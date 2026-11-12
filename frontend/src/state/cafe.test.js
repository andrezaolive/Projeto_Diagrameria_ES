import { describe, expect, it } from 'vitest';
import { estadoInicial, migrar, reducer } from './reducer.js';
import { CAPSULAS, EFEITO_SEGUNDOS, PREPARO, canecaNaCafeteira, motivoSemCafe, ritmoDoJogo, tempoDePreparo } from '../data/cafe.js';
import { MUSICAS_CAFE } from '../data/musicas.js';
import { moverComConteudo, pousar, resolverCena } from '../lib/decoracao.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const segundos = (s, n, tipo = 'CAFE_TICK') => rodar(s, ...Array.from({ length: n }, () => ({ type: tipo })));

// cafeteira comprada e na mesa, com a caneca encaixada nela
function comCafeteira(dinheiro = 500) {
  let s = rodar({ ...estadoInicial(), dinheiro }, { type: 'COMPRAR', id: 'obj-cafeteira', preco: 120 }, { type: 'ALTERNAR_MOVEL', id: 'obj-cafeteira' });
  const maquina = resolverCena(['cafeteira'], s.escritorio.posicoes)[0];
  const encaixe = pousar('caneca', false, maquina.x + 3, maquina.y + 10, [maquina]);
  return rodar(s, { type: 'MOVER_OBJETO', objeto: 'caneca', posicao: encaixe.entrada });
}

describe('cafeteira', () => {
  it('3 cápsulas: descafeinado 15%, café 25%, extra forte 50%', () => {
    expect(CAPSULAS.map((c) => [c.nome, c.lentidao])).toEqual([
      ['Cápsula de café descafeinado', 0.15],
      ['Cápsula de café', 0.25],
      ['Cápsula de café extra forte', 0.5],
    ]);
  });

  it('cápsulas são compradas uma a uma, e só com a cafeteira', () => {
    const sem = { ...estadoInicial(), dinheiro: 500 };
    expect(rodar(sem, { type: 'COMPRAR_CAPSULA', tipo: 'forte' })).toBe(sem);
    let s = comCafeteira();
    const antes = s.dinheiro;
    s = rodar(s, { type: 'COMPRAR_CAPSULA', tipo: 'forte' }, { type: 'COMPRAR_CAPSULA', tipo: 'forte' }, { type: 'COMPRAR_CAPSULA', tipo: 'normal' });
    expect(s.cafe.capsulas).toEqual({ descafeinado: 0, normal: 1, forte: 2 });
    expect(s.dinheiro).toBe(antes - 20 - 20 - 10);
    const pobre = { ...s, dinheiro: 3 };
    expect(rodar(pobre, { type: 'COMPRAR_CAPSULA', tipo: 'normal' })).toBe(pobre);
  });

  it('a caneca solta sobre a cafeteira encaixa na bandeja, e vai junto quando a cafeteira se move', () => {
    let s = comCafeteira();
    expect(canecaNaCafeteira(s)).toBe(true);
    const cena = resolverCena(['cafeteira', 'caneca'], s.escritorio.posicoes);
    const [maquina, caneca] = cena;
    expect(caneca.x).toBe(maquina.x + maquina.meta.bandeja.x);
    expect(caneca.y + caneca.meta.h).toBe(maquina.y + maquina.meta.bandeja.base);
    const posicoes = moverComConteudo(s.escritorio.posicoes, 'cafeteira', { x: maquina.x - 100, sobre: 'mesa', chao: 160 });
    const [m2, c2] = resolverCena(['cafeteira', 'caneca'], posicoes);
    expect(c2.x - m2.x).toBe(caneca.x - maquina.x);
  });

  it('só faz café com a caneca vazia na cafeteira e cápsula do tipo', () => {
    let s = comCafeteira();
    expect(motivoSemCafe(s, 'normal')).toMatch(/cápsulas/);
    s = rodar(s, { type: 'COMPRAR_CAPSULA', tipo: 'normal' });
    expect(motivoSemCafe(s, 'normal')).toBe(null);
    // caneca fora da cafeteira
    const fora = rodar(s, { type: 'MOVER_OBJETO', objeto: 'caneca', posicao: { x: 40, sobre: 'mesa', chao: 170 } });
    expect(motivoSemCafe(fora, 'normal')).toMatch(/caneca na cafeteira/);
    expect(rodar(fora, { type: 'FAZER_CAFE', tipo: 'normal', sorteio: 0 })).toBe(fora);
  });

  it('o café fica pronto em 5 a 10 s, gasta a cápsula; beber dá 40 s de efeito', () => {
    expect(tempoDePreparo(0)).toBe(PREPARO.min);
    expect(tempoDePreparo(0.9999)).toBe(PREPARO.max);
    let s = rodar(comCafeteira(), { type: 'COMPRAR_CAPSULA', tipo: 'forte' }, { type: 'FAZER_CAFE', tipo: 'forte', sorteio: 0 });
    expect(s.cafe.capsulas.forte).toBe(0);
    expect(s.cafe.preparando).toEqual({ tipo: 'forte', falta: 5 });
    expect(motivoSemCafe(s, 'forte')).toMatch(/trabalhando/);
    s = segundos(s, 4);
    expect(s.cafe.xicara).toBe(null);
    s = segundos(s, 1);
    expect(s.cafe).toMatchObject({ preparando: null, xicara: 'forte' });
    expect(motivoSemCafe(s, 'forte')).toMatch(/cheia/);
    s = rodar(s, { type: 'BEBER_CAFE' });
    expect(s.cafe).toMatchObject({ xicara: null, efeito: { tipo: 'forte', falta: EFEITO_SEGUNDOS } });
    expect(ritmoDoJogo(s.cafe)).toBe(0.5);
    s = segundos(s, EFEITO_SEGUNDOS);
    expect(s.cafe.efeito).toBe(null);
    expect(ritmoDoJogo(s.cafe)).toBe(1);
  });

  it('o efeito não acumula: outro café recomeça dos 40 s (e troca o tipo, se for outro)', () => {
    const preparar = (st, tipo) => segundos(rodar(st, { type: 'COMPRAR_CAPSULA', tipo }, { type: 'FAZER_CAFE', tipo, sorteio: 0 }), PREPARO.min);
    let s = rodar(preparar(comCafeteira(), 'normal'), { type: 'BEBER_CAFE' });
    s = preparar(s, 'normal'); // 5 s de preparo do segundo café
    s = segundos(s, 5);
    expect(s.cafe.efeito).toEqual({ tipo: 'normal', falta: EFEITO_SEGUNDOS - 10 });
    s = rodar(s, { type: 'BEBER_CAFE' });
    expect(s.cafe.efeito).toEqual({ tipo: 'normal', falta: EFEITO_SEGUNDOS });
    s = rodar(preparar(s, 'forte'), { type: 'BEBER_CAFE' });
    expect(s.cafe.efeito).toEqual({ tipo: 'forte', falta: EFEITO_SEGUNDOS });
  });

  it('cada cápsula tem a sua música', () => {
    expect(Object.keys(MUSICAS_CAFE).sort()).toEqual(CAPSULAS.map((c) => c.id).sort());
  });

  it('com café, o relógio do jogo anda mais devagar (extra forte: metade)', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id });
    const prazo = () => s.sessao.pedidos.find((p) => p.id === id).tempoRestante;
    const t0 = prazo();
    s = { ...s, cafe: { ...s.cafe, efeito: { tipo: 'forte', falta: 20 } } };
    s = segundos(s, 10, 'TICK');
    expect(t0 - prazo()).toBe(5);
    s = { ...s, cafe: { ...s.cafe, efeito: { tipo: 'normal', falta: 20 } } };
    const t1 = prazo();
    s = segundos(s, 20, 'TICK');
    expect(t1 - prazo()).toBe(15); // 25% mais lento: 15 segundos de jogo em 20
    s = { ...s, cafe: { ...s.cafe, efeito: { tipo: 'descafeinado', falta: 20 } } };
    const t2 = prazo();
    s = segundos(s, 20, 'TICK');
    expect(t2 - prazo()).toBe(17); // 15% mais lento
  });

  it('o efeito não passa para a próxima partida; save antigo ganha o café zerado', () => {
    let s = { ...estadoInicial(), cafe: { ...estadoInicial().cafe, efeito: { tipo: 'forte', falta: 9 } } };
    s = rodar(s, { type: 'INICIAR_SESSAO', modo: 'infinito' });
    expect(s.cafe.efeito).toBe(null);
    expect(migrar({ dinheiro: 5 }).cafe.capsulas).toEqual({ descafeinado: 0, normal: 0, forte: 0 });
  });
});
