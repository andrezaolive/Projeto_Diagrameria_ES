import { describe, expect, it } from 'vitest';
import { estadoInicial, reducer } from './reducer.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);

describe('painel Dev (debug)', () => {
  it('define o dinheiro, inclusive negativo; valor inválido não muda nada', () => {
    let s = rodar(estadoInicial(), { type: 'DEBUG_DINHEIRO', valor: 1234 });
    expect(s.dinheiro).toBe(1234);
    s = rodar(s, { type: 'DEBUG_DINHEIRO', valor: -50 });
    expect(s.dinheiro).toBe(-50);
    expect(rodar(s, { type: 'DEBUG_DINHEIRO', valor: NaN })).toBe(s);
  });

  it('para e continua o relógio da partida; sem partida, nada', () => {
    const sem = estadoInicial();
    expect(rodar(sem, { type: 'DEBUG_PARAR_RELOGIO', parado: true })).toBe(sem);
    let s = rodar(sem, { type: 'INICIAR_SESSAO', modo: 'infinito' }, { type: 'DEBUG_PARAR_RELOGIO', parado: true });
    expect(s.sessao.relogioParado).toBe(true);
    s = rodar(s, { type: 'DEBUG_PARAR_RELOGIO', parado: false });
    expect(s.sessao.relogioParado).toBe(false);
  });
});
