module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/testes/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  // Os testes de integracao compartilham o mesmo banco: rodar em serie evita
  // que uma suite limpe as tabelas enquanto outra ainda esta usando.
  maxWorkers: 1,
};
