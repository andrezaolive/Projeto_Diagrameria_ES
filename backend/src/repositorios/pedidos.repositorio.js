const bancoDeDados = require('../config/banco');
const { ehUuid } = require('./transacao');

/**
 * Unico lugar do projeto que fala com a tabela `pedidos`.
 *
 * As consultas daqui juntam o titulo e o enunciado do gabarito, mas NUNCA o
 * diagrama: o que sai daqui vai para o jogador antes da entrega, e o gabarito
 * so pode aparecer depois dela (RF15). Quem precisa do diagrama pede ao
 * repositorio de gabaritos.
 */

const TABELA = 'pedidos';

const COLUNAS_COM_RESULTADO = [
  'pedidos.*',
  'gabaritos.titulo',
  'gabaritos.enunciado',
  'entregas.nota as entrega_nota',
  'entregas.aceita as entrega_aceita',
  'entregas.pontos as entrega_pontos',
  'entregas.moedas as entrega_moedas',
  'entregas.gorjeta as entrega_gorjeta',
];

function comGabaritoEEntrega(trx) {
  return trx(TABELA)
    .join('gabaritos', 'gabaritos.id', 'pedidos.gabarito_id')
    .leftJoin('entregas', 'entregas.pedido_id', 'pedidos.id')
    .select(COLUNAS_COM_RESULTADO);
}

async function inserirVarios(linhas, trx) {
  return trx(TABELA).insert(linhas).returning('*');
}

/** Todos os pedidos do dia, em ordem de chegada. */
async function listarDoDia(diaId, trx = bancoDeDados) {
  return comGabaritoEEntrega(trx).where('pedidos.dia_id', diaId).orderBy('pedidos.ordem');
}

/**
 * Pedido de um dia do jogador. Pedido de outro jogador responde como
 * inexistente.
 */
async function buscarDoUsuario(id, usuarioId, trx = bancoDeDados) {
  if (!ehUuid(id)) return undefined;
  return comGabaritoEEntrega(trx)
    .join('dias', 'dias.id', 'pedidos.dia_id')
    .where({ 'pedidos.id': id, 'dias.usuario_id': usuarioId })
    .first();
}

async function atualizar(id, campos, trx) {
  await trx(TABELA).where({ id }).update(campos);
}

/** Grava como expirados, para o historico, os pedidos que o tempo ja venceu. */
async function marcarExpirados(ids, trx) {
  if (ids.length === 0) return;
  await trx(TABELA).whereIn('id', ids).update({ status: 'expirado' });
}

module.exports = { inserirVarios, listarDoDia, buscarDoUsuario, atualizar, marcarExpirados };
