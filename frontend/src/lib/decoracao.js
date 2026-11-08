// Regras para arrastar os objetos do escritório (tudo em pixels de arte, cena 320x180).
//
// Posição salva de cada objeto (state.escritorio.posicoes[nome]):
//   parede/fixo → { x, y }
//   mesa        → { x, sobre, chao?, deitado? }
//     sobre: 'mesa' (com chao = linha da base na profundidade da mesa) | 'monitor' | 'estante'
//            | nome de outro objeto empilhável (ex.: um livro)
//   A altura (y) não é salva: sai do apoio. Assim, quando um apoio some, quem estava
//   em cima "cai" para o apoio de baixo (ver soltarDependentes).
import { DESK_Y, ESTANTE, MONITOR, MONITOR_SCREEN, SCENE_H, SCENE_W } from '../art/layout.js';
import OBJETOS from '../art/objetos.json';

// Quanto da base do objeto precisa ficar sobre o tampo da mesa
export const BASE_MIN_NA_MESA = DESK_Y + 12;

// Topo do monitor CRT: objetos `elevavel` podem apoiar aqui
export const TOPO_MONITOR = { x1: MONITOR.x + 4, x2: MONITOR.x + MONITOR.w - 4, y: MONITOR.y };

// Na mesa, objetos com bases a até esta distância estão na "mesma fileira" e podem se empilhar
const MESMA_FILEIRA = 8;

const RAIZES = ['mesa', 'monitor', 'estante'];

const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---------------------------------------------------------------- orientação (livros)
export const podeDeitar = (nome) => Boolean(OBJETOS[`${nome}-deitado`]);
export const chaveSprite = (nome, deitado) => (deitado && podeDeitar(nome) ? `${nome}-deitado` : nome);
export const metaDe = (nome, deitado = false) => OBJETOS[chaveSprite(nome, deitado)];

// ---------------------------------------------------------------- limites simples
// Faixa vertical permitida para o objeto na sua zona
function faixaY(meta) {
  return meta.zona === 'parede' ? [0, DESK_Y - meta.h] : [BASE_MIN_NA_MESA - meta.h, SCENE_H - meta.h];
}

// Se o objeto cobre a tela do monitor, empurra para o lado (ou acima/abaixo) mais próximo que ainda é válido
function desviarDaTela(meta, pos) {
  const t = MONITOR_SCREEN;
  if (!sobrepoe({ ...pos, w: meta.w, h: meta.h }, t)) return pos;
  const [ymin, ymax] = faixaY(meta);
  const opcoes = [
    { x: t.x - meta.w, y: pos.y },
    { x: t.x + t.w, y: pos.y },
    { x: pos.x, y: t.y - meta.h },
    { x: pos.x, y: t.y + t.h },
  ].filter((p) => p.x >= 0 && p.x <= SCENE_W - meta.w && p.y >= ymin && p.y <= ymax);
  if (!opcoes.length) return pos;
  const dist = (p) => Math.abs(p.x - pos.x) + Math.abs(p.y - pos.y);
  return opcoes.reduce((a, b) => (dist(b) < dist(a) ? b : a));
}

// Mantém o objeto na sua zona ("parede" acima da mesa, "mesa" com a base no tampo)
// e fora da tela do monitor. Usado para parede e para objetos que não sobem em nada.
export function limitarPosicao(meta, x, y) {
  const [ymin, ymax] = faixaY(meta);
  const pos = { x: limitar(Math.round(x), 0, SCENE_W - meta.w), y: limitar(Math.round(y), ymin, ymax) };
  return desviarDaTela(meta, pos);
}

// ---------------------------------------------------------------- posições salvas
// Posição padrão (desenho original) no formato salvo
// Itens da loja que viram vários objetos (ex.: a pilha de livros → 4 livros): metadado `grupo` no gerador
export const membrosDoGrupo = (idLoja) => Object.keys(OBJETOS).filter((n) => OBJETOS[n].grupo === idLoja);
export const grupoDoObjeto = (nome) => OBJETOS[nome]?.grupo ?? null;
export const ehPorta = (nome) => Boolean(OBJETOS[nome]?.porta);

export function posicaoPadrao(nome) {
  const meta = OBJETOS[nome];
  if (meta.zona !== 'mesa') return { x: meta.x, y: meta.y };
  // vem empilhado em outro objeto (livros da pilha) ou dentro dele (canetas no pote, já inclinadas)
  if (meta.sobrePadrao) return { x: meta.x, sobre: meta.sobrePadrao, ...(meta.anguloPadrao != null ? { angulo: meta.anguloPadrao } : {}) };
  if (meta.apoio === 'estante') return { x: meta.x, sobre: 'estante' };
  return { x: meta.x, sobre: 'mesa', chao: meta.y + meta.h };
}

// Converte o que estiver salvo (inclusive o formato antigo { x, y }) para o formato atual
export function normalizarEntrada(nome, entrada) {
  if (!entrada) return posicaoPadrao(nome);
  const zona = OBJETOS[nome]?.zona;
  if (zona !== 'mesa' || entrada.sobre) return entrada;
  const meta = metaDe(nome, entrada.deitado);
  const base = entrada.y + meta.h;
  if (meta.elevavel && base <= MONITOR.y + 1) return { x: entrada.x, sobre: 'monitor' };
  return { x: entrada.x, sobre: 'mesa', chao: base };
}

// Topo de uma superfície-raiz → y do objeto apoiado nela
function yNaRaiz(raiz, meta, chao) {
  if (raiz === 'monitor') return MONITOR.y - meta.h + 1;
  if (raiz === 'estante') return ESTANTE.y - meta.h;
  return chao - meta.h;
}
const chaoDaRaiz = (raiz, chao) => (raiz === 'monitor' ? MONITOR.y : raiz === 'estante' ? ESTANTE.y : chao);

// Calcula x/y de cada objeto a partir dos apoios.
// Devolve [{ nome, meta, x, y, entrada, raiz, chao, nivel }]; nivel = altura na pilha (0 = na superfície).
export function resolverCena(nomes, posicoes = {}) {
  const entradas = Object.fromEntries(nomes.map((n) => [n, normalizarEntrada(n, posicoes[n])]));
  const pronto = {};

  const calcular = (nome, visitando = new Set()) => {
    if (pronto[nome]) return pronto[nome];
    const entrada = entradas[nome];
    const meta = metaDe(nome, entrada.deitado);
    let r;
    if (meta.zona !== 'mesa') {
      r = { x: entrada.x, y: entrada.y, raiz: 'parede', chao: entrada.y + meta.h, nivel: 0 };
    } else if (RAIZES.includes(entrada.sobre)) {
      const chao = chaoDaRaiz(entrada.sobre, entrada.chao ?? BASE_MIN_NA_MESA);
      r = { x: entrada.x, y: yNaRaiz(entrada.sobre, meta, chao), raiz: entrada.sobre, chao, nivel: 0 };
    } else if (entradas[entrada.sobre] && !visitando.has(entrada.sobre)) {
      visitando.add(nome);
      const s = calcular(entrada.sobre, visitando);
      // dentro de um porta-objetos (pote de canetas): a ponta afunda `fundo` px abaixo da boca
      r = s.meta.porta
        ? { x: entrada.x, y: s.y + s.meta.fundo - meta.h, raiz: s.raiz, chao: s.chao, nivel: s.nivel + 1, dentro: true }
        : { x: entrada.x, y: s.y - meta.h + 1, raiz: s.raiz, chao: s.chao, nivel: s.nivel + 1 };
    } else {
      // apoio sumiu: cai na mesa, no fundo
      r = { x: entrada.x, y: BASE_MIN_NA_MESA - meta.h, raiz: 'mesa', chao: BASE_MIN_NA_MESA, nivel: 0 };
    }
    return (pronto[nome] = { nome, meta, entrada, ...r });
  };

  return nomes.map((n) => calcular(n));
}

// Quando um objeto sai do lugar, quem estava apoiado nele passa a se apoiar no que estava embaixo
export function soltarDependentes(posicoes, nome) {
  if (!OBJETOS[nome]) return posicoes;
  const removido = normalizarEntrada(nome, posicoes[nome]);
  if (!removido.sobre) return posicoes;
  const novas = { ...posicoes };
  // inclui quem está em cima na posição padrão (ex.: livros da pilha que nunca foram mexidos)
  for (const n of Object.keys(OBJETOS)) {
    if (n === nome || OBJETOS[n].zona !== 'mesa' || OBJETOS[n].variante) continue;
    const e = normalizarEntrada(n, posicoes[n]);
    if (e?.sobre !== nome) continue;
    const { chao: _, ...resto } = e;
    novas[n] = removido.sobre === 'mesa' ? { ...resto, sobre: 'mesa', chao: removido.chao } : { ...resto, sobre: removido.sobre };
  }
  return novas;
}

// Está numa pilha? (tem algo em cima ou está em cima de outro objeto)
export function estaEmPilha(obj, cena) {
  return obj.nivel > 0 || cena.some((o) => o.entrada?.sobre === obj.nome);
}

// ---------------------------------------------------------------- soltar um objeto
// Onde o objeto `nome` pousa se for solto com o canto em (x, y). `cena` = os outros objetos resolvidos.
// Objetos "elevaveis" sobem no monitor e na estante e caem sobre o empilhável mais alto debaixo deles.
// Devolve { entrada, x, y } (entrada no formato salvo; x/y para mostrar a prévia).
export function pousar(nome, deitado, x, y, cena) {
  const meta = metaDe(nome, deitado);
  const extra = deitado && podeDeitar(nome) ? { deitado: true } : {};

  if (meta.zona !== 'mesa') {
    const p = limitarPosicao(meta, x, y);
    return { entrada: { x: p.x, y: p.y }, x: p.x, y: p.y };
  }
  if (!meta.elevavel) {
    const p = limitarPosicao(meta, x, y);
    return { entrada: { x: p.x, sobre: 'mesa', chao: p.y + meta.h, ...extra }, x: p.x, y: p.y };
  }

  const centro = x + meta.w / 2;
  const base = y + meta.h;

  // caneta solta sobre a boca do pote: entra no pote (o ângulo é sorteado por quem solta, no escritório)
  if (meta.caneta) {
    const pote = cena.find((o) => o.meta.porta && centro >= o.x && centro <= o.x + o.meta.w && base >= o.y - 12 && base <= o.y + o.meta.h + 4);
    if (pote) {
      const px = limitar(Math.round(x), pote.x - 1, pote.x + pote.meta.w - meta.w + 1);
      return { entrada: { x: px, sobre: pote.nome }, x: px, y: pote.y + pote.meta.fundo - meta.h };
    }
  }
  let raiz = 'mesa';
  let chao = limitar(Math.round(base), BASE_MIN_NA_MESA, SCENE_H);
  let nx = limitar(Math.round(x), 0, SCENE_W - meta.w);
  if (base < DESK_Y) {
    if (centro >= ESTANTE.x && centro <= ESTANTE.x + ESTANTE.w) {
      raiz = 'estante';
      nx = limitar(Math.round(x), ESTANTE.x, ESTANTE.x + ESTANTE.w - meta.w);
    } else if (centro >= TOPO_MONITOR.x1 && centro <= TOPO_MONITOR.x2) {
      raiz = 'monitor';
      nx = limitar(Math.round(x), MONITOR.x + 2, MONITOR.x + MONITOR.w - 2 - meta.w);
    } else {
      chao = BASE_MIN_NA_MESA; // solto no ar fora das superfícies: cai no fundo da mesa
    }
    if (raiz !== 'mesa') chao = chaoDaRaiz(raiz);
  }

  // gravidade: pousa no empilhável mais alto que está debaixo dele, na mesma superfície
  const debaixo = cena.filter(
    (o) =>
      o.meta.empilhavel &&
      o.raiz === raiz &&
      (raiz !== 'mesa' || Math.abs(o.chao - chao) <= MESMA_FILEIRA) &&
      nx < o.x + o.meta.w - 1 &&
      nx + meta.w > o.x + 1,
  );
  const apoio = debaixo.reduce((a, b) => (!a || b.y < a.y ? b : a), null);

  if (apoio) {
    const ny = apoio.y - meta.h + 1;
    const cobre = sobrepoe({ x: nx, y: ny, w: meta.w, h: meta.h }, MONITOR_SCREEN);
    if (!cobre) return { entrada: { x: nx, sobre: apoio.nome, ...extra }, x: nx, y: ny };
    // a pilha cobriria a tela: fica na superfície, ao lado
  }
  if (raiz === 'mesa') {
    const p = desviarDaTela(meta, { x: nx, y: chao - meta.h });
    return { entrada: { x: p.x, sobre: 'mesa', chao: p.y + meta.h, ...extra }, x: p.x, y: p.y };
  }
  return { entrada: { x: nx, sobre: raiz, ...extra }, x: nx, y: yNaRaiz(raiz, meta, chao) };
}

// ---------------------------------------------------------------- desenho e clique
// Profundidade: parede atrás de tudo (peças maiores primeiro, para post-its e relógio ficarem por cima
// de pôster e cortiça); depois, por superfície (estante/monitor atrás, mesa pela fileira) e altura na pilha.
export function ordemDeDesenho(objs) {
  const peso = (o) => (o.meta.zona === 'fixo' ? -2 : o.meta.zona === 'parede' ? -1 : 0);
  const area = (o) => o.meta.w * o.meta.h;
  const fileira = (o) => o.chao ?? o.y + o.meta.h;
  // o que está dentro do pote é desenhado antes dele (o pote cobre a ponta)
  const camada = (o) => (o.dentro ? -1 : o.nivel ?? 0);
  return [...objs].sort(
    (a, b) =>
      peso(a) - peso(b) || (a.meta.zona === 'parede' ? area(b) - area(a) : fileira(a) - fileira(b) || camada(a) - camada(b)),
  );
}

// Acerta o objeto só onde há pixel visível (com 1px de folga para traços finos).
// mascara = { w, h, alfa: Uint8Array } ou null (usa o retângulo inteiro)
export function acertou(obj, mascara, ax, ay) {
  // caneta inclinada no pote: desfaz a rotação (em volta da base) antes de olhar o pixel
  const ang = obj.dentro ? obj.entrada?.angulo : 0;
  if (ang) {
    const cx = obj.x + obj.meta.w / 2, cy = obj.y + obj.meta.h;
    const r = (-ang * Math.PI) / 180;
    const dx = ax - cx, dy = ay - cy;
    ax = cx + dx * Math.cos(r) - dy * Math.sin(r);
    ay = cy + dx * Math.sin(r) + dy * Math.cos(r);
  }
  const lx = Math.floor(ax - obj.x), ly = Math.floor(ay - obj.y);
  if (lx < 0 || ly < 0 || lx >= obj.meta.w || ly >= obj.meta.h) return false;
  if (!mascara) return true;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const x = lx + dx, y = ly + dy;
      if (x >= 0 && y >= 0 && x < mascara.w && y < mascara.h && mascara.alfa[y * mascara.w + x]) return true;
    }
  return false;
}

// Objeto mais à frente sob o ponteiro (ignora os fixos). `mascaras` é indexado pela chave do sprite.
export function objetoNoPonto(objsOrdenados, mascaras, ax, ay) {
  for (let i = objsOrdenados.length - 1; i >= 0; i--) {
    const o = objsOrdenados[i];
    const chave = chaveSprite(o.nome, o.entrada?.deitado);
    if (o.meta.zona !== 'fixo' && acertou(o, mascaras[chave] ?? mascaras[o.nome], ax, ay)) return o;
  }
  return null;
}

// Ângulo de uma caneta posta de volta no pote: levemente bagunçado, nunca mais que 30° para cada lado
export const ANGULO_MAX_POTE = 30;
export const anguloAleatorio = (aleatorio = Math.random) => Math.round((aleatorio() * 2 - 1) * ANGULO_MAX_POTE);

// Grupo (pilha de livros, pote com canetas) solto de uma vez: `conjunto` é a imagem do grupo inteiro
// (sprite soLoja) e `entrada`/`x` dizem onde ela pousou. Cada membro vai para a mesma posição relativa
// do arranjo original (mesma ordem, mesmos ângulos); o de baixo herda o apoio do conjunto.
export function posicoesDoGrupo(conjunto, grupo, entrada, x) {
  const dx = x - OBJETOS[conjunto].x;
  return Object.fromEntries(
    membrosDoGrupo(grupo).map((m) => {
      const meta = OBJETOS[m];
      if (!meta.sobrePadrao) return [m, { ...entrada, x: meta.x + dx }];
      return [m, { x: meta.x + dx, sobre: meta.sobrePadrao, ...(meta.anguloPadrao != null ? { angulo: meta.anguloPadrao } : {}) }];
    }),
  );
}

// Objetos guardados DENTRO de um porta-objetos (canetas no pote), pela posição salva ou padrão
export function conteudoDe(nome, posicoes, presentes) {
  return presentes.filter((n) => n !== nome && OBJETOS[n] && normalizarEntrada(n, posicoes[n]).sobre === nome);
}

// Move um objeto; se ele guarda coisas dentro (pote), elas vão junto, na mesma posição dentro dele
export function moverComConteudo(posicoes, nome, nova) {
  const novas = { ...posicoes, [nome]: nova };
  if (!OBJETOS[nome]?.porta) return novas;
  const dx = nova.x - normalizarEntrada(nome, posicoes[nome]).x;
  for (const n of Object.keys(OBJETOS)) {
    if (n === nome || OBJETOS[n].zona !== 'mesa' || OBJETOS[n].variante) continue;
    const e = normalizarEntrada(n, posicoes[n]);
    if (e.sobre === nome) novas[n] = { ...e, x: e.x + dx };
  }
  return novas;
}
