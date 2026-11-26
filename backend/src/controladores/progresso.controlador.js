const servico = require('../servicos/progresso.servico');

/** Camada HTTP do progresso: le a requisicao, chama o servico, responde. */

async function buscar(req, res) {
  res.status(200).json(await servico.buscar(req.usuario.id));
}

async function salvar(req, res) {
  res.status(200).json(await servico.salvar(req.usuario.id, req.body.dados));
}

module.exports = { buscar, salvar };
