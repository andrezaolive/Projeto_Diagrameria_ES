import { describe, expect, it } from 'vitest';
import { FATOR_REPETICAO, JUMBO_NA_CAMPANHA, TODOS_MODELOS, criarPedido, ehJumbo, modeloPorId, pedidosNoDia, sortearPedidosDoDia } from '../data/pedidos.js';
import { medalhaDaNota, naColecao, registrarEntrega } from '../lib/colecao.js';
import { composicaoDoDia, dataDoDia, niveisDoDia, nivelDoModelo } from '../lib/dificuldade.js';
import { estadoInicial, reducer, sortearUrgente } from './reducer.js';

const rodar = (s, ...acoes) => acoes.reduce(reducer, s);
const colecaoCom = (ids) => Object.fromEntries(ids.map((id) => [id, { entregas: 1, melhorNota: 70 }]));
const doNivel = (dia) => TODOS_MODELOS.filter((m) => niveisDoDia(dia).includes(nivelDoModelo(m).id) && (dia >= JUMBO_NA_CAMPANHA || !ehJumbo(m)));

describe('medalhas da coleção', () => {
  it('ouro com 85% ou mais, prata a partir de 45%, bronze abaixo', () => {
    expect([100, 85, 84, 60, 45, 44, 0].map((n) => medalhaDaNota(n).id)).toEqual(['ouro', 'ouro', 'prata', 'prata', 'prata', 'bronze', 'bronze']);
    expect(medalhaDaNota(null)).toBeNull();
  });

  it('a coleção guarda quantas entregas e a melhor nota', () => {
    let c = registrarEntrega({}, 'cinema', 40);
    c = registrarEntrega(c, 'cinema', 90);
    c = registrarEntrega(c, 'cinema', 70);
    expect(c.cinema).toEqual({ entregas: 3, melhorNota: 90 });
    expect(naColecao(c, 'cinema')).toBe(true);
    expect(naColecao(c, 'pizzaria')).toBe(false);
  });
});

describe('pedidos do dia sorteados', () => {
  it('composição de cada data do calendário (fins de semana são folga)', () => {
    const porData = Object.fromEntries(Array.from({ length: 23 }, (_, i) => [dataDoDia(i + 1), Object.values(composicaoDoDia(i + 1)).join('/')]));
    const esperado = { '2/0/0': [1, 2, 3], '3/0/0': [4, 5, 8], '2/1/0': [9, 10, 11], '1/3/0': [12, 15, 16, 17], '1/2/1': [18, 19, 22], '1/2/2': [23, 24, 25], '1/2/3': [26, 29], '0/2/4': [30, 31] };
    for (const [comp, datas] of Object.entries(esperado)) for (const d of datas) expect(porData[d], `dia ${d}`).toBe(comp);
    expect(Object.keys(porData)).toHaveLength(23);
  });

  it('quantidade de cada nível do dia, sem repetir (JUMBO só a partir do dia 5)', () => {
    for (let dia = 1; dia <= 23; dia++)
      for (const semente of [0.1, 0.5, 0.9]) {
        const ids = sortearPedidosDoDia(dia, { semente });
        expect(ids).toHaveLength(pedidosNoDia(dia));
        expect(new Set(ids).size).toBe(ids.length);
        const contagem = { facil: 0, medio: 0, dificil: 0 };
        for (const id of ids) contagem[nivelDoModelo(modeloPorId(id)).id]++;
        expect(contagem, `dia ${dia}`).toEqual(composicaoDoDia(dia));
        if (dia < JUMBO_NA_CAMPANHA) expect(ids.some((id) => ehJumbo(modeloPorId(id)))).toBe(false);
      }
    expect(niveisDoDia(1)).toEqual(['facil']);
  });

  it('é aleatório (sementes diferentes, dias diferentes) e reproduzível (mesma semente, mesmo dia)', () => {
    const vistos = new Set(Array.from({ length: 30 }, (_, i) => sortearPedidosDoDia(1, { semente: i / 30 })[0]));
    expect(vistos.size).toBeGreaterThan(5);
    expect(sortearPedidosDoDia(9, { semente: 0.42 })).toEqual(sortearPedidosDoDia(9, { semente: 0.42 }));
  });

  it('dia novo prioriza os pedidos que o jogador ainda não tem na coleção', () => {
    const faceis = doNivel(1).map((m) => m.id);
    const ineditos = faceis.slice(0, 2);
    for (let k = 0; k < 20; k++) expect(sortearPedidosDoDia(1, { colecao: colecaoCom(faceis.slice(2)), semente: k / 20 }).sort()).toEqual([...ineditos].sort());
    // tudo coletado: continua vindo pedido (repetido)
    expect(sortearPedidosDoDia(1, { colecao: colecaoCom(faceis), semente: 0.3 })).toHaveLength(2);
  });

  it('dia repetido: só pedidos já desbloqueados', () => {
    const faceis = doNivel(5).map((m) => m.id);
    const desbloqueados = faceis.slice(0, 3);
    for (let k = 0; k < 20; k++)
      for (const id of sortearPedidosDoDia(5, { colecao: colecaoCom(desbloqueados), repeticao: true, semente: k / 20 })) expect(desbloqueados).toContain(id);
    // nenhum desbloqueado do nível do dia: vale qualquer desbloqueado
    expect(sortearPedidosDoDia(15, { colecao: colecaoCom(['catraca']), repeticao: true, semente: 0.5 })).toEqual(['catraca']);
  });
});

describe('dia repetido e coleção no jogo', () => {
  const comDiaConcluido = (dia, colecao) => {
    const s = estadoInicial();
    return { ...s, colecao, campanha: { desbloqueado: dia + 1, concluidos: { [dia]: { ganho: 100, media: 80 } } } };
  };

  it('dia já concluído: pedidos (inclusive os que chegam depois e o urgente) pagam metade', () => {
    const desbloqueados = doNivel(9).map((m) => m.id).slice(0, 4);
    let s = rodar(comDiaConcluido(9, colecaoCom(desbloqueados)), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 9, sorteio: 0, semente: 0.7 });
    expect(s.sessao.repeticao).toBe(true);
    const [p] = s.sessao.pedidos;
    expect(desbloqueados).toContain(p.modelo);
    expect(p.recompensa).toBe(Math.round(criarPedido(p.modelo, 1, 9).recompensa * FATOR_REPETICAO));
    s = rodar(s, { type: 'ACEITAR', id: p.id }, { type: 'ENTREGAR', id: p.id, nota: 90, valor: 10, sorteio: 0 });
    const segundo = s.sessao.pedidos[1];
    expect(segundo.recompensa).toBe(Math.round(criarPedido(segundo.modelo, 1, 9).recompensa * FATOR_REPETICAO));
    const u = sortearUrgente(s.sessao, 60, 0);
    expect(u.recompensa).toBe(Math.round(Math.round(criarPedido(u.modelo, 1, 9).recompensa * 1.8) * FATOR_REPETICAO));
  });

  it('dia novo paga o normal; entregar registra o pedido na coleção com a melhor nota', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.2 });
    expect(s.sessao.repeticao).toBeUndefined();
    const [p] = s.sessao.pedidos;
    expect(p.recompensa).toBe(criarPedido(p.modelo, 1, 1).recompensa);
    s = rodar(s, { type: 'ACEITAR', id: p.id }, { type: 'ENTREGAR', id: p.id, nota: 88, valor: 10 });
    expect(s.colecao[p.modelo]).toEqual({ entregas: 1, melhorNota: 88 });
    expect(medalhaDaNota(s.colecao[p.modelo].melhorNota).id).toBe('ouro');
  });
});
