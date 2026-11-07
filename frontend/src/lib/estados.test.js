import { describe, expect, it } from 'vitest';
import { avaliar } from './avaliacao.js';
import { gerarFeedback } from './feedback.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';
import { ELEMENTOS, RELACOES, SECOES, secaoDoDiagrama } from '../editor/Formas.jsx';

const copia = (d) => JSON.parse(JSON.stringify(d));
const ESTADOS = ['rastreio', 'semaforo', 'catraca', 'player', 'chamado'];

describe('diagramas de estados', () => {
  it('5 pedidos, cada um com um início, pelo menos um fim e transições com os eventos do e-mail', () => {
    for (const id of ESTADOS) {
      const m = modeloPorId(id);
      const nos = m.esperado.nodes;
      expect(nos.filter((x) => x.tipo === 'estadoInicial'), id).toHaveLength(1);
      expect(nos.some((x) => x.tipo === 'estadoFinal'), id).toBe(true);
      expect(m.esperado.edges.every((e) => e.tipo === 'transicao'), id).toBe(true);
      const texto = m.corpo.join(' ');
      for (const x of nos.filter((n) => n.tipo === 'estado')) expect(texto, id).toContain(`"${x.rotulo}"`);
      for (const e of m.esperado.edges) if (e.rotulo) expect(texto, id).toContain(`"${e.rotulo}"`);
      // do início não sai evento; no fim só chega
      const inicio = nos.find((x) => x.tipo === 'estadoInicial').id;
      expect(m.esperado.edges.filter((e) => e.de === inicio).every((e) => !e.rotulo), id).toBe(true);
      expect(m.esperado.edges.some((e) => nos.find((x) => x.id === e.de).tipo === 'estadoFinal'), id).toBe(false);
      expect(avaliar(copia(m.esperado), m.esperado).nota, id).toBe(100);
    }
  });

  it('evento errado não vale a transição e o feedback aponta o evento', () => {
    const esp = modeloPorId('catraca').esperado;
    const jog = copia(esp);
    jog.edges.find((e) => e.rotulo === 'passar').rotulo = 'empurrar';
    expect(avaliar(jog, esp).relacoes).toBeCloseTo(3 / 4);
    const fb = gerarFeedback(jog, esp);
    expect(fb.problemas).toEqual([expect.objectContaining({ tipo: 'eventoErrado', usado: 'empurrar' })]);
    expect(fb.conceitos).toEqual(['transicao']);
  });

  it('evento sem diferenciar maiúsculas/acentos; transição ao contrário é sentido invertido', () => {
    const esp = modeloPorId('player').esperado;
    const jog = copia(esp);
    jog.edges.find((e) => e.rotulo === 'stop').rotulo = ' STOP ';
    expect(avaliar(jog, esp).nota).toBe(100);
    const inv = copia(esp);
    const e = inv.edges.find((x) => x.rotulo === 'fechar');
    [e.de, e.para] = [e.para, e.de];
    expect(gerarFeedback(inv, esp).problemas.map((p) => p.tipo)).toEqual(['sentidoInvertido']);
  });

  it('paleta em 3 seções, só com tipos que existem; cada pedido abre na seção certa', () => {
    expect(SECOES.map((s) => s.nome)).toEqual(['Casos de uso', 'Classes', 'Estados']);
    const elementos = ELEMENTOS.map((e) => e.tipo), relacoes = RELACOES.map((r) => r.tipo);
    for (const s of SECOES) {
      for (const t of s.elementos) expect(elementos).toContain(t);
      for (const t of s.relacoes) expect(relacoes).toContain(t);
    }
    // tudo que um gabarito usa está na seção dele
    for (const m of MODELOS) {
      const s = SECOES.find((x) => x.id === secaoDoDiagrama(m.esperado));
      expect(s, m.id).toBeDefined();
      for (const n of m.esperado.nodes) expect(s.elementos, m.id).toContain(n.tipo);
      for (const e of m.esperado.edges) expect(s.relacoes, `${m.id} ${e.tipo}`).toContain(e.tipo);
    }
    expect(secaoDoDiagrama(modeloPorId('catraca').esperado)).toBe('estados');
    expect(secaoDoDiagrama({ nodes: [], edges: [] })).toBeNull();
  });
});
