const { conexaoDoBanco } = require('../../src/config/conexao');

describe('conexaoDoBanco', () => {
  const PARTES = { host: 'h', porta: 5432, usuario: 'u', senha: 's', nome: 'n', ssl: false };

  it('monta a conexao por partes, sem ssl', () => {
    expect(conexaoDoBanco(PARTES)).toEqual({
      host: 'h',
      port: 5432,
      user: 'u',
      password: 's',
      database: 'n',
    });
  });

  it('liga o ssl conferindo o certificado', () => {
    expect(conexaoDoBanco({ ...PARTES, ssl: true }).ssl).toEqual({ rejectUnauthorized: true });
  });

  it('usa a URL com pooler para a API e a direta para migrations', () => {
    const banco = { url: 'postgres://pooler', urlDireta: 'postgres://direta', ssl: true };

    expect(conexaoDoBanco(banco)).toEqual({
      connectionString: 'postgres://pooler',
      ssl: { rejectUnauthorized: true },
    });
    expect(conexaoDoBanco(banco, { direta: true }).connectionString).toBe('postgres://direta');
  });
});
