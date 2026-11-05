import { describe, expect, it } from 'vitest';
import { MODELOS, modeloPorId, pedidosDoDia } from './pedidos.js';
import { avaliar } from '../lib/avaliacao.js';
import { gerarFeedback } from '../lib/feedback.js';
import { DIAS_CAMPANHA } from '../state/reducer.js';
import { RELACOES } from '../editor/Formas.jsx';

const copia = (d) => JSON.parse(JSON.stringify(d));

describe('modelos de pedidos', () => {
  it('todo gabarito usa só relações que o editor oferece e nós no grid', () => {
    const tipos = RELACOES.map((r) => r.tipo);
    for (const m of MODELOS) {
      for (const e of m.esperado.edges) expect(tipos).toContain(e.tipo);
      for (const n of m.esperado.nodes) expect([n.x % 20, n.y % 20]).toEqual([0, 0]);
      for (const e of m.esperado.edges) {
        expect(m.esperado.nodes.some((n) => n.id === e.de)).toBe(true);
        expect(m.esperado.nodes.some((n) => n.id === e.para)).toBe(true);
      }
    }
  });

  it('a campanha usa todos os modelos e só ids válidos', () => {
    const usados = new Set();
    for (let d = 1; d <= DIAS_CAMPANHA; d++) for (const id of pedidosDoDia(d)) usados.add(id);
    for (const id of usados) expect(modeloPorId(id)).toBeDefined();
    expect([...usados].sort()).toEqual(MODELOS.map((m) => m.id).sort());
  });

  it('composição e agregação têm sentido: o todo é a origem', () => {
    for (const id of ['lanchonete', 'playlist']) {
      const esp = modeloPorId(id).esperado;
      const jog = copia(esp);
      const e = jog.edges[0];
      [e.de, e.para] = [e.para, e.de];
      expect(avaliar(jog, esp).nota).toBeLessThan(100);
      expect(gerarFeedback(jog, esp).problemas.map((p) => p.tipo)).toEqual(['sentidoInvertido']);
    }
  });

  it('trocar composição por agregação perde pontos e o feedback explica as duas', () => {
    const esp = modeloPorId('loja-online').esperado;
    const jog = copia(esp);
    jog.edges.find((e) => e.tipo === 'composicao').tipo = 'agregacao';
    expect(avaliar(jog, esp).nota).toBeLessThan(100);
    const fb = gerarFeedback(jog, esp);
    expect(fb.problemas.map((p) => p.tipo)).toEqual(['relacaoTipoErrado']);
    expect(fb.conceitos).toEqual(expect.arrayContaining(['agregacao', 'composicao']));
  });
});
