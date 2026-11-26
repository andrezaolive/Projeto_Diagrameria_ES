import { describe, expect, it } from 'vitest';
import { SALA } from '../art/layout.js';
import OBJETOS from '../art/objetos.json';
import { CENARIOS, entradaNaSala, posicaoPadrao, pousar, resolverCena, salaDe } from './decoracao.js';
import { ITENS_LOJA, OBJETOS_BASE } from '../data/loja.js';
import { estadoInicial, reducer } from '../state/reducer.js';

const DA_SALA = ['boneco-mascote', 'globo', 'discos', 'planta-sala', 'porta-retrato', 'vaso-flor'];
const A_VENDA = ['boneco-mascote', 'globo', 'discos', 'planta-sala', 'vaso-flor'];
const cenaSala = (posicoes = {}, nomes = DA_SALA) => resolverCena(nomes.filter((n) => salaDe(n, posicoes) === 'sala'), posicoes, CENARIOS.sala);

describe('sala de exposição', () => {
  it('os objetos da sala nascem lá, cada um numa prateleira; só o porta-retrato vem de graça', () => {
    expect(OBJETOS_BASE).toContain('porta-retrato');
    expect(OBJETOS.foto ?? OBJETOS['porta-retrato'].foto).toMatchObject({ w: 16, h: 16 });
    for (const n of A_VENDA) {
      expect(OBJETOS_BASE).not.toContain(n);
      const item = ITENS_LOJA.find((i) => i.objeto === n);
      expect(item, n).toMatchObject({ categoria: 'sala' });
      expect(item.preco).toBeGreaterThan(0);
    }
    for (const n of DA_SALA) {
      expect(salaDe(n, {})).toBe('sala');
      expect(SALA.prateleiras[posicaoPadrao(n).sobre], n).toBeTruthy();
    }
    // os do escritório continuam lá
    expect(salaDe('caneca', {})).toBe('escritorio');
    expect(salaDe('postit-azul', {})).toBe('escritorio');
  });

  it('na sala, objeto de mesa cai na prateleira que está debaixo de onde foi solto', () => {
    const cena = cenaSala();
    const m = OBJETOS.caneca;
    const p1 = SALA.prateleiras.p1;
    const r = pousar('caneca', false, p1.x + 40, p1.y - m.h - 20, cena, CENARIOS.sala);
    expect(r.entrada).toMatchObject({ sala: 'sala', sobre: 'p1' });
    expect(r.y).toBe(p1.y - m.h);
    // solto no meio do nada, à esquerda: cai na prateleira do chão
    const chao = pousar('caneca', false, 60, 140, cena, CENARIOS.sala);
    expect(chao.entrada.sobre).toBe('p-baixo');
  });

  it('dentro do armário: as prateleiras de dentro valem como superfície', () => {
    const p = SALA.prateleiras['armario-baixo'];
    const r = pousar('caneca', false, p.x + 60, p.y - 20, cenaSala(), CENARIOS.sala);
    expect(r.entrada.sobre).toBe('armario-baixo');
  });

  it('empilha em cima do que é empilhável (os discos) e herda a sala', () => {
    const cena = cenaSala();
    const discos = cena.find((o) => o.nome === 'discos');
    const r = pousar('caneca', false, discos.x + 4, discos.y - OBJETOS.caneca.h - 2, cena, CENARIOS.sala);
    expect(r.entrada.sobre).toBe('discos');
    expect(salaDe('caneca', { caneca: r.entrada })).toBe('sala');
  });

  it('objeto de parede vai em qualquer lugar acima do chão (inclusive no quadro de broches)', () => {
    const q = SALA.quadro;
    const r = pousar('postit-amarelo', false, q.x + 20, q.y + 40, cenaSala(), CENARIOS.sala);
    expect(r.entrada).toEqual({ sala: 'sala', x: q.x + 20, y: q.y + 40 });
    expect(pousar('postit-amarelo', false, 10, 500, cenaSala(), CENARIOS.sala).y).toBeLessThanOrEqual(SALA.chao - OBJETOS['postit-amarelo'].h);
  });

  it('soltar na seta: leva para a outra sala; o que está dentro do pote vai junto', () => {
    expect(entradaNaSala('caneca', 'sala')).toMatchObject({ sala: 'sala', sobre: 'p-baixo' });
    expect(entradaNaSala('postit-rosa', 'sala').sala).toBe('sala');
    // de volta ao escritório: o lugar de sempre
    expect(entradaNaSala('caneca', 'escritorio')).toEqual(posicaoPadrao('caneca'));
    expect(entradaNaSala('globo', 'escritorio')).toMatchObject({ sobre: 'mesa' });
    // caneta dentro do pote: segue o pote para a sala
    let s = estadoInicial();
    s = reducer(s, { type: 'MOVER_OBJETO', objeto: 'pote-canetas', posicao: entradaNaSala('pote-canetas', 'sala') });
    const caneta = Object.keys(OBJETOS).find((n) => OBJETOS[n].caneta);
    expect(salaDe('pote-canetas', s.escritorio.posicoes)).toBe('sala');
    expect(salaDe(caneta, s.escritorio.posicoes)).toBe('sala');
  });

  it('apoio que sumiu na sala: cai na prateleira do chão', () => {
    const [o] = resolverCena(['caneca'], { caneca: { sala: 'sala', x: 50, sobre: 'nao-existe' } }, CENARIOS.sala);
    expect(o.raiz).toBe('p-baixo');
  });
});
