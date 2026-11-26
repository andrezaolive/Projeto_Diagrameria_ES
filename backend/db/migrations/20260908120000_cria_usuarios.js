/**
 * Tabela de usuarios: o jogador que cria conta e loga.
 *
 * A senha nunca e gravada em claro — a coluna guarda o hash bcrypt e por isso
 * se chama `senha_hash`, para ninguem confundir na hora de escrever um SELECT.
 */

exports.up = async function up(knex) {
  // gen_random_uuid() vem daqui. Postgres 13+ ja traz a extensao no core.
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await knex.schema.createTable('usuarios', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    tabela.string('nome', 80).notNullable();

    // Guardado sempre em minusculas (normalizado no repositorio). O UNIQUE
    // simples basta porque o dado ja entra normalizado: dois cadastros com
    // "Ana@x.com" e "ana@x.com" colidem no indice, como deve ser.
    tabela.string('email', 255).notNullable().unique();

    tabela.string('senha_hash', 60).notNullable();

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('usuarios');
  // A extensao nao e derrubada de proposito: outras tabelas podem depender dela.
};
