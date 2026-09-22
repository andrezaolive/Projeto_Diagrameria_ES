/**
 * Entrega: o diagrama que o jogador enviou para um pedido, e o resultado.
 *
 * `pedido_id` e UNIQUE: uma entrega por pedido, e ela e final (decisao da
 * Sprint 2). A checagem do servico e conveniencia; o indice e a garantia contra
 * duplo clique ou duas abas.
 *
 * Linha imutavel: nada atualiza uma entrega depois de gravada, por isso nao ha
 * `atualizado_em`. `diff` e os numeros ficam gravados como foram calculados —
 * mudar os pesos em regras.js depois nao reescreve a nota de ninguem.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('entregas', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    tabela
      .uuid('pedido_id')
      .notNullable()
      .unique({ indexName: 'entregas_uma_por_pedido' })
      .references('id')
      .inTable('pedidos')
      .onDelete('CASCADE');

    tabela.jsonb('diagrama').notNullable();
    tabela.jsonb('diff').notNullable();
    // double, nao numeric: o driver pg devolve numeric como string.
    tabela.double('nota').notNullable();
    tabela.boolean('aceita').notNullable();
    tabela.integer('pontos').notNullable();
    tabela.integer('moedas').notNullable();
    tabela.integer('gorjeta').notNullable();
    tabela.integer('entregue_ms').notNullable();

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    tabela.check('nota BETWEEN 0 AND 1', [], 'entregas_nota_valida');
    tabela.check('moedas >= 0 AND gorjeta >= 0', [], 'entregas_valores_validos');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('entregas');
};
