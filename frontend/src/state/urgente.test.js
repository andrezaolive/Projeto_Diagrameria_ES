import { describe, expect, it } from 'vitest';
import { estadoInicial, reducer, sortearUrgente } from './reducer.js';
import { URGENTE, criarPedido, criarPedidoUrgente, pacienciaDoDia } from '../data/pedidos.js';
import { detectarAlertas, vistosIniciais } from '../lib/alertas.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
// n segundos de jogo; `sorteio` vai em todo TICK
const ticks = (s, n, sorteio) => {
  for (let i = 0; i < n; i++) s = reducer(s, { type: 'TICK', sorteio });
  return s;
};
const urgentes = (s) => s.sessao.pedidos.filter((p) => p.urgente);

describe('pedido urgente', () => {
  it('paga mais, com prazo e paciência menores', () => {
    const n = criarPedido('biblioteca', 1, 1);
    const u = criarPedidoUrgente('biblioteca', 1, 1);
    expect(u.urgente).toBe(true);
    expect(u.recompensa).toBe(Math.round(n.recompensa * URGENTE.pagamento));
    expect(u.tempo).toBeLessThan(n.tempo);
    expect(u.tempoRestante).toBe(u.tempo);
    expect(u.paciencia).toBeLessThan(pacienciaDoDia(1));
    expect(u.pacienciaTotal).toBe(u.paciencia);
    expect(u.id).not.toBe(n.id);
  });

  it('o sorteio só acontece a cada minuto e com chance de 1 em 3', () => {
    const s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' }).sessao;
    expect(sortearUrgente(s, 59, 0)).toBeNull(); // fora do minuto
    expect(sortearUrgente(s, 60, URGENTE.chance)).toBeNull(); // perdeu o sorteio
    expect(sortearUrgente(s, 60, 0.1)).toMatchObject({ urgente: true });
    expect(sortearUrgente(s, 60, undefined)).toBeNull(); // sem sorteio (testes, saves): nunca
  });

  it('chega pelo TICK depois de um minuto de jogo, um por vez', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = ticks(s, 59, 0.1);
    expect(urgentes(s)).toHaveLength(0);
    s = ticks(s, 1, 0.1);
    expect(urgentes(s)).toHaveLength(1);
    expect(urgentes(s)[0].modelo).not.toBe(s.sessao.pedidos[0].modelo); // não repete um da fila
    // enquanto o urgente está na fila (aqui, aceito), não chega outro
    s = rodar(s, { type: 'ACEITAR', id: urgentes(s)[0].id });
    s = ticks(s, 60, 0.1);
    expect(urgentes(s)).toHaveLength(1);
  });

  it('debug: força um urgente na hora', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' }, { type: 'DEBUG_URGENTE' });
    expect(urgentes(s)).toHaveLength(1);
  });

  it('perder o sorteio não traz nada', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = ticks(s, 120, 0.9);
    expect(urgentes(s)).toHaveLength(0);
  });

  it('perdido ou recusado multa só 20% do pagamento do urgente', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = ticks(s, 60, 0.1);
    const u = urgentes(s)[0];
    const antes = s.dinheiro;
    s = rodar(s, { type: 'RECUSAR', id: u.id });
    expect(s.dinheiro).toBe(antes - Math.round(u.recompensa * 0.2));
  });

  it('chegada gera pop-up "urgente" uma vez só', () => {
    const u = criarPedidoUrgente('banco', 3, 1);
    const r1 = detectarAlertas([u], vistosIniciais([]));
    expect(r1.alertas.map((a) => a.tipo)).toEqual(['urgente']);
    expect(detectarAlertas([u], r1.vistos).alertas).toEqual([]);
    expect(detectarAlertas([u], vistosIniciais([u])).alertas).toEqual([]); // já estava na tela ao abrir
  });
});
