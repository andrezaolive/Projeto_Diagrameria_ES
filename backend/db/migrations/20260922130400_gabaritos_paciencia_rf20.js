/**
 * RF20: a paciencia do cliente e de 2 a 5 minutos.
 *
 * Os dados existentes sao trazidos para a faixa ANTES de criar a restricao —
 * senao a migration falharia em qualquer banco onde o seed antigo ja rodou (o
 * gabarito "Frota de veiculos" tinha 420 s).
 */

exports.up = async function up(knex) {
  await knex('gabaritos').update({
    tempo_limite_segundos: knex.raw('LEAST(GREATEST(tempo_limite_segundos, 120), 300)'),
  });

  await knex.schema.alterTable('gabaritos', (tabela) => {
    tabela.dropChecks(['gabaritos_tempo_positivo']);
    tabela.check('tempo_limite_segundos BETWEEN 120 AND 300', [], 'gabaritos_paciencia_rf20');
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('gabaritos', (tabela) => {
    tabela.dropChecks(['gabaritos_paciencia_rf20']);
    tabela.check('tempo_limite_segundos > 0', [], 'gabaritos_tempo_positivo');
  });
};
