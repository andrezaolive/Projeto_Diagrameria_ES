import { describe, expect, it } from 'vitest';
import { COMPLEXOS, MODELOS, TOTAL_PEDACOS, criarPedido, ehComplexo, modeloPorId, pedacosDoModelo, pedidosDoFimDeSemana, precoPedaco, sortearPedidosDoDia } from './pedidos.js';
import { avaliar } from '../lib/avaliacao.js';
import { composicaoDoFimDeSemana, ehFimDeSemana, nivelDoModelo, sextaAntes } from '../lib/dificuldade.js';
import { tipoDoModelo } from '../lib/categorias.js';
import { LOGOS_CLIENTES } from '../lib/logos.js';
import { foraDoLugar, sobrepoe } from '../lib/grid.js';
import { RELACOES, SECOES, secaoDoDiagrama } from '../editor/Formas.jsx';
import { COMPLEXO_A_PARTIR_DE, estadoInicial, reducer } from '../state/reducer.js';
import { chegarAgora } from '../state/testeAjuda.js';

const copia = (d) => JSON.parse(JSON.stringify(d));
const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const ELEMENTOS = ['ator', 'casoDeUso', 'classe', 'estado', 'decisao'];

describe('pedidos complexos', () => {
  it('18 pedidos: 2 fáceis, 2 médios e 2 difíceis de cada tipo de diagrama', () => {
    expect(COMPLEXOS).toHaveLength(18);
    const grupos = {};
    for (const m of COMPLEXOS) (grupos[tipoDoModelo(m)] ??= []).push(nivelDoModelo(m).id);
    expect(Object.keys(grupos).sort()).toEqual(['casos', 'classes', 'estados']);
    for (const niveis of Object.values(grupos)) expect(niveis.sort()).toEqual(['dificil', 'dificil', 'facil', 'facil', 'medio', 'medio']);
  });

  it('cada um tem muitos elementos, no grid, sem peças sobrepostas, e o gabarito vale 100', () => {
    const relacoes = RELACOES.map((r) => r.tipo);
    for (const m of COMPLEXOS) {
      expect(ehComplexo(m), m.id).toBe(true);
      const { nodes, edges } = m.esperado;
      expect(nodes.filter((n) => n.tipo !== 'sistema').length, m.id).toBeGreaterThanOrEqual(8); // início e fim contam
      expect(edges.length, m.id).toBeGreaterThanOrEqual(8);
      const secao = SECOES.find((s) => s.id === secaoDoDiagrama(m.esperado));
      for (const n of nodes) {
        expect(secao.elementos, m.id).toContain(n.tipo);
        expect([n.x % 20, n.y % 20], `${m.id} ${n.rotulo}`).toEqual([0, 0]);
      }
      for (const e of edges) {
        expect(relacoes).toContain(e.tipo);
        expect(secao.relacoes, m.id).toContain(e.tipo);
        expect(nodes.some((n) => n.id === e.de) && nodes.some((n) => n.id === e.para), `${m.id} ${e.id}`).toBe(true);
      }
      expect(new Set(edges.map((e) => e.id)).size, m.id).toBe(edges.length);
      const nos = nodes.filter((n) => n.tipo !== 'sistema');
      for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) expect(sobrepoe(nos[i], nos[j]), `${m.id}: ${nos[i].rotulo}/${nos[j].rotulo}`).toBe(false);
      expect(foraDoLugar(nodes), m.id).toEqual([]);
      expect(avaliar(copia(m.esperado), m.esperado).nota, m.id).toBe(100);
      expect(LOGOS_CLIENTES[m.cliente], m.cliente).toBeTruthy();
    }
  });

  it('o e-mail cita todos os nomes, eventos, atributos e métodos entre aspas', () => {
    for (const m of COMPLEXOS) {
      const texto = m.corpo.join(' ');
      for (const n of m.esperado.nodes) if (['sistema', ...ELEMENTOS].includes(n.tipo)) expect(texto, m.id).toContain(`"${n.rotulo}"`);
      for (const e of m.esperado.edges) if (e.rotulo) expect(texto, m.id).toContain(`"${e.rotulo}"`);
      for (const n of m.esperado.nodes) for (const membro of [...(n.atributos ?? []), ...(n.metodos ?? [])]) expect(texto, m.id).toContain(`"${membro}"`);
    }
  });

  it('os complexos difíceis de classes cobram atributos e métodos', () => {
    for (const id of ['cx-transportes', 'cx-locadora']) {
      const nos = modeloPorId(id).esperado.nodes;
      expect(nos.filter((n) => n.atributos?.length).length, id).toBeGreaterThanOrEqual(nos.length - 1);
      expect(nos.some((n) => n.metodos?.length), id).toBe(true);
    }
  });

  it('dicas em 16 pedaços: preço do nível, +10% sobre o primeiro a cada pedaço', () => {
    const p = criarPedido('cx-loja', 1, 5); // médio complexo: começa em R$ 150
    expect(pedacosDoModelo(modeloPorId('cx-loja'))).toBe(16);
    expect(pedacosDoModelo(modeloPorId('cinema'))).toBe(TOTAL_PEDACOS);
    expect(precoPedaco(p)).toBe(150);
    expect(precoPedaco({ ...p, pedacos: [3] })).toBe(165);
    expect(precoPedaco({ ...p, pedacos: Array.from({ length: 15 }, (_, i) => i) })).toBe(375);
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, dinheiro: 1000, sessao: { ...s.sessao, pedidos: [...s.sessao.pedidos, p] } };
    s = rodar(s, { type: 'ACEITAR', id: p.id }, { type: 'COMPRAR_PEDACO', indice: 15 });
    expect(s.sessao.pedidos.find((x) => x.id === p.id).pedacos).toEqual([15]);
    expect(s.dinheiro).toBe(850);
    expect(rodar(s, { type: 'COMPRAR_PEDACO', indice: 16 })).toBe(s);
  });

  it('nunca vêm nos dias úteis da campanha nem como urgentes', () => {
    expect(MODELOS.some(ehComplexo)).toBe(false);
    for (let dia = 1; dia <= 23; dia++)
      for (const semente of [0.1, 0.6]) expect(sortearPedidosDoDia(dia, { semente }).some((id) => ehComplexo(modeloPorId(id))), `dia ${dia}`).toBe(false);
  });

  it('modo infinito: complexos só a partir do pedido COMPLEXO_A_PARTIR_DE', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const vistos = [];
    for (let k = 0; k < 400; k++) {
      const p = s.sessao.pedidos.find((x) => x.status === 'novo');
      vistos.push({ seq: Number(p.id.split('-').at(-1)), complexo: ehComplexo(modeloPorId(p.modelo)) });
      s = chegarAgora(rodar(s, { type: 'RECUSAR', id: p.id }));
    }
    expect(vistos.filter((v) => v.complexo).every((v) => v.seq >= COMPLEXO_A_PARTIR_DE)).toBe(true);
    expect(vistos.some((v) => v.complexo)).toBe(true);
  });
});

describe('fins de semana da campanha', () => {
  const comSexta = (sexta, extra = {}) => {
    const s = estadoInicial();
    return { ...s, campanha: { ...s.campanha, desbloqueado: sexta + 1, concluidos: { [sexta]: { ganho: 50, media: 80 } } }, ...extra };
  };

  it('composição de cada fim de semana (só complexos)', () => {
    const esperado = { 6: '1/0/0', 7: '1/0/0', 13: '0/1/0', 14: '0/1/0', 20: '1/1/0', 21: '1/1/0', 27: '0/1/1', 28: '0/0/2' };
    for (const [data, comp] of Object.entries(esperado)) {
      expect(ehFimDeSemana(Number(data))).toBe(true);
      expect(Object.values(composicaoDoFimDeSemana(Number(data))).join('/'), `dia ${data}`).toBe(comp);
      for (const semente of [0.2, 0.8]) {
        const ids = pedidosDoFimDeSemana(Number(data), { semente });
        expect(ids.every((id) => ehComplexo(modeloPorId(id)))).toBe(true);
        const contagem = { facil: 0, medio: 0, dificil: 0 };
        for (const id of ids) contagem[nivelDoModelo(modeloPorId(id)).id]++;
        expect(Object.values(contagem).join('/')).toBe(comp);
      }
    }
    expect([5, 8, 12, 29].some(ehFimDeSemana)).toBe(false);
    expect([6, 7, 13, 28].map(sextaAntes)).toEqual([5, 5, 10, 20]);
  });

  it('jogar o fim de semana guarda a medalha e não mexe no avanço da campanha', () => {
    let s = rodar(comSexta(5), { type: 'INICIAR_SESSAO', modo: 'campanha', fimDeSemana: 6, semente: 0.3 });
    expect(s.sessao).toMatchObject({ fimDeSemana: 6, dia: 5 });
    const [p] = s.sessao.pedidos;
    expect(ehComplexo(modeloPorId(p.modelo))).toBe(true);
    s = rodar(s, { type: 'ACEITAR', id: p.id }, { type: 'ENTREGAR', id: p.id, nota: 96, valor: 100 });
    expect(s.sessao.relatorio).toMatchObject({ media: 96, aprovado: true });
    expect(s.campanha.fimDeSemana[6]).toEqual({ ganho: 100, media: 96 });
    expect(s.campanha.desbloqueado).toBe(6);
    expect(s.campanha.concluidos).toEqual({ 5: { ganho: 50, media: 80 } });
    expect(s.colecao[p.modelo].melhorNota).toBe(96);
    // jogar de novo: paga metade e só traz complexos já desbloqueados
    const r = rodar(s, { type: 'INICIAR_SESSAO', modo: 'campanha', fimDeSemana: 6, semente: 0.9 });
    expect(r.sessao.repeticao).toBe(true);
    expect(r.sessao.pedidos[0].modelo).toBe(p.modelo);
    expect(r.sessao.pedidos[0].recompensa).toBe(Math.round(criarPedido(p.modelo, 1, 5).recompensa / 2));
  });

  it('save antigo sem fins de semana continua funcionando', async () => {
    const { migrar } = await import('../state/reducer.js');
    const s = migrar({ campanha: { desbloqueado: 3, concluidos: { 1: { ganho: 1, media: 70 } } } });
    expect(s.campanha.fimDeSemana).toEqual({});
    expect(s.campanha.desbloqueado).toBe(3);
  });
});
