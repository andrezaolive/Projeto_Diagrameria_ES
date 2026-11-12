// Cafeteira e cápsulas de café (item da loja): o café deixa o relógio do jogo mais lento por um tempo.
//
// Como funciona:
//  1. compra a cafeteira (obj-cafeteira, aba Café da lojinha) e cápsulas, uma por compra;
//  2. põe a caneca (que já vem na mesa) na cafeteira: ela encaixa na bandeja;
//  3. clica na cafeteira: um botão por tipo de cápsula, com quantas ainda tem no centro;
//  4. o café fica pronto depois de 5 a 10 s; clicar na caneca cheia bebe;
//  5. durante EFEITO_SEGUNDOS o relógio do jogo (prazos, paciência, chegada de pedidos) anda mais devagar.
import { normalizarEntrada } from '../lib/decoracao.js';

export const CAFETEIRA = 'cafeteira'; // objeto do escritório
export const ITEM_CAFETEIRA = 'obj-cafeteira'; // item da loja
export const CANECA = 'caneca';

// lentidao: quanto o relógio fica mais lento (0.25 = o jogo anda a 75% da velocidade)
export const CAPSULAS = [
  { id: 'descafeinado', nome: 'Cápsula de café descafeinado', curto: 'Descafeinado', lentidao: 0.15, preco: 5 },
  { id: 'normal', nome: 'Cápsula de café', curto: 'Café', lentidao: 0.25, preco: 10 },
  { id: 'forte', nome: 'Cápsula de café extra forte', curto: 'Extra forte', lentidao: 0.5, preco: 20 },
];
export const capsulaPorId = (id) => CAPSULAS.find((c) => c.id === id) ?? null;
// ícone 16×16 de cada cápsula (gerado em scripts/gen-assets.mjs)
const ICONES = import.meta.glob('../assets/ui/capsula-*-16.png', { eager: true, import: 'default' });
export const iconeCapsula = (tipo) => ICONES[`../assets/ui/capsula-${tipo}-16.png`];

export const EFEITO_SEGUNDOS = 40; // duração do efeito de cada café (segundos reais, sem contar a pausa)
export const PREPARO = { min: 5, max: 10 }; // segundos até o café ficar pronto
// tempo de preparo a partir de um número em [0, 1) (vem na ação, para o reducer seguir puro)
export const tempoDePreparo = (sorteio = 0) => PREPARO.min + Math.min(PREPARO.max - PREPARO.min, Math.floor(sorteio * (PREPARO.max - PREPARO.min + 1)));

// state.cafe
export const cafeInicial = () => ({
  capsulas: { descafeinado: 0, normal: 0, forte: 0 },
  preparando: null, // { tipo, falta } enquanto a cafeteira trabalha
  xicara: null, // tipo do café que está na caneca (null = vazia)
  efeito: null, // { tipo, falta } enquanto o café faz efeito
});

// Velocidade do relógio do jogo: 1 = normal; com café, 1 − lentidão
export const ritmoDoJogo = (cafe) => 1 - (cafe?.efeito ? capsulaPorId(cafe.efeito.tipo)?.lentidao ?? 0 : 0);

export const temCafeteira = (state) => state.loja.possui.includes(ITEM_CAFETEIRA);
// A caneca está encaixada na cafeteira (as duas no escritório)?
export function canecaNaCafeteira(state) {
  if (!state.loja.moveis.includes(ITEM_CAFETEIRA) || state.escritorio.guardados.includes(CANECA)) return false;
  return normalizarEntrada(CANECA, state.escritorio.posicoes[CANECA]).sobre === CAFETEIRA;
}

// Por que não dá para fazer café agora (null = pode)
export function motivoSemCafe(state, tipo) {
  const cafe = state.cafe;
  if (!state.loja.moveis.includes(ITEM_CAFETEIRA)) return 'A cafeteira não está no escritório.';
  if (cafe.preparando) return 'A cafeteira já está trabalhando.';
  if (!canecaNaCafeteira(state)) return 'Coloque a caneca na cafeteira primeiro.';
  if (cafe.xicara) return 'A caneca já está cheia: beba o café antes.';
  if (tipo && !(cafe.capsulas[tipo] > 0)) return 'Acabaram as cápsulas desse tipo: compre mais na lojinha.';
  return null;
}
