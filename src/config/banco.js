const knex = require('knex');
const configuracoes = require('../../knexfile');
const ambiente = require('./ambiente');

/**
 * Instancia unica do Knex, compartilhada por todos os repositorios.
 *
 * Isto e a unica coisa no projeto que abre conexao com o Postgres. Repositorio
 * importa daqui; servico e dominio nunca tocam neste modulo.
 */
const bancoDeDados = knex(configuracoes[ambiente.ambiente] ?? configuracoes.development);

module.exports = bancoDeDados;
