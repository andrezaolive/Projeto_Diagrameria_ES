import { describe, expect, it } from 'vitest';
import { RETORNO, arquivar, criarRetorno, pistasDoRetorno, podeChegarRetorno, registroCerto, registroDaEntrega } from './retorno.js';
import { estadoInicial, reducer } from '../state/reducer.js';
import { chegarAgora } from '../state/testeAjuda.js';

const reg = (modelo, cliente, assunto, extra = {}) => ({ id: `${modelo}@1`, modelo, cliente, assunto, nota: 90, partida: 1, tipo: 'classes', ...extra });
const ARQUIVO = [
  reg('a', 'Padaria Lua', 'Sistema da padaria', { tipo: 'casos' }),
  reg('b', 'Petshop Bigode', 'Cadastro de pets'),
  reg('c', 'Papelaria Washi', 'Lojinha online', { nota: 60 }),
  reg('d', 'Banco Roxo', 'Contas do banco', { partida: 2 }),
];

describe('arquivo de pedidos entregues', () => {
  it('cada entrega vira um registro e o arquivo guarda só os últimos', () => {
    const r = registroDaEntrega({ id: 'biblioteca-3', modelo: 'biblioteca', cliente: 'Biblioteca Lilás', assunto: 'URGENTE: Empréstimos' }, 80, 2);
    expect(r).toMatchObject({ modelo: 'biblioteca', assunto: 'Empréstimos', nota: 80, partida: 2 });
    let arquivo = [];
    for (let i = 0; i < RETORNO.maxArquivo + 5; i++) arquivo = arquivar(arquivo, { ...r, id: String(i) });
    expect(arquivo).toHaveLength(RETORNO.maxArquivo);
    expect(arquivo.at(-1).id).toBe(String(RETORNO.maxArquivo + 4));
  });

  it('ENTREGAR guarda no arquivo (campanha e infinito)', () => {
    let s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const p = s.sessao.pedidos[0];
    s = reducer(reducer(s, { type: 'ACEITAR', id: p.id }), { type: 'ENTREGAR', id: p.id, nota: 77, valor: 10, erros: {} });
    expect(s.arquivo).toHaveLength(1);
    expect(s.arquivo[0]).toMatchObject({ modelo: p.modelo, cliente: p.cliente, nota: 77, partida: s.estatisticas.jogos });
  });
});

describe('pedido de retorno', () => {
  it('reenvio: diz o cliente e o pedido', () => {
    const p = criarRetorno(ARQUIVO, 9, 2, 0.3, 'reenvio');
    expect(p.retorno.tipo).toBe('reenvio');
    expect(p.cliente).toBe(ARQUIVO[1].cliente);
    expect(p.retorno.texto.join(' ')).toContain(ARQUIVO[1].assunto);
  });

  it('ambíguo: sem assinatura e com pistas suficientes para sobrar um diagrama só', () => {
    for (const alvo of ARQUIVO) {
      const pistas = pistasDoRetorno(alvo, ARQUIVO, 2);
      expect(pistas.length).toBeGreaterThanOrEqual(2);
      expect(pistas.join(' ')).not.toContain(alvo.cliente);
    }
    // a padaria é a única de casos de uso: tipo + inicial bastam
    expect(pistasDoRetorno(ARQUIVO[0], ARQUIVO, 2)).toEqual(['Era um diagrama de casos de uso.', 'O nome da nossa empresa começa com "P".']);
    // petshop e papelaria: classes e "P"; a nota (ou a partida) separa
    expect(pistasDoRetorno(ARQUIVO[1], ARQUIVO, 2)).toHaveLength(3);
    const p = criarRetorno(ARQUIVO, 9, 2, 0.1, 'ambiguo');
    expect(p.cliente).toBe('Contato sem assinatura');
    expect(p.retorno.tipo).toBe('ambiguo');
  });

  it('só chega no infinito, depois dos primeiros pedidos, com diagramas no arquivo e um de cada vez', () => {
    const sessao = { modo: 'infinito', seq: RETORNO.aPartirDe, pedidos: [] };
    expect(podeChegarRetorno(sessao, ARQUIVO)).toBe(true);
    expect(podeChegarRetorno({ ...sessao, seq: 2 }, ARQUIVO)).toBe(false);
    expect(podeChegarRetorno(sessao, ARQUIVO.slice(0, 2))).toBe(false);
    expect(podeChegarRetorno({ ...sessao, modo: 'campanha' }, ARQUIVO)).toBe(false);
    expect(podeChegarRetorno({ ...sessao, pedidos: [{ retorno: {}, status: 'novo' }] }, ARQUIVO)).toBe(false);
  });

  it('o mesmo diagrama entregue em outra partida também vale', () => {
    const p = criarRetorno(ARQUIVO, 9, 2, 0.3, 'reenvio');
    expect(registroCerto(p, ARQUIVO[1])).toBe(true);
    expect(registroCerto(p, { ...ARQUIVO[1], id: 'outro', partida: 7 })).toBe(true);
    expect(registroCerto(p, ARQUIVO[2])).toBe(false);
  });

  it('reenviar o certo entrega e paga; o errado tira paciência; aceitar não vale', () => {
    let s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, arquivo: ARQUIVO, dinheiro: 100 };
    const retorno = criarRetorno(ARQUIVO, 50, 2, 0.3, 'reenvio');
    s = { ...s, sessao: { ...s.sessao, pedidos: [...s.sessao.pedidos, retorno] } };
    expect(reducer(s, { type: 'ACEITAR', id: retorno.id })).toBe(s);
    const errado = reducer(s, { type: 'ENVIAR_RETORNO', id: retorno.id, registro: ARQUIVO[2].id });
    expect(errado.sessao.pedidos.at(-1).paciencia).toBe(RETORNO.paciencia - RETORNO.penalidade);
    expect(errado.sessao.pedidos.at(-1).status).toBe('novo');
    const certo = chegarAgora(reducer(s, { type: 'ENVIAR_RETORNO', id: retorno.id, registro: ARQUIVO[1].id }));
    const p = certo.sessao.pedidos.find((x) => x.id === retorno.id);
    expect(p.status).toBe('entregue');
    expect(certo.dinheiro).toBe(100 + retorno.recompensa);
    expect(certo.estatisticas.reenvios).toBe(1);
  });

  it('um TICK com o sorteio baixo faz o pedido que chega ser um retorno', () => {
    let s = reducer(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    s = { ...s, arquivo: ARQUIVO, sessao: { ...s.sessao, seq: 10, chegadas: [s.sessao.segundos + 1], pedidos: s.sessao.pedidos.slice(0, 1) } };
    s = reducer(s, { type: 'TICK', sorteioRetorno: 0 });
    expect(s.sessao.pedidos.at(-1).retorno).toBeTruthy();
  });
});
