// Avatar do jogador em pixel art 32x32, montado em tempo de execução a partir de partes.
// Cada parte é uma lista de retângulos [x, y, w, h, cor]; camadas com contorno ganham
// automaticamente 1px de 'ink' em volta (por cima das camadas anteriores).
import { PALETTE, PELES } from '../art/palette.js';

export const TAM_AVATAR = 32;

// 'H' = cor do cabelo, 'P' = pele, 'S' = sombra da pele, 'R' = roupa
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
];

export const CORES_CABELO = ['ink', 'plum', 'grape', 'peach', 'butter', 'rose', 'lavender', 'sky'];
export const CORES_ROUPA = ['violet', 'rose', 'mint', 'sky', 'butter', 'blush', 'grape'];

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
  roupa: CORES_ROUPA,
};

export const avatarPadrao = () => ({
  cabelo: 'curto',
  corCabelo: 'plum',
  pele: PELES[1].id,
  olhos: 'ponto',
  nariz: 'ponto',
  boca: 'sorriso',
  roupa: 'violet',
});

// Avança (passo = ±1) uma característica, dando a volta na lista
export function alternar(avatar, campo, passo) {
  const lista = OPCOES_AVATAR[campo];
  const i = Math.max(0, lista.indexOf(avatar[campo]));
  return { ...avatar, [campo]: lista[(i + passo + lista.length) % lista.length] };
}

// Nome legível da opção escolhida (para a tela de edição)
export function nomeOpcao(campo, valor) {
  const buscar = (lista) => lista.find((x) => x.id === valor)?.nome ?? valor;
  if (campo === 'cabelo') {
    const c = CABELOS.find((x) => x.id === valor);
    return c ? c.nome : valor;
  }
  if (campo === 'pele') return buscar(PELES);
  if (campo === 'olhos') return buscar(OLHOS);
  if (campo === 'nariz') return buscar(NARIZES);
  if (campo === 'boca') return buscar(BOCAS);
  return NOMES_CORES[valor] ?? valor;
}

const NOMES_CORES = {
  ink: 'Preto', plum: 'Castanho', grape: 'Ameixa', peach: 'Loiro claro', butter: 'Loiro',
  rose: 'Ruivo', lavender: 'Lavanda', sky: 'Azul', violet: 'Violeta', mint: 'Menta', blush: 'Rosa',
};

const CORPO = [
  { rects: [[6, 25, 20, 1], [5, 26, 22, 2], [4, 28, 24, 4]], cor: 'R' },
  { rects: [[14, 21, 4, 5]], cor: 'P' },
  { rects: [[8, 13, 2, 4], [22, 13, 2, 4]], cor: 'P' },
  { rects: [[10, 9, 12, 13], [11, 8, 10, 1], [11, 22, 10, 1]], cor: 'P' },
];

// Devolve uma matriz 32x32 de hex (ou null = transparente)
export function montarAvatar(avatar) {
  const a = { ...avatarPadrao(), ...avatar };
  const pele = PELES.find((p) => p.id === a.pele) ?? PELES[0];
  const cabelo = CABELOS.find((c) => c.id === a.cabelo) ?? CABELOS[0];
  const cor = (c) =>
    ({ H: PALETTE[a.corCabelo], P: pele.base, S: pele.sombra, R: PALETTE[a.roupa] })[c] ?? PALETTE[c];

  const N = TAM_AVATAR;
  const grade = Array.from({ length: N }, () => Array(N).fill(null));
  const pintar = (x, y, hex) => {
    if (x >= 0 && y >= 0 && x < N && y < N) grade[y][x] = hex;
  };

  // camada com contorno automático
  const camada = (rects, c) => {
    if (!rects?.length) return;
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
  };
  // detalhes sem contorno
  const detalhe = (rects) => {
    for (const [x, y, w, h, c] of rects) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) pintar(i, j, cor(c));
  };

  camada(cabelo.tras, 'H');
  for (const p of CORPO) camada(p.rects, p.cor);
  detalhe([[21, 10, 1, 11, 'S'], [15, 25, 2, 1, 'P'], [10, 18, 2, 1, 'blush'], [20, 18, 2, 1, 'blush']]);
  detalhe((OLHOS.find((o) => o.id === a.olhos) ?? OLHOS[0]).rects);
  detalhe((NARIZES.find((n) => n.id === a.nariz) ?? NARIZES[0]).rects);
  detalhe((BOCAS.find((b) => b.id === a.boca) ?? BOCAS[0]).rects);
  camada(cabelo.frente, 'H');
  return grade;
}
