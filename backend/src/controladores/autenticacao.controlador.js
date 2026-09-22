const servico = require('../servicos/autenticacao.servico');

/**
 * Camada HTTP: le a requisicao, chama o servico, responde. Nenhuma regra de
 * negocio mora aqui.
 *
 * Os handlers sao async e o Express 5 encaminha promise rejeitada para o
 * tratador de erro sozinho — por isso nao ha try/catch nem next(erro).
 */

async function cadastrar(req, res) {
  const { nome, email, senha } = req.body;
  const resultado = await servico.cadastrar({ nome, email, senha });
  res.status(201).json(resultado);
}

async function entrar(req, res) {
  const { email, senha } = req.body;
  const resultado = await servico.entrar({ email, senha });
  res.status(200).json(resultado);
}

async function eu(req, res) {
  const usuario = await servico.perfil(req.usuario.id);
  res.status(200).json({ usuario });
}

module.exports = { cadastrar, entrar, eu };
