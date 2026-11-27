const express = require('express');
const request = require('supertest');
const {
  ErroDaAplicacao,
  ErroDeValidacao,
  ErroDeAutenticacao,
  ErroDeConflito,
  ErroNaoEncontrado,
  ErroDeLimite,
} = require('../../src/dominio/erros');
const { tratadorDeErros, rotaNaoEncontrada } = require('../../src/middlewares/tratadorDeErros');

/** App de brinquedo: GET / lanca o erro que o teste mandar. */
function appQueLanca(erro) {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.get('/', () => {
    throw erro;
  });
  app.post('/', (_req, res) => res.json({ ok: true }));
  app.use(rotaNaoEncontrada);
  app.use(tratadorDeErros);
  return app;
}

class ErroSemStatus extends ErroDaAplicacao {}

describe('tratadorDeErros', () => {
  it.each([
    [new ErroDeValidacao('x', [{ campo: 'a', mensagem: 'b' }]), 400],
    [new ErroDeAutenticacao(), 401],
    [new ErroNaoEncontrado(), 404],
    [new ErroDeConflito('x'), 409],
    [new ErroDeLimite(), 429],
    [new ErroSemStatus('SEM_STATUS', 'x'), 400],
  ])('%p vira %i no formato padrao', async (erro, status) => {
    const resposta = await request(appQueLanca(erro)).get('/');
    expect(resposta.status).toBe(status);
    expect(resposta.body.erro).toMatchObject({ codigo: erro.codigo, mensagem: erro.message });
  });

  it('repassa os detalhes so quando existem', async () => {
    const com = await request(appQueLanca(new ErroDeValidacao('x', [1]))).get('/');
    expect(com.body.erro.detalhes).toEqual([1]);
    const sem = await request(appQueLanca(new ErroDeAutenticacao())).get('/');
    expect(sem.body.erro).not.toHaveProperty('detalhes');
  });

  it('erro inesperado vira 500 generico, sem vazar mensagem nem stack', async () => {
    const resposta = await request(appQueLanca(new Error('senha do banco: hunter2'))).get('/');
    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno no servidor.' },
    });
    expect(resposta.text).not.toMatch(/hunter2|at /);
  });

  it('JSON malformado vira 400 JSON_INVALIDO', async () => {
    const resposta = await request(appQueLanca(null))
      .post('/')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('JSON_INVALIDO');
  });

  it('corpo acima do limite vira 413 CORPO_GRANDE_DEMAIS', async () => {
    const resposta = await request(appQueLanca(null))
      .post('/')
      .send({ texto: 'a'.repeat(2048) });
    expect(resposta.status).toBe(413);
    expect(resposta.body.erro.codigo).toBe('CORPO_GRANDE_DEMAIS');
  });

  it('rota inexistente vira 404 ROTA_NAO_ENCONTRADA', async () => {
    const resposta = await request(appQueLanca(null)).delete('/nada');
    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toEqual({
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: 'Rota DELETE /nada nao existe.',
    });
  });
});
