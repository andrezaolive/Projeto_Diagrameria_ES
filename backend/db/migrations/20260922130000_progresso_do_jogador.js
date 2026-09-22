/**
 * Progresso do jogador: em que fase esta e quantas moedas tem em caixa.
 *
 * Fica na propria tabela de usuarios porque e 1:1 com a conta e e lido em toda
 * partida. `fase_atual` so muda no fim de um dia sem Game Over (RF17, RF24);
 * `moedas` recebe o credito de cada entrega aceita (RF21) e, na Sprint 3, o
 * debito da loja e do painel de dicas — por isso o CHECK impede saldo negativo.
 */

exports.up = async function up(knex) {
  await knex.schema.alterTable('usuarios', (tabela) => {
    tabela.integer('fase_atual').notNullable().defaultTo(1);
    tabela.integer('moedas').notNullable().defaultTo(0);
    tabela.check('fase_atual >= 1', [], 'usuarios_fase_valida');
    tabela.check('moedas >= 0', [], 'usuarios_moedas_nao_negativas');
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('usuarios', (tabela) => {
    tabela.dropChecks(['usuarios_fase_valida', 'usuarios_moedas_nao_negativas']);
    tabela.dropColumn('fase_atual');
    tabela.dropColumn('moedas');
  });
};
