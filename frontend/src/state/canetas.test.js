import { describe, expect, it } from 'vitest';
import { estadoInicial, reducer } from './reducer.js';
import { ANGULO_MAX_POTE, ANGULO_MIN_POTE, acertou, anguloAleatorio, membrosDoGrupo, ordemDeDesenho, posicoesDoGrupo, pousar, resolverCena } from '../lib/decoracao.js';
import { TINTAS } from '../art/palette.js';
import OBJETOS from '../art/objetos.json';
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

  it('as canetas começam dentro do pote, no centro do fundo, inclinadas de 10° a 30°, e o pote cobre a ponta', () => {
    const cena = resolverCena(GRUPO, {});
    const pote = cena.find((o) => o.nome === 'pote-canetas');
    for (const c of cena.filter((o) => o.nome.startsWith('caneta-'))) {
      expect(c.dentro).toBe(true);
      expect(c.x, c.nome).toBe(pote.x + (pote.meta.w - c.meta.w) / 2);
      expect(Math.abs(c.entrada.angulo), c.nome).toBeGreaterThanOrEqual(ANGULO_MIN_POTE);
      expect(Math.abs(c.entrada.angulo), c.nome).toBeLessThanOrEqual(ANGULO_MAX_POTE);
    }
    const ordem = ordemDeDesenho(cena).map((o) => o.nome);
    expect(ordem.at(-1)).toBe('pote-canetas'); // desenhado por último, na frente das canetas
  });

  it('caneta solta sobre o pote entra nele, no centro inferior; longe dele, fica na mesa', () => {
    const cena = resolverCena(['pote-canetas'], {});
    const pote = cena[0];
    const meio = pote.x + (pote.meta.w - 3) / 2;
    for (const x of [pote.x - 1, pote.x + 5, pote.x + pote.meta.w - 3]) {
      const r = pousar('caneta-azul', false, x, pote.y - 18, cena);
      expect(r.entrada).toEqual({ x: meio, sobre: 'pote-canetas' }); // sempre o mesmo ponto, onde quer que solte
      expect(r.y + 22).toBe(pote.y + pote.meta.fundo); // a base no fundo do pote
    }
    expect(pousar('caneta-azul', false, 40, 150, cena).entrada.sobre).not.toBe('pote-canetas');
  });

  it('ângulo sorteado ao devolver: de 10° a 30°, para um lado ou para o outro', () => {
    expect(anguloAleatorio(() => 0)).toBe(-10);
    expect(anguloAleatorio(() => 0.9999)).toBe(30);
    const vistos = new Set();
    for (let i = 0; i < 200; i++) {
      const a = anguloAleatorio();
      expect(Math.abs(a)).toBeGreaterThanOrEqual(ANGULO_MIN_POTE);
      expect(Math.abs(a)).toBeLessThanOrEqual(ANGULO_MAX_POTE);
      vistos.add(Math.sign(a));
    }
    expect(vistos).toEqual(new Set([-1, 1]));
  });

  it('com a base no centro do fundo e até 30°, a caneta não vaza pelas laterais do pote', () => {
    const pote = resolverCena(['pote-canetas'], {})[0];
    const sobra = pote.meta.w / 2; // da base (centro) até a parede do pote
    // na altura da boca (fundo px acima da base) o meio da caneta se afasta fundo·sen(30°) do centro
    expect(pote.meta.fundo * Math.sin((ANGULO_MAX_POTE * Math.PI) / 180) + 1.5).toBeLessThanOrEqual(sobra);
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
    const folga = OBJETOS['pote-canetas'].x - OBJETOS.canetas.x; // o leque é mais largo que o pote
    expect(pote.x).toBe(100 + folga);
    const canetas = cena.filter((o) => o.nome.startsWith('caneta-'));
    expect(canetas.every((o) => o.x === pote.x + 6)).toBe(true); // todas no centro do pote
    const angulos = canetas.map((o) => o.entrada.angulo);
    expect(angulos).toEqual([...angulos].sort((a, b) => a - b)); // mesmo leque, na mesma ordem
  });

  it('save antigo com a caneta fora do centro: dentro do pote ela volta para o centro', () => {
    const cena = resolverCena(GRUPO, { 'caneta-azul': { x: 263, sobre: 'pote-canetas', angulo: -24 } });
    const pote = cena.find((o) => o.nome === 'pote-canetas');
    expect(cena.find((o) => o.nome === 'caneta-azul').x).toBe(pote.x + 6);
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
    const ciano = cena.find((o) => o.nome === 'caneta-ciano'); // 30° para a direita
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
