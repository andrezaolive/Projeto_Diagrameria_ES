import { describe, expect, it } from 'vitest';
import { MULTIPLICIDADES, TEM_MULTIPLICIDADE, lerMult, multIgual, padraoRelacao } from './multiplicidade.js';
import { avaliar } from './avaliacao.js';
import { gerarFeedback } from './feedback.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';

const copia = (d) => JSON.parse(JSON.stringify(d));

describe('multiplicidade', () => {
  it('"*" vale o mesmo que "0..*"', () => {
    expect(multIgual('*', '0..*')).toBe(true);
    expect(multIgual('1..*', '0..*')).toBe(false);
    expect(multIgual(undefined, '1')).toBe(false);
    expect(MULTIPLICIDADES).toEqual(['1', '0..1', '1..*', '0..*']);
  });

  it('reconhece 1:1, 1:* e *:*', () => {
    expect(padraoRelacao('1', '1')).toBe('1:1');
    expect(padraoRelacao('1', '1..*')).toBe('1:*');
    expect(padraoRelacao('0..*', '1..*')).toBe('*:*');
    expect(lerMult('0..1')).toMatch(/no máximo/);
  });

  it('só associação, agregação e composição têm multiplicidade nos gabaritos', () => {
    for (const m of MODELOS)
      for (const e of m.esperado.edges) if (e.multDe || e.multPara) expect(TEM_MULTIPLICIDADE).toContain(e.tipo);
  });

  it('os pedidos novos cobrem 1:1, 1:* e *:*', () => {
    const padroes = new Set(MODELOS.flatMap((m) => m.esperado.edges.map((e) => padraoRelacao(e.multDe, e.multPara))));
    expect([...padroes]).toEqual(expect.arrayContaining(['1:1', '1:*', '*:*']));
  });

  it('pedido sem multiplicidade mantém a nota de sempre', () => {
    const esp = modeloPorId('biblioteca').esperado;
    expect(avaliar(copia(esp), esp)).toMatchObject({ nota: 100, multiplicidades: null });
  });

  it('esquecer ou errar multiplicidade tira pontos e aparece no feedback em vermelho', () => {
    const esp = modeloPorId('cooperativa').esperado; // Cliente [1] — [1..*] Conta
    const sem = copia(esp);
    delete sem.edges[0].multDe;
    delete sem.edges[0].multPara;
    const r = avaliar(sem, esp);
    expect(r.multiplicidades).toBe(0);
    expect(r.nota).toBe(85); // 35 + 25 + 25, sem os 15 da multiplicidade

    const errada = copia(esp);
    errada.edges[0].multPara = '0..1';
    expect(avaliar(errada, esp).multiplicidades).toBe(0.5);
    const fb = gerarFeedback(errada, esp);
    expect(fb.problemas).toHaveLength(1);
    expect(fb.problemas[0]).toMatchObject({ tipo: 'multiplicidade', lado: 'Conta', outro: 'Cliente', esperado: '1..*', usado: '0..1' });
    expect(fb.conceitos).toEqual(['multiplicidade']);
  });

  it('associação desenhada ao contrário: as multiplicidades acompanham as pontas', () => {
    const esp = modeloPorId('cooperativa').esperado;
    const inv = copia(esp);
    const ed = inv.edges[0];
    [ed.de, ed.para, ed.multDe, ed.multPara] = [ed.para, ed.de, ed.multPara, ed.multDe];
    expect(avaliar(inv, esp)).toMatchObject({ nota: 100, multiplicidades: 1 });
    expect(gerarFeedback(inv, esp).problemas).toEqual([]);
  });

  it('aceita "*" no lugar de "0..*"', () => {
    const esp = modeloPorId('playlist').esperado; // 0..* — 0..*
    const jog = copia(esp);
    jog.edges[0].multDe = '*';
    jog.edges[0].multPara = '*';
    expect(avaliar(jog, esp).nota).toBe(100);
  });
});
