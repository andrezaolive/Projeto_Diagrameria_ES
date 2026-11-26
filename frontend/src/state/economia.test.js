import { describe, expect, it } from 'vitest';
import { DESPESA, FATOR_INFINITO, bonusDoDia, criarPedido, criarPedidoUrgente, despesaDoDia, modeloPorId, precoPedaco } from '../data/pedidos.js';
import { fatorAtraso, pagamentoDaEntrega } from '../lib/avaliacao.js';
import { ITENS_LOJA } from '../data/loja.js';
import { FAIXAS_JOGO } from '../data/musicas.js';
import { estadoInicial, reducer } from './reducer.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);

describe('economia', () => {
  it('bônus do dia: +2% por dia, no máximo +40%', () => {
    expect(bonusDoDia(1)).toBe(1);
    expect(bonusDoDia(11)).toBeCloseTo(1.2);
    expect(bonusDoDia(21)).toBeCloseTo(1.4);
    expect(bonusDoDia(23)).toBeCloseTo(1.4);
  });

  it('aluguel e luz crescem de R$ 30 a R$ 200 ao longo do mês', () => {
    expect(despesaDoDia(1)).toBe(DESPESA.inicio);
    expect(despesaDoDia(23)).toBe(DESPESA.fim);
    for (let d = 2; d <= 23; d++) expect(despesaDoDia(d)).toBeGreaterThanOrEqual(despesaDoDia(d - 1));
  });

  it('loja: preços maiores, com itens premium de R$ 1.000 ou mais', () => {
    const total = [...ITENS_LOJA, ...FAIXAS_JOGO].reduce((t, i) => t + (i.preco ?? 0), 0);
    expect(total).toBeGreaterThan(11000);
    expect(ITENS_LOJA.filter((i) => i.preco >= 1000).map((i) => i.id).sort()).toEqual(['fundo-cerejeiras', 'obj-gato', 'obj-neon']);
  });

  it('dicas (grade 2x2): R$ 100 / 150 / 200 pelo nível, e cada pedaço encarece +25%, +50% e +100%', () => {
    const preco = (id, comprados) => precoPedaco({ ...criarPedido(id, 1, 1), pedacos: Array.from({ length: comprados }, (_, i) => i) });
    const facil = 'atlas';
    expect([0, 1, 2, 3].map((k) => preco(facil, k))).toEqual([100, 125, 150, 200]);
    const medio = ['cinema', 'hotel', 'locadora'].find((id) => preco(id, 0) === 150);
    expect(medio).toBeTruthy();
    expect([0, 1, 2, 3].map((k) => preco(medio, k))).toEqual([150, 188, 225, 300]);
    expect([0, 1, 2, 3].map((k) => preco('frota', k))).toEqual([200, 250, 300, 400]);
  });

  it('JUMBO: cada diagrama conta os próprios pedaços', () => {
    const p = { ...criarPedido('jumbo-cinema', 1, 5), pedacos: [0, 1] };
    expect(precoPedaco(p, 0)).toBeGreaterThan(precoPedaco(p, 1));
  });

  it('atraso: −10% a cada 30 s, até sobrar 20%', () => {
    expect([0, 1, 30, 31, 60, 120, 240, 999].map(fatorAtraso)).toEqual([1, 0.9, 0.9, 0.8, 0.8, 0.6, 0.2, 0.2]);
    const p = { ...criarPedido('cinema', 1, 1), tempoRestante: 0, atraso: 45 };
    expect(pagamentoDaEntrega(p, 100)).toMatchObject({ atrasado: true, fatorAtraso: 0.8, valor: Math.round(p.recompensa * 0.8), perdeuBonus: false });
    expect(pagamentoDaEntrega({ ...p, tempoRestante: 10 }, 50)).toMatchObject({ atrasado: false, valor: Math.round(p.recompensa / 2) });
  });

  it('urgente entregue atrasado perde o bônus e paga como um pedido normal atrasado', () => {
    const u = criarPedidoUrgente('cinema', 1, 1);
    expect(u.recompensa).toBeGreaterThan(u.recompensaNormal);
    expect(pagamentoDaEntrega({ ...u, tempoRestante: 5 }, 100).valor).toBe(u.recompensa);
    expect(pagamentoDaEntrega({ ...u, tempoRestante: 0, atraso: 10 }, 100)).toMatchObject({ valor: Math.round(u.recompensaNormal * 0.9), perdeuBonus: true });
  });

  it('o prazo zerado começa a contar o atraso no TICK', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id });
    s = { ...s, sessao: { ...s.sessao, pedidos: s.sessao.pedidos.map((p) => (p.id === id ? { ...p, tempoRestante: 1 } : p)) } };
    s = rodar(s, { type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' });
    expect(s.sessao.pedidos[0]).toMatchObject({ tempoRestante: 0, atraso: 2 });
  });

  it('modo infinito paga 60% (e avisa no pedido)', () => {
    const s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    for (const p of s.sessao.pedidos) {
      expect(p.infinito).toBe(true);
      expect(p.recompensa).toBe(Math.round(criarPedido(p.modelo, 1, 1).recompensa * FATOR_INFINITO));
    }
  });
});
