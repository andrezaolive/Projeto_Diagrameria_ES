import { describe, expect, it } from 'vitest';
import { categoriasDoModelo, tipoDoDiagrama } from './categorias.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';
import { estadoInicial, reducer } from '../state/reducer.js';

describe('debug: todos os pedidos', () => {
  it('todo modelo tem um tipo de diagrama como primeira categoria', () => {
    for (const m of MODELOS) expect(['Casos de uso', 'Classes', 'Estados'], m.id).toContain(categoriasDoModelo(m)[0]);
    expect(tipoDoDiagrama(modeloPorId('catraca').esperado)).toBe('estados');
    expect(categoriasDoModelo(modeloPorId('hotel'))).toEqual(['Casos de uso', 'Sistema', 'Dependência']);
    expect(categoriasDoModelo(modeloPorId('comanda'))).toEqual(['Classes', 'Composição', 'Multiplicidade', 'Atributos e métodos']);
    expect(categoriasDoModelo(modeloPorId('player'))).toEqual(['Estados', 'Transições']);
  });

  it('escolher um troca o pedido alvo, na mesma posição, por um novo do modelo', () => {
    let s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const [a, b] = s.sessao.pedidos;
    s = reducer(s, { type: 'ACEITAR', id: b.id }); // o alvo estava em andamento
    s = reducer(s, { type: 'DEBUG_TROCAR_PEDIDO', alvo: b.id, modelo: 'comanda' });
    expect(s.sessao.pedidos.map((p) => p.modelo)).toEqual([a.modelo, 'comanda']);
    expect(s.sessao.pedidos[1]).toMatchObject({ status: 'novo', id: `comanda-${s.sessao.seq - 1}` });
    expect(s.sessao.ativo).toBeNull();
    // modelo inexistente: nada muda
    expect(reducer(s, { type: 'DEBUG_TROCAR_PEDIDO', alvo: a.id, modelo: 'nao-existe' })).toBe(s);
  });
});
