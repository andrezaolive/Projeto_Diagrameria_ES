require('dotenv').config();

/**
 * Le e valida as variaveis de ambiente do processo e do banco, uma unica vez,
 * na subida do processo.
 *
 * A regra e falhar cedo e alto: e melhor se recusar a subir com uma mensagem
 * clara do que subir apontando para o banco errado.
 *
 * O segredo do JWT NAO mora aqui: o knexfile importa este arquivo, e a CLI de
 * migration nao tem por que exigir segredo de token. Ele fica em
 * src/config/autenticacao.js, carregado so por quem assina ou verifica token.
 */

const AMBIENTES_VALIDOS = ['development', 'test', 'production'];

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

// Um NODE_ENV desconhecido ("prod", "staging") cairia na config de
// desenvolvimento sem ninguem perceber. Melhor recusar.
const nomeDoAmbiente = opcional('NODE_ENV', 'development');
if (!AMBIENTES_VALIDOS.includes(nomeDoAmbiente)) {
  throw new Error(
    `NODE_ENV="${nomeDoAmbiente}" nao e reconhecido. Use um de: ${AMBIENTES_VALIDOS.join(', ')}.`
  );
}

const ehTeste = nomeDoAmbiente === 'test';

/**
 * Banco por URL (DATABASE_URL) ou por partes (DB_HOST, DB_USUARIO...).
 *
 * A URL e o que o Neon instalado pelo Marketplace da Vercel injeta no projeto:
 * DATABASE_URL (com pooler, para a API) e DATABASE_URL_UNPOOLED (conexao
 * direta, para as migrations). Os testes ignoram a URL de proposito: um
 * DATABASE_URL esquecido no terminal faria a suite limpar o banco de producao.
 */
function configuracaoDoBanco() {
  const ssl = opcional('DB_SSL', 'false') === 'true';
  const url = ehTeste ? null : opcional('DATABASE_URL', null);

  if (url) {
    return { url, urlDireta: opcional('DATABASE_URL_UNPOOLED', url), ssl };
  }

  return {
    host: opcional('DB_HOST', 'localhost'),
    porta: Number(opcional('DB_PORTA', '5432')),
    usuario: obrigatoria('DB_USUARIO'),
    senha: obrigatoria('DB_SENHA'),
    // Os testes de integracao limpam as tabelas entre os casos. Apontar para o
    // banco de desenvolvimento aqui apagaria os gabaritos do time.
    nome: ehTeste ? obrigatoria('DB_NOME_TESTE') : obrigatoria('DB_NOME'),
    ssl,
  };
}

const ambiente = {
  ambiente: nomeDoAmbiente,
  ehTeste,
  ehProducao: nomeDoAmbiente === 'production',
  porta: Number(opcional('PORTA', '3000')),
  origemPermitida: opcional('ORIGEM_PERMITIDA', 'http://localhost:5173'),

  // A Vercel define VERCEL=1. La o app fica atras do proxy dela, e sem confiar
  // no X-Forwarded-For todo jogador teria o mesmo IP para o limite de tentativas.
  atrasDeProxy: opcional('VERCEL', '') !== '',

  banco: configuracaoDoBanco(),
};

module.exports = ambiente;
