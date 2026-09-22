const express = require('express');
const request = require('supertest');
const { limitaTentativas } = require('../../src/middlewares/limitaTentativas');
const { tratadorDeErros } = require('../../src/middlewares/tratadorDeErros');

/**
 * O limitador isolado, num app de brinquedo: nas rotas reais ele fica desligado
 * durante os testes (ver src/rotas/autenticacao.rotas.js), porque a suite de
 * integracao faz dezenas de cadastros do mesmo IP.
 */

function appCom(opcoes) {
  const app = express();
  app.use(express.json());
  app.post('/', limitaTentativas({ janelaMs: 60_000, ...opcoes }), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(tratadorDeErros);
  return app;
}

describe('limitaTentativas', () => {
  it('deixa passar ate o limite e depois responde 429 no formato padrao', async () => {
    const app = appCom({ limite: 2 });

    expect((await request(app).post('/')).status).toBe(200);
    expect((await request(app).post('/')).status).toBe(200);

    const bloqueada = await request(app).post('/');
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.erro.codigo).toBe('MUITAS_TENTATIVAS');
  });

  // Turma inteira no mesmo laboratorio sai pelo mesmo IP: errar a senha de uma
  // conta nao pode travar o login das outras.
  it('com porEmail, conta cada email separado', async () => {
    const app = appCom({ limite: 1, porEmail: true });

    expect((await request(app).post('/').send({ email: 'ana@x.dev' })).status).toBe(200);
    expect((await request(app).post('/').send({ email: 'ana@x.dev' })).status).toBe(429);
    expect((await request(app).post('/').send({ email: 'bia@x.dev' })).status).toBe(200);
  });

  it('com porEmail, caixa e espaco nao geram contador novo', async () => {
    const app = appCom({ limite: 1, porEmail: true });

    await request(app).post('/').send({ email: 'ana@x.dev' });
    const resposta = await request(app).post('/').send({ email: ' ANA@x.dev ' });
    expect(resposta.status).toBe(429);
  });

  it('desligado, nao limita', async () => {
    const app = appCom({ limite: 1, ativo: false });

    await request(app).post('/');
    expect((await request(app).post('/')).status).toBe(200);
  });
});
