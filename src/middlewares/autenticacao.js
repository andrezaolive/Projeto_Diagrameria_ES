const token = require('../servicos/token.servico');
const { ErroDeAutenticacao } = require('../dominio/erros');

/**
 * Exige um JWT valido no header `Authorization: Bearer <token>`.
 *
 * Em caso de sucesso, deixa em `req.usuario` apenas o que veio assinado no
 * token ({ id, email }). Nao consulta o banco: o token e a prova. Rota que
 * precise do usuario completo chama o repositorio por conta propria.
 */
function exigeAutenticacao(req, _res, proximo) {
  const cabecalho = req.get('authorization') ?? '';
  const [esquema, valor] = cabecalho.split(' ');

  if (esquema !== 'Bearer' || !valor) {
    return proximo(new ErroDeAutenticacao('Envie o token em "Authorization: Bearer <token>".'));
  }

  try {
    const conteudo = token.verificar(valor);
    req.usuario = { id: conteudo.sub, email: conteudo.email };
    return proximo();
  } catch (erro) {
    const mensagem =
      erro.name === 'TokenExpiredError'
        ? 'Sessao expirada. Faca login de novo.'
        : 'Token invalido.';
    return proximo(new ErroDeAutenticacao(mensagem));
  }
}

module.exports = { exigeAutenticacao };
