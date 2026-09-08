const bcrypt = require('bcrypt');
const repositorio = require('../repositorios/usuarios.repositorio');
const token = require('./token.servico');
const ambiente = require('../config/ambiente');
const { ErroDeConflito, ErroDeAutenticacao, ErroNaoEncontrado } = require('../dominio/erros');

/**
 * Regra de negocio de cadastro e login.
 *
 * Duas decisoes que valem comentario:
 *
 * 1. O login responde a mesma coisa para "email nao existe" e "senha errada".
 *    Mensagens diferentes transformariam a tela de login num verificador de
 *    quem tem conta no jogo.
 *
 * 2. Quando o email nao existe, ainda assim gastamos um bcrypt.compare contra
 *    um hash descartavel. Sem isso, "email inexistente" responderia em 1ms e
 *    "senha errada" em ~200ms, e o tempo de resposta entregaria o que a
 *    mensagem se esforcou para esconder.
 */

// Hash de uma senha que ninguem usa, so para o compare falso ter contra o que rodar.
const HASH_DESCARTAVEL = bcrypt.hashSync('senha-que-nao-e-de-ninguem', ambiente.custoBcrypt);

/** Formato do usuario que sai daqui para o mundo: sem senha_hash, em camelCase. */
function paraResposta(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    criadoEm: linha.criado_em,
  };
}

/**
 * @param {{nome: string, email: string, senha: string}} dados
 * @returns {Promise<{usuario: object, token: string}>}
 */
async function cadastrar({ nome, email, senha }) {
  const jaExiste = await repositorio.buscarPorEmail(email);
  if (jaExiste) {
    throw new ErroDeConflito('Ja existe uma conta com este email.', 'EMAIL_EM_USO');
  }

  const senhaHash = await bcrypt.hash(senha, ambiente.custoBcrypt);

  let usuario;
  try {
    usuario = await repositorio.inserir({ nome, email, senhaHash });
  } catch (erro) {
    // 23505 = unique_violation. Acontece se dois cadastros do mesmo email
    // passarem pela checagem acima ao mesmo tempo — a checagem e conveniencia,
    // o indice UNIQUE e a garantia.
    if (erro.code === '23505') {
      throw new ErroDeConflito('Ja existe uma conta com este email.', 'EMAIL_EM_USO');
    }
    throw erro;
  }

  return { usuario: paraResposta(usuario), token: token.gerar(usuario) };
}

/**
 * @param {{email: string, senha: string}} credenciais
 * @returns {Promise<{usuario: object, token: string}>}
 */
async function entrar({ email, senha }) {
  const usuario = await repositorio.buscarPorEmail(email);
  const hashParaComparar = usuario ? usuario.senha_hash : HASH_DESCARTAVEL;

  const senhaConfere = await bcrypt.compare(senha, hashParaComparar);

  if (!usuario || !senhaConfere) {
    throw new ErroDeAutenticacao('Email ou senha incorretos.');
  }

  return { usuario: paraResposta(usuario), token: token.gerar(usuario) };
}

/**
 * Dados do usuario logado. Vai ao banco em vez de confiar no token porque o
 * nome pode ter mudado depois que o token foi emitido.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
async function perfil(id) {
  const usuario = await repositorio.buscarPorId(id);
  if (!usuario) {
    // Token valido de uma conta que nao existe mais.
    throw new ErroNaoEncontrado('Usuario nao encontrado.');
  }
  return paraResposta(usuario);
}

module.exports = { cadastrar, entrar, perfil };
