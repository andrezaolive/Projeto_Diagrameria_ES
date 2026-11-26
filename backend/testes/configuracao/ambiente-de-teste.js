// Roda antes de qualquer modulo do teste ser carregado.
//
// O Jest ja define NODE_ENV=test, mas deixar explicito aqui e o que garante que
// src/config/ambiente.js escolha DB_NOME_TESTE. Se esta linha sumir, a suite de
// integracao passa a limpar as tabelas do banco de desenvolvimento.
process.env.NODE_ENV = 'test';
