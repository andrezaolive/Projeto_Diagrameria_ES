const { ajv, paraDetalhes } = require('../validacao');
const { verificarIntegridade } = require('./integridade');
const { compararDiagramas } = require('./validadorUML');
const schema = require('../../../docs/schemas/diagrama.schema.json');

/**
 * Porta de entrada unica para "este diagrama e aceitavel?".
 *
 * Usado em todo lugar onde um diagrama entra no sistema: gravacao de gabarito
 * (seed hoje; rota de admin depois) e, na Sprint 2, a entrega do jogador.
 *
 * O schema continua morando em docs/schemas/, porque e o contrato que o
 * frontend le. Este modulo so o carrega — nao existe segunda copia.
 */

const validarFormato = ajv.compile(schema);

/**
 * Formato (schema) primeiro, coerencia (ids) depois. A integridade so roda se o
 * formato passar, porque ela assume que `classes` e `relacionamentos` sao listas
 * bem formadas.
 *
 * @param {unknown} diagrama
 * @returns {{campo: string, mensagem: string}[]}  Vazio quando o diagrama e valido.
 */
function validarDiagrama(diagrama) {
  if (!validarFormato(diagrama)) {
    return paraDetalhes(validarFormato.errors);
  }
  return verificarIntegridade(diagrama);
}

module.exports = { validarDiagrama, verificarIntegridade, compararDiagramas, schema };
