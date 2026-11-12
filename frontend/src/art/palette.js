// Paleta oficial (16 cores). Ver CLAUDE.md. Usada pelo gerador de assets e pelo CSS.
export const PALETTE = {
  ink: '#1e1a2e',
  night: '#2d2640',
  plum: '#463a5e',
  grape: '#5f4d7a',
  violet: '#7d6a9e',
  orchid: '#9d87c0',
  lavender: '#b8a4d9',
  lilac: '#d4c4ec',
  mist: '#ece4f7',
  cream: '#fbf7ff',
  blush: '#f4b6c8',
  peach: '#f7d6a8',
  butter: '#f2e6a0',
  mint: '#a8d8d0',
  sky: '#a9c4ec',
  rose: '#e88a9e',
};

// Exceção documentada à paleta: tons de pele do avatar do jogador (a paleta de 16 cores
// não cobre a diversidade de peles). Usar somente no avatar.
export const PELES = [
  { id: 'clara', nome: 'Clara', base: '#fbe3cf', sombra: '#e8bfa5' },
  { id: 'media-clara', nome: 'Média clara', base: '#eab793', sombra: '#c98f6e' },
  { id: 'media', nome: 'Média', base: '#c68a63', sombra: '#a06a4c' },
  { id: 'morena', nome: 'Morena', base: '#8d5a43', sombra: '#6e4234' },
  { id: 'escura', nome: 'Escura', base: '#5c3a30', sombra: '#432a26' },
];

// Tintas das canetas do pote (lojinha → Pote de canetas) e do rabisco no papel. Segunda exceção à
// paleta, como as PELES: verde, ciano, laranja e um vermelho/azul vivos não existem nas 16 cores.
// Tons suaves para combinar com o resto; branco, preto, roxo, rosa e amarelo saem da paleta.
export const TINTAS = {
  branco: '#fbf7ff',
  preto: '#1e1a2e',
  azul: '#5b7fd1',
  roxo: '#7d6a9e',
  vermelho: '#d0505f',
  rosa: '#f4b6c8',
  laranja: '#ef9a55',
  amarelo: '#f2d45c',
  verde: '#6cb877',
  ciano: '#6ccfd9',
};
