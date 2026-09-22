/**
 * Titulo de gabarito passa a ser unico.
 *
 * E a chave natural que o seed usa para fazer upsert: rodar o seed de novo
 * atualiza o gabarito existente em vez de apagar e recriar — apagar quebraria
 * (ou levaria junto, com CASCADE) as partidas que ja apontam para ele.
 */

exports.up = async function up(knex) {
  await knex.schema.alterTable('gabaritos', (tabela) => {
    tabela.unique(['titulo'], { indexName: 'gabaritos_titulo_unico' });
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('gabaritos', (tabela) => {
    tabela.dropUnique(['titulo'], 'gabaritos_titulo_unico');
  });
};
