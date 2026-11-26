const path = require('path');
const ambiente = require('./src/config/ambiente');

/**
 * Configuracao do Knex — usado como query builder e ferramenta de migration,
 * nunca como ORM. O SQL das consultas fica explicito nos repositorios.
 *
 * Le a CLI (`npm run migrate`) e a aplicacao (src/config/banco.js) pelo mesmo
 * arquivo, para nao existir a chance de a migration criar a tabela em um banco
 * e o servidor procurar em outro.
 */

const { conexaoDoBanco } = require('./src/config/conexao');

const base = {
  client: 'pg',
  connection: conexaoDoBanco(ambiente.banco),
  migrations: {
    directory: path.join(__dirname, 'db', 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'db', 'seeds'),
  },
};

module.exports = {
  development: {
    ...base,
    pool: { min: 0, max: 10 },
  },

  test: {
    ...base,
    // Uma conexao so: a suite roda em serie (maxWorkers 1) e um pool ocioso
    // segura o processo do Jest aberto no fim dos testes.
    pool: { min: 0, max: 1 },
  },

  // Na Vercel cada instancia da funcao abre o proprio pool, e varias podem
  // existir ao mesmo tempo: poucas conexoes por instancia, nenhuma presa ociosa.
  // O pooler do Neon (DATABASE_URL) e quem segura a multidao.
  production: {
    ...base,
    pool: { min: 0, max: 2 },
  },

  // So para migrations em producao (`npm run migrate:direto`, scripts/vercel-build.js):
  // conexao direta, sem o pooler, que nao combina com DDL em transacao.
  migracao: {
    ...base,
    connection: conexaoDoBanco(ambiente.banco, { direta: true }),
    pool: { min: 0, max: 1 },
  },
};
