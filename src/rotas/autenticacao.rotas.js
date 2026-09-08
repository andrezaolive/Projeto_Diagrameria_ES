const { Router } = require('express');
const controlador = require('../controladores/autenticacao.controlador');
const { validaCorpo } = require('../middlewares/validaEntrada');
const { exigeAutenticacao } = require('../middlewares/autenticacao');

/**
 * Rotas de conta. Os schemas ficam ao lado das rotas de proposito: e aqui que
 * se le, de uma vez, o que a rota aceita e o que ela faz.
 *
 * `additionalProperties: false` segue a mesma linha do schema do diagrama —
 * campo escrito errado falha na hora, em vez de ser ignorado em silencio.
 */

const schemaCadastro = {
  type: 'object',
  required: ['nome', 'email', 'senha'],
  additionalProperties: false,
  properties: {
    nome: { type: 'string', minLength: 2, maxLength: 80 },
    email: { type: 'string', format: 'email', maxLength: 255 },
    // 8 caracteres e o minimo; o resto do custo de quebrar fica com o bcrypt.
    senha: { type: 'string', minLength: 8, maxLength: 72 },
  },
};

const schemaLogin = {
  type: 'object',
  required: ['email', 'senha'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    // Sem minLength: no login o tamanho da senha nao e criterio de validacao,
    // e recusar por tamanho revelaria a regra vigente quando a conta foi criada.
    senha: { type: 'string', maxLength: 72 },
  },
};

const rotas = Router();

rotas.post('/cadastro', validaCorpo(schemaCadastro), controlador.cadastrar);
rotas.post('/login', validaCorpo(schemaLogin), controlador.entrar);
rotas.get('/eu', exigeAutenticacao, controlador.eu);

module.exports = rotas;
