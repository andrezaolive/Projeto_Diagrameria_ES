// Avatar do jogador em pixel art 32x32, montado em tempo de execução a partir de partes.
// Cada parte é uma lista de retângulos [x, y, w, h, cor]; camadas com contorno ganham
// automaticamente 1px de 'ink' em volta (por cima das camadas anteriores).
//
// Cabelos, roupas e acessórios também existem como PNGs editáveis em src/assets/avatar/
// (cabelos/<id>-tras.png, cabelos/<id>-frente.png, roupas/<id>.png, acessorios/<id>.png), gerados a
// partir destes retângulos por scripts/arte-avatar.mjs. O jogo usa o PNG quando ele existe
// (data/spritesAvatar.js) e os retângulos daqui quando não existe (ex.: nos testes). Nos PNGs, as
// CORES_CHAVE são trocadas pela escolha do jogador: no cabelo, o plum vira a cor do cabelo; na
// roupa, o violet vira a cor da roupa; em qualquer camada, os dois tons de pele de referência viram
// a pele escolhida. As outras cores ficam como estão.
import { PALETTE, PELES } from '../art/palette.js';

export const TAM_AVATAR = 32;

// 'H' = cor do cabelo, 'P' = pele, 'S' = sombra da pele, 'R' = roupa
// preco: à venda na lojinha (aba Avatar); sem preco = já vem no jogo
export const CABELOS = [
  { id: 'curto', nome: 'Curto', grupo: 'masc', frente: [[10, 5, 12, 3], [9, 6, 2, 5], [21, 6, 2, 5], [11, 8, 6, 1]] },
  { id: 'espetado', nome: 'Espetado', grupo: 'masc', frente: [[10, 5, 12, 3], [9, 6, 2, 4], [21, 6, 2, 4], [10, 3, 2, 2], [14, 2, 2, 3], [18, 3, 2, 2], [12, 8, 3, 1]] },
  { id: 'topete', nome: 'Topete', grupo: 'masc', frente: [[10, 5, 12, 3], [12, 3, 9, 2], [9, 7, 2, 4], [21, 7, 2, 4], [17, 8, 4, 1]] },
  { id: 'raspado', nome: 'Raspado', grupo: 'masc', frente: [[11, 7, 10, 2], [10, 8, 1, 3], [21, 8, 1, 3]] },
  { id: 'careca', nome: 'Careca', grupo: 'masc', frente: [] },
  { id: 'longo', nome: 'Longo', grupo: 'fem', tras: [[8, 7, 16, 18]], frente: [[10, 5, 12, 3], [9, 6, 3, 11], [20, 6, 3, 11], [12, 8, 5, 1]] },
  { id: 'chanel', nome: 'Chanel', grupo: 'fem', tras: [[8, 7, 16, 12]], frente: [[10, 5, 12, 3], [9, 6, 3, 12], [20, 6, 3, 12], [11, 8, 10, 1]] },
  { id: 'rabo', nome: 'Rabo de cavalo', grupo: 'fem', tras: [[22, 8, 4, 3], [24, 10, 3, 11]], frente: [[10, 5, 12, 3], [9, 6, 2, 5], [21, 6, 2, 5], [13, 8, 6, 1]] },
  { id: 'coque', nome: 'Coque', grupo: 'fem', tras: [[13, 1, 6, 5]], frente: [[10, 5, 12, 3], [9, 6, 2, 4], [21, 6, 2, 4]] },
  { id: 'cacheado', nome: 'Cacheado', grupo: 'fem', tras: [[9, 3, 14, 3], [7, 5, 18, 14], [6, 8, 20, 9]], frente: [[10, 6, 12, 3], [9, 8, 2, 5], [21, 8, 2, 5]] },
  // à venda
  { id: 'moicano', nome: 'Moicano', grupo: 'masc', preco: 150, frente: [[14, 1, 4, 7], [11, 7, 3, 1], [18, 7, 3, 1]] },
  { id: 'undercut', nome: 'Undercut', grupo: 'masc', preco: 150, frente: [[10, 4, 12, 4], [15, 3, 8, 3], [9, 6, 2, 3], [21, 6, 2, 3], [13, 8, 9, 1]] },
  { id: 'tigela', nome: 'Franjinha', grupo: 'masc', preco: 120, frente: [[10, 5, 12, 3], [9, 6, 2, 6], [21, 6, 2, 6], [10, 8, 12, 2]] },
  { id: 'black', nome: 'Black power', grupo: 'fem', preco: 200, tras: [[8, 1, 16, 4], [6, 3, 20, 13], [5, 6, 22, 8]], frente: [[10, 5, 12, 3], [9, 7, 2, 5], [21, 7, 2, 5]] },
  { id: 'chiquinhas', nome: 'Maria-chiquinha', grupo: 'fem', preco: 180, tras: [[5, 9, 4, 3], [4, 11, 4, 9], [23, 9, 4, 3], [24, 11, 4, 9]], frente: [[10, 5, 12, 3], [9, 6, 2, 4], [21, 6, 2, 4], [12, 8, 4, 1]] },
  { id: 'tranca', nome: 'Trança', grupo: 'fem', preco: 200, tras: [[8, 7, 16, 10]], frente: [[10, 5, 12, 3], [9, 6, 3, 9], [20, 6, 3, 9], [12, 8, 5, 1], [7, 15, 4, 3], [8, 18, 3, 3], [7, 21, 4, 3], [8, 24, 3, 3]] },
];

export const CORES_CABELO = ['ink', 'plum', 'grape', 'peach', 'butter', 'rose', 'lavender', 'sky'];
export const CORES_ROUPA = ['violet', 'rose', 'mint', 'sky', 'butter', 'blush', 'grape'];

// Tronco (a camiseta); toda roupa começa por ele. Fica atrás do pescoço e da cabeça.
const TRONCO = [[6, 25, 20, 1], [5, 26, 22, 2], [4, 28, 24, 4]];

// Modelos de roupa: camadas (com contorno) e detalhes (sem contorno). 'R' = cor escolhida.
export const ROUPAS = [
  { id: 'camiseta', nome: 'Camiseta', camadas: [[TRONCO, 'R']] },
  { id: 'listrada', nome: 'Suéter listrado', preco: 180, camadas: [[TRONCO, 'R']], detalhes: [[5, 27, 22, 1, 'cream'], [4, 30, 24, 1, 'cream']] },
  {
    id: 'moletom', nome: 'Moletom', preco: 220,
    camadas: [[TRONCO, 'R'], [[[8, 23, 4, 3], [20, 23, 4, 3]], 'R']],
    detalhes: [[14, 27, 1, 3, 'cream'], [17, 27, 1, 3, 'cream'], [10, 29, 12, 1, 'ink']],
  },
  {
    id: 'social', nome: 'Camisa e gravata', preco: 250,
    camadas: [[TRONCO, 'cream']],
    detalhes: [[11, 25, 2, 2, 'mist'], [19, 25, 2, 2, 'mist'], [15, 26, 2, 2, 'R'], [14, 28, 4, 2, 'R'], [15, 30, 2, 2, 'R']],
  },
  {
    id: 'jaqueta', nome: 'Jaqueta', preco: 280,
    camadas: [[TRONCO, 'R']],
    detalhes: [[13, 25, 6, 7, 'cream'], [12, 26, 1, 6, 'ink'], [19, 26, 1, 6, 'ink'], [7, 29, 3, 1, 'ink'], [22, 29, 3, 1, 'ink']],
  },
  {
    id: 'jardineira', nome: 'Jardineira', preco: 240,
    camadas: [[TRONCO, 'cream'], [[[11, 27, 10, 5], [11, 25, 2, 2], [19, 25, 2, 2]], 'R']],
    detalhes: [[12, 28, 1, 1, 'butter'], [19, 28, 1, 1, 'butter']],
  },
];

// Acessórios: por cima de tudo (até do cabelo)
export const ACESSORIOS = [
  { id: 'nenhum', nome: 'Nenhum' },
  {
    id: 'oculos', nome: 'Par de óculos', preco: 120,
    detalhes: [[11, 12, 4, 1, 'ink'], [17, 12, 4, 1, 'ink'], [11, 16, 4, 1, 'ink'], [17, 16, 4, 1, 'ink'], [11, 12, 1, 5, 'ink'], [14, 12, 1, 5, 'ink'], [17, 12, 1, 5, 'ink'], [20, 12, 1, 5, 'ink'], [15, 13, 2, 1, 'ink'], [9, 13, 2, 1, 'ink'], [21, 13, 2, 1, 'ink']],
  },
  {
    id: 'oculos-sol', nome: 'Par de óculos escuros', preco: 160,
    detalhes: [[11, 13, 4, 3, 'ink'], [17, 13, 4, 3, 'ink'], [15, 13, 2, 1, 'ink'], [9, 13, 2, 1, 'ink'], [21, 13, 2, 1, 'ink'], [12, 14, 1, 1, 'sky'], [18, 14, 1, 1, 'sky']],
  },
  { id: 'bone', nome: 'Boné', preco: 150, camadas: [[[[10, 3, 12, 4], [9, 5, 14, 2], [5, 7, 12, 1]], 'rose']], detalhes: [[15, 3, 2, 1, 'cream']] },
  { id: 'gorro', nome: 'Gorro', preco: 150, camadas: [[[[10, 3, 12, 4], [9, 5, 14, 3]], 'mint'], [[[14, 0, 4, 2]], 'cream']], detalhes: [[9, 7, 14, 1, 'cream']] },
  { id: 'fones', nome: 'Fones de ouvido', preco: 200, camadas: [[[[9, 3, 14, 2], [8, 4, 2, 6], [22, 4, 2, 6]], 'grape'], [[[6, 11, 4, 7], [22, 11, 4, 7]], 'violet']] },
  { id: 'laco', nome: 'Laço', preco: 100, camadas: [[[[17, 2, 4, 5], [22, 2, 4, 5], [21, 3, 1, 3]], 'rose']], detalhes: [[21, 4, 1, 1, 'blush']] },
  { id: 'brincos', nome: 'Brincos', preco: 100, detalhes: [[8, 17, 1, 2, 'butter'], [23, 17, 1, 2, 'butter']] },
];

export const OLHOS = [
  { id: 'ponto', nome: 'Pontinho', rects: [[12, 14, 2, 2, 'ink'], [18, 14, 2, 2, 'ink'], [12, 14, 1, 1, 'cream'], [18, 14, 1, 1, 'cream']] },
  { id: 'feliz', nome: 'Feliz', rects: [[12, 15, 1, 1, 'ink'], [13, 14, 1, 1, 'ink'], [14, 15, 1, 1, 'ink'], [18, 15, 1, 1, 'ink'], [19, 14, 1, 1, 'ink'], [20, 15, 1, 1, 'ink']] },
  { id: 'sono', nome: 'Sonolento', rects: [[12, 15, 3, 1, 'ink'], [18, 15, 3, 1, 'ink']] },
  { id: 'grande', nome: 'Grandes', rects: [[12, 13, 2, 3, 'ink'], [18, 13, 2, 3, 'ink'], [12, 13, 1, 1, 'cream'], [18, 13, 1, 1, 'cream']] },
  { id: 'cilios', nome: 'Cílios', rects: [[12, 14, 2, 2, 'ink'], [18, 14, 2, 2, 'ink'], [11, 13, 1, 1, 'ink'], [20, 13, 1, 1, 'ink'], [12, 14, 1, 1, 'cream'], [18, 14, 1, 1, 'cream']] },
];

export const NARIZES = [
  { id: 'ponto', nome: 'Pontinho', rects: [[15, 17, 2, 1, 'S']] },
  { id: 'reto', nome: 'Reto', rects: [[16, 15, 1, 3, 'S'], [15, 18, 2, 1, 'S']] },
  { id: 'botao', nome: 'Botão', rects: [[15, 16, 2, 2, 'S']] },
  { id: 'largo', nome: 'Largo', rects: [[15, 17, 2, 1, 'S'], [14, 18, 4, 1, 'S']] },
];

export const BOCAS = [
  { id: 'sorriso', nome: 'Sorriso', rects: [[13, 19, 1, 1, 'ink'], [14, 20, 4, 1, 'ink'], [18, 19, 1, 1, 'ink']] },
  { id: 'reta', nome: 'Séria', rects: [[14, 20, 4, 1, 'ink']] },
  { id: 'aberta', nome: 'Aberta', rects: [[14, 19, 4, 2, 'ink'], [15, 20, 2, 1, 'rose']] },
  { id: 'o', nome: 'Surpresa', rects: [[15, 19, 2, 2, 'ink']] },
  { id: 'batom', nome: 'Batom', rects: [[13, 19, 1, 1, 'rose'], [14, 20, 4, 1, 'rose'], [18, 19, 1, 1, 'rose'], [14, 19, 4, 1, 'blush']] },
];

export const OPCOES_AVATAR = {
  cabelo: CABELOS.map((c) => c.id),
  corCabelo: CORES_CABELO,
  pele: PELES.map((p) => p.id),
  olhos: OLHOS.map((o) => o.id),
  nariz: NARIZES.map((n) => n.id),
  boca: BOCAS.map((b) => b.id),
  modeloRoupa: ROUPAS.map((r) => r.id),
  roupa: CORES_ROUPA,
  acessorio: ACESSORIOS.map((a) => a.id),
};

export const avatarPadrao = () => ({
  cabelo: 'curto',
  corCabelo: 'plum',
  pele: PELES[1].id,
  olhos: 'ponto',
  nariz: 'ponto',
  boca: 'sorriso',
  modeloRoupa: 'camiseta',
  roupa: 'violet',
  acessorio: 'nenhum',
});

// ---------------------------------------------------------------- partes à venda (lojinha → Avatar)
const LISTAS_A_VENDA = { cabelo: CABELOS, modeloRoupa: ROUPAS, acessorio: ACESSORIOS };
export const ROTULO_PARTE = { cabelo: 'Cabelo', modeloRoupa: 'Roupa', acessorio: 'Acessório' };
export const idItemAvatar = (campo, valor) => `avatar-${campo}-${valor}`;
// Itens da loja: { id, categoria: 'avatar', nome, preco, campo, valor }
export const ITENS_AVATAR = Object.entries(LISTAS_A_VENDA).flatMap(([campo, lista]) =>
  lista.filter((x) => x.preco).map((x) => ({ id: idItemAvatar(campo, x.id), categoria: 'avatar', nome: x.nome, preco: x.preco, campo, valor: x.id })),
);

// O jogador pode usar esta opção? (as de graça sempre; as à venda, só depois de comprar)
export function temOpcao(possui, campo, valor) {
  const x = LISTAS_A_VENDA[campo]?.find((o) => o.id === valor);
  return !x?.preco || (possui ?? []).includes(idItemAvatar(campo, valor));
}
// Opções de cada campo que o jogador tem
export const opcoesDoJogador = (possui) =>
  Object.fromEntries(Object.entries(OPCOES_AVATAR).map(([campo, lista]) => [campo, lista.filter((v) => temOpcao(possui, campo, v))]));

// Avança (passo = ±1) uma característica, dando a volta na lista
export function alternar(avatar, campo, passo, opcoes = OPCOES_AVATAR) {
  const lista = opcoes[campo];
  const i = Math.max(0, lista.indexOf(avatar[campo] ?? avatarPadrao()[campo]));
  return { ...avatar, [campo]: lista[(i + passo + lista.length) % lista.length] };
}

// Nome legível da opção escolhida (para a tela de edição)
export function nomeOpcao(campo, valor) {
  const lista = { cabelo: CABELOS, pele: PELES, olhos: OLHOS, nariz: NARIZES, boca: BOCAS, modeloRoupa: ROUPAS, acessorio: ACESSORIOS }[campo];
  if (lista) return lista.find((x) => x.id === valor)?.nome ?? valor;
  return NOMES_CORES[valor] ?? valor;
}

const NOMES_CORES = {
  ink: 'Preto', plum: 'Castanho', grape: 'Ameixa', peach: 'Loiro claro', butter: 'Loiro',
  rose: 'Ruivo', lavender: 'Lavanda', sky: 'Azul', violet: 'Violeta', mint: 'Menta', blush: 'Rosa',
};

// ---------------------------------------------------------------- camadas
// Cores de referência dos PNGs (ver o comentário do topo)
const PELE_REF = PELES[1];
export const CORES_CHAVE = { H: PALETTE.plum, R: PALETTE.violet, P: PELE_REF.base, S: PELE_REF.sombra };

const CORPO = [
  { rects: [[14, 21, 4, 5]], cor: 'P' },
  { rects: [[8, 13, 2, 4], [22, 13, 2, 4]], cor: 'P' },
  { rects: [[10, 9, 12, 13], [11, 8, 10, 1], [11, 22, 10, 1]], cor: 'P' },
];

const novaGrade = () => Array.from({ length: TAM_AVATAR }, () => Array(TAM_AVATAR).fill(null));

// Desenha camadas (com contorno automático) e detalhes numa grade; `cor` traduz as letras
function desenhar(grade, { camadas = [], detalhes = [] }, cor) {
  const N = TAM_AVATAR;
  const pintar = (x, y, hex) => {
    if (x >= 0 && y >= 0 && x < N && y < N) grade[y][x] = hex;
  };
  for (const [rects, c] of camadas) {
    if (!rects?.length) continue;
    const dentro = new Set();
    for (const [x, y, w, h] of rects) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) dentro.add(`${i},${j}`);
    for (const k of dentro) {
      const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        if (!dentro.has(`${x + dx},${y + dy}`)) pintar(x + dx, y + dy, PALETTE.ink);
    }
    for (const k of dentro) {
      const [x, y] = k.split(',').map(Number);
      pintar(x, y, cor(c));
    }
  }
  for (const [x, y, w, h, c] of detalhes) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) pintar(i, j, cor(c));
  return grade;
}

// Camadas que viram PNG: chave (caminho dentro de assets/avatar, sem .png) → { tipo, def }
export function camadasExportaveis() {
  const lista = [];
  for (const c of CABELOS) {
    if (c.tras?.length) lista.push({ chave: `cabelos/${c.id}-tras`, tipo: 'cabelo', def: { camadas: [[c.tras, 'H']] } });
    if (c.frente?.length) lista.push({ chave: `cabelos/${c.id}-frente`, tipo: 'cabelo', def: { camadas: [[c.frente, 'H']] } });
  }
  for (const r of ROUPAS) lista.push({ chave: `roupas/${r.id}`, tipo: 'roupa', def: r });
  for (const a of ACESSORIOS) if (a.camadas || a.detalhes) lista.push({ chave: `acessorios/${a.id}`, tipo: 'acessorio', def: a });
  return lista;
}
const DEFS = Object.fromEntries(camadasExportaveis().map((x) => [x.chave, x]));

// Grade da camada com as cores de referência (o que vai para o PNG)
const corRef = (c) => CORES_CHAVE[c] ?? PALETTE[c];
const cacheRef = {};
export function gradeDaCamada(chave) {
  const d = DEFS[chave];
  if (!d) return null;
  return (cacheRef[chave] ??= desenhar(novaGrade(), d.def, corRef));
}

// Devolve uma matriz 32x32 de hex (ou null = transparente). `sprites` = grades lidas dos PNGs
// (chave → grade, ver data/spritesAvatar.js); sem o PNG, usa a camada desenhada pelos retângulos.
export function montarAvatar(avatar, sprites = {}) {
  const a = { ...avatarPadrao(), ...avatar };
  const pele = PELES.find((p) => p.id === a.pele) ?? PELES[0];
  const cabelo = CABELOS.find((c) => c.id === a.cabelo) ?? CABELOS[0];
  const roupa = ROUPAS.find((r) => r.id === a.modeloRoupa) ?? ROUPAS[0];
  const acessorio = ACESSORIOS.find((x) => x.id === a.acessorio) ?? ACESSORIOS[0];
  const escolhida = { H: PALETTE[a.corCabelo], P: pele.base, S: pele.sombra, R: PALETTE[a.roupa] };
  const cor = (c) => escolhida[c] ?? PALETTE[c];

  const grade = novaGrade();
  // camada pronta (PNG ou referência) trocando as cores-chave pela escolha do jogador
  const trocas = (tipo) => {
    const t = { [CORES_CHAVE.P]: escolhida.P, [CORES_CHAVE.S]: escolhida.S };
    if (tipo === 'cabelo') t[CORES_CHAVE.H] = escolhida.H;
    if (tipo === 'roupa') t[CORES_CHAVE.R] = escolhida.R;
    return t;
  };
  const sobrepor = (chave) => {
    const g = sprites[chave] ?? gradeDaCamada(chave);
    if (!g) return;
    const t = trocas(DEFS[chave].tipo);
    for (let y = 0; y < TAM_AVATAR; y++) for (let x = 0; x < TAM_AVATAR; x++) if (g[y]?.[x]) grade[y][x] = t[g[y][x]] ?? g[y][x];
  };

  sobrepor(`cabelos/${cabelo.id}-tras`);
  sobrepor(`roupas/${roupa.id}`);
  desenhar(grade, { camadas: CORPO.map((p) => [p.rects, p.cor]) }, cor);
  desenhar(grade, { detalhes: [[21, 10, 1, 11, 'S'], [15, 25, 2, 1, 'P'], [10, 18, 2, 1, 'blush'], [20, 18, 2, 1, 'blush']] }, cor);
  desenhar(grade, { detalhes: (OLHOS.find((o) => o.id === a.olhos) ?? OLHOS[0]).rects }, cor);
  desenhar(grade, { detalhes: (NARIZES.find((n) => n.id === a.nariz) ?? NARIZES[0]).rects }, cor);
  desenhar(grade, { detalhes: (BOCAS.find((b) => b.id === a.boca) ?? BOCAS[0]).rects }, cor);
  sobrepor(`cabelos/${cabelo.id}-frente`);
  sobrepor(`acessorios/${acessorio.id}`);
  return grade;
}
