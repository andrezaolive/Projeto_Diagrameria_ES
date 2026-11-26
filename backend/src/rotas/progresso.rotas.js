const { Router } = require('express');
const controlador = require('../controladores/progresso.controlador');
const { validaCorpo } = require('../middlewares/validaEntrada');
const { exigeAutenticacao } = require('../middlewares/autenticacao');

/**
 * Save do jogo na conta. Toda rota exige login: cada um so le e grava o
 * proprio progresso (o id vem do token, nunca da URL ou do corpo).
 *
 * O limite de tamanho do corpo desta rota e maior que o do resto da API e fica
 * em src/app.js (LIMITE_PROGRESSO).
 */

const schemaSalvar = {
  type: 'object',
  required: ['dados'],
  additionalProperties: false,
  properties: {
    // Opaco de proposito: o formato do save e do frontend e muda com o jogo.
    dados: { type: 'object' },
  },
};

const rotas = Router();

rotas.use(exigeAutenticacao);
rotas.get('/', controlador.buscar);
rotas.put('/', validaCorpo(schemaSalvar), controlador.salvar);

module.exports = rotas;
