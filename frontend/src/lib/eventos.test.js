import { describe, expect, it } from 'vitest';
import { CANSACO, CHANCE_DERRAMAR, CHANCE_DERRAMAR_CAMPANHA, EVENTOS, chanceDeDerramar, depoisDoCafe, fatorDaSemana, nivelDoCansaco, sortearCansaco, SORTEIO_EVENTO, derramouCafe, janelasDaPane, quedaDeEnergia, resolverEvento, sortearEvento, tempoDeLimpeza } from './eventos.js';
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


describe('semana e cansaço', () => {
  it('na campanha os eventos ficam mais prováveis ao longo da semana', () => {
    expect(fatorDaSemana({ modo: 'campanha', dia: 1 })).toBe(1); // segunda, dia 1
    expect(fatorDaSemana({ modo: 'campanha', dia: 5 })).toBeCloseTo(1.6); // sexta, dia 5
    expect(fatorDaSemana({ modo: 'campanha', dia: 6 })).toBe(1); // segunda de novo (data 8)
    expect(fatorDaSemana({ modo: 'campanha', dia: 5, fimDeSemana: 6 })).toBeCloseTo(1.6); // sábado = sexta
    expect(fatorDaSemana({ modo: 'infinito' })).toBe(1);
    const s = { modo: 'campanha', segundos: 150 };
    const chance = SORTEIO_EVENTO.chanceCampanha;
    expect(sortearEvento({ ...s, dia: 1 }, chance * 1.2)).toBeNull(); // segunda: não chega
    expect(sortearEvento({ ...s, dia: 5 }, chance * 1.2)).toEqual({ tipo: 'energia' }); // sexta: chega
  });

  it('cansaço: só depois de 5 min, no minuto cheio, com 1/3 de chance e com a cafeteira', () => {
    const s = { modo: 'campanha', dia: 1, segundos: CANSACO.aPartirDe };
    expect(sortearCansaco(s, 0.2, true)).toBe(true);
    expect(sortearCansaco(s, 0.4, true)).toBe(false); // acima de 1/3
    expect(sortearCansaco(s, 0.2, false)).toBe(false); // sem cafeteira não dá para curar
    expect(sortearCansaco({ ...s, segundos: 240 }, 0, true)).toBe(false); // antes dos 5 min
    expect(sortearCansaco({ ...s, segundos: 301 }, 0, true)).toBe(false); // fora do minuto cheio
    expect(sortearCansaco({ ...s, cansaco: { inicio: 0 } }, 0, true)).toBe(false); // já cansado
    expect(sortearCansaco({ ...s, segundos: 360, semCansacoAte: 400 }, 0, true)).toBe(false); // café ainda vale
    expect(sortearCansaco({ ...s, segundos: 420, semCansacoAte: 400 }, 0, true)).toBe(true);
  });

  it('a tela escurece em 34 s; o café tira o cansaço por 1, 2 ou 3 min; cansado derrama mais', () => {
    const s = { modo: 'infinito', segundos: 317, cansaco: { inicio: 300 } };
    expect(nivelDoCansaco(s)).toBeCloseTo(17 / CANSACO.escurecer);
    expect(CANSACO.escurecer).toBe(20);
    expect(nivelDoCansaco({ ...s, segundos: 400 })).toBe(1);
    expect(chanceDeDerramar({ modo: 'infinito' })).toBeCloseTo(CHANCE_DERRAMAR);
    expect(chanceDeDerramar({ ...s, segundos: 400 })).toBeCloseTo(CHANCE_DERRAMAR * 3);
    expect(depoisDoCafe(s, 'descafeinado')).toMatchObject({ cansaco: null, semCansacoAte: 317 + 60 });
    expect(depoisDoCafe(s, 'forte').semCansacoAte).toBe(317 + 180);
    // no jogo: o TICK traz o cansaço e beber café tira
    let st = infinito();
    st = { ...st, loja: { ...st.loja, possui: [...st.loja.possui, 'obj-cafeteira'], moveis: [...st.loja.moveis, 'obj-cafeteira'] } };
    st = comSessao(st, { segundos: CANSACO.aPartirDe - 1, pedidos: st.sessao.pedidos.map((p) => ({ ...p, status: 'aceito' })) });
    st = tick(st, { sorteioCansaco: 0 });
    expect(st.sessao.cansaco).toEqual({ inicio: CANSACO.aPartirDe });
    st = reducer({ ...st, cafe: { ...st.cafe, xicara: 'normal' } }, { type: 'BEBER_CAFE' });
    expect(st.sessao.cansaco).toBeNull();
    expect(st.sessao.semCansacoAte).toBe(CANSACO.aPartirDe + 120);
  });
});

describe('dormir de cansaço', () => {
  const cansadoAoLimite = (st) => comSessao(st, { cansaco: { inicio: (st.sessao.segundos ?? 0) - CANSACO.escurecer + 1 } });

  it('campanha: chegam todos os pedidos do dia mais 1 ou 2 urgentes, todos atrasados; dorme 5 s', () => {
    let st = reducer({ ...estadoInicial(), tutorial: { visto: true } }, { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 12, semente: 0.3 });
    const naFila = st.sessao.fila.length;
    expect(naFila).toBeGreaterThan(0);
    st = comSessao(cansadoAoLimite(comSessao(st, { segundos: 400 })), {});
    st = tick(st, { sorteio: 0.9 }); // 2 urgentes
    const s = st.sessao;
    expect(s.cansaco).toBeNull();
    expect(s.dormindo).toEqual({ falta: CANSACO.sono, total: CANSACO.sono });
    expect(s.fila).toEqual([]);
    expect(s.pedidos).toHaveLength(1 + naFila + 2);
    expect(s.pedidos.filter((p) => p.urgente)).toHaveLength(2);
    expect(s.pedidos.every((p) => p.status === 'aceito' && p.tempoRestante === 0 && p.dormiu)).toBe(true);
    expect(s.acordou.n).toBe(1);
    expect(s.acordou.atrasados).toBe(s.pedidos.length);
    // dormindo, o relógio do jogo não anda; acorda depois de 5 TICKs
    let t = st;
    for (let i = 0; i < CANSACO.sono; i++) {
      expect(t.sessao.segundos).toBe(s.segundos);
      t = tick(t);
    }
    expect(t.sessao.dormindo).toBeNull();
    expect(tick(t).sessao.segundos).toBe(s.segundos + 1);
  });

  it('infinito: os em aberto atrasam, chegam 2 com metade do prazo, perde só 1 coração', () => {
    let st = infinito();
    const antes = st.sessao.pedidos.length;
    st = cansadoAoLimite(comSessao(st, { segundos: 400 }));
    st = tick(st);
    const s = st.sessao;
    expect(s.vidas).toBe(st.sessao.vidas);
    expect(s.vidas).toBe(2);
    expect(s.pedidos).toHaveLength(antes + 2);
    const novos = s.pedidos.slice(antes);
    expect(novos.every((p) => p.status === 'aceito' && p.tempoRestante === Math.ceil(p.tempo / 2))).toBe(true);
    expect(s.pedidos.slice(0, antes).every((p) => p.tempoRestante === 0 && p.dormiu)).toBe(true);
    // entregar atrasado um pedido do sono não tira outro coração
    const p = s.pedidos[0];
    const depois = reducer(st, { type: 'ENTREGAR', id: p.id, nota: 80, valor: 10, atrasado: true, erros: {} });
    expect(depois.sessao.vidas).toBe(2);
  });

  it('não dorme antes da tela ficar preta', () => {
    const st = tick(comSessao(infinito(), { segundos: 400, cansaco: { inicio: 390 } }));
    expect(st.sessao.dormindo).toBeFalsy();
    expect(st.sessao.cansaco).toBeTruthy();
  });
});

describe('raios da queda de energia', () => {
  it('de 3 a 7 raios, com 1 a 3 cliques, pelo menos um em cada sala, dentro da área', () => {
    for (let i = 0; i < 200; i++) {
      const raios = quedaDeEnergia(i / 200).raios;
      expect(raios.length).toBeGreaterThanOrEqual(3);
      expect(raios.length).toBeLessThanOrEqual(7);
      expect(raios.some((r) => r.sala === 'escritorio') && raios.some((r) => r.sala === 'sala')).toBe(true);
      for (const r of raios) {
        expect(r.falta).toBeGreaterThanOrEqual(1);
        expect(r.falta).toBeLessThanOrEqual(3);
        expect(r.x).toBeGreaterThanOrEqual(90);
        expect(r.y).toBeLessThanOrEqual(540);
      }
    }
    expect(quedaDeEnergia(0.3)).toEqual(quedaDeEnergia(0.3)); // mesmo sorteio, mesmos raios
  });

  it('coletar todos os raios devolve a energia de graça', () => {
    let st = { ...comSessao(infinito(), { bloqueio: quedaDeEnergia(0.42) }), dinheiro: 500 };
    const total = st.sessao.bloqueio.raios.reduce((s, r) => s + r.falta, 0);
    const primeiro = st.sessao.bloqueio.raios[0];
    st = reducer(st, { type: 'COLETAR_RAIO', id: primeiro.id });
    const depois = st.sessao.bloqueio.raios.find((r) => r.id === primeiro.id);
    if (primeiro.falta > 1) expect(depois.falta).toBe(primeiro.falta - 1);
    else expect(depois).toBeUndefined(); // com 1 clique, o raio some
    for (let k = 1; k < total; k++) {
      const r = st.sessao.bloqueio.raios[0];
      st = reducer(st, { type: 'COLETAR_RAIO', id: r.id });
    }
    expect(st.sessao.bloqueio).toBeNull();
    expect(st.dinheiro).toBe(500);
    expect(reducer(st, { type: 'COLETAR_RAIO', id: 0 })).toBe(st); // sem queda, nada acontece
  });
});
