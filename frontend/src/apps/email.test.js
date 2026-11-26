import { describe, expect, it } from 'vitest';
import { ordenarCaixa } from './Email.jsx';

describe('caixa de e-mail', () => {
  it('em aberto em cima (mais novo primeiro); terminados descem, inclusive o urgente', () => {
    const p = (id, status, extra = {}) => ({ id, status, ...extra });
    const lista = [p('a', 'entregue'), p('b', 'novo'), p('c', 'recusado'), p('u', 'entregue', { urgente: true }), p('d', 'aceito'), p('e', 'expirado')];
    expect(ordenarCaixa(lista).map((x) => x.id)).toEqual(['d', 'b', 'e', 'u', 'c', 'a']);
  });
});
