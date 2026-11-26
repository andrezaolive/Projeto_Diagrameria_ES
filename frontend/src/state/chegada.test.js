import { describe, expect, it } from 'vitest';
import { ESPERA_INFINITO, diaEncerrado, estadoInicial, reducer, temRelogio } from './reducer.js';
import { CHEGADA, intervaloChegada, pedidosNoDia } from '../data/pedidos.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const ticks = (s, n, sorteioChegada = 0.5) => {
  for (let i = 0; i < n; i++) s = reducer(s, { type: 'TICK', sorteioChegada });
  return s;
};
const iniciar = (dia, sorteio) => rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia, sorteio });

describe('chegada dos pedidos do dia (campanha)', () => {
  it('intervalo entre 45 s e 90 s', () => {
    expect(intervaloChegada(0)).toBe(CHEGADA.min);
    expect(intervaloChegada(0.9999)).toBe(CHEGADA.max);
    expect(intervaloChegada()).toBeGreaterThanOrEqual(45);
  });

  it('só o primeiro chega no começo; o segundo chega na hora sorteada', () => {
    expect(pedidosNoDia(5)).toBe(3);
    let s = iniciar(5, 0); // 45 s
    expect(s.sessao.pedidos).toHaveLength(1);
    expect(s.sessao.proximoEm).toBe(45);
    s = rodar(s, { type: 'ACEITAR', id: s.sessao.pedidos[0].id }); // trabalhando no primeiro
    s = ticks(s, 44);
    expect(s.sessao.pedidos).toHaveLength(1);
    s = ticks(s, 1);
    expect(s.sessao.pedidos).toHaveLength(2);
    expect(s.sessao.pedidos[1].status).toBe('novo');
    expect(s.sessao.pedidos[1].paciencia).toBe(s.sessao.pedidos[1].pacienciaTotal); // paciência conta da chegada
  });

  it('entregar o anterior antes da hora traz o próximo 10 a 20 s depois (não na hora)', () => {
    let s = iniciar(9, 1); // 3 pedidos, 90 s de intervalo
    expect(pedidosNoDia(9)).toBe(3);
    const a = s.sessao.pedidos[0];
    s = rodar(s, { type: 'ACEITAR', id: a.id }, { type: 'ENTREGAR', id: a.id, nota: 80, valor: 1, sorteio: 0 });
    expect(s.sessao.pedidos).toHaveLength(1);
    expect(s.sessao.proximoEm).toBe(s.sessao.segundos + ESPERA_INFINITO.min); // adiantado: 10 s
    expect(temRelogio(s.sessao)).toBe(true); // o relógio continua para ele chegar
    expect(diaEncerrado(s.sessao)).toBe(false);
    s = ticks(s, ESPERA_INFINITO.min - 1, 0);
    expect(s.sessao.pedidos).toHaveLength(1);
    s = ticks(s, 1, 0);
    expect(s.sessao.pedidos).toHaveLength(2);
    expect(s.sessao.proximoEm).toBe(s.sessao.segundos + 45); // o seguinte, a partir de agora
  });

  it('o dia só acaba depois que todos chegaram e terminaram', () => {
    let s = iniciar(1); // 2 pedidos
    const a = s.sessao.pedidos[0];
    s = rodar(s, { type: 'RECUSAR', id: a.id }); // recusar também adianta o próximo
    expect(diaEncerrado(s.sessao)).toBe(false);
    s = ticks(s, ESPERA_INFINITO.max);
    expect(s.sessao.pedidos).toHaveLength(2);
    expect(diaEncerrado(s.sessao)).toBe(false);
    s = rodar(s, { type: 'RECUSAR', id: s.sessao.pedidos[1].id });
    expect(diaEncerrado(s.sessao)).toBe(true);
  });

  it('modo infinito continua com dois pedidos de cara', () => {
    const s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    expect(s.sessao.pedidos).toHaveLength(2);
    expect(s.sessao.fila).toBeUndefined();
  });
});
