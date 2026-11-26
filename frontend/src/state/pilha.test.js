import { describe, expect, it } from 'vitest';
import { estadoInicial, reducer } from './reducer.js';
import { membrosDoGrupo, resolverCena } from '../lib/decoracao.js';
import { ITENS_LOJA, objetosDoItem } from '../data/loja.js';
import { linhaDePixels } from '../screens/Rascunho.jsx';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const LIVROS = membrosDoGrupo('obj-livros');
const comPilha = () =>
  rodar({ ...estadoInicial(), dinheiro: 500 }, { type: 'COMPRAR', id: 'obj-livros', preco: 90 }, { type: 'ALTERNAR_MOVEL', id: 'obj-livros' });
// objetos da pilha que estão na mesa (como o escritório calcula)
const naMesa = (s) => {
  const item = ITENS_LOJA.find((i) => i.id === 'obj-livros');
  return s.loja.moveis.includes(item.id) ? objetosDoItem(item).filter((n) => !s.escritorio.guardados.includes(n)) : [];
};

describe('pilha de livros', () => {
  it('a pilha comprada vira 4 livros separados, um em cima do outro', () => {
    expect(LIVROS).toHaveLength(4);
    const s = comPilha();
    expect(naMesa(s)).toEqual(LIVROS);
    const cena = resolverCena(LIVROS, s.escritorio.posicoes);
    expect(cena.map((o) => o.nivel)).toEqual([0, 1, 2, 3]);
  });

  it('cada livro é guardado sozinho; com os 4 no baú, volta a ser a "Pilha de livros"', () => {
    let s = comPilha();
    s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: 'pilha-amarelo' });
    expect(s.escritorio.guardados).toEqual(['pilha-amarelo']);
    expect(s.loja.moveis).toContain('obj-livros');
    for (const l of ['pilha-azul', 'pilha-rosa', 'pilha-menta']) s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: l });
    expect(s.escritorio.guardados).toEqual([]); // não ficam soltos: viram o item da loja
    expect(s.loja.moveis).not.toContain('obj-livros');
  });

  it('retirar a pilha do baú põe os 4 de volta, empilhados', () => {
    let s = comPilha();
    s = rodar(s, { type: 'MOVER_OBJETO', objeto: 'pilha-rosa', posicao: { x: 200, sobre: 'mesa', chao: 175 } });
    for (const l of LIVROS) s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: l });
    s = rodar(s, { type: 'RETIRAR_OBJETO', objeto: 'livros' });
    expect(naMesa(s)).toEqual(LIVROS);
    for (const l of LIVROS) expect(s.escritorio.posicoes[l]).toBeUndefined(); // posições padrão
    expect(resolverCena(LIVROS, s.escritorio.posicoes).map((o) => o.nivel)).toEqual([0, 1, 2, 3]);
  });

  it('tirar o livro de baixo faz os de cima caírem', () => {
    const s = rodar(comPilha(), { type: 'GUARDAR_OBJETO', objeto: 'pilha-azul' });
    const resto = LIVROS.filter((l) => l !== 'pilha-azul');
    const cena = resolverCena(resto, s.escritorio.posicoes);
    expect(cena.find((o) => o.nome === 'pilha-rosa').nivel).toBe(0);
    expect(cena.find((o) => o.nome === 'pilha-amarelo').nivel).toBe(2);
  });

  it('pote de canetas está à venda', () => {
    expect(ITENS_LOJA.find((i) => i.objeto === 'canetas')).toMatchObject({ categoria: 'mesa', nome: 'Pote de canetas' });
  });
});

describe('folha de rascunho', () => {
  it('a linha do lápis não tem buracos', () => {
    const pts = linhaDePixels(0, 0, 5, 2);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts.at(-1)).toEqual([5, 2]);
    for (let i = 1; i < pts.length; i++) {
      expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThanOrEqual(1);
      expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThanOrEqual(1);
    }
  });

  it('o rabisco fica salvo no escritório', () => {
    const s = rodar(estadoInicial(), { type: 'SALVAR_RABISCO', dados: 'data:image/png;base64,AAA' });
    expect(s.escritorio.rabisco).toBe('data:image/png;base64,AAA');
    expect(rodar(s, { type: 'SALVAR_RABISCO', dados: null }).escritorio.rabisco).toBeNull();
  });
});
