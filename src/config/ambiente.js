require('dotenv').config();

/**
 * Le e valida as variaveis de ambiente uma unica vez, na subida do processo.
 *
 * A regra e falhar cedo e alto: e melhor o servidor se recusar a subir com uma
 * mensagem clara do que subir com JWT_SEGREDO indefinido e assinar tokens que
 * qualquer um consegue forjar.
 */

const PLACEHOLDER_SEGREDO = 'troque-este-valor-antes-de-rodar';

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (valor === undefined || valor.trim() === '') {
    throw new Error(
      `Variavel de ambiente ${nome} nao definida. Copie o .env.example para .env e preencha.`
    );
  }
  return valor;
}

function opcional(nome, padrao) {
  const valor = process.env[nome];
  return valor === undefined || valor.trim() === '' ? padrao : valor;
}

const ehTeste = process.env.NODE_ENV === 'test';

const segredoJwt = obrigatoria('JWT_SEGREDO');
if (segredoJwt === PLACEHOLDER_SEGREDO) {
  throw new Error(
    'JWT_SEGREDO ainda esta com o valor de exemplo. Gere um valor real com:\n' +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

const ambiente = {
  ambiente: opcional('NODE_ENV', 'development'),
  ehTeste,
  porta: Number(opcional('PORTA', '3000')),
  origemPermitida: opcional('ORIGEM_PERMITIDA', 'http://localhost:5173'),

  banco: {
    host: opcional('DB_HOST', 'localhost'),
    porta: Number(opcional('DB_PORTA', '5432')),
    usuario: obrigatoria('DB_USUARIO'),
    senha: obrigatoria('DB_SENHA'),
    // Os testes de integracao limpam as tabelas entre os casos. Apontar para o
    // banco de desenvolvimento aqui apagaria os gabaritos do time.
    nome: ehTeste ? obrigatoria('DB_NOME_TESTE') : obrigatoria('DB_NOME'),
  },

  jwt: {
    segredo: segredoJwt,
    expiracao: opcional('JWT_EXPIRACAO', '24h'),
  },

  // Custo do bcrypt. Baixo nos testes porque 12 rounds por usuario criado deixa
  // a suite de integracao lenta demais para rodar a cada salvamento.
  custoBcrypt: ehTeste ? 4 : 12,
};

module.exports = ambiente;
