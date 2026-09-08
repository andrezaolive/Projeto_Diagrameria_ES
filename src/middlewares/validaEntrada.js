const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { ErroDeValidacao } = require('../dominio/erros');

/**
 * Validacao do corpo da requisicao com JSON Schema.
 *
 * O mesmo Ajv que valida o diagrama valida o corpo das rotas: uma unica
 * gramatica de erro no projeto inteiro, e o frontend recebe sempre o mesmo
 * formato de `detalhes`.
 *
 * `coerceTypes` fica desligado de proposito — "1" nao deve virar 1 sem alguem
 * ter pedido. `removeAdditional` tambem: campo desconhecido e erro, nao lixo
 * para ignorar em silencio.
 */

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

/** Traduz o erro cru do Ajv para algo que cabe numa mensagem de tela. */
function paraDetalhes(errosDoAjv) {
  return errosDoAjv.map((erro) => ({
    // instancePath vem como "/email"; a raiz vem vazia.
    campo: erro.instancePath.replace(/^\//, '') || erro.params?.missingProperty || '(corpo)',
    mensagem: erro.message,
  }));
}

/**
 * @param {object} schema  JSON Schema do corpo esperado.
 * @returns {Function} middleware Express.
 */
function validaCorpo(schema) {
  const validar = ajv.compile(schema);

  return function middlewareDeValidacao(req, _res, proximo) {
    if (!validar(req.body ?? {})) {
      return proximo(
        new ErroDeValidacao(
          'Os dados enviados nao passaram na validacao.',
          paraDetalhes(validar.errors)
        )
      );
    }
    return proximo();
  };
}

module.exports = { validaCorpo };
