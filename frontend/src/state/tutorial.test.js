import { describe, expect, it } from 'vitest';
import { diaEncerrado, estadoInicial, migrar, reducer, temRelogio } from './reducer.js';

const iniciar = (state, extra = {}) => reducer(state, { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.3, sorteio: 0.5, ...extra });

describe('tutorial da primeira partida', () => {
  it('save novo ainda não viu o tutorial', () => {
    expect(estadoInicial().tutorial).toEqual({ visto: false });
  });

  it('com tutorial, os pedidos esperam: relógio parado e o dia não acaba', () => {
    const s = iniciar(estadoInicial(), { tutorial: true });
    expect(s.sessao.pedidos).toEqual([]);
    expect(s.sessao.esperaTutorial).toHaveLength(1);
    expect(temRelogio(s.sessao)).toBe(false);
    expect(diaEncerrado(s.sessao)).toBe(false);
  });

  it('CONCLUIR_TUTORIAL marca como visto e faz o primeiro pedido chegar', () => {
    const antes = iniciar(estadoInicial(), { tutorial: true });
    const s = reducer(antes, { type: 'CONCLUIR_TUTORIAL' });
    expect(s.tutorial.visto).toBe(true);
    expect(s.sessao.esperaTutorial).toBeUndefined();
    expect(s.sessao.pedidos).toEqual(antes.sessao.esperaTutorial);
    expect(s.sessao.pedidos[0].status).toBe('novo');
    expect(temRelogio(s.sessao)).toBe(true);
  });

  it('modo infinito também segura os dois primeiros pedidos', () => {
    const s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito', tutorial: true });
    expect(s.sessao.pedidos).toEqual([]);
    expect(reducer(s, { type: 'CONCLUIR_TUTORIAL' }).sessao.pedidos).toHaveLength(2);
  });

  it('sem a flag, nada muda', () => {
    const s = iniciar(estadoInicial());
    expect(s.sessao.pedidos).toHaveLength(1);
    expect(s.sessao.esperaTutorial).toBeUndefined();
  });

  it('save antigo: quem já jogou não vê o tutorial; quem nunca jogou vê', () => {
    const { tutorial: _, ...semTutorial } = estadoInicial();
    expect(migrar({ ...semTutorial, estatisticas: { ...semTutorial.estatisticas, jogos: 3 } }).tutorial.visto).toBe(true);
    expect(migrar(semTutorial).tutorial.visto).toBe(false);
    expect(migrar({ ...semTutorial, tutorial: { visto: true } }).tutorial.visto).toBe(true);
  });
});
