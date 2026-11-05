import { describe, expect, it } from 'vitest';
import { estadoInicial, migrar, reducer } from './reducer.js';
import { avaliar } from '../lib/avaliacao.js';
import { MODELOS, TOTAL_PEDACOS, modeloPorId, pedidosDoDia, precoPedaco } from '../data/pedidos.js';

const rodar = (state, ...acoes) => acoes.reduce(reducer, state);

describe('avaliação', () => {
  it('gabarito idêntico tira 100', () => {
    for (const m of MODELOS) expect(avaliar(m.esperado, m.esperado).nota).toBe(100);
  });

  it('diagrama vazio tira 0', () => {
    expect(avaliar({ nodes: [], edges: [] }, modeloPorId('banco').esperado).nota).toBe(0);
  });

  it('ignora acentos e maiúsculas nos nomes e o sentido da associação', () => {
    const esp = modeloPorId('cafeteria').esperado;
    const jog = {
      nodes: esp.nodes.map((n) => ({ ...n, id: 'x' + n.id, rotulo: n.rotulo.toUpperCase().replace('á', 'a') })),
      edges: esp.edges.map((e) => (e.tipo === 'associacao' ? { ...e, de: 'x' + e.para, para: 'x' + e.de } : { ...e, de: 'x' + e.de, para: 'x' + e.para })),
    };
    expect(avaliar(jog, esp).nota).toBe(100);
  });

  it('include no sentido errado perde pontos', () => {
    const esp = modeloPorId('cafeteria').esperado;
    const jog = { ...esp, edges: esp.edges.map((e) => (e.tipo === 'include' ? { ...e, de: e.para, para: e.de } : e)) };
    expect(avaliar(jog, esp).nota).toBeLessThan(100);
  });
});

describe('campanha', () => {
  it('conclui o dia e libera o próximo quando todos os pedidos acabam', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    expect(s.sessao.pedidos).toHaveLength(pedidosDoDia(1).length);
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id }, { type: 'TICK' });
    expect(s.sessao.pedidos[0].tempoRestante).toBe(s.sessao.pedidos[0].tempo - 1);
    s = rodar(s, { type: 'ENTREGAR', id, nota: 80, valor: 50 });
    expect(s.dinheiro).toBe(150);
    expect(s.campanha.desbloqueado).toBe(2);
    expect(s.campanha.concluidos[1]).toEqual({ ganho: 50, media: 80 });
  });

  it('só um pedido em andamento por vez', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const [a, b] = s.sessao.pedidos;
    s = rodar(s, { type: 'ACEITAR', id: a.id }, { type: 'ACEITAR', id: b.id });
    expect(s.sessao.ativo).toBe(a.id);
    expect(s.sessao.pedidos[1].status).toBe('novo');
  });

  it('modo infinito sempre traz um pedido novo após entregar', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const id = s.sessao.pedidos[0].id;
    s = rodar(s, { type: 'ACEITAR', id }, { type: 'ENTREGAR', id, nota: 100, valor: 10 });
    expect(s.sessao.pedidos).toHaveLength(3);
    expect(new Set(s.sessao.pedidos.map((p) => p.id)).size).toBe(3);
  });
});

describe('dicas (pedaços da resposta)', () => {
  const comPedido = () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    return rodar(s, { type: 'ACEITAR', id: s.sessao.pedidos[0].id });
  };

  it('compra um pedaço, desconta o preço e não cobra duas vezes', () => {
    const s0 = comPedido();
    const p = s0.sessao.pedidos[0];
    const preco = precoPedaco(p);
    const s1 = reducer(s0, { type: 'COMPRAR_PEDACO', indice: 2 });
    expect(s1.sessao.pedidos[0].pedacos).toEqual([2]);
    expect(s1.dinheiro).toBe(100 - preco);
    expect(reducer(s1, { type: 'COMPRAR_PEDACO', indice: 2 })).toBe(s1);
  });

  it('recusa sem pedido ativo, sem dinheiro ou fora da grade', () => {
    const semPedido = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    expect(reducer(semPedido, { type: 'COMPRAR_PEDACO', indice: 0 })).toBe(semPedido);
    const pobre = { ...comPedido(), dinheiro: 0 };
    expect(reducer(pobre, { type: 'COMPRAR_PEDACO', indice: 0 })).toBe(pobre);
    const s = comPedido();
    expect(reducer(s, { type: 'COMPRAR_PEDACO', indice: TOTAL_PEDACOS })).toBe(s);
  });
});

describe('loja', () => {
  it('não compra sem dinheiro e desconta ao comprar', () => {
    const s0 = estadoInicial();
    expect(reducer(s0, { type: 'COMPRAR', id: 'obj-gato', preco: 250 })).toBe(s0);
    const s1 = reducer(s0, { type: 'COMPRAR', id: 'obj-planta', preco: 80 });
    expect(s1.dinheiro).toBe(20);
    expect(reducer(s1, { type: 'ALTERNAR_MOVEL', id: 'obj-planta' }).loja.moveis).toEqual(['obj-planta']);
  });

  it('guarda a posição dos objetos e arruma de volta', () => {
    const posicao = { x: 10, sobre: 'mesa', chao: 156 };
    const s = reducer(estadoInicial(), { type: 'MOVER_OBJETO', objeto: 'caneca', posicao });
    expect(s.escritorio.posicoes.caneca).toEqual(posicao);
    expect(reducer(s, { type: 'ARRUMAR_ESCRITORIO' }).escritorio.posicoes).toEqual({});
  });

  it('migra saves antigos com ids movel-*', () => {
    const s = migrar({ dinheiro: 5, loja: { possui: ['fundo-por-do-sol', 'movel-gato'], moveis: ['movel-gato'] } });
    expect(s.loja.possui).toContain('obj-gato');
    expect(s.loja.moveis).toEqual(['obj-gato']);
    expect(s.escritorio.posicoes).toEqual({});
    expect(s.dinheiro).toBe(5);
  });
});

describe('inventário do escritório', () => {
  it('guarda e retira objetos do jogo; o que estava em cima cai', () => {
    let s = rodar(
      estadoInicial(),
      { type: 'MOVER_OBJETO', objeto: 'livro-azul', posicao: { x: 100, sobre: 'mesa', chao: 150, deitado: true } },
      { type: 'MOVER_OBJETO', objeto: 'livro-rosa', posicao: { x: 100, sobre: 'livro-azul', deitado: true } },
      { type: 'GUARDAR_OBJETO', objeto: 'livro-azul' },
    );
    expect(s.escritorio.guardados).toEqual(['livro-azul']);
    expect(s.escritorio.posicoes['livro-azul']).toBeUndefined();
    expect(s.escritorio.posicoes['livro-rosa']).toEqual({ x: 100, sobre: 'mesa', chao: 150, deitado: true });
    s = rodar(s, { type: 'RETIRAR_OBJETO', objeto: 'livro-azul' });
    expect(s.escritorio.guardados).toEqual([]);
  });

  it('objeto da loja guardado sai de "em uso" e volta ao retirar', () => {
    let s = { ...estadoInicial(), loja: { possui: ['fundo-por-do-sol', 'obj-gato'], fundo: 'fundo-por-do-sol', moveis: ['obj-gato'] } };
    s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: 'gato' });
    expect(s.loja.moveis).toEqual([]);
    expect(s.escritorio.guardados).toEqual([]);
    s = rodar(s, { type: 'RETIRAR_OBJETO', objeto: 'gato' });
    expect(s.loja.moveis).toEqual(['obj-gato']);
  });
});

describe('debug: refresh de pedidos', () => {
  it('troca só os pedidos não aceitos, em sequência, e passa por todos os modelos', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const aceito = s.sessao.pedidos[0];
    s = rodar(s, { type: 'ACEITAR', id: aceito.id });
    const vistos = new Set();
    for (let i = 0; i < MODELOS.length; i++) {
      s = rodar(s, { type: 'DEBUG_REFRESH_PEDIDOS' });
      expect(s.sessao.pedidos.find((p) => p.id === aceito.id).status).toBe('aceito');
      s.sessao.pedidos.filter((p) => p.status === 'novo').forEach((p) => vistos.add(p.modelo));
    }
    expect(vistos.size).toBe(MODELOS.length);
    expect(new Set(s.sessao.pedidos.map((p) => p.id)).size).toBe(s.sessao.pedidos.length);
    expect(s.dinheiro).toBe(100); // sem multa
    expect(s.estatisticas.recusados).toBe(0);
  });
});
