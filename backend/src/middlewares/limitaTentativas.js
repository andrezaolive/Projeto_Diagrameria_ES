const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { ErroDeLimite } = require('../dominio/erros');

/**
 * Limite de requisicoes por IP, para as rotas que aceitam senha.
 *
 * Sem isto, o login e um oraculo de forca bruta: bcrypt deixa cada tentativa
 * cara para nos, nao para quem esta tentando. O contador fica em memoria, o que
 * basta enquanto houver um processo so; com mais de uma instancia, cada uma
 * conta separado e o limite efetivo multiplica.
 *
 * O estouro vira ErroDeLimite e passa pelo tratadorDeErros, para sair no mesmo
 * formato { erro: { codigo, mensagem } } do resto da API.
 */

/**
 * Chave "IP + email": numa sala de aula ou laboratorio, dezenas de jogadores
 * saem pelo mesmo IP (NAT). Contar so por IP bloquearia a turma inteira por
 * causa de um; contar por IP + email limita a forca bruta contra cada conta.
 * `ipKeyGenerator` agrupa IPv6 por sub-rede — sem isso, trocar o sufixo do
 * endereco zeraria o contador.
 */
function chavePorIpEEmail(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ipKeyGenerator(req.ip)}|${email}`;
}

/**
 * Chave pelo jogador logado, para rotas autenticadas: o limite acompanha a
 * conta, nao a rede. Tem que vir depois de exigeAutenticacao.
 */
function chavePorUsuario(req) {
  return `usuario|${req.usuario.id}`;
}

/**
 * @param {object} opcoes
 * @param {number} opcoes.limite  Requisicoes aceitas por janela.
 * @param {number} opcoes.janelaMs  Tamanho da janela.
 * @param {boolean} [opcoes.porEmail]  Conta por IP + email em vez de so por IP.
 * @param {boolean} [opcoes.porUsuario]  Conta pelo jogador logado (req.usuario).
 * @param {boolean} [opcoes.ativo]  false desliga o limite (usado na suite de integracao).
 * @returns {Function} middleware Express.
 */
function limitaTentativas({
  limite,
  janelaMs,
  porEmail = false,
  porUsuario = false,
  ativo = true,
}) {
  let keyGenerator;
  if (porUsuario) keyGenerator = chavePorUsuario;
  else if (porEmail) keyGenerator = chavePorIpEEmail;

  return rateLimit({
    limit: limite,
    windowMs: janelaMs,
    skip: () => !ativo,
    ...(keyGenerator ? { keyGenerator } : {}),
    // Cabecalhos RateLimit-* padronizados (draft-8), para o frontend saber
    // quanto falta sem ter que adivinhar.
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, proximo) => proximo(new ErroDeLimite()),
  });
}

module.exports = { limitaTentativas };
