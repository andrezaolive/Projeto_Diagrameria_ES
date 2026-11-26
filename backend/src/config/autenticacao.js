const ambiente = require('./ambiente');

/**
 * Configuracao de autenticacao: segredo e expiracao do JWT, custo do bcrypt.
 *
 * Separado de ambiente.js para que so quem assina ou verifica token dependa do
 * segredo — a CLI de migration, por exemplo, nao depende.
 *
 * A regra continua a mesma de antes: sem segredo, ou com o valor de exemplo, o
 * modulo lanca no require. Subir assinando token com segredo previsivel e pior
 * do que nao subir.
 */

const PLACEHOLDER_SEGREDO = 'troque-este-valor-antes-de-rodar';

const segredo = process.env.JWT_SEGREDO;

if (segredo === undefined || segredo.trim() === '') {
  throw new Error(
    'Variavel de ambiente JWT_SEGREDO nao definida. Copie o .env.example para .env e preencha.'
  );
}

if (segredo === PLACEHOLDER_SEGREDO) {
  throw new Error(
    'JWT_SEGREDO ainda esta com o valor de exemplo. Gere um valor real com:\n' +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

const expiracao = process.env.JWT_EXPIRACAO?.trim() || '24h';

module.exports = {
  jwt: {
    segredo,
    expiracao,
    // Fixado nos dois lados: sem isto, a verificacao aceitaria qualquer
    // algoritmo HMAC que a lib suporte, e a escolha deixa de ser nossa.
    algoritmo: 'HS256',
  },

  // Custo do bcrypt. Baixo nos testes porque 12 rounds por usuario criado deixa
  // a suite de integracao lenta demais para rodar a cada salvamento.
  custoBcrypt: ambiente.ehTeste ? 4 : 12,
};
