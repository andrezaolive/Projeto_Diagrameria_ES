// Músicas do jogo. Os WAV originais ficam em ../audio/ (fora do git); aqui entram os MP3 gerados a partir deles.
// A Game 1 já vem com o jogo; as outras são compradas na lojinha (aba Músicas) e escolhidas no toca-fitas.
import game1 from '../assets/audio/musica-game-1.mp3';
import game2 from '../assets/audio/musica-game-2.mp3';
import game3 from '../assets/audio/musica-game-3.mp3';
import game4 from '../assets/audio/musica-game-4.mp3';
import menu from '../assets/audio/musica-menu.mp3';
import { EXCESSO_MENU_DB, LOOP_MENU } from '../lib/musica.js';

// `loop` = duração exata do WAV (amostras / 44100). Não usar a duração do MP3 decodificado:
// o encoder acrescenta alguns ms de silêncio no fim, que viraria um buraco na emenda.
// `cor`: rótulo do disco no ícone. `preco` 0 = já vem com o jogo.
export const FAIXAS_JOGO = [
  { id: 'musica-game-1', nome: 'Game 1', url: game1, loop: 2454261 / 44100, preco: 0, cor: 'var(--c-mint)' },
  { id: 'musica-game-2', nome: 'Game 2', url: game2, loop: 2490353 / 44100, preco: 150, cor: 'var(--c-blush)' },
  { id: 'musica-game-3', nome: 'Game 3', url: game3, loop: 1992282 / 44100, preco: 200, cor: 'var(--c-sky)' },
  { id: 'musica-game-4', nome: 'Game 4', url: game4, loop: 2228211 / 44100, preco: 180, cor: 'var(--c-peach)' },
  // a do menu tem emenda própria (cauda por cima do início), igual à do menu
  { id: 'musica-menu', nome: 'Menu', url: menu, loop: LOOP_MENU, excessoDb: EXCESSO_MENU_DB, preco: 100, cor: 'var(--c-butter)' },
];

export const ALEATORIA = 'aleatoria';
export const faixaPorId = (id) => FAIXAS_JOGO.find((f) => f.id === id) ?? null;

// Músicas que o jogador tem (as de graça + as compradas)
export const faixasDoJogador = (possui = []) => FAIXAS_JOGO.filter((f) => f.preco === 0 || possui.includes(f.id));

// Escolher a música só depois de comprar o toca-fitas
export const temTocaFitas = (possui = []) => possui.includes('obj-radio');

// Sorteia uma das músicas do jogador (evitando repetir `atual`, se houver outra)
export function sortearFaixa(possui = [], aleatorio = Math.random, atual = null) {
  const lista = faixasDoJogador(possui);
  const opcoes = lista.length > 1 ? lista.filter((f) => f.id !== atual) : lista;
  return opcoes[Math.min(opcoes.length - 1, Math.floor(aleatorio() * opcoes.length))].id;
}

// Música que toca ao começar o jogo: a escolhida no toca-fitas (se ainda dá para usar) ou uma sorteada
export function faixaInicial(loja, aleatorio = Math.random) {
  const escolhida = loja?.musica;
  const disponivel = faixasDoJogador(loja?.possui).some((f) => f.id === escolhida);
  if (temTocaFitas(loja?.possui) && disponivel) return escolhida;
  return sortearFaixa(loja?.possui, aleatorio);
}
