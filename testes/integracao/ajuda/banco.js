const bancoDeDados = require('../../../src/config/banco');

/**
 * Ajudantes de banco para os testes de integracao.
 *
 * O banco alvo e o `DB_NOME_TESTE` — src/config/ambiente.js troca a conexao
 * quando NODE_ENV e 'test'. Nao ha protecao a mais aqui de proposito: a decisao
 * mora num lugar so.
 */

/** Aplica as migrations. Chamar no beforeAll de cada suite de integracao. */
async function prepararBanco() {
  await bancoDeDados.migrate.latest();
}

/**
 * Esvazia as tabelas de dados entre os testes, sem tocar em knex_migrations —
 * apagar o controle de migration faria a proxima suite tentar recriar tudo.
 */
async function limparTabelas() {
  await bancoDeDados.raw('TRUNCATE TABLE usuarios, gabaritos RESTART IDENTITY CASCADE');
}

/** Fecha o pool. Sem isso o processo do Jest fica aberto depois dos testes. */
async function encerrarBanco() {
  await bancoDeDados.destroy();
}

module.exports = { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco };
