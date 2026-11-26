/**
 * Ponto de entrada da API na Vercel (funcao serverless). O vercel.json manda
 * todo caminho para ca, e o Express roteia pelo caminho original (/api/...).
 *
 * Local continua sendo src/server.js (`npm run dev`), que sobe a porta e
 * confere o banco antes; aqui nao ha porta, a Vercel chama o app direto.
 */

// O Knex carrega o driver pelo nome ('pg') em tempo de execucao, e o empacotador
// da Vercel nao enxerga esse require. Importar aqui garante que o pg vai junto.
require('pg');

const { criarApp } = require('../src/app');

module.exports = criarApp();
