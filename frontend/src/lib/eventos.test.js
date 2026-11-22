import { describe, expect, it } from 'vitest';
import { CHANCE_DERRAMAR_CAMPANHA, EVENTOS, SORTEIO_EVENTO, derramouCafe, janelasDaPane, quedaDeEnergia, resolverEvento, sortearEvento, tempoDeLimpeza } from './eventos.js';
import { motivoSemCafe } from '../data/cafe.js';
import { estadoInicial, reducer } from '../state/reducer.js';

const infinito = () => reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito', semente: 0.5 });
const comSessao = (s, extra) => ({ ...s, sessao: { ...s.sessao, ...extra } });
const tick = (s, extra = {}) => reducer(s, { type: 'TICK', ...extra });
// relógio no segundo antes do sorteio de evento (o TICK soma 1)
const antesDoSorteio = (s) => comSessao(s, { segundos: 2 * SORTEIO_EVENTO.intervalo + SORTEIO_EVENTO.deslocamento - 1 });

describe('eventos aleatórios do modo infinito', () => {
  it('sorteio: só no infinito, na hora certa, depois do começo e com a chance', () => {
    const s = { modo: 'infinito', segundos: 150 };
    expect(sortearEvento(s, 0)).toEqual({ tipo: 'pane' });
    expect(sortearEvento(s, SORTEIO_EVENTO.chance * 0.75)).toEqual({ tipo: 'energia' });
    expect(sortearEvento(s, SORTEIO_EVENTO.chance)).toBeNull();
    expect(sortearEvento({ ...s, segundos: 151 }, 0)).toBeNull();
    expect(sortearEvento({ ...s, segundos: 30 }, 0)).toBeNull(); // cedo demais
    // campanha: os mesmos eventos, com chance menor (e nunca no tutorial ou com o dia encerrado)
    expect(sortearEvento({ ...s, modo: 'campanha' }, SORTEIO_EVENTO.chanceCampanha * 0.25)).toEqual({ tipo: 'pane' });
    expect(sortearEvento({ ...s, modo: 'campanha' }, SORTEIO_EVENTO.chanceCampanha * 0.75)).toEqual({ tipo: 'energia' });
    expect(sortearEvento({ ...s, modo: 'campanha' }, SORTEIO_EVENTO.chanceCampanha)).toBeNull();
    expect(SORTEIO_EVENTO.chanceCampanha).toBeLessThan(SORTEIO_EVENTO.chance);
    expect(sortearEvento({ ...s, esperaTutorial: [] }, 0)).toBeNull();
    expect(sortearEvento({ ...s, bloqueio: { falta: 3 } }, 0)).toBeNull();
  });

  it('o TICK abre o evento e, com ele aberto, o relógio para', () => {
    let s = tick(antesDoSorteio(infinito()), { sorteioEvento: 0 });
    expect(s.sessao.evento).toEqual({ tipo: 'pane' });
    const seg = s.sessao.segundos;
    s = tick(s);
    expect(s.sessao.segundos).toBe(seg);
  });

  it('queda de energia: sem janela, vira direto o contratempo com o preço do gerador sorteado', () => {
    expect(quedaDeEnergia(0).preco).toBe(150);
    expect(quedaDeEnergia(0.5).preco).toBe(180);
    expect(quedaDeEnergia(0.999).preco).toBe(200);
    const s = tick(antesDoSorteio(infinito()), { sorteioEvento: SORTEIO_EVENTO.chance * 0.75 });
    expect(s.sessao.evento).toBeFalsy();
    expect(s.sessao.bloqueio).toMatchObject({ tipo: 'energia', falta: EVENTOS.energia.bloqueio });
    expect(EVENTOS.energia.precos).toContain(s.sessao.bloqueio.preco);
    expect(resolverEvento('energia', 'pagar')).toBeNull();
  });

  it('esperar deixa um contratempo que conta os segundos de jogo e some', () => {
    let s = comSessao(infinito(), { bloqueio: quedaDeEnergia(0) });
    const pac = s.sessao.pedidos[0].paciencia;
    s = tick(s);
    expect(s.sessao.bloqueio.falta).toBe(EVENTOS.energia.bloqueio - 1);
    expect(s.sessao.pedidos[0].paciencia).toBe(pac - 1); // o tempo corre
    for (let i = 0; i < EVENTOS.energia.bloqueio; i++) s = tick(s);
    expect(s.sessao.bloqueio).toBeNull();
  });

  it('ligar o gerador faz a energia voltar na hora e desconta o preço (precisa ter o dinheiro)', () => {
    const s = { ...comSessao(infinito(), { bloqueio: quedaDeEnergia(0.4) }), dinheiro: 500 };
    const pago = reducer(s, { type: 'LIGAR_GERADOR' });
    expect(pago.dinheiro).toBe(500 - 170);
    expect(pago.sessao.bloqueio).toBeNull();
    expect(pago.estatisticas.gastos.eventos).toBe(170);
    expect(reducer({ ...s, dinheiro: 10 }, { type: 'LIGAR_GERADOR' })).toEqual({ ...s, dinheiro: 10 });
  });

  it('pane: só o minijogo; consertar não custa nada e falhar deixa o computador parado', () => {
    expect(resolverEvento('pane', 'consertou')).toEqual({ custo: 0, bloqueio: 0 });
    expect(resolverEvento('pane', 'falhou')).toEqual({ custo: 0, bloqueio: EVENTOS.pane.falhou });
    expect(resolverEvento('pane', 'esperar')).toBeNull();
    expect(resolverEvento('pane', 'pagar')).toBeNull();
    expect(EVENTOS.pane.tempoMinijogo).toBe(5);
    expect([0, 0.34, 0.67, 0.999].map(janelasDaPane)).toEqual([6, 7, 8, 8]);
  });

  it('café derramado: só ao fazer café no infinito; a cápsula se perde, fica a poça e o computador espera a limpeza', () => {
    expect(tempoDeLimpeza(0)).toBe(5);
    expect(tempoDeLimpeza(0.5)).toBe(6);
    expect(tempoDeLimpeza(1)).toBe(7);
    expect(derramouCafe({ modo: 'infinito' }, 0.05)).toBe(true);
    expect(derramouCafe({ modo: 'infinito', cafeDerramado: true }, 0.05)).toBe(false);
    expect(derramouCafe({ modo: 'infinito' }, 0.5)).toBe(false);
    expect(derramouCafe({ modo: 'campanha' }, CHANCE_DERRAMAR_CAMPANHA - 0.01)).toBe(true);
    expect(derramouCafe({ modo: 'campanha' }, CHANCE_DERRAMAR_CAMPANHA + 0.01)).toBe(false);
    let s = infinito();
    s = {
      ...s,
      loja: { ...s.loja, possui: [...s.loja.possui, 'obj-cafeteira'], moveis: [...s.loja.moveis, 'obj-cafeteira'] },
      escritorio: { ...s.escritorio, posicoes: { ...s.escritorio.posicoes, caneca: { sobre: 'cafeteira' } } },
      cafe: { ...s.cafe, capsulas: { normal: 2 } },
    };
    const derramou = reducer(s, { type: 'FAZER_CAFE', tipo: 'normal', sorteio: 0, derrame: 0 });
    expect(derramou.sessao.cafeDerramado).toBe(true);
    expect(derramou.sessao.evento).toBeFalsy(); // sem janela
    expect(motivoSemCafe(derramou, 'normal')).toBe('Limpe o café derramado primeiro.');
    const segundos = derramou.sessao.segundos;
    expect(tick(derramou).sessao.segundos).toBe(segundos + 1); // o relógio não para
    expect(reducer(derramou, { type: 'LIMPAR_CAFE' }).sessao.cafeDerramado).toBe(false);
    expect(derramou.cafe.capsulas.normal).toBe(1);
    expect(derramou.cafe.preparando).toBeFalsy();
    const fez = reducer(s, { type: 'FAZER_CAFE', tipo: 'normal', sorteio: 0, derrame: 0.9 });
    expect(fez.sessao.cafeDerramado).toBeFalsy();
    expect(fez.cafe.preparando?.tipo).toBe('normal');
  });
});
