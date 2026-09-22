const { Router } = require('express');
const controlador = require('../controladores/autenticacao.controlador');
const { validaCorpo } = require('../middlewares/validaEntrada');
const { exigeAutenticacao } = require('../middlewares/autenticacao');
const { limitaTentativas } = require('../middlewares/limitaTentativas');
const ambiente = require('../config/ambiente');

/**
 * Rotas de conta. Os schemas ficam ao lado das rotas de proposito: e aqui que
 * se le, de uma vez, o que a rota aceita e o que ela faz.
 *
 * `additionalProperties: false` segue a mesma linha do schema do diagrama —
 * campo escrito errado falha na hora, em vez de ser ignorado em silencio.
 *
 * `maxBytes` e `semEspacosNasPontas` sao palavras-chave nossas, definidas em
 * src/dominio/validacao.js.
 */

const schemaCadastro = {
  type: 'object',
  required: ['nome', 'email', 'senha'],
  additionalProperties: false,
  properties: {
    nome: { type: 'string', minLength: 2, maxLength: 80, semEspacosNasPontas: true },
    email: { type: 'string', format: 'email', maxLength: 255 },
    // 8 caracteres e o minimo; o resto do custo de quebrar fica com o bcrypt.
    // O teto e em bytes porque e em bytes que o bcrypt corta.
    senha: { type: 'string', minLength: 8, maxLength: 72, maxBytes: 72 },
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
    senha: { type: 'string', maxLength: 72, maxBytes: 72 },
  },
};

// Desligados na suite de integracao, que faz dezenas de cadastros e logins
// seguidos do mesmo IP. O comportamento do limite tem teste proprio em
// testes/unitarios/limitaTentativas.test.js.
const QUINZE_MINUTOS = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

const limiteDeLogin = limitaTentativas({
  limite: 10,
  janelaMs: QUINZE_MINUTOS,
  porEmail: true,
  ativo: !ambiente.ehTeste,
});

// Por IP, e mais folgado: uma turma inteira pode criar conta do mesmo
// laboratorio na primeira aula.
const limiteDeCadastro = limitaTentativas({
  limite: 60,
  janelaMs: UMA_HORA,
  ativo: !ambiente.ehTeste,
});

const rotas = Router();

// O limite vem antes da validacao: corpo invalido tambem conta como tentativa.
rotas.post('/cadastro', limiteDeCadastro, validaCorpo(schemaCadastro), controlador.cadastrar);
rotas.post('/login', limiteDeLogin, validaCorpo(schemaLogin), controlador.entrar);
rotas.get('/eu', exigeAutenticacao, controlador.eu);

module.exports = rotas;
