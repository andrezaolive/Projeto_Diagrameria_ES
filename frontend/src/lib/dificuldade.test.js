import { describe, expect, it } from 'vitest';
import { NIVEIS, niveisNoInfinito, nivelDoModelo, pontuacao } from './dificuldade.js';
import { MODELOS, ORDEM_CAMPANHA, modeloPorId, pedidosDoDia } from '../data/pedidos.js';
import { DIAS_CAMPANHA, estadoInicial, reducer } from '../state/reducer.js';

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

  it('a campanha apresenta todos, do fácil ao difícil, sem nunca voltar de nível', () => {
    expect([...ORDEM_CAMPANHA].sort()).toEqual(MODELOS.map((m) => m.id).sort());
    for (let i = 1; i < ORDEM_CAMPANHA.length; i++) expect(indice(ORDEM_CAMPANHA[i])).toBeGreaterThanOrEqual(indice(ORDEM_CAMPANHA[i - 1]));
    // os primeiros dias são fáceis; depois de mostrar tudo, só médios e difíceis
    for (let d = 1; d <= 4; d++) expect(pedidosDoDia(d).map(indice)).toEqual([0]);
    const vistos = [];
    for (let d = 1; d <= DIAS_CAMPANHA; d++) vistos.push(...pedidosDoDia(d));
    expect(vistos.slice(ORDEM_CAMPANHA.length).every((id) => indice(id) > 0)).toBe(true);
  });

  it('os tipos de diagrama se revezam no começo', () => {
    const tipos = ORDEM_CAMPANHA.slice(0, 3).map((id) => modeloPorId(id).esperado.nodes[0].tipo);
    expect(new Set(tipos).size).toBe(3);
  });

  it('modo infinito: começa fácil e endurece', () => {
    expect(niveisNoInfinito(1)).toEqual(['facil']);
    expect(niveisNoInfinito(5)).toEqual(['facil', 'medio']);
    expect(niveisNoInfinito(20)).toEqual(['medio', 'dificil']);
    const s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    for (const p of s.sessao.pedidos) expect(nivelDoModelo(modeloPorId(p.modelo)).id).toBe('facil');
  });
});
