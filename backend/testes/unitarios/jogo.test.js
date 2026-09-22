const regras = require('../../src/dominio/jogo/regras');
const { calcularPagamento, pontosMaximosDoPedido } = require('../../src/dominio/jogo/pontuacao');
const relogio = require('../../src/dominio/jogo/relogio');
const { transicionarDia, transicionarPedido } = require('../../src/dominio/jogo/estados');
const { resumirDia } = require('../../src/dominio/jogo/resumoDoDia');

describe('regras por fase', () => {
  it.each([
    [1, 3],
    [10, 3],
    [11, 4],
    [20, 4],
    [21, 5],
    [101, 13],
  ])('fase %i tem %i clientes (3 na fase 1, +1 a cada 10)', (fase, clientes) => {
    expect(regras.clientesPorFase(fase)).toBe(clientes);
  });

  it.each([
    [1, 1],
    [10, 1],
    [11, 2],
    [41, 5],
    [200, 5],
  ])('fase %i sorteia dificuldade %i', (fase, dificuldade) => {
    expect(regras.dificuldadePorFase(fase)).toBe(dificuldade);
  });

  it('relacionamentos pesam mais a partir da fase 11 (RF18)', () => {
    expect(regras.pesosPorFase(11).relacionamento).toBeGreaterThan(
      regras.pesosPorFase(10).relacionamento
    );
  });
});

describe('pagamento do pedido', () => {
  const base = { dificuldade: 2, pacienciaMs: 200_000 };

  it('nota 1 entregue na hora paga valor base + gorjeta maxima', () => {
    expect(calcularPagamento({ ...base, nota: 1, tempoRestanteMs: 200_000 })).toEqual({
      aceita: true,
      moedas: 20,
      gorjeta: 10,
      pontos: 110,
    });
  });

  it('entregue no ultimo segundo: sem gorjeta', () => {
    const resultado = calcularPagamento({ ...base, nota: 1, tempoRestanteMs: 0 });
    expect(resultado.gorjeta).toBe(0);
    expect(resultado.moedas).toBe(20);
  });

  it('gorjeta cresce com o tempo restante e com a nota (RF26)', () => {
    const rapido = calcularPagamento({ ...base, nota: 0.8, tempoRestanteMs: 150_000 });
    const lento = calcularPagamento({ ...base, nota: 0.8, tempoRestanteMs: 50_000 });
    const pior = calcularPagamento({ ...base, nota: 0.6, tempoRestanteMs: 150_000 });

    expect(rapido.gorjeta).toBeGreaterThan(lento.gorjeta);
    expect(rapido.gorjeta).toBeGreaterThan(pior.gorjeta);
  });

  it('abaixo da nota minima o cliente recusa: sem moedas e com punicao', () => {
    expect(calcularPagamento({ ...base, nota: 0.49, tempoRestanteMs: 200_000 })).toEqual({
      aceita: false,
      moedas: 0,
      gorjeta: 0,
      pontos: -regras.PUNICAO_POR_CLIENTE_PERDIDO,
    });
  });

  it('exatamente na nota minima e aceito', () => {
    expect(calcularPagamento({ ...base, nota: 0.5, tempoRestanteMs: 0 }).aceita).toBe(true);
  });
});

describe('relogio do dia', () => {
  const dia = { iniciadoEmMs: 1_000_000, tempoPausadoMs: 0, pausadoEmMs: null };

  it('conta o tempo desde o inicio do dia', () => {
    expect(relogio.tempoDeJogo(dia, 1_030_000)).toBe(30_000);
  });

  it('desconta as pausas ja encerradas', () => {
    expect(relogio.tempoDeJogo({ ...dia, tempoPausadoMs: 10_000 }, 1_030_000)).toBe(20_000);
  });

  it('para durante a pausa em curso (RF29)', () => {
    const pausado = { ...dia, pausadoEmMs: 1_020_000 };
    expect(relogio.tempoDeJogo(pausado, 1_020_000)).toBe(20_000);
    expect(relogio.tempoDeJogo(pausado, 1_500_000)).toBe(20_000);
  });

  const pedido = { chegadaMs: 60_000, pacienciaMs: 120_000, status: 'aguardando' };

  it('cliente que ainda nao chegou esta a caminho', () => {
    expect(relogio.estadoDoPedido(pedido, 59_999)).toBe('a_caminho');
    expect(relogio.estadoDoPedido(pedido, 60_000)).toBe('aguardando');
  });

  it('expira so depois da tolerancia de latencia', () => {
    const prazo = relogio.prazoDoPedido(pedido);
    expect(relogio.estadoDoPedido(pedido, prazo + regras.TOLERANCIA_DE_LATENCIA_MS)).toBe(
      'aguardando'
    );
    expect(relogio.estadoDoPedido(pedido, prazo + regras.TOLERANCIA_DE_LATENCIA_MS + 1)).toBe(
      'expirado'
    );
  });

  it('pedido entregue nao expira depois', () => {
    expect(relogio.estadoDoPedido({ ...pedido, status: 'entregue' }, 10_000_000)).toBe('entregue');
  });

  it('paciencia restante nunca fica negativa', () => {
    expect(relogio.pacienciaRestanteMs(pedido, 100_000)).toBe(80_000);
    expect(relogio.pacienciaRestanteMs(pedido, 999_999)).toBe(0);
  });

  it('primeiro cliente chega na abertura e os outros em intervalos dentro do limite', () => {
    const chegadas = relogio.gerarChegadas(4, () => 0.5);
    const meio = (regras.CHEGADA.intervaloMinimoMs + regras.CHEGADA.intervaloMaximoMs) / 2;

    expect(chegadas).toEqual([0, meio, 2 * meio, 3 * meio]);
  });

  it('intervalos nos extremos do sorteio', () => {
    expect(relogio.gerarChegadas(2, () => 0)[1]).toBe(regras.CHEGADA.intervaloMinimoMs);
    expect(relogio.gerarChegadas(2, () => 0.999999)[1]).toBe(regras.CHEGADA.intervaloMaximoMs);
  });
});

describe('maquinas de estado', () => {
  it('dia: pausa e retoma', () => {
    expect(transicionarDia('em_andamento', 'pausar')).toBe('pausado');
    expect(transicionarDia('pausado', 'retomar')).toBe('em_andamento');
  });

  it.each([
    ['pausado', 'pausar', 'DIA_PAUSADO'],
    ['em_andamento', 'retomar', 'DIA_NAO_PAUSADO'],
    ['concluido', 'pausar', 'DIA_ENCERRADO'],
    ['game_over', 'retomar', 'DIA_ENCERRADO'],
  ])('dia %s nao aceita %s (%s)', (estado, evento, codigo) => {
    expect(() => transicionarDia(estado, evento)).toThrow(expect.objectContaining({ codigo }));
  });

  it('pedido: aceita e depois entrega', () => {
    expect(transicionarPedido('aguardando', 'aceitar')).toBe('aceito');
    expect(transicionarPedido('aceito', 'entregar')).toBe('entregue');
  });

  it.each([
    ['a_caminho', 'aceitar', 'PEDIDO_NAO_CHEGOU'],
    ['aguardando', 'entregar', 'PEDIDO_NAO_ACEITO'],
    ['aceito', 'aceitar', 'PEDIDO_JA_ACEITO'],
    ['entregue', 'entregar', 'PEDIDO_JA_ENTREGUE'],
    ['expirado', 'entregar', 'PEDIDO_EXPIRADO'],
  ])('pedido %s nao aceita %s (%s)', (estado, evento, codigo) => {
    expect(() => transicionarPedido(estado, evento)).toThrow(expect.objectContaining({ codigo }));
  });
});

describe('resumo do dia', () => {
  const entregue = (nota) => ({
    dificuldade: 1,
    estado: 'entregue',
    entrega: calcularPagamento({
      nota,
      dificuldade: 1,
      tempoRestanteMs: 60_000,
      pacienciaMs: 120_000,
    }),
  });
  const expirado = { dificuldade: 1, estado: 'expirado' };

  it('dia bom avanca de fase', () => {
    const resumo = resumirDia(1, [entregue(1), entregue(0.9), entregue(0.8)]);

    expect(resumo.gameOver).toBe(false);
    expect(resumo.proximaFase).toBe(2);
    expect(resumo.aceitas).toBe(3);
    expect(resumo.pontosMaximos).toBe(3 * pontosMaximosDoPedido(1));
  });

  it('dia ruim da Game Over e repete a fase (RF24)', () => {
    const resumo = resumirDia(1, [entregue(0.6), expirado, expirado]);

    expect(resumo.gameOver).toBe(true);
    expect(resumo.proximaFase).toBe(1);
    expect(resumo.clientesPerdidos).toBe(2);
  });

  it('entrega recusada conta como cliente perdido', () => {
    const resumo = resumirDia(1, [entregue(1), entregue(1), entregue(0.2)]);

    expect(resumo.recusadas).toBe(1);
    expect(resumo.clientesPerdidos).toBe(1);
  });

  it('moedas do dia somam valor e gorjeta de cada entrega', () => {
    const pedidos = [entregue(1), entregue(1), entregue(1)];
    const resumo = resumirDia(1, pedidos);
    const esperado = pedidos.reduce((soma, p) => soma + p.entrega.moedas + p.entrega.gorjeta, 0);

    expect(resumo.moedas).toBe(esperado);
  });

  it('o limiar de Game Over sobe com a fase', () => {
    expect(regras.limiarDeGameOver(21)).toBeGreaterThan(regras.limiarDeGameOver(1));
  });
});
