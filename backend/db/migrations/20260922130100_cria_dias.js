/**
 * Dia de trabalho: uma rodada do jogo, numa fase (RF17, RF23).
 *
 * O relogio do dia e o "tempo de jogo" (src/dominio/jogo/relogio.js):
 *
 *   tempo = agora - iniciado_em - tempo_pausado_ms - (pausa em curso)
 *
 * Por isso a pausa (RF29) so grava `pausado_em` e, ao retomar, soma a duracao
 * em `tempo_pausado_ms`. Nenhum prazo de pedido precisa ser reescrito.
 *
 * `resumo` e preenchido uma vez, quando o dia encerra: e o relatorio do fim do
 * dia (RF23), guardado para nao depender de recalcular com regras que podem
 * ter mudado depois.
 */

const STATUS = ['em_andamento', 'pausado', 'concluido', 'game_over'];

exports.up = async function up(knex) {
  await knex.schema.createTable('dias', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // CASCADE: excluir a conta leva o historico junto.
    tabela
      .uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE');
    tabela.integer('fase').notNullable();
    tabela.string('status', 20).notNullable().defaultTo('em_andamento');

    tabela.timestamp('iniciado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('pausado_em', { useTz: true }).nullable();
    tabela.integer('tempo_pausado_ms').notNullable().defaultTo(0);
    tabela.integer('pausas_usadas').notNullable().defaultTo(0);
    tabela.timestamp('encerrado_em', { useTz: true }).nullable();
    tabela.jsonb('resumo').nullable();

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    tabela.check(`status IN (${STATUS.map((s) => `'${s}'`).join(', ')})`, [], 'dias_status_valido');
    tabela.check('fase >= 1', [], 'dias_fase_valida');
    tabela.check('tempo_pausado_ms >= 0', [], 'dias_tempo_pausado_valido');
    // Pausado se e somente se ha pausa em curso.
    tabela.check("(status = 'pausado') = (pausado_em IS NOT NULL)", [], 'dias_pausa_coerente');
  });

  // Um dia aberto por jogador. A checagem do servico e conveniencia; esta e a
  // garantia contra dois "iniciar" simultaneos.
  await knex.raw(`
    CREATE UNIQUE INDEX dias_um_aberto_por_usuario
    ON dias (usuario_id)
    WHERE status IN ('em_andamento', 'pausado')
  `);

  await knex.raw(`
    CREATE TRIGGER dias_atualizado_em
    BEFORE UPDATE ON dias
    FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em()
  `);
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('dias');
};
