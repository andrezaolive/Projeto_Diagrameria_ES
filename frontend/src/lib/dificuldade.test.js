import { describe, expect, it } from 'vitest';
import { NIVEIS, niveisNoInfinito, nivelDoModelo, pontuacao } from './dificuldade.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';
import { estadoInicial, reducer } from '../state/reducer.js';

const indice = (id) => NIVEIS.indexOf(nivelDoModelo(modeloPorId(id)));

describe('dificuldade dos pedidos', () => {
  it('há pedidos dos três níveis', () => {
    const contagem = Object.fromEntries(NIVEIS.map((n) => [n.id, MODELOS.filter((m) => nivelDoModelo(m) === n).length]));
    for (const n of NIVEIS) expect(contagem[n.id], n.id).toBeGreaterThanOrEqual(5);
  });

  it('mais coisa para inserir = mais pontos', () => {
    expect(pontuacao(modeloPorId('comanda'))).toBeGreaterThan(pontuacao(modeloPorId('casa')));
    expect(pontuacao(modeloPorId('rastreio'))).toBeGreaterThan(pontuacao(modeloPorId('catraca')));
    expect(nivelDoModelo(modeloPorId('idiomas')).id).toBe('facil');
    expect(nivelDoModelo(modeloPorId('frota')).id).toBe('dificil');
  });

  it('modo infinito: começa fácil e endurece', () => {
    expect(niveisNoInfinito(1)).toEqual(['facil']);
    expect(niveisNoInfinito(5)).toEqual(['facil', 'medio']);
    expect(niveisNoInfinito(20)).toEqual(['medio', 'dificil']);
    const s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    for (const p of s.sessao.pedidos) expect(nivelDoModelo(modeloPorId(p.modelo)).id).toBe('facil');
  });
});
