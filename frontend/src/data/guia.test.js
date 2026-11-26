import { describe, expect, it } from 'vitest';
import { SECOES_GUIA } from './guia.js';
import { foraDoLugar, sobrepoe } from '../lib/grid.js';
import { ELEMENTOS, RELACOES } from '../editor/Formas.jsx';

describe('guia dos diagramas', () => {
  it('três seções: caso de uso, classes e estados', () => {
    expect(SECOES_GUIA.map((s) => s.nome)).toEqual(['Caso de uso', 'Classes', 'Estados']);
  });

  it('cada seção explica peças que existem no editor e tem pedido, passos e diagrama válidos', () => {
    const tipos = [...ELEMENTOS, ...RELACOES].map((x) => x.tipo);
    for (const s of SECOES_GUIA) {
      expect(s.pecas.length, s.id).toBeGreaterThanOrEqual(4);
      for (const p of s.pecas) if (p.tipo) expect(tipos, `${s.id}: ${p.tipo}`).toContain(p.tipo);
      expect(s.pedido.corpo.length && s.passos.length, s.id).toBeGreaterThan(2);
      const { nodes, edges } = s.diagrama;
      for (const e of edges) expect(nodes.some((n) => n.id === e.de) && nodes.some((n) => n.id === e.para), `${s.id}: ${e.id}`).toBe(true);
      expect(foraDoLugar(nodes), s.id).toEqual([]); // casos dentro do sistema, atores fora
      const caixas = nodes.filter((n) => n.tipo !== 'sistema');
      for (let i = 0; i < caixas.length; i++)
        for (let j = i + 1; j < caixas.length; j++) expect(sobrepoe(caixas[i], caixas[j]), `${s.id}: ${caixas[i].id}×${caixas[j].id}`).toBe(false);
    }
  });
});
