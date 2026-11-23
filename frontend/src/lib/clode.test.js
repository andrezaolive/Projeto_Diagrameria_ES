import { describe, expect, it } from 'vitest';
import { acaoDoClode } from './clode.js';
import { avaliar } from './avaliacao.js';
import { TODOS_MODELOS, modeloPorId, partesDoModelo } from '../data/pedidos.js';

const vazio = { nodes: [], edges: [] };
const copia = (d) => JSON.parse(JSON.stringify(d));
// usa o Clode até ele não ter mais nada a fazer
function aoMaximo(d, esperado, limite = 120) {
  for (let i = 0; i < limite; i++) {
    const a = acaoDoClode(d, esperado);
    if (a.tipo === 'nada') return { d, usos: i };
    d = a.diagrama;
  }
  throw new Error('o Clode não parou');
}

describe('Clode', () => {
  it('com o gabarito pronto não há nada a fazer', () => {
    for (const m of TODOS_MODELOS) for (const { esperado } of partesDoModelo(m)) expect(acaoDoClode(copia(esperado), esperado).tipo, m.id).toBe('nada');
  });

  it('primeiro põe os elementos que faltam, um por uso', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const a = acaoDoClode(vazio, esp);
    expect(a.tipo).toBe('adicionar');
    expect(a.diagrama.nodes).toHaveLength(1);
    expect(a.diagrama.nodes[0].tipo).toBe('sistema');
    expect(a.texto).toContain('Sistema da Biblioteca');
  });

  it('usado até o fim, a partir do zero, chega à nota 100 em todo pedido', () => {
    for (const m of TODOS_MODELOS)
      for (const { esperado } of partesDoModelo(m)) {
        const { d, usos } = aoMaximo(vazio, esperado);
        expect(avaliar(d, esperado).nota, m.id).toBe(100);
        expect(usos, m.id).toBeGreaterThan(0);
      }
  });

  it('corrige uma coisa só: nome errado, tipo errado, relação invertida, sobrando', () => {
    const esp = modeloPorId('petshop').esperado;
    const base = copia(esp);
    // nome com erro de digitação
    const nome = { ...base, nodes: base.nodes.map((n) => (n.rotulo === 'Cachorro' ? { ...n, rotulo: 'Cachoro' } : n)) };
    const a = acaoDoClode(nome, esp);
    expect(a.tipo).toBe('corrigir');
    expect(a.texto).toContain('Cachorro');
    expect(avaliar(a.diagrama, esp).nota).toBe(100);
    // herança ao contrário
    const inv = { ...base, edges: base.edges.map((e, i) => (i === 0 ? { ...e, de: e.para, para: e.de } : e)) };
    const b = acaoDoClode(inv, esp);
    expect(b.texto).toContain('sentido');
    expect(avaliar(b.diagrama, esp).nota).toBe(100);
    // um elemento a mais
    const extra = { ...base, nodes: [...base.nodes, { id: 'x', tipo: 'classe', rotulo: 'Peixe', x: 900, y: 600 }] };
    const c = acaoDoClode(extra, esp);
    expect(c.texto).toContain('Peixe');
    expect(c.diagrama.nodes).toHaveLength(base.nodes.length);
  });

  it('também cuida de atributos, multiplicidade e eventos', () => {
    const cl = modeloPorId('cooperativa').esperado;
    const semMembro = copia(cl);
    semMembro.nodes[1].metodos = semMembro.nodes[1].metodos.slice(1);
    expect(acaoDoClode(semMembro, cl).texto).toContain('Escrevi');
    const semMult = copia(cl);
    semMult.edges = semMult.edges.map((e) => ({ ...e, multDe: undefined, multPara: undefined }));
    expect(acaoDoClode(semMult, cl).texto).toContain('multiplicidade');
    const est = modeloPorId('catraca').esperado;
    const evento = copia(est);
    evento.edges = evento.edges.map((e) => (e.rotulo === 'passar' ? { ...e, rotulo: 'empurrar' } : e));
    expect(acaoDoClode(evento, est).texto).toContain('evento');
  });
});

describe('Clode no jogo (USAR_CLODE)', () => {
  it('cobra pelo nível do pedido, grava o diagrama e conta como dica', async () => {
    const { estadoInicial, reducer, precoDoClode } = await import('../state/reducer.js');
    let s = reducer({ ...estadoInicial(), dinheiro: 1000 }, { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const p = s.sessao.pedidos[0];
    s = reducer(s, { type: 'ACEITAR', id: p.id });
    const preco = precoDoClode(p, s.sessao);
    const novo = { nodes: [{ id: 'a', tipo: 'ator', rotulo: 'X', x: 0, y: 0 }], edges: [] };
    const depois = reducer(s, { type: 'USAR_CLODE', id: p.id, chave: 'pedido:' + p.id, diagrama: novo });
    expect(depois.dinheiro).toBe(1000 - preco);
    expect(depois.diagramas['pedido:' + p.id]).toEqual(novo);
    expect(depois.estatisticas.gastos.clode).toBe(preco);
    expect(depois.sessao.pedidos[0].clode).toBe(1);
    // o seguinte custa 10% a mais, também em outro pedido do mesmo dia
    expect(precoDoClode(depois.sessao.pedidos[0], depois.sessao)).toBe(Math.round(preco * 1.1));
    expect(precoDoClode({ ...p, id: 'outro' }, depois.sessao)).toBe(Math.round(preco * 1.1));
    expect(precoDoClode(p, { ...s.sessao, clode: { usos: 5, ultimo: 0 } })).toBe(Math.round(preco * 1.5));
    expect(reducer({ ...s, dinheiro: preco - 1 }, { type: 'USAR_CLODE', id: p.id, chave: 'x', diagrama: novo }).dinheiro).toBe(preco - 1);
  });

  it('no modo infinito é bem mais barato', async () => {
    const { precoBrutoDoClode } = await import('../state/reducer.js');
    expect(precoBrutoDoClode({ modelo: 'yoga' }, { modo: 'infinito' })).toBe(40);
    expect(precoBrutoDoClode({ modelo: 'acervo' }, { modo: 'infinito' })).toBe(80);
    expect(precoBrutoDoClode({ modelo: 'acervo' }, { modo: 'infinito', clode: { usos: 2, ultimo: 0 } })).toBe(96);
  });

  it('nunca fica mais barato no dia: depois de um difícil, o fácil mantém o preço alto; partida nova zera', async () => {
    const { estadoInicial, reducer, precoBrutoDoClode } = await import('../state/reducer.js');
    const facil = { modelo: 'yoga' }, dificil = { modelo: 'acervo' };
    const sessao = { modo: 'campanha', clode: { usos: 1, ultimo: precoBrutoDoClode(dificil, {}) } };
    expect(precoBrutoDoClode(dificil, {})).toBe(400);
    expect(precoBrutoDoClode(facil, sessao)).toBe(400); // fácil seria 220: fica o mais alto
    expect(precoBrutoDoClode(dificil, sessao)).toBe(440);
    const nova = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    expect(nova.sessao.clode).toBeUndefined();
    expect(precoBrutoDoClode(facil, nova.sessao)).toBe(200);
  });
});
