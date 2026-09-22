const { Router } = require('express');
const rotasDeAutenticacao = require('./autenticacao.rotas');
const rotasDoJogo = require('./jogo.rotas');

/** Monta todas as rotas da API sob um unico router. */
const rotas = Router();

// Usado pelo docker/CI para saber se o processo esta de pe. Nao consulta o
// banco de proposito: responde sobre o servidor, nao sobre a infraestrutura.
rotas.get('/saude', (_req, res) => {
  res.json({ status: 'ok', versao: require('../../package.json').version });
});

rotas.use('/auth', rotasDeAutenticacao);
rotas.use(rotasDoJogo);

module.exports = rotas;
