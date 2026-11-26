const repositorio = require('../repositorios/progresso.repositorio');
const { ErroNaoEncontrado } = require('../dominio/erros');

/**
 * Progresso do jogador. O save e opaco para o servidor: ele guarda e devolve,
 * sem validar regra de jogo (a correcao roda no navegador).
 */

function paraResposta(linha) {
  return {
    dados: linha.dados,
    versao: linha.versao,
    atualizadoEm: linha.atualizado_em,
  };
}

/**
 * @param {string} usuarioId
 * @returns {Promise<object>}
 * @throws {ErroNaoEncontrado} SEM_PROGRESSO se a conta ainda nao salvou nada.
 */
async function buscar(usuarioId) {
  const linha = await repositorio.buscar(usuarioId);
  if (!linha) {
    throw new ErroNaoEncontrado('Esta conta ainda nao tem progresso salvo.', 'SEM_PROGRESSO');
  }
  return paraResposta(linha);
}

/**
 * @param {string} usuarioId
 * @param {object} dados
 * @returns {Promise<object>}
 */
async function salvar(usuarioId, dados) {
  return paraResposta(await repositorio.gravar(usuarioId, dados));
}

module.exports = { buscar, salvar };
