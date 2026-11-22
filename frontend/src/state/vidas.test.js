import { describe, expect, it } from 'vitest';
import { chegarAgora } from './testeAjuda.js';
import { MAX_ACEITOS_INFINITO, VIDAS_INFINITO, estadoInicial, partidaEncerrada, pedidosAceitos, podeAceitar, reducer } from './reducer.js';

const infinito = () => reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
// deixa o primeiro pedido novo a um segundo de ir embora
const quaseIndo = (s) => {
  const id = s.sessao.pedidos.find((p) => p.status === 'novo')?.id;
  return { ...s, sessao: { ...s.sessao, pedidos: s.sessao.pedidos.map((p) => (p.id === id ? { ...p, paciencia: 1 } : p)) } };
};
const expirar = (s) => chegarAgora(reducer(quaseIndo(s), { type: 'TICK' }));
const entregar = (s, atrasado) => {
  const id = s.sessao.pedidos.find((p) => p.status === 'novo').id;
  s = reducer(s, { type: 'ACEITAR', id });
  return chegarAgora(reducer(s, { type: 'ENTREGAR', id, nota: 80, valor: 50, atrasado, erros: {} }));
};

describe('corações do modo infinito', () => {
  it('a partida começa com 3 corações; a campanha não tem', () => {
    expect(infinito().sessao.vidas).toBe(VIDAS_INFINITO);
    expect(reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.3 }).sessao.vidas).toBeUndefined();
  });

  it('cliente que vai embora tira um coração', () => {
    const s = expirar(infinito());
    expect(s.sessao.pedidos[0].status).toBe('expirado');
    expect(s.sessao.vidas).toBe(VIDAS_INFINITO - 1);
  });

  it('entrega atrasada tira um coração; no prazo, não', () => {
    expect(entregar(infinito(), false).sessao.vidas).toBe(VIDAS_INFINITO);
    expect(entregar(infinito(), true).sessao.vidas).toBe(VIDAS_INFINITO - 1);
  });

  it('recusar não tira coração (já cobra a multa)', () => {
    const s = infinito();
    expect(reducer(s, { type: 'RECUSAR', id: s.sessao.pedidos[0].id }).sessao.vidas).toBe(VIDAS_INFINITO);
  });

  it('sem corações a partida acaba, o relógio para e o recorde é guardado', () => {
    let s = entregar(infinito(), false);
    s = expirar(s);
    s = entregar(s, true);
    expect(partidaEncerrada(s.sessao)).toBe(false);
    s = expirar(s);
    expect(s.sessao.vidas).toBe(0);
    expect(partidaEncerrada(s.sessao)).toBe(true);
    expect(s.sessao.fimDeJogo).toEqual({ entregues: 2, recorde: true, recordeAnterior: 0 });
    expect(s.estatisticas.recordeInfinito).toBe(2);
    // depois do fim, o TICK não mexe em mais nada
    expect(reducer(quaseIndo(s), { type: 'TICK' }).sessao).toEqual(quaseIndo(s).sessao);
  });

  it('partida pior que o recorde não troca o recorde', () => {
    let s = infinito();
    s = { ...s, estatisticas: { ...s.estatisticas, recordeInfinito: 5 } };
    s = expirar(expirar(expirar(s)));
    expect(s.sessao.fimDeJogo).toEqual({ entregues: 0, recorde: false, recordeAnterior: 5 });
    expect(s.estatisticas.recordeInfinito).toBe(5);
  });
});

describe('limite de pedidos em andamento no modo infinito', () => {
  // `n` pedidos novos na caixa, além dos que já estão lá
  const comNovos = (s, n) => {
    const base = s.sessao.pedidos[0];
    const extras = Array.from({ length: n }, (_, i) => ({ ...base, id: `extra-${i}`, status: 'novo' }));
    return { ...s, sessao: { ...s.sessao, pedidos: [...s.sessao.pedidos, ...extras] } };
  };
  const aceitarTodos = (s) => s.sessao.pedidos.filter((p) => p.status === 'novo').reduce((st, p) => reducer(st, { type: 'ACEITAR', id: p.id }), s);

  it(`aceita até ${MAX_ACEITOS_INFINITO} ao mesmo tempo; o próximo fica esperando`, () => {
    const s = aceitarTodos(comNovos(infinito(), 3)); // 2 iniciais + 3 = 5 novos
    expect(pedidosAceitos(s.sessao)).toHaveLength(MAX_ACEITOS_INFINITO);
    expect(podeAceitar(s.sessao)).toBe(false);
    expect(s.sessao.pedidos.filter((p) => p.status === 'novo')).toHaveLength(2);
  });

  it('entregar um libera a vaga', () => {
    let s = aceitarTodos(comNovos(infinito(), 3));
    const id = pedidosAceitos(s.sessao)[0].id;
    s = reducer(s, { type: 'ENTREGAR', id, nota: 90, valor: 10, erros: {} });
    expect(podeAceitar(s.sessao)).toBe(true);
  });

  it('a campanha não tem limite', () => {
    let s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.3 });
    s = aceitarTodos(comNovos(s, 4));
    expect(pedidosAceitos(s.sessao)).toHaveLength(5);
  });
});
