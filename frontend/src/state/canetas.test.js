import { describe, expect, it } from 'vitest';
import { estadoInicial, reducer } from './reducer.js';
import { ANGULO_MAX_POTE, acertou, anguloAleatorio, membrosDoGrupo, ordemDeDesenho, posicoesDoGrupo, pousar, resolverCena } from '../lib/decoracao.js';
import { TINTAS } from '../art/palette.js';
import { FOLHA, coresDisponiveis, posicaoDoCursor } from '../screens/Rascunho.jsx';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const GRUPO = membrosDoGrupo('obj-canetas');
const CANETAS = GRUPO.filter((n) => n.startsWith('caneta-'));

describe('pote de canetas', () => {
  it('10 cores, na ordem pedida', () => {
    expect(Object.keys(TINTAS)).toEqual(['branco', 'preto', 'azul', 'roxo', 'vermelho', 'rosa', 'laranja', 'amarelo', 'verde', 'ciano']);
    expect(GRUPO[0]).toBe('pote-canetas');
    expect(CANETAS).toEqual(Object.keys(TINTAS).map((c) => `caneta-${c}`));
  });

  it('as canetas começam dentro do pote, inclinadas no máximo 30°, e o pote cobre a ponta', () => {
    const cena = resolverCena(GRUPO, {});
    for (const c of cena.filter((o) => o.nome.startsWith('caneta-'))) {
      expect(c.dentro).toBe(true);
      expect(Math.abs(c.entrada.angulo)).toBeLessThanOrEqual(ANGULO_MAX_POTE);
    }
    const ordem = ordemDeDesenho(cena).map((o) => o.nome);
    expect(ordem.at(-1)).toBe('pote-canetas'); // desenhado por último, na frente das canetas
  });

  it('caneta solta sobre o pote entra nele; longe dele, fica na mesa', () => {
    const cena = resolverCena(['pote-canetas'], {});
    const pote = cena[0];
    expect(pousar('caneta-azul', false, pote.x + 5, pote.y - 18, cena).entrada.sobre).toBe('pote-canetas');
    expect(pousar('caneta-azul', false, 40, 150, cena).entrada.sobre).not.toBe('pote-canetas');
  });

  it('ângulo sorteado ao devolver: nunca passa de 30° para cada lado', () => {
    expect(anguloAleatorio(() => 0)).toBe(-30);
    expect(anguloAleatorio(() => 0.9999)).toBe(30);
    for (let i = 0; i < 50; i++) expect(Math.abs(anguloAleatorio())).toBeLessThanOrEqual(30);
  });

  it('pote cheio tirado do baú: vai inteiro para onde o jogador soltar, com as canetas na mesma ordem', () => {
    let s = rodar({ ...estadoInicial(), dinheiro: 500 }, { type: 'COMPRAR', id: 'obj-canetas', preco: 60 }, { type: 'ALTERNAR_MOVEL', id: 'obj-canetas' });
    for (const n of GRUPO) s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: n });
    expect(s.loja.moveis).not.toContain('obj-canetas'); // virou o item inteiro no baú
    const posicoes = posicoesDoGrupo('canetas', 'obj-canetas', { x: 100, sobre: 'mesa', chao: 170 }, 100);
    s = rodar(s, { type: 'COLOCAR_GRUPO', grupo: 'obj-canetas', posicoes });
    expect(s.loja.moveis).toContain('obj-canetas');
    const cena = resolverCena(GRUPO, s.escritorio.posicoes);
    const pote = cena.find((o) => o.nome === 'pote-canetas');
    expect(pote.x).toBe(100);
    const xs = cena.filter((o) => o.nome.startsWith('caneta-')).map((o) => o.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b)); // mesma ordem, da esquerda para a direita
    expect(xs.every((x) => x >= 99 && x <= 100 + 15)).toBe(true);
  });

  it('a pilha de livros também vai inteira para onde for solta', () => {
    const livros = membrosDoGrupo('obj-livros');
    const posicoes = posicoesDoGrupo('livros', 'obj-livros', { x: 200, sobre: 'mesa', chao: 172 }, 200);
    const cena = resolverCena(livros, posicoes);
    expect(cena[0]).toMatchObject({ x: 200, nivel: 0 });
    expect(cena.map((o) => o.nivel)).toEqual([0, 1, 2, 3]);
  });

  it('arrastar o pote leva junto as canetas de dentro (mesma posição e ângulo); a de fora fica', () => {
    let s = rodar({ ...estadoInicial(), dinheiro: 500 }, { type: 'COMPRAR', id: 'obj-canetas', preco: 60 }, { type: 'ALTERNAR_MOVEL', id: 'obj-canetas' });
    s = rodar(s, { type: 'MOVER_OBJETO', objeto: 'caneta-azul', posicao: { x: 120, sobre: 'mesa', chao: 172 } }); // tirada do pote
    const antes = resolverCena(GRUPO, s.escritorio.posicoes);
    const pote0 = antes.find((o) => o.nome === 'pote-canetas');
    s = rodar(s, { type: 'MOVER_OBJETO', objeto: 'pote-canetas', posicao: { x: pote0.x - 150, sobre: 'mesa', chao: 170 } });
    const depois = resolverCena(GRUPO, s.escritorio.posicoes);
    for (const c of CANETAS.filter((n) => n !== 'caneta-azul')) {
      const a = antes.find((o) => o.nome === c), d = depois.find((o) => o.nome === c);
      expect(d.x - a.x, c).toBe(-150);
      expect(d.entrada.angulo, c).toBe(a.entrada.angulo);
      expect(d.dentro, c).toBe(true);
    }
    expect(depois.find((o) => o.nome === 'caneta-azul').x).toBe(120); // estava fora: não se mexe
  });

  it('guardar o pote leva junto as canetas de dentro; a de fora fica na mesa', () => {
    let s = rodar({ ...estadoInicial(), dinheiro: 500 }, { type: 'COMPRAR', id: 'obj-canetas', preco: 60 }, { type: 'ALTERNAR_MOVEL', id: 'obj-canetas' });
    s = rodar(s, { type: 'MOVER_OBJETO', objeto: 'caneta-azul', posicao: { x: 120, sobre: 'mesa', chao: 172 } }); // fora do pote
    s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: 'pote-canetas' });
    const fora = ['caneta-azul'];
    expect(s.escritorio.guardados.sort()).toEqual(GRUPO.filter((n) => !fora.includes(n)).sort());
    expect(s.loja.moveis).toContain('obj-canetas'); // a azul continua na mesa

    // retirar o pote: as canetas guardadas com ele voltam junto, dentro dele, com os mesmos ângulos
    s = rodar(s, { type: 'RETIRAR_OBJETO', objeto: 'pote-canetas' });
    expect(s.escritorio.guardados).toEqual([]);
    const cena = resolverCena(GRUPO, s.escritorio.posicoes);
    for (const c of CANETAS.filter((n) => !fora.includes(n))) expect(cena.find((o) => o.nome === c).dentro, c).toBe(true);
  });

  it('pote guardado com todas as canetas dentro: vira o item "Pote de canetas" no baú', () => {
    let s = rodar({ ...estadoInicial(), dinheiro: 500 }, { type: 'COMPRAR', id: 'obj-canetas', preco: 60 }, { type: 'ALTERNAR_MOVEL', id: 'obj-canetas' });
    s = rodar(s, { type: 'GUARDAR_OBJETO', objeto: 'pote-canetas' });
    expect(s.loja.moveis).not.toContain('obj-canetas');
    expect(s.escritorio.guardados).toEqual([]);
  });

  it('o clique acerta a caneta onde ela aparece (inclinada), não onde estaria reta', () => {
    const cena = resolverCena(GRUPO, {});
    const ciano = cena.find((o) => o.nome === 'caneta-ciano'); // 24° para a direita
    const r = (ciano.entrada.angulo * Math.PI) / 180;
    const cx = ciano.x + ciano.meta.w / 2, cy = ciano.y + ciano.meta.h;
    // ponta (2px abaixo do topo, no meio) depois de girar em volta da base
    const px = cx + Math.sin(r) * (ciano.meta.h - 2), py = cy - Math.cos(r) * (ciano.meta.h - 2);
    expect(acertou(ciano, null, px, py)).toBe(true);
    expect(acertou(ciano, null, cx, ciano.y + 1)).toBe(false); // a ponta "reta" já não é dela
  });

  it('a ponta do lápis cai exatamente no pixel pintado; a borracha fica centrada no que apaga', () => {
    const s = FOLHA.escala;
    const lapis = posicaoDoCursor(10, 20, false);
    // ponta = pixel (0, 11) do sprite → canto (left + 0, top + 11·s) = pixel (10, 20) da folha
    expect([lapis.left / s, lapis.top / s + 11]).toEqual([10, 20]);
    const borracha = posicaoDoCursor(10, 20, true);
    // quadrado da borracha (colunas 0–2, linhas 9–11 do sprite) = pixels 9..11 × 19..21
    expect([borracha.left / s, borracha.top / s + 9]).toEqual([9, 19]);
  });

  it('com o pote comprado, a folha ganha as 10 cores além do lápis', () => {
    expect(coresDisponiveis([]).map((c) => c.id)).toEqual(['lapis']);
    expect(coresDisponiveis(['obj-canetas'])).toHaveLength(11);
  });
});
