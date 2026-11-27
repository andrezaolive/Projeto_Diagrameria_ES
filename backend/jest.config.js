module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/testes/**/*.test.js'],
  // server.js so chama listen(); o app inteiro passa por criarApp() nos testes.
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  // RNF13: cobertura minima de 80%. `npm run test:cobertura` falha abaixo disso.
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  // Precisa rodar antes dos modulos do teste: e o que faz src/config/ambiente.js
  // apontar para o banco de teste em vez do de desenvolvimento.
  setupFiles: ['<rootDir>/testes/configuracao/ambiente-de-teste.js'],
  // Os testes de integracao compartilham o mesmo banco: rodar em serie evita
  // que uma suite limpe as tabelas enquanto outra ainda esta usando.
  maxWorkers: 1,
};
