import { describe, expect, it } from 'vitest';
import { GRID, TAMANHOS, clampZoom, posicaoAoSoltar, snap, telaParaMundo, zoomEm } from './grid.js';

describe('grid invisível', () => {
  it('encaixa valores no múltiplo mais próximo', () => {
    expect(snap(0)).toBe(0);
    expect(snap(9)).toBe(0);
    expect(snap(11)).toBe(20);
    expect(snap(-11)).toBe(-20);
    expect(snap(37)).toBe(40);
  });

  it('solta o elemento centrado no ponteiro e com o canto no grid', () => {
    for (const tipo of Object.keys(TAMANHOS)) {
      const p = posicaoAoSoltar(tipo, 133.7, 271.2);
      expect(Math.abs(p.x % GRID)).toBe(0);
      expect(Math.abs(p.y % GRID)).toBe(0);
      expect(Math.abs(p.x + TAMANHOS[tipo].w / 2 - 133.7)).toBeLessThanOrEqual(GRID / 2);
    }
  });
});

describe('zoom', () => {
  it('limita o zoom', () => {
    expect(clampZoom(10)).toBe(3);
    expect(clampZoom(0.01)).toBe(0.25);
  });

  it('mantém fixo o ponto sob o cursor', () => {
    const v = { x: 30, y: -10, zoom: 1 };
    const antes = telaParaMundo(v, 400, 300);
    const v2 = zoomEm(v, 1.5, 400, 300);
    const depois = telaParaMundo(v2, 400, 300);
    expect(depois.x).toBeCloseTo(antes.x);
    expect(depois.y).toBeCloseTo(antes.y);
    expect(v2.zoom).toBe(1.5);
  });
});
