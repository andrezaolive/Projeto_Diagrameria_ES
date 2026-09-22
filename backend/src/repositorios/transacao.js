const bancoDeDados = require('../config/banco');

/**
 * Transacao e relogio, para o servico nao precisar importar o banco.
 *
 * O servico decide O QUE tem que ser atomico; o repositorio continua sendo o
 * unico que sabe COMO se fala com o Postgres.
 */

/**
 * @template T
 * @param {(trx: object) => Promise<T>} trabalho
 * @returns {Promise<T>}
 */
function emTransacao(trabalho) {
  return bancoDeDados.transaction(trabalho);
}

/**
 * Horario do servidor de banco, lido dentro da transacao (RNF: uma fonte de
 * relogio so). Dentro de uma transacao, now() e o inicio dela: todas as contas
 * de uma mesma acao usam o mesmo instante.
 *
 * @returns {Promise<number>} epoch em milissegundos.
 */
async function agora(trx = bancoDeDados) {
  const { rows } = await trx.raw('SELECT now() AS agora');
  return rows[0].agora.getTime();
}

/** Id que nao e UUID nunca existe: evita o erro 22P02 do Postgres virar 500. */
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ehUuid(valor) {
  return typeof valor === 'string' && FORMATO_UUID.test(valor);
}

module.exports = { emTransacao, agora, ehUuid };
