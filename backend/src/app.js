const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rotas = require('./rotas');
const ambiente = require('./config/ambiente');
const { tratadorDeErros, rotaNaoEncontrada } = require('./middlewares/tratadorDeErros');

const LIMITE_PROGRESSO = '2mb';

/**
 * Monta o app Express, sem subir servidor.
 *
 * A separacao entre app.js e server.js existe para os testes de integracao
 * poderem passar este objeto direto para o supertest, sem ocupar uma porta.
 */
function criarApp() {
  const app = express();

  if (ambiente.atrasDeProxy) app.set('trust proxy', 1);

  app.use(helmet());

  // Uma origem so: o React em dev. `credentials` fica desligado porque o token
  // vai no header Authorization, nao em cookie.
  app.use(cors({ origin: ambiente.origemPermitida }));

  // O save do jogo (PUT /api/progresso) leva o estado inteiro do frontend:
  // colecao, escritorio, arquivo das ultimas entregas com os diagramas. So essa
  // rota ganha o limite maior; o express.json() de baixo pula corpo ja lido.
  app.use('/api/progresso', express.json({ limit: LIMITE_PROGRESSO }));

  // 100kb da folga para um diagrama grande (40 classes) e ainda corta upload absurdo.
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', rotas);

  app.use(rotaNaoEncontrada);
  app.use(tratadorDeErros);

  return app;
}

module.exports = { criarApp };
