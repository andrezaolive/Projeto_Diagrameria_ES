import { describe, expect, it } from 'vitest';
import { avaliar } from './avaliacao.js';
import { gerarFeedback } from './feedback.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';
import { ELEMENTOS, RELACOES, SECOES, secaoDoDiagrama } from '../editor/Formas.jsx';

const copia = (d) => JSON.parse(JSON.stringify(d));
const COM_DECISAO = ['login-app', 'pagamento', 'devolucao', 'encomenda', 'caixa-eletronico'];
const ESTADOS = ['rastreio', 'semaforo', 'catraca', 'player', 'chamado', ...COM_DECISAO];

describe('diagramas de estados', () => {
  it('10 pedidos, cada um com um início, pelo menos um fim e transições com os eventos do e-mail', () => {
    for (const id of ESTADOS) {
      const m = modeloPorId(id);
      const nos = m.esperado.nodes;
      expect(nos.filter((x) => x.tipo === 'estadoInicial'), id).toHaveLength(1);
      expect(nos.some((x) => x.tipo === 'estadoFinal'), id).toBe(true);
      expect(m.esperado.edges.every((e) => e.tipo === 'transicao'), id).toBe(true);
      const texto = m.corpo.join(' ');
      for (const x of nos.filter((n) => n.tipo === 'estado' || n.tipo === 'decisao')) expect(texto, id).toContain(`"${x.rotulo}"`);
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

  it('decisão: 5 pedidos usam o losango, com uma entrada com evento e saídas [sim]/[não]', () => {
    for (const id of COM_DECISAO) {
      const { nodes, edges } = modeloPorId(id).esperado;
      const decisoes = nodes.filter((x) => x.tipo === 'decisao');
      expect(decisoes.length, id).toBeGreaterThan(0);
      for (const d of decisoes) {
        const entram = edges.filter((e) => e.para === d.id), saem = edges.filter((e) => e.de === d.id);
        expect(entram.every((e) => e.rotulo && !e.rotulo.startsWith('[')), id).toBe(true);
        expect(saem.map((e) => e.rotulo).sort(), id).toEqual(['[não]', '[sim]']);
      }
      expect(secaoDoDiagrama(modeloPorId(id).esperado), id).toBe('estados');
    }
  });

  it('a condição vale com ou sem colchetes; decisão no lugar de estado é tipo errado', () => {
    const esp = modeloPorId('pagamento').esperado;
    const jog = copia(esp);
    for (const e of jog.edges) if (e.rotulo?.startsWith('[')) e.rotulo = e.rotulo.slice(1, -1).toUpperCase();
    expect(avaliar(jog, esp).nota).toBe(100);
    const troca = copia(esp);
    troca.nodes.find((x) => x.tipo === 'decisao').tipo = 'estado';
    const fb = gerarFeedback(troca, esp);
    expect(fb.problemas).toEqual([expect.objectContaining({ tipo: 'tipoErrado', usado: 'estado', certo: 'decisao' })]);
    expect(fb.conceitos).toContain('decisao');
  });
});
