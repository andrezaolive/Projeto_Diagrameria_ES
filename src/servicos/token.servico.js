const jwt = require('jsonwebtoken');
const { jwt: configuracao } = require('../config/autenticacao');

/**
 * Emissao e verificacao do JWT, num lugar so.
 *
 * O token carrega o minimo: quem e o usuario. Nada de pontuacao, saldo ou
 * progresso — o servidor e a autoridade sobre isso e consulta o banco. Dado de
 * jogo dentro do token seria dado que o cliente controla ate o token expirar.
 */

/**
 * @param {{id: string, email: string}} usuario
 * @returns {string} JWT assinado.
 */
function gerar(usuario) {
  return jwt.sign({ email: usuario.email }, configuracao.segredo, {
    subject: usuario.id,
    expiresIn: configuracao.expiracao,
    algorithm: configuracao.algoritmo,
  });
}

/**
 * @param {string} token
 * @returns {object} conteudo do token.
 * @throws {Error} erro do jsonwebtoken (TokenExpiredError, JsonWebTokenError).
 */
function verificar(token) {
  return jwt.verify(token, configuracao.segredo, { algorithms: [configuracao.algoritmo] });
}

module.exports = { gerar, verificar };
