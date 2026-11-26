import { describe, expect, it } from 'vitest';
import { diagramaVazio, diferencas, gerarFeedback, parecido } from './feedback.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';

const copia = (d) => JSON.parse(JSON.stringify(d));
const tipos = (fb) => fb.problemas.map((p) => p.tipo).sort();
const renomear = (d, de, para) => ({ ...d, nodes: d.nodes.map((n) => (n.rotulo === de ? { ...n, rotulo: para } : n)) });

describe('feedback da entrega', () => {
  it('gabarito idêntico: nenhum problema, e o gabarito não é alterado', () => {
    for (const m of MODELOS) {
      const antes = JSON.stringify(m.esperado);
      expect(gerarFeedback(copia(m.esperado), m.esperado).problemas).toEqual([]);
      expect(JSON.stringify(m.esperado)).toBe(antes);
    }
  });

  it('erro de digitação vira "grafia" com as letras erradas marcadas, sem quebrar as relações', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const jog = renomear(copia(esp), 'Verificar cadastro', 'Verificar cadatro');
    const fb = gerarFeedback(jog, esp);
    expect(tipos(fb)).toEqual(['grafia']);
    const g = fb.problemas[0];
    expect(g.escrito).toBe('Verificar cadatro');
    expect(g.correto).toBe('Verificar cadastro');
    expect(g.diff.correto.filter((x) => x.faltou).map((x) => x.t).join('')).toBe('s');
  });

  it('marca letra trocada no que o jogador escreveu', () => {
    const d = diferencas('Gatu', 'Gato');
    expect(d.escrito.filter((x) => x.errado).map((x) => x.t).join('')).toBe('u');
    expect(d.correto.filter((x) => x.faltou).map((x) => x.t).join('')).toBe('o');
  });

  it('acento e maiúscula não contam como erro (igual à nota)', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const jog = renomear(copia(esp), 'Bibliotecário', 'BIBLIOTECARIO');
    expect(gerarFeedback(jog, esp).problemas).toEqual([]);
    expect(parecido('Bibliotecário', 'bibliotecario')).toBe(false);
  });

  it('elemento com o tipo trocado (classe no lugar de caso de uso)', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const jog = copia(esp);
    jog.nodes.find((n) => n.rotulo === 'Devolver livro').tipo = 'classe';
    const fb = gerarFeedback(jog, esp);
    expect(tipos(fb)).toEqual(['tipoErrado']);
    expect(fb.problemas[0]).toMatchObject({ usado: 'classe', certo: 'casoDeUso' });
    expect(fb.conceitos).toEqual(expect.arrayContaining(['classe', 'casoDeUso']));
  });

  it('include ao contrário e include trocado por extend', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const inv = copia(esp);
    const inc = inv.edges.find((e) => e.tipo === 'include');
    [inc.de, inc.para] = [inc.para, inc.de];
    const fb = gerarFeedback(inv, esp);
    expect(tipos(fb)).toEqual(['sentidoInvertido']);
    expect(fb.problemas[0].certa).toMatchObject({ tipo: 'include', ra: 'Emprestar livro', rb: 'Verificar cadastro' });
    expect(fb.conceitos).toEqual(['include']);

    const trocado = copia(esp);
    trocado.edges.find((e) => e.tipo === 'include').tipo = 'extend';
    const fb2 = gerarFeedback(trocado, esp);
    expect(tipos(fb2)).toEqual(['relacaoTipoErrado']);
    expect(fb2.conceitos).toEqual(expect.arrayContaining(['include', 'extend']));
  });

  it('associação não tem sentido: invertida não é erro', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const jog = copia(esp);
    const a = jog.edges.find((e) => e.tipo === 'associacao');
    [a.de, a.para] = [a.para, a.de];
    expect(gerarFeedback(jog, esp).problemas).toEqual([]);
  });

  it('falta e sobra de elementos e relações', () => {
    const esp = modeloPorId('biblioteca').esperado;
    const jog = copia(esp);
    jog.nodes = jog.nodes.filter((n) => n.rotulo !== 'Consultar acervo');
    jog.edges = jog.edges.filter((e) => e.para !== 'c1');
    jog.nodes.push({ id: 'x', tipo: 'ator', rotulo: 'Zelador', x: 0, y: 0 });
    jog.edges.push({ id: 'y', tipo: 'associacao', de: 'x', para: 'c3' });
    const fb = gerarFeedback(jog, esp);
    expect(tipos(fb)).toEqual(['faltando', 'relacaoFaltando', 'relacaoSobrando', 'sobrando']);
  });

  it('herança do modelo de classes: filha → mãe', () => {
    const esp = modeloPorId('petshop').esperado;
    const jog = copia(esp);
    const h = jog.edges.find((e) => e.tipo === 'heranca');
    [h.de, h.para] = [h.para, h.de];
    const fb = gerarFeedback(jog, esp);
    expect(tipos(fb)).toEqual(['sentidoInvertido']);
    expect(fb.problemas[0].certa.rb).toBe('Animal');
  });

  it('diagrama vazio não tem feedback', () => {
    expect(diagramaVazio({ nodes: [], edges: [] })).toBe(true);
    expect(diagramaVazio({ nodes: [{ id: 'a', tipo: 'ator', rotulo: 'A' }], edges: [] })).toBe(false);
  });
});
