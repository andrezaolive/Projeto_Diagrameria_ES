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

const conexao = {
  host: ambiente.banco.host,
  port: ambiente.banco.porta,
  user: ambiente.banco.usuario,
  password: ambiente.banco.senha,
  database: ambiente.banco.nome,
};

const base = {
  client: 'pg',
  connection: conexao,
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

  production: {
    ...base,
    pool: { min: 2, max: 20 },
  },
};
