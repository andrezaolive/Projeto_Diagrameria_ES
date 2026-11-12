import { describe, expect, it } from 'vitest';
import { FAIXAS_JOGO, faixaInicial, faixasDoJogador, sortearFaixa, temTocaFitas } from './musicas.js';

describe('músicas do jogo', () => {
  it('Game 1 vem de graça; as outras custam de 100 a 200', () => {
    expect(FAIXAS_JOGO.map((f) => f.nome)).toEqual(['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Menu']);
    expect(FAIXAS_JOGO[0].preco).toBe(0);
    for (const f of FAIXAS_JOGO.slice(1)) expect(f.preco).toBeGreaterThanOrEqual(100), expect(f.preco).toBeLessThanOrEqual(200);
    for (const f of FAIXAS_JOGO) expect(f.loop).toBeGreaterThan(30);
  });

  it('o jogador só tem as de graça e as compradas', () => {
    expect(faixasDoJogador([]).map((f) => f.id)).toEqual(['musica-game-1']);
    expect(faixasDoJogador(['musica-game-3']).map((f) => f.id)).toEqual(['musica-game-1', 'musica-game-3']);
  });

  it('sorteio só entre as do jogador e sem repetir a atual', () => {
    expect(sortearFaixa([], () => 0.9)).toBe('musica-game-1');
    const possui = ['musica-game-2'];
    expect(sortearFaixa(possui, () => 0, 'musica-game-1')).toBe('musica-game-2');
  });

  it('a escolhida no toca-fitas só vale com o toca-fitas comprado', () => {
    const loja = { possui: ['musica-game-2'], musica: 'musica-game-2' };
    expect(temTocaFitas(loja.possui)).toBe(false);
    expect(faixaInicial(loja, () => 0)).toBe('musica-game-1'); // sorteada (sem toca-fitas)
    expect(faixaInicial({ ...loja, possui: [...loja.possui, 'obj-radio'] }, () => 0)).toBe('musica-game-2');
    // escolhida mas não comprada: sorteia
    expect(faixaInicial({ possui: ['obj-radio'], musica: 'musica-game-3' }, () => 0)).toBe('musica-game-1');
  });
});

describe('escolher música no toca-fitas (reducer)', () => {
  it('só com o toca-fitas, e só músicas do jogador ou aleatória', async () => {
    const { estadoInicial, reducer } = await import('../state/reducer.js');
    let s = estadoInicial();
    expect(s.loja.musica).toBeNull();
    s = reducer(s, { type: 'ESCOLHER_MUSICA', id: 'musica-game-1' });
    expect(s.loja.musica).toBeNull(); // sem toca-fitas
    s = { ...s, dinheiro: 500, loja: { ...s.loja, possui: [...s.loja.possui, 'obj-radio'] } };
    s = reducer(s, { type: 'ESCOLHER_MUSICA', id: 'musica-game-2' });
    expect(s.loja.musica).toBeNull(); // não comprou
    s = reducer(s, { type: 'COMPRAR', id: 'musica-game-2', preco: 150 });
    s = reducer(s, { type: 'ESCOLHER_MUSICA', id: 'musica-game-2' });
    expect(s.loja.musica).toBe('musica-game-2');
    s = reducer(s, { type: 'ESCOLHER_MUSICA', id: 'aleatoria' });
    expect(s.loja.musica).toBe('aleatoria');
  });
});
