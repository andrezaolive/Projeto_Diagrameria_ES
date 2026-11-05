import { describe, expect, it } from 'vitest';
import { FRASES, detectarAlertas, sortearFrase, vistosIniciais } from './alertas.js';

const ped = (id, status, paciencia, total = 100) => ({ id, cliente: `Cliente ${id}`, status, paciencia, pacienciaTotal: total });

describe('alertas de clientes impacientes', () => {
  it('avisa uma vez quando o pedido novo chega a 25% da paciência', () => {
    let r = detectarAlertas([ped('a', 'novo', 26)]);
    expect(r.alertas).toEqual([]);
    r = detectarAlertas([ped('a', 'novo', 25)], r.vistos);
    expect(r.alertas.map((a) => a.tipo)).toEqual(['atencao']);
    r = detectarAlertas([ped('a', 'novo', 10)], r.vistos);
    expect(r.alertas).toEqual([]); // não repete
  });

  it('cliente que foi embora com outros pedidos na fila: alerta vermelho', () => {
    const r = detectarAlertas([ped('a', 'expirado', 0), ped('b', 'novo', 90)]);
    expect(r.alertas.map((a) => a.tipo)).toEqual(['saiu']);
    // pedido em andamento também conta como fila
    expect(detectarAlertas([ped('a', 'expirado', 0), ped('b', 'aceito', 90)]).alertas).toHaveLength(1);
  });

  it('último pedido do dia indo embora: nada aparece', () => {
    const r = detectarAlertas([ped('a', 'entregue', 50), ped('b', 'recusado', 50), ped('c', 'expirado', 0)]);
    expect(r.alertas).toEqual([]);
    expect(r.vistos.saiu.has('c')).toBe(true); // e não aparece depois
  });

  it('ao abrir o jogo, pedidos já expirados não geram alerta', () => {
    const pedidos = [ped('a', 'expirado', 0), ped('b', 'novo', 90)];
    expect(detectarAlertas(pedidos, vistosIniciais(pedidos)).alertas).toEqual([]);
  });

  it('não altera os conjuntos recebidos', () => {
    const vistos = { atencao: new Set(), saiu: new Set() };
    detectarAlertas([ped('a', 'novo', 1)], vistos);
    expect(vistos.atencao.size).toBe(0);
  });

  it('sorteia frases da lista certa', () => {
    expect(FRASES.atencao).toContain('Olá? Tem alguém aí?');
    expect(sortearFrase('atencao', () => 0)).toBe(FRASES.atencao[0]);
    expect(sortearFrase('saiu', () => 0.9999)).toBe(FRASES.saiu.at(-1));
  });

  it('evita repetir a frase de um pop-up que já está na tela', () => {
    expect(sortearFrase('saiu', () => 0, [FRASES.saiu[0]])).toBe(FRASES.saiu[1]);
    expect(FRASES.saiu).toContain(sortearFrase('saiu', () => 0, FRASES.saiu)); // todas usadas: repete
  });
});
