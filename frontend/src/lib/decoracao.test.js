import { describe, expect, it } from 'vitest';
import {
  TOPO_MONITOR,
  acertou,
  estaEmPilha,
  limitarPosicao,
  metaDe,
  normalizarEntrada,
  objetoNoPonto,
  ordemDeDesenho,
  podeDeitar,
  pousar,
  resolverCena,
  soltarDependentes,
} from './decoracao.js';
import { DESK_Y, ESTANTE, MONITOR, MONITOR_SCREEN } from '../art/layout.js';
import OBJETOS from '../art/objetos.json';

const mesa = { w: 10, h: 20, zona: 'mesa' };
const parede = { w: 30, h: 30, zona: 'parede' };

describe('limites das zonas', () => {
  it('objeto de mesa não sai da cena nem sobe para a parede', () => {
    expect(limitarPosicao(mesa, -50, 0)).toEqual({ x: 0, y: DESK_Y + 12 - 20 });
    expect(limitarPosicao(mesa, 999, 999)).toEqual({ x: 310, y: 160 });
  });

  it('objeto de parede não desce para a mesa', () => {
    expect(limitarPosicao(parede, 10, 200)).toEqual({ x: 10, y: DESK_Y - 30 });
    expect(limitarPosicao(parede, 100.6, -5)).toEqual({ x: 101, y: 0 });
  });
});

describe('ordem e clique', () => {
  const a = { nome: 'a', x: 0, y: 140, meta: mesa };
  const b = { nome: 'b', x: 5, y: 150, meta: mesa };
  const p = { nome: 'p', x: 0, y: 130, meta: parede };

  it('parede atrás e quem está mais à frente na mesa por cima', () => {
    expect(ordemDeDesenho([b, p, a]).map((o) => o.nome)).toEqual(['p', 'a', 'b']);
  });

  it('pega o objeto da frente e respeita pixels transparentes', () => {
    const ordem = ordemDeDesenho([a, b]);
    expect(objetoNoPonto(ordem, {}, 7, 155).nome).toBe('b');
    const vazia = { w: 10, h: 20, alfa: new Uint8Array(200) };
    expect(acertou(b, vazia, 7, 155)).toBe(false);
    expect(objetoNoPonto(ordem, { b: vazia }, 7, 155).nome).toBe('a');
  });
});

const cobreTela = (meta, p) => {
  const t = MONITOR_SCREEN;
  return p.x < t.x + t.w && p.x + meta.w > t.x && p.y < t.y + t.h && p.y + meta.h > t.y;
};
const achar = (cena, nome) => cena.find((o) => o.nome === nome);

describe('superfícies: monitor, estante e tela livre', () => {
  const meioMonitor = MONITOR.x + MONITOR.w / 2;

  it('objeto elevável apoia no topo do monitor, sem passar das bordas', () => {
    const r = pousar('caneca', false, meioMonitor - 8, 10, []);
    expect(r.entrada.sobre).toBe('monitor');
    expect(r.y).toBe(TOPO_MONITOR.y - OBJETOS.caneca.h + 1);
    // centro ainda sobre o monitor, mas o objeto passaria da borda: é puxado para dentro
    const borda = pousar('caneca', false, TOPO_MONITOR.x2 - 9, 10, []);
    expect(borda.entrada.sobre).toBe('monitor');
    expect(borda.x + OBJETOS.caneca.w).toBeLessThanOrEqual(MONITOR.x + MONITOR.w);
  });

  it('a estante é uma superfície', () => {
    const r = pousar('caneca', false, ESTANTE.x + 20, 0, []);
    expect(r.entrada.sobre).toBe('estante');
    expect(r.y + OBJETOS.caneca.h).toBe(ESTANTE.y);
  });

  it('solto no ar fora das superfícies, cai no fundo da mesa; não elevável fica na mesa', () => {
    expect(pousar('caneca', false, 10, 10, []).entrada).toMatchObject({ sobre: 'mesa', chao: DESK_Y + 12 });
    expect(pousar('papeis', false, ESTANTE.x + 10, 0, []).entrada.sobre).toBe('mesa');
  });

  it('nenhum objeto cobre a tela: post-it e planta são empurrados para fora', () => {
    const postit = OBJETOS['postit-amarelo'];
    const t = MONITOR_SCREEN;
    expect(cobreTela(postit, limitarPosicao(postit, t.x + 10, t.y + 10))).toBe(false);
    const planta = OBJETOS.planta;
    expect(cobreTela(planta, limitarPosicao(planta, t.x + 5, 0))).toBe(false);
  });

  it('livros e vasinho vêm na estante; post-its na parede', () => {
    const cena = resolverCena(['livro-rosa', 'vaso-estante', 'postit-azul'], {});
    expect(achar(cena, 'livro-rosa')).toMatchObject({ raiz: 'estante', y: ESTANTE.y - OBJETOS['livro-rosa'].h });
    expect(achar(cena, 'vaso-estante').raiz).toBe('estante');
    expect(achar(cena, 'postit-azul').raiz).toBe('parede');
  });

  it('save antigo { x, y } continua valendo', () => {
    expect(normalizarEntrada('caneca', { x: 50, y: 120 })).toEqual({ x: 50, sobre: 'mesa', chao: 120 + 14 }); // caneca: 14px de altura
    expect(normalizarEntrada('caneca', { x: 150, y: 15 })).toEqual({ x: 150, sobre: 'monitor' });
  });

  it('na parede, peças pequenas ficam por cima das grandes', () => {
    const grande = { nome: 'cortica', x: 0, y: 0, meta: { w: 44, h: 30, zona: 'parede' } };
    const postit = { nome: 'postit', x: 0, y: 0, meta: { w: 10, h: 11, zona: 'parede' } };
    expect(ordemDeDesenho([postit, grande]).map((o) => o.nome)).toEqual(['cortica', 'postit']);
  });
});

describe('livros: girar e empilhar', () => {
  const deitado = OBJETOS['livro-azul-deitado'];

  it('cada livro gira entre em pé e deitado (largura e altura trocadas)', () => {
    expect(podeDeitar('livro-azul')).toBe(true);
    expect(podeDeitar('caneca')).toBe(false);
    expect(metaDe('livro-azul', true)).toEqual(deitado);
    expect(deitado.w).toBe(OBJETOS['livro-azul'].h);
  });

  it('um livro solto logo acima de outro, na mesma fileira da mesa, fica empilhado', () => {
    const pos = { 'livro-azul': { x: 100, sobre: 'mesa', chao: 150, deitado: true } };
    const cena = resolverCena(['livro-azul'], pos);
    const base = achar(cena, 'livro-azul');
    const r = pousar('livro-rosa', true, 101, base.y - 6, cena);
    expect(r.entrada).toEqual({ x: 101, sobre: 'livro-azul', deitado: true });
    expect(r.y).toBe(base.y - OBJETOS['livro-rosa-deitado'].h + 1);
    // bem mais para o fundo da mesa: é outra fileira, fica na mesa
    expect(pousar('livro-rosa', true, 101, 125, cena).entrada.sobre).toBe('mesa');
  });

  it('pilha na estante: cai sobre o livro mais alto debaixo dele', () => {
    const cena = resolverCena(['livro-amarelo', 'livro-azul'], {});
    const amarelo = achar(cena, 'livro-amarelo');
    const r = pousar('livro-menta', true, amarelo.x - 2, 0, cena);
    expect(r.entrada.sobre).toBe('livro-amarelo');
  });

  it('tirar um livro do meio faz os de cima descerem', () => {
    const pos = {
      'livro-azul': { x: 100, sobre: 'mesa', chao: 150, deitado: true },
      'livro-rosa': { x: 100, sobre: 'livro-azul', deitado: true },
      'livro-menta': { x: 101, sobre: 'livro-rosa', deitado: true },
    };
    const antes = resolverCena(Object.keys(pos), pos);
    expect(achar(antes, 'livro-menta').nivel).toBe(2);
    expect(estaEmPilha(achar(antes, 'livro-rosa'), antes)).toBe(true);

    const depois = soltarDependentes(pos, 'livro-rosa');
    expect(depois['livro-menta']).toEqual({ x: 101, sobre: 'livro-azul', deitado: true });
    const semRosa = resolverCena(['livro-azul', 'livro-menta'], depois);
    expect(achar(semRosa, 'livro-menta').nivel).toBe(1);

    // tirando o de baixo, o resto vai para a mesa na mesma fileira
    const semBase = soltarDependentes(pos, 'livro-azul');
    expect(semBase['livro-rosa']).toEqual({ x: 100, sobre: 'mesa', chao: 150, deitado: true });
  });
});
