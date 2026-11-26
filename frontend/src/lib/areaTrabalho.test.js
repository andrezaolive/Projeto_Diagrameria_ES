import { describe, expect, it } from 'vitest';
import { GRADE, celulaDoPonto, pixelDaCelula, posicoesPadrao, resolverPosicoes, soltarEm } from './areaTrabalho.js';

const IDS = ['editor', 'email', 'dicas', 'loja', 'guia', 'escritorio'];

describe('ícones da área de trabalho', () => {
  it('o grid cabe no palco, acima da barra de tarefas (52px)', () => {
    const fim = pixelDaCelula({ col: GRADE.colunas - 1, lin: GRADE.linhas - 1 });
    expect(fim.x + GRADE.w).toBeLessThanOrEqual(1280);
    expect(fim.y + GRADE.h).toBeLessThanOrEqual(720 - 52);
  });

  it('soltar fora da tela fica na borda do grid', () => {
    expect(celulaDoPonto(-500, -500)).toEqual({ col: 0, lin: 0 });
    expect(celulaDoPonto(5000, 5000)).toEqual({ col: GRADE.colunas - 1, lin: GRADE.linhas - 1 });
    expect(celulaDoPonto(16 + 132 * 3 + 10, 16 + 124 * 2 + 10)).toEqual({ col: 3, lin: 2 });
  });

  it('padrão: principais em coluna (o escritório no lugar do guia) e o guia sozinho no canto superior direito', () => {
    const p = posicoesPadrao(IDS);
    expect(p.editor).toEqual({ col: 0, lin: 0 });
    expect(p.loja).toEqual({ col: 0, lin: 3 });
    expect(p.escritorio).toEqual({ col: 0, lin: 4 });
    expect(p.guia).toEqual({ col: GRADE.colunas - 1, lin: 0 });
    // sem fixos: tudo em coluna, e o 6º passa para a coluna seguinte
    expect(posicoesPadrao(IDS, {}).escritorio).toEqual({ col: 1, lin: 0 });
  });

  it('célula livre: fica nela; ocupada: vai para a vaga mais próxima', () => {
    const p = posicoesPadrao(IDS);
    expect(soltarEm(p, 'email', { col: 5, lin: 3 })).toEqual({ col: 5, lin: 3 });
    // em cima do editor (0,0): a vaga mais perto é (1,1) ou similar, nunca uma ocupada
    const nova = soltarEm(p, 'loja', { col: 0, lin: 0 });
    expect(Object.entries(p).some(([id, c]) => id !== 'loja' && c.col === nova.col && c.lin === nova.lin)).toBe(false);
    expect(Math.max(Math.abs(nova.col), Math.abs(nova.lin))).toBeLessThanOrEqual(2);
  });

  it('sem vaga por perto, vai para uma lateral', () => {
    // enche tudo em volta de (4,2), menos uma vaga na última coluna
    const p = {};
    let n = 0;
    for (let col = 0; col < GRADE.colunas; col++)
      for (let lin = 0; lin < GRADE.linhas; lin++) if (!(col === GRADE.colunas - 1 && lin === 4)) p[`i${n++}`] = { col, lin };
    p.movido = { col: 99, lin: 99 }; // o que está sendo solto (sem lugar ainda)
    delete p.i0; // libera (0,0): longe do alvo, mas na lateral esquerda
    const r = soltarEm(p, 'movido', { col: 4, lin: 2 });
    expect([0, GRADE.colunas - 1]).toContain(r.col);
  });

  it('save antigo ou repetido é consertado sem sobrepor', () => {
    const r = resolverPosicoes(IDS, { email: { col: 0, lin: 0 }, editor: { col: 0, lin: 0 }, guia: { col: 40, lin: 1 } });
    const vistos = new Set(Object.values(r).map((c) => `${c.col},${c.lin}`));
    expect(vistos.size).toBe(IDS.length);
    for (const c of Object.values(r)) expect(c.col).toBeLessThan(GRADE.colunas);
  });
});
