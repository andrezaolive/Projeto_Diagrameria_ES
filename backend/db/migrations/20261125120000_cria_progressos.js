/**
 * Progresso salvo de cada jogador: um save por conta.
 *
 * `dados` e o estado do jogo como o frontend o serializa. O servidor guarda e
 * devolve sem interpretar: a correcao dos diagramas e a economia rodam no
 * navegador, e o backend so faz a conta funcionar em qualquer aparelho.
 *
 * Uma linha por usuario (usuario_id e a chave primaria), apagada junto com a conta.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('progressos', (tabela) => {
    tabela.uuid('usuario_id').primary().references('id').inTable('usuarios').onDelete('CASCADE');

    tabela.jsonb('dados').notNullable();

    // Sobe a cada gravacao. Hoje so informa; serve de base para recusar um save
    // mais velho por cima de um mais novo (dois aparelhos abertos ao mesmo tempo).
    tabela.integer('versao').notNullable().defaultTo(1);

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE TRIGGER progressos_atualizado_em
    BEFORE UPDATE ON progressos
    FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em()
  `);
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('progressos');
};
