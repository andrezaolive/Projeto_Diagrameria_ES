const { ajv, paraDetalhes } = require('../dominio/validacao');
const { ErroDeValidacao } = require('../dominio/erros');

/**
 * Validacao do corpo da requisicao com JSON Schema, usando a instancia de Ajv
 * compartilhada com o validador do diagrama (src/dominio/validacao.js).
 */

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
