import { describe, expect, it } from 'vitest';
import { CAIXA, CICLO, FATOR, MODIFICADORES, aplicarModificador, avancarCiclo, caixaInicial, chanceDeUrgente, cicloInicial, crescerCaixa, pedidosParaCrescer, precoNoExpediente, sortearModificador, tamanhoDoCiclo } from './modificadores.js';
import { chegarAgora } from '../state/testeAjuda.js';
import { VIDAS_INFINITO, estadoInicial, podeAceitar, reducer, sortearUrgente } from '../state/reducer.js';

const infinito = (semente = 0.5) => reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito', semente });
const comMod = (s, mod) => ({ ...s, sessao: { ...s.sessao, ciclo: { n: 2, mod, faltam: 3, total: 3 } } });
const abertos = (s) => s.sessao.pedidos.filter((p) => !p.urgente && ['novo', 'aceito'].includes(p.status));
const recusarPrimeiro = (s, sorteio = 0.5) => chegarAgora(reducer(s, { type: 'RECUSAR', id: abertos(s)[0].id, sorteio }));

describe('ciclos do expediente', () => {
  it('cada ciclo dura de 3 a 5 pedidos', () => {
    const tamanhos = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.999].map(tamanhoDoCiclo));
    expect([...tamanhos].sort()).toEqual([3, 4, 5]);
    expect(Math.min(...tamanhos)).toBe(CICLO.min);
  });

  it('o primeiro ciclo é normal; ao fechar, o próximo sorteia um modificador diferente do anterior', () => {
    const c = cicloInicial(0);
    expect(c).toEqual({ n: 1, mod: null, faltam: 3, total: 3 });
    expect(avancarCiclo(c, 2)).toMatchObject({ n: 1, faltam: 1 });
    const novo = avancarCiclo(c, 3, 0.1);
    expect(novo.n).toBe(2);
    expect(novo.mod).not.toBeNull();
    for (let i = 0; i < 20; i++) expect(sortearModificador(i / 20, novo.mod, { temCafeteira: true })).not.toBe(novo.mod);
  });

  it('café grátis só sai para quem tem a cafeteira', () => {
    const sorteados = new Set(Array.from({ length: 50 }, (_, i) => sortearModificador(i / 50, null)));
    expect(sorteados.has('cafe')).toBe(false);
    expect(sorteados.size).toBe(MODIFICADORES.length - 1);
  });

  it('a partida infinita começa no ciclo 1 e cada pedido terminado conta', () => {
    let s = infinito(0);
    expect(s.sessao.ciclo).toEqual({ n: 1, mod: null, faltam: 3, total: 3 });
    s = recusarPrimeiro(s);
    expect(s.sessao.ciclo.faltam).toBe(2);
    s = recusarPrimeiro(recusarPrimeiro(s));
    expect(s.sessao.ciclo.n).toBe(2);
    expect(s.sessao.ciclo.mod).not.toBeNull();
  });

  it('a campanha não tem ciclos', () => {
    expect(reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.3 }).sessao.ciclo).toBeUndefined();
  });
});

describe('efeito de cada modificador', () => {
  const chega = (mod) => recusarPrimeiro(comMod(infinito(), mod)).sessao.pedidos.at(-1);
  const normal = chega(null);

  const base = { tempo: 200, tempoRestante: 200, paciencia: 100, pacienciaTotal: 100, recompensa: 100 };
  const sessaoCom = (mod) => ({ modo: 'infinito', ciclo: { mod } });

  it('cliente impaciente: prazo 30% menor nos pedidos que chegam', () => {
    expect(aplicarModificador(sessaoCom('impaciente'), base)).toMatchObject({ tempo: 140, tempoRestante: 140, mod: 'impaciente' });
    expect(chega('impaciente').mod).toBe('impaciente');
  });

  it('cliente generoso: pagam 50% a mais', () => {
    expect(aplicarModificador(sessaoCom('generoso'), base)).toMatchObject({ recompensa: 150, mod: 'generoso' });
    expect(chega('generoso').mod).toBe('generoso');
  });

  it('modificadores sem efeito no pedido (e a campanha) não mexem nele', () => {
    expect(aplicarModificador(sessaoCom('auditoria'), base)).toBe(base);
    expect(aplicarModificador({ modo: 'campanha', ciclo: { mod: 'generoso' } }, base)).toBe(base);
  });

  it('hora tranquila: sem urgentes e mais paciência', () => {
    const s = comMod(infinito(), 'tranquila');
    expect(sortearUrgente(s.sessao, 60, 0)).toBeNull();
    expect(sortearUrgente(infinito().sessao, 60, 0)).not.toBeNull();
    expect(chega('tranquila').pacienciaTotal).toBe(Math.round(normal.pacienciaTotal * FATOR.tranquila));
  });

  it('sobrecarga: a caixa passa a ter 3 pedidos em aberto', () => {
    const s = recusarPrimeiro(comMod(infinito(), 'sobrecarga'));
    expect(abertos(s)).toHaveLength(CAIXA.inicial + CAIXA.sobrecarga);
    expect(abertos(recusarPrimeiro(infinito()))).toHaveLength(2);
  });

  it('semana de auditoria: entrega abaixo de 70% custa um coração', () => {
    const entregar = (s, nota) => {
      const id = abertos(s)[0].id;
      s = reducer(s, { type: 'ACEITAR', id });
      return reducer(s, { type: 'ENTREGAR', id, nota, valor: 10, erros: {} });
    };
    const s = comMod(infinito(), 'auditoria');
    expect(entregar(s, 60).sessao.vidas).toBe(VIDAS_INFINITO - 1);
    expect(entregar(s, 80).sessao.vidas).toBe(VIDAS_INFINITO);
    expect(entregar(infinito(), 60).sessao.vidas).toBe(VIDAS_INFINITO);
  });

  it('orçamento apertado: dicas, lojinha e cápsulas mais caras', () => {
    const s = comMod(infinito(), 'apertado');
    expect(precoNoExpediente(100, s.sessao)).toBe(150);
    expect(precoNoExpediente(100, infinito().sessao)).toBe(100);
    const comCafeteira = { ...s, dinheiro: 1000, loja: { ...s.loja, possui: [...s.loja.possui, 'obj-cafeteira'] } };
    const depois = reducer(comCafeteira, { type: 'COMPRAR_CAPSULA', tipo: 'normal' });
    expect(1000 - depois.dinheiro).toBe(Math.round(125 * FATOR.apertado));
  });

  it('café grátis: fazer café não gasta a cápsula', () => {
    let s = comMod(infinito(), 'cafe');
    s = { ...s, loja: { ...s.loja, possui: [...s.loja.possui, 'obj-cafeteira'], moveis: [...s.loja.moveis, 'obj-cafeteira'] } };
    // caneca encaixada na cafeteira
    s = { ...s, escritorio: { ...s.escritorio, posicoes: { ...s.escritorio.posicoes, caneca: { sobre: 'cafeteira' } } } };
    const depois = reducer(s, { type: 'FAZER_CAFE', tipo: 'forte', sorteio: 0 });
    expect(depois.cafe.preparando?.tipo).toBe('forte');
    expect(depois.cafe.capsulas.forte ?? 0).toBe(s.cafe.capsulas.forte ?? 0);
  });

});

describe('escalada do modo infinito', () => {
  it('a caixa começa com 2 e cresce 1 a cada 5 a 10 pedidos terminados, até 6', () => {
    const tamanhos = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.999].map(pedidosParaCrescer));
    expect(Math.min(...tamanhos)).toBe(5);
    expect(Math.max(...tamanhos)).toBe(10);
    let c = caixaInicial(0); // 5 pedidos
    expect(c).toEqual({ tam: 2, faltam: 5 });
    c = crescerCaixa(c, 4);
    expect(c.tam).toBe(2);
    c = crescerCaixa(c, 1, 0.999); // cresce; o próximo leva 10
    expect(c).toEqual({ tam: 3, faltam: 10 });
    for (let i = 0; i < 100; i++) c = crescerCaixa(c, 1);
    expect(c.tam).toBe(CAIXA.max);
  });

  it('na partida, terminar pedidos faz a caixa crescer e chegar mais pedidos', () => {
    let s = infinito();
    expect(s.sessao.caixa.tam).toBe(2);
    const faltam = s.sessao.caixa.faltam;
    for (let i = 0; i < faltam; i++) s = recusarPrimeiro(s);
    expect(s.sessao.caixa.tam).toBe(3);
    // o modificador "sobrecarga" pode estar valendo (+1); sem ele, a caixa tem o tamanho da escalada
    const extra = s.sessao.ciclo.mod === 'sobrecarga' ? CAIXA.sobrecarga : 0;
    expect(abertos(s)).toHaveLength(3 + extra);
  });

  it('a chance de urgente sobe a cada ciclo, de 1/5 até 1/3 (a campanha fica em 1/5)', () => {
    const comCiclo = (n) => ({ modo: 'infinito', ciclo: { n } });
    expect(chanceDeUrgente(comCiclo(1), 0.2)).toBeCloseTo(1 / 5);
    expect(chanceDeUrgente(comCiclo(3), 0.2)).toBeGreaterThan(chanceDeUrgente(comCiclo(2), 0.2));
    expect(chanceDeUrgente(comCiclo(6), 0.2)).toBeCloseTo(1 / 3);
    expect(chanceDeUrgente(comCiclo(50), 0.2)).toBeCloseTo(1 / 3);
    expect(chanceDeUrgente({ modo: 'campanha' }, 0.2)).toBe(0.2);
    // sorteio de 0,25: no ciclo 1 não chega (≥ 1/5); no ciclo 6, chega
    const s = infinito().sessao;
    expect(sortearUrgente({ ...s, ciclo: { ...s.ciclo, n: 1 } }, 60, 0.25)).toBeNull();
    expect(sortearUrgente({ ...s, ciclo: { ...s.ciclo, n: 6 } }, 60, 0.25)).not.toBeNull();
  });

  it('urgentes não contam na caixa nem no limite de aceitos, e sempre podem ser aceitos', () => {
    let s = infinito();
    const base = s.sessao.pedidos[0];
    const normais = [1, 2, 3].map((i) => ({ ...base, id: `n${i}`, status: 'aceito' }));
    const urgente = { ...base, id: 'u1', status: 'novo', urgente: true };
    s = { ...s, sessao: { ...s.sessao, pedidos: [...normais, urgente] } };
    expect(podeAceitar(s.sessao, { ...base, status: 'novo' })).toBe(false);
    expect(podeAceitar(s.sessao, urgente)).toBe(true);
    s = reducer(s, { type: 'ACEITAR', id: 'u1' });
    expect(s.sessao.pedidos.find((p) => p.id === 'u1').status).toBe('aceito');
    expect(abertos(s)).toHaveLength(3); // o urgente não ocupa lugar na caixa
  });
});
