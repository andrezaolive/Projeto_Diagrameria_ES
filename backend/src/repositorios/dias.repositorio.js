const bancoDeDados = require('../config/banco');
const { ehUuid } = require('./transacao');
const { ErroDeConflito } = require('../dominio/erros');

/**
 * Unico lugar do projeto que fala com a tabela `dias`.
 *
 * Toda acao do jogador sobre um dia (aceitar, entregar, pausar) trava a linha
 * do dia com FOR UPDATE: as acoes de um mesmo jogador ficam em fila, e duas
 * abas abertas nao conseguem entregar ao mesmo tempo.
 */

const TABELA = 'dias';
const VIOLACAO_DE_UNICIDADE = '23505';

/** @throws {ErroDeConflito} DIA_EM_ANDAMENTO se o jogador ja tem um dia aberto. */
async function inserir({ usuarioId, fase }, trx = bancoDeDados) {
  try {
    const [dia] = await trx(TABELA).insert({ usuario_id: usuarioId, fase }).returning('*');
    return dia;
  } catch (erro) {
    // Dois "iniciar" simultaneos: o indice unico parcial segura o segundo.
    if (erro.code === VIOLACAO_DE_UNICIDADE) {
      throw new ErroDeConflito('Ja existe um dia de trabalho em andamento.', 'DIA_EM_ANDAMENTO');
    }
    throw erro;
  }
}

/** Dia em andamento ou pausado do jogador, travado para a transacao. */
async function buscarAberto(usuarioId, trx) {
  return trx(TABELA)
    .where({ usuario_id: usuarioId })
    .whereIn('status', ['em_andamento', 'pausado'])
    .forUpdate()
    .first();
}

/**
 * Dia do jogador, travado. Dia de outro jogador responde como inexistente —
 * nao revela que o id existe.
 */
async function buscarDoUsuario(id, usuarioId, trx) {
  if (!ehUuid(id)) return undefined;
  return trx(TABELA).where({ id, usuario_id: usuarioId }).forUpdate().first();
}

async function atualizar(id, campos, trx) {
  const [dia] = await trx(TABELA).where({ id }).update(campos).returning('*');
  return dia;
}

module.exports = { inserir, buscarAberto, buscarDoUsuario, atualizar };
