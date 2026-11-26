/**
 * Monta a conexao do Knex a partir de `ambiente.banco` (src/config/ambiente.js).
 * Funcao pura, separada do knexfile para ter teste unitario.
 *
 * Com `ssl`, o certificado do servidor e conferido (rejectUnauthorized): Neon e
 * outros Postgres na nuvem usam certificado de autoridade publica.
 *
 * @param {object} banco  `ambiente.banco`: { url, urlDireta, ssl } ou { host, porta, usuario, senha, nome, ssl }.
 * @param {{direta?: boolean}} [opcoes]  direta: usa a URL sem pooler (migrations).
 * @returns {object} o `connection` do Knex.
 */
function conexaoDoBanco(banco, { direta = false } = {}) {
  const ssl = banco.ssl ? { ssl: { rejectUnauthorized: true } } : {};

  if (banco.url) {
    return { connectionString: direta ? banco.urlDireta : banco.url, ...ssl };
  }

  return {
    host: banco.host,
    port: banco.porta,
    user: banco.usuario,
    password: banco.senha,
    database: banco.nome,
    ...ssl,
  };
}

module.exports = { conexaoDoBanco };
