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
 * Esvazia todas as tabelas de dados entre os testes.
 *
 * A lista sai do proprio Postgres, para tabela nova entrar sem ninguem lembrar
 * de editar este arquivo. As do Knex (knex_migrations e knex_migrations_lock)
 * ficam de fora: apagar o controle de migration faria a proxima suite tentar
 * recriar tudo.
 */
async function limparTabelas() {
  const { rows } = await bancoDeDados.raw(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE 'knex\\_%'
  `);
  if (rows.length === 0) return;

  const tabelas = rows.map(({ tablename }) => `"${tablename}"`).join(', ');
  await bancoDeDados.raw(`TRUNCATE TABLE ${tabelas} RESTART IDENTITY CASCADE`);
}

/** Fecha o pool. Sem isso o processo do Jest fica aberto depois dos testes. */
async function encerrarBanco() {
  await bancoDeDados.destroy();
}

module.exports = { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco };
