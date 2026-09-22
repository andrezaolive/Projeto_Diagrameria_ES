const diaServico = require('../servicos/dia.servico');
const pedidoServico = require('../servicos/pedido.servico');

/**
 * Camada HTTP do jogo: le a requisicao, chama o servico, responde. Nenhuma
 * regra de jogo mora aqui.
 *
 * `req.usuario.id` vem do token (exigeAutenticacao). Nenhuma rota aceita id de
 * usuario vindo do cliente: o dono de dia e pedido e sempre quem esta logado.
 */

async function progresso(req, res) {
  res.status(200).json(await diaServico.progresso(req.usuario.id));
}

async function iniciarDia(req, res) {
  res.status(201).json(await diaServico.iniciar(req.usuario.id));
}

async function diaAtual(req, res) {
  res.status(200).json(await diaServico.atual(req.usuario.id));
}

async function consultarDia(req, res) {
  res.status(200).json(await diaServico.consultar(req.params.id, req.usuario.id));
}

async function pausar(req, res) {
  res.status(200).json(await diaServico.pausar(req.params.id, req.usuario.id));
}

async function retomar(req, res) {
  res.status(200).json(await diaServico.retomar(req.params.id, req.usuario.id));
}

async function aceitarPedido(req, res) {
  res.status(200).json(await pedidoServico.aceitar(req.params.id, req.usuario.id));
}

async function entregarPedido(req, res) {
  const resultado = await pedidoServico.entregar(req.params.id, req.usuario.id, req.body.diagrama);
  res.status(201).json(resultado);
}

module.exports = {
  progresso,
  iniciarDia,
  diaAtual,
  consultarDia,
  pausar,
  retomar,
  aceitarPedido,
  entregarPedido,
};
