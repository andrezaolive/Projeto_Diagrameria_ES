module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/testes/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  // Precisa rodar antes dos modulos do teste: e o que faz src/config/ambiente.js
  // apontar para o banco de teste em vez do de desenvolvimento.
  setupFiles: ['<rootDir>/testes/configuracao/ambiente-de-teste.js'],
  // Os testes de integracao compartilham o mesmo banco: rodar em serie evita
  // que uma suite limpe as tabelas enquanto outra ainda esta usando.
  maxWorkers: 1,
};
