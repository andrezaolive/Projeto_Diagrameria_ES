/**
 * Pedido: um cliente do dia, com o gabarito que ele quer.
 *
 * Os pedidos do dia sao todos sorteados quando o dia comeca, com o horario de
 * chegada de cada um (`chegada_ms`, em tempo de jogo). O frontend so ve o
 * pedido depois que esse horario chega (RNF: o servidor e a autoridade).
 *
 * `paciencia_ms` e `dificuldade` sao COPIADAS do gabarito no sorteio: editar o
 * gabarito depois nao pode mudar o prazo nem o valor de um pedido ja feito.
 *
 * `status` gravado: aguardando, aceito, entregue, expirado. Um pedido pode estar
 * expirado no tempo e ainda "aguardando" aqui — o estado valido e o derivado
 * (relogio.estadoDoPedido). O `expirado` gravado so aparece quando o dia
 * encerra, para o historico.
 */

const STATUS = ['aguardando', 'aceito', 'entregue', 'expirado'];

exports.up = async function up(knex) {
  await knex.schema.createTable('pedidos', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    tabela.uuid('dia_id').notNullable().references('id').inTable('dias').onDelete('CASCADE');
    // RESTRICT: gabarito usado em partida se aposenta com `ativo = false`, nunca some.
    tabela
      .uuid('gabarito_id')
      .notNullable()
      .references('id')
      .inTable('gabaritos')
      .onDelete('RESTRICT');

    tabela.integer('ordem').notNullable();
    tabela.integer('chegada_ms').notNullable();
    tabela.integer('paciencia_ms').notNullable();
    tabela.integer('dificuldade').notNullable();
    tabela.integer('aceito_ms').nullable();
    tabela.string('status', 20).notNullable().defaultTo('aguardando');

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    tabela.unique(['dia_id', 'ordem'], { indexName: 'pedidos_ordem_unica_no_dia' });
    tabela.index(['gabarito_id'], 'pedidos_gabarito_idx');

    tabela.check(
      `status IN (${STATUS.map((s) => `'${s}'`).join(', ')})`,
      [],
      'pedidos_status_valido'
    );
    tabela.check('chegada_ms >= 0', [], 'pedidos_chegada_valida');
    tabela.check('paciencia_ms > 0', [], 'pedidos_paciencia_valida');
    tabela.check('dificuldade BETWEEN 1 AND 5', [], 'pedidos_dificuldade_valida');
  });

  await knex.raw(`
    CREATE TRIGGER pedidos_atualizado_em
    BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em()
  `);
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('pedidos');
};
