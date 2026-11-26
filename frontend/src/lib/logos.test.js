import { describe, expect, it } from 'vitest';
import { ICONES, LEGENDA, LOGOS_CLIENTES, logoDaEmpresa } from './logos.js';
import { MODELOS } from '../data/pedidos.js';
import { PALETTE } from '../art/palette.js';

describe('logos das empresas', () => {
  it('icones 12x12 so com letras da legenda', () => {
    const letras = new RegExp(`^[.${Object.keys(LEGENDA).join('')}]{12}$`);
    for (const [nome, linhas] of Object.entries(ICONES)) {
      expect(linhas, nome).toHaveLength(12);
      for (const l of linhas) expect(l, nome).toMatch(letras);
    }
    for (const cor of Object.values(LEGENDA)) expect(PALETTE[cor]).toBeDefined();
  });

  it('toda empresa dos pedidos tem um icone proprio, sem repetir', () => {
    const clientes = [...new Set(MODELOS.map((m) => m.cliente))];
    for (const c of clientes) {
      expect(LOGOS_CLIENTES[c], c).toBeDefined();
      expect(ICONES[LOGOS_CLIENTES[c][0]], c).toBeDefined();
      expect(PALETTE[LOGOS_CLIENTES[c][1]], c).toBeDefined();
    }
    const icones = clientes.map((c) => LOGOS_CLIENTES[c][0]);
    expect(new Set(icones).size).toBe(clientes.length);
  });

  it('empresa desconhecida ganha um logo valido, pelo nome quando der', () => {
    expect(logoDaEmpresa('Pizzaria do Zé').icone).toBe('pizza');
    const qualquer = logoDaEmpresa('Empresa Qualquer');
    expect(ICONES[qualquer.icone]).toBeDefined();
    expect(logoDaEmpresa('Empresa Qualquer')).toEqual(qualquer);
  });
});
