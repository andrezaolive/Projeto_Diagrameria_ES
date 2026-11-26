import { describe, expect, it } from 'vitest';
import { JUMBOS, MODELOS, TOTAL_PEDACOS, URGENTE, criarPedido, ehJumbo, modeloPorId, partesDoModelo } from './pedidos.js';
import { avaliar, avaliarPartes } from '../lib/avaliacao.js';
import { nivelDoModelo } from '../lib/dificuldade.js';
import { categoriasDoModelo } from '../lib/categorias.js';
import { foraDoLugar, sobrepoe } from '../lib/grid.js';
import { RELACOES, SECOES, secaoDoDiagrama } from '../editor/Formas.jsx';
import { chaveDaParte, estadoInicial, reducer, sortearUrgente } from '../state/reducer.js';

const copia = (d) => JSON.parse(JSON.stringify(d));
const combinacao = (m) => m.partes.map((p) => p.secao).join('+');

describe('pedidos JUMBO (dois diagramas de uma vez)', () => {
  it('15 pedidos: 5 de cada par de diagramas, com 2 fáceis, 2 médios e 1 difícil em cada', () => {
    expect(JUMBOS).toHaveLength(15);
    const grupos = {};
    for (const m of JUMBOS) (grupos[combinacao(m)] ??= []).push(nivelDoModelo(m).id);
    expect(Object.keys(grupos).sort()).toEqual(['casos+classes', 'casos+estados', 'classes+estados']);
    for (const niveis of Object.values(grupos)) expect(niveis.sort()).toEqual(['dificil', 'facil', 'facil', 'medio', 'medio']);
  });

  it('cada parte usa só o que a sua aba oferece, no grid, sem peças sobrepostas', () => {
    const relacoes = RELACOES.map((r) => r.tipo);
    for (const m of JUMBOS) {
      expect(ehJumbo(m), m.id).toBe(true);
      expect(new Set(m.partes.map((p) => p.secao)).size, m.id).toBe(2);
      for (const { secao, esperado } of m.partes) {
        const s = SECOES.find((x) => x.id === secao);
        expect(secaoDoDiagrama(esperado), `${m.id} ${secao}`).toBe(secao);
        for (const n of esperado.nodes) {
          expect(s.elementos, m.id).toContain(n.tipo);
          expect([n.x % 20, n.y % 20], m.id).toEqual([0, 0]);
        }
        for (const e of esperado.edges) {
          expect(relacoes).toContain(e.tipo);
          expect(s.relacoes, m.id).toContain(e.tipo);
        }
        const nos = esperado.nodes.filter((n) => n.tipo !== 'sistema');
        for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) expect(sobrepoe(nos[i], nos[j]), `${m.id}: ${nos[i].rotulo}/${nos[j].rotulo}`).toBe(false);
        expect(foraDoLugar(esperado.nodes), m.id).toEqual([]);
        expect(avaliar(copia(esperado), esperado).nota, `${m.id} ${secao}`).toBe(100);
      }
    }
  });

  it('o e-mail cita os nomes e eventos de cada diagrama', () => {
    for (const m of JUMBOS) {
      const texto = m.corpo.join(' ');
      expect(texto, m.id).toContain('JUMBO');
      for (const { esperado } of m.partes) {
        for (const n of esperado.nodes) if (['sistema', 'ator', 'casoDeUso', 'classe', 'estado', 'decisao'].includes(n.tipo)) expect(texto, m.id).toContain(`"${n.rotulo}"`);
        for (const e of esperado.edges) if (e.rotulo) expect(texto, m.id).toContain(`"${e.rotulo}"`);
        for (const n of esperado.nodes) for (const membro of [...(n.atributos ?? []), ...(n.metodos ?? [])]) expect(texto, m.id).toContain(`"${membro}"`);
      }
    }
  });

  it('nota = média das partes; uma parte vazia derruba só a metade', () => {
    const m = modeloPorId('jumbo-cinema');
    const perfeito = avaliarPartes(m.partes.map((p) => ({ ...p, diagrama: copia(p.esperado) })));
    expect(perfeito.nota).toBe(100);
    expect(perfeito.partes.map((p) => p.nota)).toEqual([100, 100]);
    const meio = avaliarPartes(m.partes.map((p, i) => ({ ...p, diagrama: i === 0 ? copia(p.esperado) : { nodes: [], edges: [] } })));
    expect(meio.nota).toBe(50);
    // pedido normal também tem "partes" (uma só), para o código tratar os dois do mesmo jeito
    expect(partesDoModelo(modeloPorId('cinema'))).toEqual([{ secao: 'casos', esperado: modeloPorId('cinema').esperado }]);
    expect(categoriasDoModelo(m).slice(0, 2)).toEqual(['Jumbo', 'Casos de uso + Estados']);
  });

  it('nunca chega como urgente', () => {
    expect(MODELOS.some(ehJumbo)).toBe(false);
    const s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' }).sessao;
    for (let k = 0; k < 200; k++) {
      const u = sortearUrgente(s, 60, (k / 200) * URGENTE.chance);
      expect(u && ehJumbo(modeloPorId(u.modelo))).toBeFalsy();
    }
  });

  it('entrega guarda um diagrama por aba e limpa os rascunhos de cada aba', () => {
    let st = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const p = criarPedido('jumbo-banho-tosa', 99, 1);
    st = { ...st, sessao: { ...st.sessao, pedidos: [...st.sessao.pedidos, p] } };
    st = reducer(st, { type: 'ACEITAR', id: p.id });
    const [a, b] = modeloPorId(p.modelo).partes;
    st = reducer(st, { type: 'SET_DIAGRAMA', chave: chaveDaParte(p.id, a.secao), diagrama: a.esperado });
    st = reducer(st, { type: 'SET_DIAGRAMA', chave: chaveDaParte(p.id, b.secao), diagrama: b.esperado });
    // dicas: cada diagrama tem os seus pedaços
    st = { ...st, dinheiro: 1000 };
    st = reducer(st, { type: 'COMPRAR_PEDACO', indice: TOTAL_PEDACOS + 1 });
    expect(st.sessao.pedidos.find((x) => x.id === p.id).pedacos).toEqual([TOTAL_PEDACOS + 1]);
    expect(reducer(st, { type: 'COMPRAR_PEDACO', indice: 2 * TOTAL_PEDACOS })).toBe(st);
    const partes = [{ secao: a.secao, diagrama: a.esperado }, { secao: b.secao, diagrama: b.esperado }];
    st = reducer(st, { type: 'ENTREGAR', id: p.id, nota: 100, valor: 10, partes });
    const entregue = st.sessao.pedidos.find((x) => x.id === p.id);
    expect(entregue).toMatchObject({ status: 'entregue', partes });
    expect(Object.keys(st.diagramas).filter((k) => k.startsWith(`pedido:${p.id}`))).toEqual([]);
  });
});
