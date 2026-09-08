const { ErroDaAplicacao } = require('../dominio/erros');
const ambiente = require('../config/ambiente');

/** 404 para rota que nao existe. Vem antes do tratador, no fim da cadeia. */
function rotaNaoEncontrada(req, res) {
  res.status(404).json({
    erro: {
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: `Rota ${req.method} ${req.path} nao existe.`,
    },
  });
}

/**
 * Ultimo middleware da cadeia: transforma qualquer erro em uma resposta JSON
 * com o mesmo formato.
 *
 * O contrato com o frontend e sempre { erro: { codigo, mensagem, detalhes? } }.
 * `codigo` e o que o React deve ler para ramificar; `mensagem` e o que ele pode
 * mostrar na tela.
 *
 * Erro inesperado nunca vaza para o cliente: vira 500 generico e o stack vai
 * para o log do servidor. Um stack trace na resposta conta a estrutura de
 * pastas e a versao das libs para quem estiver do outro lado.
 */
// A assinatura de 4 argumentos e o que faz o Express reconhecer o tratador de erro.
function tratadorDeErros(erro, req, res, _proximo) {
  if (erro instanceof ErroDaAplicacao) {
    return res.status(erro.status).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.detalhes ? { detalhes: erro.detalhes } : {}),
      },
    });
  }

  // JSON malformado no corpo: o express.json() lanca antes de qualquer rota.
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: { codigo: 'JSON_INVALIDO', mensagem: 'O corpo da requisicao nao e um JSON valido.' },
    });
  }

  if (!ambiente.ehTeste) {
    console.error(`[erro nao tratado] ${req.method} ${req.path}`, erro);
  }

  return res.status(500).json({
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno no servidor.' },
  });
}

module.exports = { tratadorDeErros, rotaNaoEncontrada };
