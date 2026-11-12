import { describe, expect, it } from 'vitest';
import { diaEncerrado, estadoInicial, reducer, temRelogio } from './reducer.js';
import { MULTA, multaPedido, pacienciaDoDia } from '../data/pedidos.js';

const rodar = (state, ...acoes) => acoes.reduce(reducer, state);
const ticks = (state, n) => rodar(state, ...Array.from({ length: n }, () => ({ type: 'TICK' })));

describe('paciência dos clientes', () => {
  it('clientes ficam mais apressados nos dias avançados, com mínimo de 1 minuto', () => {
    expect(pacienciaDoDia(1)).toBeGreaterThan(pacienciaDoDia(10));
    expect(pacienciaDoDia(99)).toBe(60);
  });

  it('pedido novo perde paciência a cada segundo; o aceito não', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const [a, b] = s.sessao.pedidos;
    s = rodar(s, { type: 'ACEITAR', id: a.id });
    s = ticks(s, 5);
    const [pa, pb] = s.sessao.pedidos;
    expect(pa.paciencia).toBe(a.paciencia); // aceito: só o prazo corre
    expect(pa.tempoRestante).toBe(a.tempo - 5);
    expect(pb.paciencia).toBe(b.paciencia - 5);
  });

  it('sem paciência, o cliente vai embora e um pedido novo chega (modo infinito)', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const total = s.sessao.pedidos[0].pacienciaTotal;
    s = ticks(s, total);
    const expirados = s.sessao.pedidos.filter((p) => p.status === 'expirado');
    expect(expirados).toHaveLength(2);
    expect(s.sessao.pedidos.filter((p) => p.status === 'novo')).toHaveLength(2);
    expect(new Set(s.sessao.pedidos.map((p) => p.id)).size).toBe(s.sessao.pedidos.length);
    expect(s.estatisticas.expirados).toBe(2);
  });

  it('na campanha, cliente que foi embora conta como pedido encerrado do dia', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    const total = Math.max(...s.sessao.pedidos.map((p) => p.pacienciaTotal));
    s = ticks(s, total);
    expect(s.sessao.pedidos.every((p) => p.status === 'expirado')).toBe(true);
    expect(diaEncerrado(s.sessao)).toBe(true);
    // multas em sequência: 50% enquanto o saldo não é negativo, 25% depois
    let saldo = 100;
    let multas = 0;
    for (const p of s.sessao.pedidos) {
      const m = multaPedido(p, saldo);
      expect(p.multa).toBe(m);
      saldo -= m;
      multas += m;
    }
    expect(s.dinheiro).toBe(saldo);
    // ninguém atendido: 0% de desempenho, o dia não conta como concluído
    expect(s.sessao.relatorio).toEqual({ media: 0, aprovado: false, ganho: -multas });
    expect(s.campanha.concluidos[1]).toBeUndefined();
    expect(s.campanha.desbloqueado).toBe(1);
    expect(temRelogio(s.sessao)).toBe(false); // nada mais para cronometrar
  });

  it('pedidos de saves antigos (sem paciência) não expiram', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, sessao: { ...s.sessao, pedidos: s.sessao.pedidos.map(({ paciencia, pacienciaTotal, ...p }) => p) } };
    s = ticks(s, 500);
    expect(s.sessao.pedidos.every((p) => p.status === 'novo')).toBe(true);
  });
});

describe('multa por pedido perdido', () => {
  it('recusar custa metade do pagamento, uma vez só', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const p = s.sessao.pedidos[0];
    const multa = multaPedido(p);
    expect(multa).toBe(Math.round(p.recompensa / 2));
    s = rodar(s, { type: 'RECUSAR', id: p.id }, { type: 'RECUSAR', id: p.id });
    expect(s.dinheiro).toBe(100 - multa);
    expect(s.sessao.ganho).toBe(-multa);
    expect(s.sessao.pedidos[0]).toMatchObject({ status: 'recusado', multa });
    expect(s.estatisticas).toMatchObject({ recusados: 1, multas: multa });
  });

  it('cliente que foi embora também cobra a multa', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const [a, b] = s.sessao.pedidos;
    s = { ...s, dinheiro: 1000 };
    s = ticks(s, a.pacienciaTotal);
    const multas = multaPedido(a) + multaPedido(b);
    expect(s.dinheiro).toBe(1000 - multas);
    expect(s.estatisticas.multas).toBe(multas);
    expect(s.sessao.pedidos.filter((p) => p.status === 'expirado').every((p) => p.multa > 0)).toBe(true);
  });

  it('com pouco dinheiro, a multa deixa o saldo negativo (dívida) e bloqueia compras', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, dinheiro: 10 };
    const p = s.sessao.pedidos[0];
    s = rodar(s, { type: 'RECUSAR', id: p.id });
    expect(s.dinheiro).toBe(10 - multaPedido(p));
    expect(s.dinheiro).toBeLessThan(0);
    const antes = s.dinheiro;
    s = rodar(s, { type: 'COMPRAR', id: 'obj-vela', preco: 50 });
    expect(s.dinheiro).toBe(antes);
    expect(s.loja.possui).not.toContain('obj-vela');
  });

  it('entregar um pedido abate a dívida', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, dinheiro: -30 };
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id }, { type: 'ENTREGAR', id, nota: 90, valor: 100 });
    expect(s.dinheiro).toBe(70);
  });

  it('entregar não cobra multa', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id }, { type: 'ENTREGAR', id, nota: 80, valor: 50 });
    expect(s.dinheiro).toBe(150);
    expect(s.estatisticas.multas).toBe(0);
  });
});

describe('multa reduzida em dívida', () => {
  it('com saldo negativo a multa é 25% do pagamento; com saldo zero ou positivo, 50%', () => {
    const p = { recompensa: 120 };
    expect(MULTA).toEqual({ normal: 0.5, emDivida: 0.25, urgente: 0.2 });
    expect(multaPedido({ recompensa: 200, urgente: true }, 50)).toBe(40); // urgente: 20%, com ou sem dívida
    expect(multaPedido({ recompensa: 200, urgente: true }, -5)).toBe(40);
    expect(multaPedido(p, 50)).toBe(60);
    expect(multaPedido(p, 0)).toBe(60);
    expect(multaPedido(p, -1)).toBe(30);
  });

  it('recusar em dívida cobra 25%', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, dinheiro: -40 };
    const p = s.sessao.pedidos[0];
    s = rodar(s, { type: 'RECUSAR', id: p.id });
    expect(s.dinheiro).toBe(-40 - Math.round(p.recompensa * 0.25));
    expect(s.sessao.pedidos[0].multa).toBe(Math.round(p.recompensa * 0.25));
  });

  it('a multa que leva ao vermelho ainda é cheia; a seguinte já é reduzida', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, dinheiro: 10 };
    const [a, b] = s.sessao.pedidos;
    s = rodar(s, { type: 'RECUSAR', id: a.id });
    expect(s.dinheiro).toBe(10 - Math.round(a.recompensa * 0.5));
    const antes = s.dinheiro;
    s = rodar(s, { type: 'RECUSAR', id: b.id });
    expect(s.dinheiro).toBe(antes - Math.round(b.recompensa * 0.25));
  });
});
