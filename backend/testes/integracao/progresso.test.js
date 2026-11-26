const request = require('supertest');
const { criarApp } = require('../../src/app');
const { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco } = require('./ajuda/banco');

/**
 * Save do jogo na conta, de ponta a ponta. O que importa aqui: o save volta
 * igual ao que foi, cada um so ve o proprio, e um save grande cabe.
 */

const app = criarApp();

async function criarConta(email) {
  const resposta = await request(app)
    .post('/api/auth/cadastro')
    .send({ nome: 'Jogadora', email, senha: 'senha-bem-grande' });
  return resposta.body.token;
}

const SAVE = {
  perfil: { nome: 'Jogadora', conta: { email: 'a@diagrameria.dev' } },
  dinheiro: 350,
  colecao: { lanchonete: { entregas: 2, melhorNota: 90 } },
};

beforeAll(async () => {
  await prepararBanco();
});

beforeEach(async () => {
  await limparTabelas();
});

afterAll(async () => {
  await encerrarBanco();
});

describe('GET /api/progresso', () => {
  it('exige login', async () => {
    const resposta = await request(app).get('/api/progresso');
    expect(resposta.status).toBe(401);
  });

  it('responde 404 SEM_PROGRESSO para conta que nunca salvou', async () => {
    const token = await criarConta('a@diagrameria.dev');
    const resposta = await request(app)
      .get('/api/progresso')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('SEM_PROGRESSO');
  });
});

describe('PUT /api/progresso', () => {
  it('exige login', async () => {
    const resposta = await request(app).put('/api/progresso').send({ dados: SAVE });
    expect(resposta.status).toBe(401);
  });

  it('grava e devolve o save igual', async () => {
    const token = await criarConta('a@diagrameria.dev');
    const auth = `Bearer ${token}`;

    const gravado = await request(app)
      .put('/api/progresso')
      .set('Authorization', auth)
      .send({ dados: SAVE });
    expect(gravado.status).toBe(200);
    expect(gravado.body.versao).toBe(1);

    const lido = await request(app).get('/api/progresso').set('Authorization', auth);
    expect(lido.status).toBe(200);
    expect(lido.body.dados).toEqual(SAVE);
    expect(lido.body.atualizadoEm).toEqual(expect.any(String));
  });

  it('substitui o save anterior e sobe a versao', async () => {
    const auth = `Bearer ${await criarConta('a@diagrameria.dev')}`;

    await request(app).put('/api/progresso').set('Authorization', auth).send({ dados: SAVE });
    const segundo = await request(app)
      .put('/api/progresso')
      .set('Authorization', auth)
      .send({ dados: { ...SAVE, dinheiro: 10 } });

    expect(segundo.body.versao).toBe(2);
    expect(segundo.body.dados.dinheiro).toBe(10);
    expect(await bancoDeDados('progressos').count('* as n').first()).toEqual({ n: '1' });
  });

  it('cada conta so ve o proprio progresso', async () => {
    const authA = `Bearer ${await criarConta('a@diagrameria.dev')}`;
    const authB = `Bearer ${await criarConta('b@diagrameria.dev')}`;

    await request(app).put('/api/progresso').set('Authorization', authA).send({ dados: SAVE });

    const deB = await request(app).get('/api/progresso').set('Authorization', authB);
    expect(deB.status).toBe(404);
  });

  it('recusa corpo fora do formato', async () => {
    const auth = `Bearer ${await criarConta('a@diagrameria.dev')}`;

    const semDados = await request(app).put('/api/progresso').set('Authorization', auth).send(SAVE);
    expect(semDados.status).toBe(400);

    const lista = await request(app)
      .put('/api/progresso')
      .set('Authorization', auth)
      .send({ dados: [1, 2] });
    expect(lista.status).toBe(400);
  });

  it('aceita save maior que o limite padrao da API (100kb)', async () => {
    const auth = `Bearer ${await criarConta('a@diagrameria.dev')}`;
    const grande = { ...SAVE, arquivo: Array.from({ length: 40 }, () => 'x'.repeat(10_000)) };

    const resposta = await request(app)
      .put('/api/progresso')
      .set('Authorization', auth)
      .send({ dados: grande });
    expect(resposta.status).toBe(200);
  });

  it('o resto da API continua com o limite de 100kb', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@diagrameria.dev', senha: 'x'.repeat(200_000) });
    expect(resposta.status).toBe(413);
  });

  it('apaga o progresso junto com a conta', async () => {
    const auth = `Bearer ${await criarConta('a@diagrameria.dev')}`;
    await request(app).put('/api/progresso').set('Authorization', auth).send({ dados: SAVE });

    await bancoDeDados('usuarios').del();
    expect(await bancoDeDados('progressos').count('* as n').first()).toEqual({ n: '0' });
  });
});
