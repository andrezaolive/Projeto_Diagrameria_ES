/**
 * Tabela de gabaritos: o diagrama "certo" de cada pedido que o cliente faz no
 * balcao, junto com o enunciado que o jogador le.
 *
 * A coluna `diagrama` e JSONB no MESMO formato que o Canvas produz e que o
 * docs/schemas/diagrama.schema.json descreve. Nao e normalizada em tabelas de
 * classe/relacionamento de proposito: o ValidadorUML compara dois documentos
 * inteiros, e quebrar isso em linhas so criaria trabalho de remontagem.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('gabaritos', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    tabela.string('titulo', 120).notNullable();

    // O que o cliente pede, em texto. E o unico enunciado que o jogador ve.
    tabela.text('enunciado').notNullable();

    tabela.jsonb('diagrama').notNullable();

    // 1 a 5. Usado na Sprint 2 para escolher que pedido cai em que fase.
    tabela.integer('dificuldade').notNullable().defaultTo(1);

    // Tempo de paciencia do cliente, base para o prazo do pedido.
    tabela.integer('tempo_limite_segundos').notNullable().defaultTo(180);

    // Permite aposentar um gabarito sem apagar as partidas que ja o usaram.
    tabela.boolean('ativo').notNullable().defaultTo(true);

    tabela.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    tabela.check('dificuldade BETWEEN 1 AND 5', [], 'gabaritos_dificuldade_valida');
    tabela.check('tempo_limite_segundos > 0', [], 'gabaritos_tempo_positivo');
  });

  // O sorteio da Sprint 2 e sempre "um gabarito ativo desta dificuldade".
  await knex.schema.alterTable('gabaritos', (tabela) => {
    tabela.index(['ativo', 'dificuldade'], 'gabaritos_ativo_dificuldade_idx');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('gabaritos');
};
