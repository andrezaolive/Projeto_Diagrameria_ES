// Clode: o robozinho do editor. A cada uso (pago), ele faz UMA coisa no diagrama que o jogador está
// montando, comparando com o gabarito, na ordem:
//  1. falta um elemento → põe ele pronto (tipo, nome e, nas classes, atributos e métodos);
//  2. não falta elemento → corrige um erro só: nome, tipo do elemento, relação (tipo, sentido,
//     evento), relação faltando, multiplicidade, atributo/método, caso de uso fora do sistema (ou
//     ator dentro), e por fim o que está sobrando (relação, depois elemento);
//  3. nada a fazer → { tipo: 'nada' } (e não cobra).
// Usa as mesmas regras da nota e do feedback (lib/avaliacao.js, lib/feedback.js).
import { TIPOS_AVALIADOS, chaveRelacao, normalizar } from './avaliacao.js';
import { NOME_TIPO, parecido } from './feedback.js';
import { multIgual } from './multiplicidade.js';
import { contido, foraDoLugar, retangulo, sobrepoe } from './grid.js';
import { compararMembros, lerMembro, temMembros } from './membros.js';

export const PRECO_CLODE = { facil: 200, medio: 300, dificil: 400 }; // "bem caro": o dobro da 1ª dica
// modo infinito: bem mais barato (a caixa cheia de pedidos é cruel)
export const PRECO_CLODE_INFINITO = { facil: 40, medio: 60, dificil: 80 };
export const AUMENTO_CLODE = 0.1; // cada uso no dia encarece o seguinte em 10% do preço do nível

const novoId = () => `cl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const par = (a, b) => [a, b].sort().join('|');
const SEM_MULT = ['heranca', 'dependencia', 'include', 'extend', 'transicao'];

// nó do gabarito → nó do jogador (mesma ordem de critérios do feedback)
function casarNos(jogador, esperado) {
  const avaliado = (n) => TIPOS_AVALIADOS.includes(n.tipo);
  const nosE = esperado.nodes.filter(avaliado);
  let livres = jogador.nodes.filter(avaliado);
  const casados = new Map();
  const casar = (filtro) =>
    nosE.forEach((ne) => {
      if (casados.has(ne)) return;
      const i = livres.findIndex((nj) => filtro(nj, ne));
      if (i < 0) return;
      casados.set(ne, livres[i]);
      livres = livres.filter((_, k) => k !== i);
    });
  casar((nj, ne) => nj.tipo === ne.tipo && normalizar(nj.rotulo) === normalizar(ne.rotulo));
  casar((nj, ne) => normalizar(nj.rotulo) === normalizar(ne.rotulo));
  casar((nj, ne) => nj.tipo === ne.tipo && parecido(nj.rotulo, ne.rotulo));
  casar((nj, ne) => parecido(nj.rotulo, ne.rotulo));
  return { nosE, casados, sobrando: livres };
}

// Onde pôr um elemento novo: perto de onde ele fica no gabarito, sem cobrir ninguém. Com sistema dos
// dois lados, a posição é levada para o sistema do jogador (o caso de uso cai dentro dele).
function posicaoLivre(jogador, esperado, ne, casados) {
  let x = ne.x, y = ne.y;
  const se = esperado.nodes.find((n) => n.tipo === 'sistema');
  const sj = se && casados.get(se);
  if (se && sj && ne.tipo !== 'sistema') {
    const rs = retangulo(se), rj = retangulo(sj);
    x = rj.x + (ne.x - rs.x) * (rj.w / rs.w);
    y = rj.y + (ne.y - rs.y) * (rj.h / rs.h);
  }
  const outros = jogador.nodes.filter((n) => n.tipo !== 'sistema' && n.tipo !== 'nota');
  const livre = (px, py) => !outros.some((o) => sobrepoe({ ...ne, x: px, y: py }, o));
  const g = (v) => Math.round(v / 20) * 20;
  if (livre(g(x), g(y))) return { x: g(x), y: g(y) };
  for (let r = 1; r <= 12; r++)
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const px = g(x + dx * r * 60), py = g(y + dy * r * 60);
      if (livre(px, py)) return { x: px, y: py };
    }
  return { x: g(x), y: g(y) };
}

// Sistema que falta: em volta dos casos de uso que o jogador já pôs (se houver)
function sistemaEmVolta(jogador, ne) {
  const casos = jogador.nodes.filter((n) => n.tipo === 'casoDeUso');
  if (!casos.length) return { x: ne.x, y: ne.y };
  const rs = casos.map(retangulo);
  const x0 = Math.min(...rs.map((r) => r.x)) - 40, y0 = Math.min(...rs.map((r) => r.y)) - 60;
  const x1 = Math.max(...rs.map((r) => r.x + r.w)) + 40, y1 = Math.max(...rs.map((r) => r.y + r.h)) + 40;
  return { x: x0, y: y0, w: Math.max(ne.w ?? 0, x1 - x0), h: Math.max(ne.h ?? 0, y1 - y0) };
}

const nomeDo = (n) => (n.tipo === 'estadoInicial' || n.tipo === 'estadoFinal' ? NOME_TIPO[n.tipo] : `${NOME_TIPO[n.tipo]} "${n.rotulo}"`);

// O que o Clode faria agora: { tipo: 'adicionar' | 'corrigir' | 'nada', texto, diagrama }
// `gerarId`: id do elemento/relação que ele cria (o reducer passa um fixo, para continuar puro)
export function acaoDoClode(jogador, esperado, gerarId = novoId) {
  if (!esperado) return { tipo: 'nada', texto: 'Nada a ser feito.' };
  const d = { nodes: jogador.nodes ?? [], edges: jogador.edges ?? [] };
  const { nosE, casados, sobrando } = casarNos(d, esperado);
  const trocarNo = (id, mudanca) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...mudanca } : n)) });
  const trocarAresta = (id, mudanca) => ({ ...d, edges: d.edges.map((x) => (x.id === id ? { ...x, ...mudanca } : x)) });

  // 1) elemento faltando (o sistema primeiro, depois na ordem do gabarito)
  const faltando = nosE.filter((ne) => !casados.has(ne)).sort((a, b) => (b.tipo === 'sistema') - (a.tipo === 'sistema'));
  if (faltando.length) {
    const ne = faltando[0];
    const pos = ne.tipo === 'sistema' ? sistemaEmVolta(d, ne) : posicaoLivre(d, esperado, ne, casados);
    const novo = { ...ne, id: gerarId(), ...pos };
    return { tipo: 'adicionar', texto: `Coloquei ${nomeDo(ne)}.`, diagrama: { ...d, nodes: [...d.nodes, novo] } };
  }

  // 2) correções, uma por vez
  for (const ne of nosE) {
    const nj = casados.get(ne);
    if (normalizar(nj.rotulo) !== normalizar(ne.rotulo))
      return { tipo: 'corrigir', texto: `Corrigi o nome "${nj.rotulo}" para "${ne.rotulo}".`, diagrama: trocarNo(nj.id, { rotulo: ne.rotulo }) };
    if (nj.tipo !== ne.tipo)
      return { tipo: 'corrigir', texto: `"${ne.rotulo}" era ${NOME_TIPO[ne.tipo]}, não ${NOME_TIPO[nj.tipo]}: troquei.`, diagrama: trocarNo(nj.id, { tipo: ne.tipo }) };
  }

  // relações, pelos nós casados (id do jogador ↔ nó do gabarito)
  const doJogador = new Map([...casados].map(([ne, nj]) => [ne.id, nj.id]));
  const nomeJ = (id) => {
    const ne = [...casados].find(([, nj]) => nj.id === id)?.[0];
    return ne ? normalizar(ne.rotulo) : `?${id}`;
  };
  const rotuloE = (id) => esperado.nodes.find((n) => n.id === id)?.rotulo;
  let livresJ = [...d.edges];
  const chaveJ = (e) => chaveRelacao(e.tipo, nomeJ(e.de), nomeJ(e.para), e.rotulo ?? '');
  const chaveE = (e) => chaveRelacao(e.tipo, normalizar(rotuloE(e.de)), normalizar(rotuloE(e.para)), e.rotulo ?? '');
  const certas = [], pendentes = [];
  for (const ee of esperado.edges) {
    const i = livresJ.findIndex((ej) => chaveJ(ej) === chaveE(ee));
    if (i >= 0) {
      certas.push([ee, livresJ[i]]);
      livresJ = livresJ.filter((_, k) => k !== i);
    } else pendentes.push(ee);
  }
  const descr = (ee) => `${NOME_TIPO[ee.tipo]} de "${rotuloE(ee.de)}" para "${rotuloE(ee.para)}"`;
  for (const ee of pendentes) {
    const de = doJogador.get(ee.de), para = doJogador.get(ee.para);
    const i = livresJ.findIndex((ej) => par(ej.de, ej.para) === par(de, para));
    if (i < 0) continue;
    const ej = livresJ[i];
    const mudanca = { tipo: ee.tipo, de, para, rotulo: ee.rotulo, multDe: ee.multDe, multPara: ee.multPara };
    let texto;
    if (ej.tipo === ee.tipo && ee.tipo === 'transicao' && ej.de === de) texto = `Corrigi o evento da transição para "${ee.rotulo}".`;
    else if (ej.tipo === ee.tipo) texto = `Virei o sentido da ${NOME_TIPO[ee.tipo]} entre "${rotuloE(ee.de)}" e "${rotuloE(ee.para)}".`;
    else texto = `Troquei a ${NOME_TIPO[ej.tipo]} por ${descr(ee)}.`;
    return { tipo: 'corrigir', texto, diagrama: trocarAresta(ej.id, mudanca) };
  }
  for (const ee of pendentes) {
    const de = doJogador.get(ee.de), para = doJogador.get(ee.para);
    if (livresJ.some((ej) => par(ej.de, ej.para) === par(de, para))) continue;
    const nova = { id: gerarId(), tipo: ee.tipo, de, para, ...(ee.rotulo ? { rotulo: ee.rotulo } : {}), ...(ee.multDe ? { multDe: ee.multDe } : {}), ...(ee.multPara ? { multPara: ee.multPara } : {}) };
    return { tipo: 'corrigir', texto: `Liguei com a ${descr(ee)}${ee.rotulo ? ` ("${ee.rotulo}")` : ''}.`, diagrama: { ...d, edges: [...d.edges, nova] } };
  }

  // multiplicidade das relações certas (associação desenhada ao contrário: as pontas trocam)
  for (const [ee, ej] of certas) {
    if (SEM_MULT.includes(ee.tipo) || (!ee.multDe && !ee.multPara)) continue;
    const mesma = ej.de === doJogador.get(ee.de);
    const [md, mp] = mesma ? [ee.multDe, ee.multPara] : [ee.multPara, ee.multDe];
    if ((md && !multIgual(md, ej.multDe)) || (mp && !multIgual(mp, ej.multPara)))
      return { tipo: 'corrigir', texto: `Acertei a multiplicidade entre "${rotuloE(ee.de)}" e "${rotuloE(ee.para)}".`, diagrama: trocarAresta(ej.id, { multDe: md, multPara: mp }) };
  }

  // atributos e métodos (um membro por vez)
  for (const ce of esperado.nodes.filter((n) => n.tipo === 'classe' && temMembros(n))) {
    const cj = casados.get(ce);
    for (const r of compararMembros(cj, ce)) {
      if (r.pontos === 1) continue;
      const lista = cj[r.campo] ?? [];
      const nova = r.achou
        ? lista.map((l) => (lerMembro(l).nome.toLowerCase() === r.achou.nome.toLowerCase() ? r.esperado.texto : l))
        : [...lista, r.esperado.texto];
      const texto = r.achou ? `Corrigi "${r.achou.texto}" para "${r.esperado.texto}" em ${ce.rotulo}.` : `Escrevi "${r.esperado.texto}" em ${ce.rotulo}.`;
      return { tipo: 'corrigir', texto, diagrama: trocarNo(cj.id, { [r.campo]: nova }) };
    }
  }

  // fronteira do sistema: caso de uso para dentro, ator para fora
  const se = esperado.nodes.find((n) => n.tipo === 'sistema');
  const sj = se && casados.get(se);
  if (sj)
    for (const x of foraDoLugar(d.nodes)) {
      const n = d.nodes.find((k) => k.id === x.id);
      const ne = [...casados].find(([, nj]) => nj.id === n.id)?.[0];
      if (!ne) continue;
      const rj = retangulo(sj);
      let pos;
      if (x.problema === 'foraDoSistema') {
        pos = posicaoLivre({ ...d, nodes: d.nodes.filter((k) => k.id !== n.id) }, esperado, ne, casados);
        if (!contido({ ...n, ...pos }, sj)) pos = { x: rj.x + 40, y: rj.y + 60 };
      } else pos = { x: Math.round((rj.x - retangulo(n).w - 60) / 20) * 20, y: n.y };
      return { tipo: 'corrigir', texto: x.problema === 'foraDoSistema' ? `Pus "${n.rotulo}" dentro do sistema.` : `Tirei o ator "${n.rotulo}" de dentro do sistema.`, diagrama: trocarNo(n.id, pos) };
    }

  // sobrando: relação e depois elemento
  if (livresJ.length) {
    const ej = livresJ[0];
    const a = d.nodes.find((n) => n.id === ej.de)?.rotulo, b = d.nodes.find((n) => n.id === ej.para)?.rotulo;
    return { tipo: 'corrigir', texto: `Tirei a ${NOME_TIPO[ej.tipo]} entre "${a}" e "${b}", que não faz parte do pedido.`, diagrama: { ...d, edges: d.edges.filter((x) => x.id !== ej.id) } };
  }
  if (sobrando.length) {
    const n = sobrando[0];
    return {
      tipo: 'corrigir',
      texto: `Tirei ${nomeDo(n)}, que não faz parte do pedido.`,
      diagrama: { nodes: d.nodes.filter((x) => x.id !== n.id), edges: d.edges.filter((x) => x.de !== n.id && x.para !== n.id) },
    };
  }
  return { tipo: 'nada', texto: 'Nada a ser feito.' };
}
