const request = require('supertest');
const { criarApp } = require('../../src/app');
const regras = require('../../src/dominio/jogo/regras');
const { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco } = require('./ajuda/banco');
const seed = require('../../db/seeds/01_gabaritos');

/**
 * O jogo de ponta a ponta: dia, clientes, pedidos, entrega, nota, moedas, fim
 * do dia e Game Over — HTTP real contra o Postgres de teste.
 *
 * O tempo nao passa de verdade: `passarTempo()` recua os instantes gravados do
 * dia, o que equivale a o relogio de parede andar. Como a pausa tambem e
 * recuada, o tempo de jogo continua parado durante ela — exatamente o que o
 * servidor faz de verdade.
 */

const app = criarApp();

let contador = 0;
async function novoJogador() {
  contador += 1;
  const resposta = await request(app)
    .post('/api/auth/cadastro')
    .send({
      nome: 'Jogador',
      email: `jogador${contador}@diagrameria.dev`,
      senha: 'senha-bem-grande',
    });
  return `Bearer ${resposta.body.token}`;
}

/** Simula `ms` de relogio de parede passando para este dia. */
async function passarTempo(diaId, ms) {
  const segundos = ms / 1000;
  await bancoDeDados('dias')
    .where({ id: diaId })
    .update({
      iniciado_em: bancoDeDados.raw('iniciado_em - make_interval(secs => ?)', [segundos]),
      pausado_em: bancoDeDados.raw('pausado_em - make_interval(secs => ?)', [segundos]),
    });
}

/** O diagrama certo de um pedido, lido direto do banco (o jogador nunca o recebe antes). */
async function gabaritoDoPedido(pedidoId) {
  const linha = await bancoDeDados('pedidos')
    .join('gabaritos', 'gabaritos.id', 'pedidos.gabarito_id')
    .where('pedidos.id', pedidoId)
    .first('gabaritos.diagrama', 'gabaritos.id');
  return linha;
}

const iniciarDia = (token) => request(app).post('/api/dias').set('Authorization', token);
const diaAtual = (token) => request(app).get('/api/dias/atual').set('Authorization', token);
const aceitar = (token, pedidoId) =>
  request(app).post(`/api/pedidos/${pedidoId}/aceitar`).set('Authorization', token);
const entregar = (token, pedidoId, diagrama) =>
  request(app)
    .post(`/api/pedidos/${pedidoId}/entrega`)
    .set('Authorization', token)
    .send({ diagrama });
const progresso = (token) => request(app).get('/api/progresso').set('Authorization', token);

/** Aceita e entrega o diagrama perfeito de um pedido. */
async function atenderComPerfeicao(token, pedidoId) {
  await aceitar(token, pedidoId);
  const { diagrama } = await gabaritoDoPedido(pedidoId);
  return entregar(token, pedidoId, diagrama);
}

/** Faz todos os clientes do dia chegarem (o ultimo chega em no maximo 2 intervalos maximos). */
async function trazerTodosOsClientes(token, diaId) {
  await passarTempo(diaId, 2 * regras.CHEGADA.intervaloMaximoMs + 1000);
  return (await diaAtual(token)).body;
}

beforeAll(async () => {
  await prepararBanco();
});

beforeEach(async () => {
  await limparTabelas();
  await seed.seed(bancoDeDados);
});

afterAll(async () => {
  await encerrarBanco();
});

describe('inicio do dia', () => {
  it('abre o dia da fase 1 com 3 clientes, e so o primeiro ja chegou', async () => {
    const token = await novoJogador();
    const resposta = await iniciarDia(token);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      fase: 1,
      status: 'em_andamento',
      clientesNoDia: 3,
      pausasRestantes: regras.PAUSAS_POR_DIA,
    });
    expect(resposta.body.pedidos).toHaveLength(1);
    expect(resposta.body.pedidos[0]).toMatchObject({ status: 'aguardando', dificuldade: 1 });
    expect(resposta.body.proximaChegadaEmMs).toBeGreaterThanOrEqual(
      regras.CHEGADA.intervaloMinimoMs
    );
  });

  // RF15 so libera o gabarito DEPOIS da entrega.
  it('nunca manda o diagrama do gabarito antes da entrega', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const todos = await trazerTodosOsClientes(token, dia.id);
    const texto = JSON.stringify(todos);

    expect(texto).not.toContain('"diagrama"');
    expect(texto).not.toContain('"relacionamentos"');
    expect(texto).not.toContain('"gabarito');
  });

  it('os clientes chegam com o tempo e cada pedido do dia tem um gabarito diferente', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const todos = await trazerTodosOsClientes(token, dia.id);

    expect(todos.pedidos).toHaveLength(3);
    expect(todos.proximaChegadaEmMs).toBeNull();
    expect(new Set(todos.pedidos.map((pedido) => pedido.titulo)).size).toBe(3);
  });

  it('recusa abrir um segundo dia e diz qual esta aberto', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);

    const resposta = await iniciarDia(token);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toMatchObject({
      codigo: 'DIA_EM_ANDAMENTO',
      detalhes: { diaId: dia.id },
    });
  });

  it('GET /dias/atual sem dia aberto e 404', async () => {
    const token = await novoJogador();
    expect((await diaAtual(token)).status).toBe(404);
  });

  it('exige login', async () => {
    expect((await request(app).post('/api/dias')).status).toBe(401);
    expect((await request(app).get('/api/progresso')).status).toBe(401);
  });
});

describe('pedido e entrega', () => {
  it('entrega perfeita: nota 1, moedas creditadas e o esperado na resposta', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const [pedido] = dia.pedidos;

    const resposta = await atenderComPerfeicao(token, pedido.id);

    expect(resposta.status).toBe(201);
    expect(resposta.body.resultado).toMatchObject({ nota: 1, aceita: true });
    expect(resposta.body.resultado.moedas).toBe(10 * pedido.dificuldade);
    expect(resposta.body.esperado.classes.length).toBeGreaterThan(0);
    expect(resposta.body.diff.classes.faltando).toEqual([]);

    const { moedas, gorjeta } = resposta.body.resultado;
    expect((await progresso(token)).body.moedas).toBe(moedas + gorjeta);
  });

  it('entrega parcial: nota proporcional e o diff aponta o que faltou', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const [pedido] = dia.pedidos;
    await aceitar(token, pedido.id);

    const { diagrama } = await gabaritoDoPedido(pedido.id);
    const [primeira, ...resto] = diagrama.classes;
    const semUmaClasse = {
      ...diagrama,
      classes: resto,
      relacionamentos: diagrama.relacionamentos.filter(
        (r) => r.origem !== primeira.id && r.destino !== primeira.id
      ),
    };

    const resposta = await entregar(token, pedido.id, semUmaClasse);

    expect(resposta.body.resultado.nota).toBeGreaterThan(0);
    expect(resposta.body.resultado.nota).toBeLessThan(1);
    expect(resposta.body.diff.classes.faltando).toEqual([primeira.nome]);
  });

  it('entregar sem aceitar antes e 409', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const { diagrama } = await gabaritoDoPedido(dia.pedidos[0].id);

    const resposta = await entregar(token, dia.pedidos[0].id, diagrama);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('PEDIDO_NAO_ACEITO');
  });

  it('a entrega e uma so', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    await atenderComPerfeicao(token, dia.pedidos[0].id);

    const segunda = await atenderComPerfeicao(token, dia.pedidos[0].id);

    expect(segunda.status).toBe(409);
    expect(segunda.body.erro.codigo).toBe('PEDIDO_JA_ENTREGUE');
  });

  it('diagrama malformado e 400 e nao gasta o pedido', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const [pedido] = dia.pedidos;
    await aceitar(token, pedido.id);

    const invalido = {
      versao: '1.0',
      classes: [{ id: 'a', nome: 'A' }],
      relacionamentos: [{ tipo: 'associacao', origem: 'a', destino: 'nao-existe' }],
    };
    const resposta = await entregar(token, pedido.id, invalido);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.detalhes).toEqual([
      expect.objectContaining({ campo: 'diagrama/relacionamentos/0/destino' }),
    ]);
    // O pedido continua aceito: da para entregar de novo, agora direito.
    expect((await atenderComPerfeicao(token, pedido.id)).status).toBe(201);
  });

  it('cliente que ainda nao chegou nao pode ser aceito', async () => {
    const token = await novoJogador();
    await iniciarDia(token);
    const [{ id }] = await bancoDeDados('pedidos').where({ ordem: 3 }).select('id');

    const resposta = await aceitar(token, id);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('PEDIDO_NAO_CHEGOU');
  });

  it('depois da paciencia o cliente vai embora (RF05)', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const [pedido] = dia.pedidos;

    await passarTempo(dia.id, pedido.pacienciaMs + regras.TOLERANCIA_DE_LATENCIA_MS + 1000);
    const resposta = await aceitar(token, pedido.id);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('PEDIDO_EXPIRADO');
  });

  it('pedido e dia de outro jogador respondem 404', async () => {
    const dono = await novoJogador();
    const intruso = await novoJogador();
    const { body: dia } = await iniciarDia(dono);

    expect((await aceitar(intruso, dia.pedidos[0].id)).status).toBe(404);
    expect(
      (await request(app).get(`/api/dias/${dia.id}`).set('Authorization', intruso)).status
    ).toBe(404);
  });

  it('id que nem e UUID e 404, nao 500', async () => {
    const token = await novoJogador();
    expect((await aceitar(token, 'nao-e-uuid')).status).toBe(404);
  });
});

describe('fim do dia', () => {
  it('dia bem atendido encerra, avanca a fase e traz o resumo (RF17, RF23)', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const todos = await trazerTodosOsClientes(token, dia.id);

    let ultima;
    for (const pedido of todos.pedidos) ultima = await atenderComPerfeicao(token, pedido.id);

    expect(ultima.body.dia.status).toBe('concluido');
    expect(ultima.body.dia.resumo).toMatchObject({
      fase: 1,
      aceitas: 3,
      clientesPerdidos: 0,
      gameOver: false,
      proximaFase: 2,
    });
    expect((await progresso(token)).body.fase).toBe(2);
  });

  it('dia abandonado da Game Over e repete a fase (RF24)', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);

    await passarTempo(dia.id, 20 * 60 * 1000);
    const encerrado = await diaAtual(token);

    expect(encerrado.body.status).toBe('game_over');
    expect(encerrado.body.resumo).toMatchObject({ expirados: 3, gameOver: true, proximaFase: 1 });
    expect(encerrado.body.pedidos.every((pedido) => pedido.status === 'expirado')).toBe(true);
    expect((await progresso(token)).body.fase).toBe(1);

    // Encerrado, deixa de ser o dia atual; um novo dia abre na mesma fase.
    expect((await diaAtual(token)).status).toBe(404);
    const novo = await iniciarDia(token);
    expect(novo.status).toBe(201);
    expect(novo.body.fase).toBe(1);
  });

  it('abrir um dia novo encerra antes o dia aberto que ja terminou', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    await passarTempo(dia.id, 20 * 60 * 1000);

    expect((await iniciarDia(token)).status).toBe(201);
    const antigo = await bancoDeDados('dias').where({ id: dia.id }).first();
    expect(antigo.status).toBe('game_over');
  });

  it('o sorteio do dia seguinte prefere gabarito que o jogador ainda nao viu', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    const todos = await trazerTodosOsClientes(token, dia.id);
    for (const pedido of todos.pedidos) await atenderComPerfeicao(token, pedido.id);

    const vistos = new Set(todos.pedidos.map((pedido) => pedido.titulo));
    const { body: seguinte } = await iniciarDia(token);

    // Ha 4 gabaritos de dificuldade 1: o 4o, nunca visto, sai antes dos outros.
    const doSeguinte = await trazerTodosOsClientes(token, seguinte.id);
    const naoVistos = doSeguinte.pedidos.filter((pedido) => !vistos.has(pedido.titulo));
    expect(naoVistos).toHaveLength(1);
  });
});

describe('pausa (RF29)', () => {
  const pausar = (token, diaId) =>
    request(app).post(`/api/dias/${diaId}/pausar`).set('Authorization', token);
  const retomar = (token, diaId) =>
    request(app).post(`/api/dias/${diaId}/retomar`).set('Authorization', token);

  it('congela a paciencia enquanto o dia esta pausado', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);

    const pausado = await pausar(token, dia.id);
    expect(pausado.body.status).toBe('pausado');
    const pacienciaNaPausa = pausado.body.pedidos[0].pacienciaRestanteMs;

    await passarTempo(dia.id, 10 * 60 * 1000);
    const retomado = await retomar(token, dia.id);

    expect(retomado.body.status).toBe('em_andamento');
    expect(retomado.body.pedidos[0].status).toBe('aguardando');
    expect(retomado.body.pedidos[0].pacienciaRestanteMs).toBe(pacienciaNaPausa);
  });

  it('pausado nao aceita nem entrega', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);
    await pausar(token, dia.id);

    const resposta = await aceitar(token, dia.pedidos[0].id);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('DIA_PAUSADO');
  });

  it(`permite ${regras.PAUSAS_POR_DIA} pausas por dia`, async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);

    for (let i = 0; i < regras.PAUSAS_POR_DIA; i += 1) {
      expect((await pausar(token, dia.id)).status).toBe(200);
      expect((await retomar(token, dia.id)).status).toBe(200);
    }
    const alem = await pausar(token, dia.id);

    expect(alem.status).toBe(409);
    expect(alem.body.erro.codigo).toBe('LIMITE_DE_PAUSAS');
  });

  it('retomar um dia que nao esta pausado e 409', async () => {
    const token = await novoJogador();
    const { body: dia } = await iniciarDia(token);

    const resposta = await retomar(token, dia.id);

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('DIA_NAO_PAUSADO');
  });
});
