import { describe, expect, it } from 'vitest';
import { PASSO_ENTREGAR, TREINOS, criarPedidoDeTreino, passoDoTreino } from './treino.js';
import { modeloPorId } from './pedidos.js';
import { avaliar } from '../lib/avaliacao.js';
import { desempenhoDoDia, estadoInicial, reducer, temRelogio } from '../state/reducer.js';

const vazio = { nodes: [], edges: [] };
const iniciar = (modo = 'campanha') => reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo, dia: 1, semente: 0.3, sorteio: 0.5, tutorial: true });

describe('pedidos de treino', () => {
  it.each(TREINOS.map((t) => [t.id, t]))('%s: o gabarito completa todos os passos e tira 100%%', (_, t) => {
    expect(passoDoTreino(t, t.esperado, t.secao).texto).toBe(PASSO_ENTREGAR.texto);
    expect(avaliar(t.esperado, t.esperado).nota).toBe(100);
    expect(modeloPorId(t.id)).toBe(t);
  });

  it('começa no primeiro passo e pede a aba certa quando está em outra', () => {
    const t = TREINOS.find((x) => x.secao === 'classes');
    expect(passoDoTreino(t, vazio, 'classes')).toMatchObject({ n: 1, total: t.passos.length + 1, alvo: { paleta: 'classe' } });
    expect(passoDoTreino(t, vazio, 'casos').alvo).toEqual({ secao: 'classes' });
  });

  it('o passo volta se o jogador desfaz o que fez', () => {
    const t = TREINOS[0];
    const sistema = { nodes: [{ id: 'x', tipo: 'sistema', rotulo: 'Biblioteca', x: 0, y: 0, w: 320, h: 220 }], edges: [] };
    expect(passoDoTreino(t, sistema, t.secao).n).toBe(3);
    expect(passoDoTreino(t, vazio, t.secao).n).toBe(1);
  });

  it('o sorteio escolhe um dos três tipos', () => {
    expect(TREINOS.map((t) => t.secao).sort()).toEqual(['casos', 'classes', 'estados']);
    expect(criarPedidoDeTreino(0).modelo).toBe(TREINOS[0].id);
    expect(criarPedidoDeTreino(0.99).modelo).toBe(TREINOS[2].id);
  });
});

describe('treino no tutorial', () => {
  it('"Vamos nessa!" põe o treino aceito no editor, com o relógio parado e os pedidos ainda esperando', () => {
    const s = reducer(iniciar(), { type: 'CONCLUIR_TUTORIAL', treino: true, sorteio: 0.5 });
    expect(s.tutorial.visto).toBe(true);
    expect(s.sessao.pedidos).toHaveLength(1);
    expect(s.sessao.pedidos[0]).toMatchObject({ treino: true, status: 'aceito' });
    expect(s.sessao.ativo).toBe(s.sessao.pedidos[0].id);
    expect(s.sessao.esperaTutorial).toHaveLength(1);
    expect(temRelogio(s.sessao)).toBe(false);
  });

  it('entregar o treino paga pouco, some da sessão (não entra na média) e libera os pedidos', () => {
    const antes = reducer(iniciar(), { type: 'CONCLUIR_TUTORIAL', treino: true, sorteio: 0 });
    const id = antes.sessao.ativo;
    const s = reducer(antes, { type: 'ENTREGAR', id, nota: 100, valor: 50, diagrama: vazio });
    expect(s.dinheiro).toBe(antes.dinheiro + 50);
    expect(s.sessao.pedidos.some((p) => p.treino)).toBe(false);
    expect(s.sessao.pedidos).toEqual(antes.sessao.esperaTutorial);
    expect(s.sessao.esperaTutorial).toBeUndefined();
    expect(s.estatisticas.entregues).toBe(antes.estatisticas.entregues);
    expect(s.colecao).toEqual(antes.colecao);
    expect(s.conquistas).toEqual(antes.conquistas);
    expect(desempenhoDoDia(s.sessao.pedidos)).toBe(0);
    expect(temRelogio(s.sessao)).toBe(true);
  });

  it('pular o treino (ou recusar) não paga nem cobra multa', () => {
    const antes = reducer(iniciar('infinito'), { type: 'CONCLUIR_TUTORIAL', treino: true, sorteio: 0 });
    for (const acao of [{ type: 'PULAR_TREINO' }, { type: 'RECUSAR', id: antes.sessao.ativo }]) {
      const s = reducer(antes, acao);
      expect(s.dinheiro).toBe(antes.dinheiro);
      expect(s.sessao.pedidos).toHaveLength(2);
      expect(s.sessao.pedidos.some((p) => p.treino)).toBe(false);
    }
  });

  it('"Pular" no tutorial do computador pula o treino também', () => {
    const s = reducer(iniciar(), { type: 'CONCLUIR_TUTORIAL' });
    expect(s.sessao.pedidos.some((p) => p.treino)).toBe(false);
    expect(s.sessao.pedidos).toHaveLength(1);
  });
});
