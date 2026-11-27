/**
 * Validacao das variaveis de ambiente na subida. Cada caso recarrega o modulo
 * com um process.env proprio. Variavel "ausente" e string vazia, e nao delete:
 * o dotenv do ambiente.js repreencheria do .env uma variavel apagada.
 */

const ORIGINAL = { ...process.env };

function carregar(modulo, env) {
  process.env = { ...ORIGINAL, ...env };
  let resultado;
  jest.isolateModules(() => {
    resultado = require(`../../src/config/${modulo}`);
  });
  return resultado;
}

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('config/ambiente', () => {
  it('recusa NODE_ENV desconhecido', () => {
    expect(() => carregar('ambiente', { NODE_ENV: 'staging' })).toThrow(/NODE_ENV="staging"/);
  });

  it('recusa subir sem variavel obrigatoria do banco', () => {
    expect(() => carregar('ambiente', { DB_USUARIO: '' })).toThrow(/DB_USUARIO/);
    expect(() => carregar('ambiente', { DB_NOME_TESTE: ' ' })).toThrow(/DB_NOME_TESTE/);
  });

  it('nos testes ignora DATABASE_URL e usa o banco de teste', () => {
    const { banco } = carregar('ambiente', {
      DATABASE_URL: 'postgres://producao',
      DB_NOME_TESTE: 'diagrameria_teste',
    });
    expect(banco.url).toBeUndefined();
    expect(banco.nome).toBe('diagrameria_teste');
  });

  it('fora dos testes usa DATABASE_URL, e a direta cai na mesma URL', () => {
    const { banco, ehProducao } = carregar('ambiente', {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://pooled',
      DATABASE_URL_UNPOOLED: '',
      DB_SSL: 'true',
    });
    expect(ehProducao).toBe(true);
    expect(banco).toEqual({ url: 'postgres://pooled', urlDireta: 'postgres://pooled', ssl: true });
  });

  it('no desenvolvimento, sem URL, usa DB_NOME e os padroes', () => {
    const config = carregar('ambiente', {
      NODE_ENV: 'development',
      DATABASE_URL: '',
      DB_HOST: '',
      DB_PORTA: '',
      DB_NOME: 'diagrameria',
      PORTA: '',
      VERCEL: '1',
    });
    expect(config.banco).toMatchObject({ host: 'localhost', porta: 5432, nome: 'diagrameria' });
    expect(config.porta).toBe(3000);
    expect(config.atrasDeProxy).toBe(true);
  });
});

describe('config/autenticacao', () => {
  it('recusa subir sem JWT_SEGREDO', () => {
    expect(() => carregar('autenticacao', { JWT_SEGREDO: '  ' })).toThrow(
      /JWT_SEGREDO nao definida/
    );
  });

  it('recusa o segredo de exemplo do .env.example', () => {
    expect(() =>
      carregar('autenticacao', { JWT_SEGREDO: 'troque-este-valor-antes-de-rodar' })
    ).toThrow(/valor de exemplo/);
  });

  it('expira em 24h por padrao e usa bcrypt barato nos testes', () => {
    const config = carregar('autenticacao', { JWT_SEGREDO: 'x'.repeat(64), JWT_EXPIRACAO: '' });
    expect(config.jwt).toMatchObject({ expiracao: '24h', algoritmo: 'HS256' });
    expect(config.custoBcrypt).toBe(4);
  });

  it('usa bcrypt de custo 12 fora dos testes', () => {
    const config = carregar('autenticacao', {
      NODE_ENV: 'production',
      JWT_SEGREDO: 'x'.repeat(64),
      DATABASE_URL: 'postgres://pooled',
    });
    expect(config.custoBcrypt).toBe(12);
  });
});
