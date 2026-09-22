const { ErroDeConflito } = require('../dominio/erros');

/**
 * Unico lugar do projeto que fala com a tabela `entregas`.
 */

const TABELA = 'entregas';
const VIOLACAO_DE_UNICIDADE = '23505';

/**
 * @throws {ErroDeConflito} PEDIDO_JA_ENTREGUE se o pedido ja tem entrega. Com o
 *   dia travado isto nao deveria acontecer; o indice UNIQUE e a garantia.
 */
async function inserir(dados, trx) {
  try {
    const [entrega] = await trx(TABELA)
      .insert({
        pedido_id: dados.pedidoId,
        // JSON.stringify explicito: o driver pg serializaria um array JSONB
        // como array do Postgres, nao como JSON.
        diagrama: JSON.stringify(dados.diagrama),
        diff: JSON.stringify(dados.diff),
        nota: dados.nota,
        aceita: dados.aceita,
        pontos: dados.pontos,
        moedas: dados.moedas,
        gorjeta: dados.gorjeta,
        entregue_ms: dados.entregueMs,
      })
      .returning('*');
    return entrega;
  } catch (erro) {
    if (erro.code === VIOLACAO_DE_UNICIDADE) {
      throw new ErroDeConflito('Este pedido ja foi entregue.', 'PEDIDO_JA_ENTREGUE');
    }
    throw erro;
  }
}

module.exports = { inserir };
