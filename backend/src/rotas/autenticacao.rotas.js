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

// Troca de email e/ou senha. A senha nova segue a mesma regra do cadastro; a
// atual, a mesma do login (sem minLength, pelo mesmo motivo).
const schemaAlterar = {
  type: 'object',
  required: ['senhaAtual'],
  // senhaAtual + pelo menos um de email/senha (additionalProperties barra o resto).
  minProperties: 2,
  additionalProperties: false,
  properties: {
    senhaAtual: schemaLogin.properties.senha,
    email: schemaCadastro.properties.email,
    senha: schemaCadastro.properties.senha,
  },
};

// Desligados na suite de integracao, que faz dezenas de cadastros e logins
// seguidos do mesmo IP. O comportamento do limite tem teste proprio em
// testes/unitarios/limitaTentativas.test.js.
const UM_MINUTO = 60 * 1000;
const QUINZE_MINUTOS = 15 * UM_MINUTO;
const UMA_HORA = 60 * UM_MINUTO;

// RNF22: 5 logins errados em 60 s bloqueiam aquela conta naquele IP ate a
// janela fechar. Login certo nao conta.
const limiteDeLogin = limitaTentativas({
  limite: 5,
  janelaMs: UM_MINUTO,
  porEmail: true,
  soFalhas: true,
  ativo: !ambiente.ehTeste,
});

// Por IP, e mais folgado: uma turma inteira pode criar conta do mesmo
// laboratorio na primeira aula.
const limiteDeCadastro = limitaTentativas({
  limite: 60,
  janelaMs: UMA_HORA,
  ativo: !ambiente.ehTeste,
});

// A troca de conta tambem confere senha, entao tambem serve para chutar senha.
// So por IP: o email do corpo aqui e o novo, e trocar ele zeraria o contador.
const limiteDeAlteracao = limitaTentativas({
  limite: 30,
  janelaMs: QUINZE_MINUTOS,
  ativo: !ambiente.ehTeste,
});

const rotas = Router();

// O limite vem antes da validacao: corpo invalido tambem conta como tentativa.
rotas.post('/cadastro', limiteDeCadastro, validaCorpo(schemaCadastro), controlador.cadastrar);
rotas.post('/login', limiteDeLogin, validaCorpo(schemaLogin), controlador.entrar);
rotas.get('/eu', exigeAutenticacao, controlador.eu);
rotas.patch(
  '/eu',
  exigeAutenticacao,
  limiteDeAlteracao,
  validaCorpo(schemaAlterar),
  controlador.alterar
);

module.exports = rotas;
