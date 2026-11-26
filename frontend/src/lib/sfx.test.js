import { describe, expect, it } from 'vitest';
import { AMOSTRAS, GANHO_SOLTAR, somDaNota, taxaDePitch } from './sfx.js';

describe('efeitos sonoros', () => {
  it('som da entrega segue as faixas do mascote; Excellent só com 100%', () => {
    expect([0, 1, 29, 30, 59, 60, 85, 99, 100].map(somDaNota)).toEqual([
      'worst', 'bad', 'bad', 'ok', 'ok', 'great', 'great', 'great', 'excellent',
    ]);
  });

  it('hover e click variam o pitch dentro do intervalo; os da nota não', () => {
    const st = AMOSTRAS.hover.semitons;
    expect(taxaDePitch(st, () => 0)).toBeCloseTo(2 ** (-st / 12));
    expect(taxaDePitch(st, () => 1)).toBeCloseTo(2 ** (st / 12));
    expect(taxaDePitch(AMOSTRAS.excellent.semitons, () => 0.9)).toBe(1);
    for (const n of ['hover', 'click']) expect(AMOSTRAS[n].semitons).toBeGreaterThan(0);
  });

  it('soltar um item toca o click a 7%', () => {
    expect(GANHO_SOLTAR).toBe(0.07);
    expect(GANHO_SOLTAR).toBeLessThan(AMOSTRAS.click.ganho);
  });

  it('hover bem mais baixo que os outros', () => {
    expect(AMOSTRAS.hover.ganho).toBeLessThan(AMOSTRAS.click.ganho);
    expect(AMOSTRAS.click.ganho).toBeLessThan(AMOSTRAS.ok.ganho / 2);
  });
});
