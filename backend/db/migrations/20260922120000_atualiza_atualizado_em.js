/**
 * Mantem a coluna `atualizado_em` verdadeira.
 *
 * O `defaultTo(now())` so vale no INSERT; sem este trigger a coluna ficaria
 * congelada no instante da criacao e mentiria para quem a consultasse. Feito no
 * banco, e nao no repositorio, para valer tambem para UPDATE escrito a mao no
 * psql ou numa migration de dados.
 *
 * Tabela nova com `atualizado_em` precisa do mesmo trigger na migration que a
 * cria: `CREATE TRIGGER <tabela>_atualizado_em BEFORE UPDATE ON <tabela>
 * FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em()`.
 */

const TABELAS = ['usuarios', 'gabaritos'];

exports.up = async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION atualiza_atualizado_em() RETURNS trigger AS $$
    BEGIN
      NEW.atualizado_em = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  for (const tabela of TABELAS) {
    await knex.raw(`
      CREATE TRIGGER ${tabela}_atualizado_em
      BEFORE UPDATE ON ${tabela}
      FOR EACH ROW EXECUTE FUNCTION atualiza_atualizado_em()
    `);
  }
};

exports.down = async function down(knex) {
  for (const tabela of TABELAS) {
    await knex.raw(`DROP TRIGGER IF EXISTS ${tabela}_atualizado_em ON ${tabela}`);
  }
  await knex.raw('DROP FUNCTION IF EXISTS atualiza_atualizado_em()');
};
