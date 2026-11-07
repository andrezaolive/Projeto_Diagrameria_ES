import { describe, expect, it } from 'vitest';
import { TAMANHO_MINIMO, contido, foraDoLugar, redimensionar, retangulo, sobrepoe } from './grid.js';
import { avaliar } from './avaliacao.js';
import { gerarFeedback } from './feedback.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';

const copia = (d) => JSON.parse(JSON.stringify(d));
const ehCasoDeUso = (m) => m.esperado.nodes.some((n) => n.tipo === 'casoDeUso');

describe('fronteira do sistema (casos de uso)', () => {
  it('todo pedido de caso de uso tem um sistema com o nome dito no e-mail, casos dentro e atores fora', () => {
    const casos = MODELOS.filter(ehCasoDeUso);
    expect(casos.length).toBeGreaterThanOrEqual(9);
    for (const m of casos) {
      const sistemas = m.esperado.nodes.filter((n) => n.tipo === 'sistema');
      expect(sistemas, m.id).toHaveLength(1);
      const [s] = sistemas;
      expect([s.w % 20, s.h % 20], m.id).toEqual([0, 0]);
      expect(m.corpo.join(' '), m.id).toContain(`"${s.rotulo}"`);
      expect(foraDoLugar(m.esperado.nodes), m.id).toEqual([]);
      expect(avaliar(copia(m.esperado), m.esperado), m.id).toMatchObject({ nota: 100, fronteira: 1 });
    }
  });

  it('pedidos de classes não cobram fronteira', () => {
    for (const m of MODELOS.filter((x) => !ehCasoDeUso(x))) expect(avaliar(copia(m.esperado), m.esperado).fronteira, m.id).toBeNull();
  });

  it('há pedidos com dependência entre casos de uso', () => {
    const comDep = MODELOS.filter(ehCasoDeUso).filter((m) =>
      m.esperado.edges.some((e) => e.tipo === 'dependencia' && [e.de, e.para].every((id) => m.esperado.nodes.find((n) => n.id === id).tipo === 'casoDeUso')),
    );
    expect(comDep.map((m) => m.id)).toEqual(expect.arrayContaining(['hotel', 'streaming', 'farmacia']));
  });

  it('caso de uso fora do sistema perde pontos e aparece no feedback', () => {
    const esp = modeloPorId('cafeteria').esperado;
    const jog = copia(esp);
    jog.nodes.find((n) => n.rotulo === 'Pagar').x = 700; // saiu pela direita
    const r = avaliar(jog, esp);
    expect(r.fronteira).toBeCloseTo(3 / 4);
    expect(r.nota).toBeLessThan(100);
    const fb = gerarFeedback(jog, esp);
    expect(fb.problemas).toEqual([expect.objectContaining({ tipo: 'foraDoSistema', rotulo: 'Pagar' })]);
    expect(fb.conceitos).toContain('sistema');
  });

  it('ator dentro do sistema também é erro', () => {
    const esp = modeloPorId('cafeteria').esperado;
    const jog = copia(esp);
    Object.assign(jog.nodes.find((n) => n.tipo === 'ator'), { x: 420, y: 60 });
    expect(avaliar(jog, esp).fronteira).toBeCloseTo(3 / 4);
    expect(gerarFeedback(jog, esp).problemas.map((p) => p.tipo)).toEqual(['atorNoSistema']);
  });

  it('sem sistema: falta o sistema e os casos de uso contam como fora', () => {
    const esp = modeloPorId('banco').esperado;
    const jog = copia(esp);
    jog.nodes = jog.nodes.filter((n) => n.tipo !== 'sistema');
    const r = avaliar(jog, esp);
    expect(r.fronteira).toBeCloseTo(1 / 4); // só o ator está "certo"
    expect(gerarFeedback(jog, esp).problemas.map((p) => p.tipo)).toEqual(['faltando']);
  });

  it('redimensionar pelo meio dos lados: no grid, com tamanho mínimo, e o lado oposto fica parado', () => {
    const base = { x: 100, y: 100, w: 360, h: 400 };
    expect(redimensionar(base, 'l', 47, 0, TAMANHO_MINIMO.sistema)).toEqual({ x: 100, y: 100, w: 400, h: 400 });
    expect(redimensionar(base, 's', 0, -1000, TAMANHO_MINIMO.sistema)).toEqual({ x: 100, y: 100, w: 360, h: 160 });
    expect(redimensionar(base, 'o', -61, 0, TAMANHO_MINIMO.sistema)).toEqual({ x: 40, y: 100, w: 420, h: 400 });
    expect(redimensionar(base, 'n', 0, 1000, TAMANHO_MINIMO.sistema)).toEqual({ x: 100, y: 340, w: 360, h: 160 });
  });

  it('geometria: contido e sobrepõe usam o tamanho próprio do sistema', () => {
    const s = { tipo: 'sistema', x: 0, y: 0, w: 200, h: 200 };
    expect(retangulo(s)).toEqual({ x: 0, y: 0, w: 200, h: 200 });
    expect(contido({ tipo: 'casoDeUso', x: 20, y: 20 }, s)).toBe(true);
    expect(contido({ tipo: 'casoDeUso', x: 60, y: 20 }, s)).toBe(false); // 60+160 > 200
    expect(sobrepoe({ tipo: 'ator', x: 180, y: 0 }, s)).toBe(true);
    expect(sobrepoe({ tipo: 'ator', x: 200, y: 0 }, s)).toBe(false); // encostado na borda não conta
  });
});
