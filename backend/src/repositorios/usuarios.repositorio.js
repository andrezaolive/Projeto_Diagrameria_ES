const bancoDeDados = require('../config/banco');
const { ErroDeConflito } = require('../dominio/erros');

/**
 * Unico lugar do projeto que fala com a tabela `usuarios`.
 *
 * Toda funcao daqui devolve a linha crua do banco (snake_case, com senha_hash).
 * Quem decide o que vira resposta HTTP e o servico — o repositorio nao esconde
 * coluna, so nao inventa nenhuma.
 */

const TABELA = 'usuarios';

/** Email e comparado e gravado sempre em minusculas, sem espacos nas pontas. */
function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

async function buscarPorEmail(email) {
  return bancoDeDados(TABELA)
    .where({ email: normalizarEmail(email) })
    .first();
}

async function buscarPorId(id, trx = bancoDeDados) {
  return trx(TABELA).where({ id }).first();
}

/** RF21: credito de moedas em caixa. Incremento no banco, sem ler-e-somar. */
async function creditarMoedas(id, valor, trx) {
  if (valor === 0) return;
  await trx(TABELA).where({ id }).increment('moedas', valor);
}

/**
 * RF17: avanca a fase ao fim de um dia sem Game Over. So avanca se o jogador
 * ainda estiver na fase do dia: encerrar o mesmo dia duas vezes nao pula fase.
 */
async function avancarFase(id, faseDoDia, trx) {
  await trx(TABELA)
    .where({ id, fase_atual: faseDoDia })
    .update({ fase_atual: faseDoDia + 1 });
}

/** Codigo SQLSTATE do Postgres para violacao de indice UNIQUE. */
const VIOLACAO_DE_UNICIDADE = '23505';

/**
 * @param {{nome: string, email: string, senhaHash: string}} dados
 * @returns {Promise<object>} a linha inserida.
 * @throws {ErroDeConflito} EMAIL_EM_USO se o email ja existe.
 */
async function inserir({ nome, email, senhaHash }) {
  try {
    const [usuario] = await bancoDeDados(TABELA)
      .insert({
        nome,
        email: normalizarEmail(email),
        senha_hash: senhaHash,
      })
      .returning('*');

    return usuario;
  } catch (erro) {
    // Traduzido aqui porque codigo de erro do Postgres e assunto do repositorio:
    // o servico so precisa saber que o email ja estava em uso.
    if (erro.code === VIOLACAO_DE_UNICIDADE) {
      throw new ErroDeConflito('Ja existe uma conta com este email.', 'EMAIL_EM_USO');
    }
    throw erro;
  }
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  inserir,
  normalizarEmail,
  creditarMoedas,
  avancarFase,
};
