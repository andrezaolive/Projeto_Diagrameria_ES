const bancoDeDados = require('../config/banco');

/**
 * Unico lugar do projeto que fala com a tabela `gabaritos`.
 */

const TABELA = 'gabaritos';

/**
 * Sorteia um gabarito ativo para um pedido novo.
 *
 * A preferencia, em ordem:
 * 1. a dificuldade da fase (RF19); sem gabarito dela, a mais proxima;
 * 2. um que ainda nao saiu neste dia;
 * 3. um que o jogador nunca viu — depois da entrega ele ve o esperado (RF15),
 *    entao repetir entregaria a resposta.
 *
 * Nada e proibido: se so sobrar gabarito ja visto, ele sai. Um dia sem pedido
 * seria pior do que um pedido repetido.
 *
 * @param {object} criterio
 * @param {number} criterio.dificuldade
 * @param {string} criterio.usuarioId
 * @param {string[]} criterio.jaSorteadosNoDia
 * @returns {Promise<{id: string, dificuldade: number, tempo_limite_segundos: number}|undefined>}
 */
async function sortear({ dificuldade, usuarioId, jaSorteadosNoDia }, trx = bancoDeDados) {
  return trx(TABELA)
    .select('id', 'dificuldade', 'tempo_limite_segundos')
    .where({ ativo: true })
    .orderByRaw('abs(dificuldade - ?)', [dificuldade])
    .orderByRaw('(id = ANY(?::uuid[]))', [jaSorteadosNoDia])
    .orderByRaw(
      `EXISTS (
        SELECT 1 FROM pedidos p
        JOIN dias d ON d.id = p.dia_id
        JOIN entregas e ON e.pedido_id = p.id
        WHERE p.gabarito_id = gabaritos.id AND d.usuario_id = ?
      )`,
      [usuarioId]
    )
    .orderByRaw('random()')
    .first();
}

/** Gabarito completo, com o diagrama. So o servico de entrega pede isto. */
async function buscarPorId(id, trx = bancoDeDados) {
  return trx(TABELA).where({ id }).first();
}

module.exports = { sortear, buscarPorId };
