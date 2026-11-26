import { describe, expect, it } from 'vitest';
import { EXCESSO_MENU_DB, LOOP_MENU, curvaCompensacao } from './musica.js';

describe('música do menu', () => {
  it('loop em 18 compassos de 82 BPM', () => {
    expect(LOOP_MENU).toBeCloseTo(52.683, 3);
  });

  it('a curva da emenda abaixa até ~-5,7 dB e volta ao volume normal', () => {
    const { curva, dur } = curvaCompensacao(EXCESSO_MENU_DB);
    expect(dur).toBeCloseTo(6, 5);
    expect(curva[0]).toBeCloseTo(10 ** (-0.24 / 20), 3);
    expect(Math.min(...curva)).toBeCloseTo(10 ** (-5.74 / 20), 3);
    expect(curva[curva.length - 1]).toBe(1);
    expect(curva.every((g) => g > 0 && g <= 1)).toBe(true);
  });
});
