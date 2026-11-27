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
  app.post('/', limitaTentativas({ janelaMs: 60_000, ...opcoes }), (req, res) => {
    // senha "errada" simula login malsucedido
    if (req.body?.senha === 'errada') return res.status(401).json({ ok: false });
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

  describe('com soFalhas (regra do login, RNF22)', () => {
    const regraDoLogin = { limite: 5, porEmail: true, soFalhas: true };
    const tentar = (app, senha) => request(app).post('/').send({ email: 'ana@x.dev', senha });

    it('bloqueia na sexta tentativa depois de 5 falhas', async () => {
      const app = appCom(regraDoLogin);
      for (let i = 0; i < 5; i++) expect((await tentar(app, 'errada')).status).toBe(401);

      const bloqueada = await tentar(app, 'certa');
      expect(bloqueada.status).toBe(429);
      expect(bloqueada.body.erro.codigo).toBe('MUITAS_TENTATIVAS');
    });

    it('login certo nao gasta tentativa', async () => {
      const app = appCom(regraDoLogin);
      for (let i = 0; i < 10; i++) expect((await tentar(app, 'certa')).status).toBe(200);
      for (let i = 0; i < 4; i++) expect((await tentar(app, 'errada')).status).toBe(401);
      expect((await tentar(app, 'certa')).status).toBe(200);
    });

    it('libera de novo quando a janela fecha', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      try {
        const app = appCom(regraDoLogin);
        for (let i = 0; i < 5; i++) await tentar(app, 'errada');
        expect((await tentar(app, 'certa')).status).toBe(429);

        jest.advanceTimersByTime(60_001);
        expect((await tentar(app, 'certa')).status).toBe(200);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
