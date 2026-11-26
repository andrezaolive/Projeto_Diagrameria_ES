const bancoDeDados = require('../config/banco');

/**
 * Unico lugar do projeto que fala com a tabela `progressos`. Devolve a linha
 * crua (snake_case).
 */

const TABELA = 'progressos';

async function buscar(usuarioId) {
  return bancoDeDados(TABELA).where({ usuario_id: usuarioId }).first();
}

/**
 * Cria ou substitui o save do usuario, numa query so (sem corrida entre o
 * "ja existe?" e o insert).
 *
 * @param {string} usuarioId
 * @param {object} dados
 * @returns {Promise<object>} a linha gravada.
 */
async function gravar(usuarioId, dados) {
  const [linha] = await bancoDeDados(TABELA)
    .insert({ usuario_id: usuarioId, dados })
    .onConflict('usuario_id')
    .merge({ dados, versao: bancoDeDados.raw('?? + 1', [`${TABELA}.versao`]) })
    .returning('*');
  return linha;
}

module.exports = { buscar, gravar };
