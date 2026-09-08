const bancoDeDados = require('../config/banco');

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

async function buscarPorId(id) {
  return bancoDeDados(TABELA).where({ id }).first();
}

/**
 * @param {{nome: string, email: string, senhaHash: string}} dados
 * @returns {Promise<object>} a linha inserida.
 */
async function inserir({ nome, email, senhaHash }) {
  const [usuario] = await bancoDeDados(TABELA)
    .insert({
      nome: nome.trim(),
      email: normalizarEmail(email),
      senha_hash: senhaHash,
    })
    .returning('*');

  return usuario;
}

module.exports = { buscarPorEmail, buscarPorId, inserir, normalizarEmail };
