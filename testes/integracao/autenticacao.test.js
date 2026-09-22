const request = require('supertest');
const { criarApp } = require('../../src/app');
const { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco } = require('./ajuda/banco');
const repositorio = require('../../src/repositorios/usuarios.repositorio');

/**
 * Cadastro e login de ponta a ponta: requisicao HTTP real contra o Postgres de
 * teste. O que estes testes cobrem e justamente o que o teste unitario nao
 * alcanca — o indice UNIQUE, o middleware de erro, o formato da resposta.
 */

const app = criarApp();

const NOVO_USUARIO = {
  nome: 'Andreza Oliveira',
  email: 'andreza@diagrameria.dev',
  senha: 'senha-bem-grande',
};

beforeAll(async () => {
  await prepararBanco();
});

beforeEach(async () => {
  await limparTabelas();
});

afterAll(async () => {
  await encerrarBanco();
});

describe('POST /api/auth/cadastro', () => {
  it('cria a conta e ja devolve o token', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toMatchObject({
      nome: NOVO_USUARIO.nome,
      email: NOVO_USUARIO.email,
    });
    expect(resposta.body.usuario.id).toEqual(expect.any(String));
    expect(typeof resposta.body.token).toBe('string');
  });

  it('nunca devolve o hash da senha na resposta', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);

    expect(resposta.body.usuario).not.toHaveProperty('senha_hash');
    expect(resposta.body.usuario).not.toHaveProperty('senha');
    expect(JSON.stringify(resposta.body)).not.toContain('$2b$');
  });

  it('grava a senha em hash, nunca em claro', async () => {
    await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);

    const linha = await bancoDeDados('usuarios').where({ email: NOVO_USUARIO.email }).first();
    expect(linha.senha_hash).not.toBe(NOVO_USUARIO.senha);
    expect(linha.senha_hash.startsWith('$2b$')).toBe(true);
  });

  it('normaliza o email para minusculas', async () => {
    await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, email: 'ANDREZA@Diagrameria.DEV' });

    const linha = await bancoDeDados('usuarios').first();
    expect(linha.email).toBe('andreza@diagrameria.dev');
  });

  // Email com espaco nas pontas nao chega ao repositorio: o `format: email` do
  // Ajv recusa antes. Fica registrado aqui para ninguem "consertar" o 400 sem
  // decidir de proposito aparar a entrada — o que nao e obvio, porque senha com
  // espaco no fim e senha legitima e nao pode ser aparada junto.
  it('recusa email com espacos nas pontas', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, email: '  andreza@diagrameria.dev  ' });

    expect(resposta.status).toBe(400);
  });

  it('recusa email repetido, mesmo com outra caixa', async () => {
    await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);

    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, email: 'ANDREZA@diagrameria.dev' });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('EMAIL_EM_USO');
  });

  it('recusa senha curta e diz qual campo falhou', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, senha: 'curta' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('ENTRADA_INVALIDA');
    expect(resposta.body.erro.detalhes).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'senha' })])
    );
  });

  it('recusa email sem formato de email', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, email: 'nao-e-email' });

    expect(resposta.status).toBe(400);
  });

  it('recusa campo desconhecido no corpo e diz qual', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, admin: true });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.detalhes).toEqual([{ campo: 'admin', mensagem: expect.any(String) }]);
  });

  it('recusa corpo vazio', async () => {
    const resposta = await request(app).post('/api/auth/cadastro').send({});
    expect(resposta.status).toBe(400);
  });

  // Recusa em vez de aparar, pelo mesmo motivo do email: aparar depois de
  // validar deixaria "  a" passar no minLength 2 e ser gravado como "a".
  it('recusa nome com espacos nas pontas', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, nome: '  a' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.detalhes).toEqual([
      { campo: 'nome', mensagem: 'nao pode comecar nem terminar com espaco' },
    ]);
  });

  // 40 caracteres, 80 bytes: passa no maxLength 72, mas o bcrypt ignoraria
  // tudo depois do byte 72 — duas senhas diferentes virariam a mesma.
  it('recusa senha que passa de 72 bytes, mesmo com menos de 72 caracteres', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, senha: 'é'.repeat(40) });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.detalhes).toEqual([
      { campo: 'senha', mensagem: expect.stringContaining('72 bytes') },
    ]);
  });

  it('descreve o erro de validacao em portugues', async () => {
    const resposta = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...NOVO_USUARIO, senha: 'curta' });

    const [detalhe] = resposta.body.erro.detalhes;
    expect(detalhe.campo).toBe('senha');
    expect(detalhe.mensagem).toMatch(/caracteres/);
  });
});

describe('repositorio de usuarios', () => {
  // A checagem "email ja existe" do servico pode ser vencida por dois cadastros
  // simultaneos; quem segura e o indice UNIQUE. O repositorio traduz a violacao
  // para o mesmo erro de negocio, e o servico nao precisa saber de Postgres.
  it('traduz email duplicado no INSERT para ErroDeConflito', async () => {
    const dados = { nome: 'Ana', email: 'ana@diagrameria.dev', senhaHash: 'x'.repeat(60) };
    await repositorio.inserir(dados);

    await expect(repositorio.inserir(dados)).rejects.toMatchObject({
      name: 'ErroDeConflito',
      codigo: 'EMAIL_EM_USO',
    });
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);
  });

  it('entra com as credenciais certas', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: NOVO_USUARIO.email, senha: NOVO_USUARIO.senha });

    expect(resposta.status).toBe(200);
    expect(typeof resposta.body.token).toBe('string');
    expect(resposta.body.usuario.email).toBe(NOVO_USUARIO.email);
  });

  it('aceita o email com outra caixa', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ANDREZA@DIAGRAMERIA.DEV', senha: NOVO_USUARIO.senha });

    expect(resposta.status).toBe(200);
  });

  // A tela de login nao pode virar um verificador de quem tem conta no jogo:
  // senha errada e email inexistente respondem exatamente a mesma coisa.
  it('responde igual para senha errada e para email inexistente', async () => {
    const senhaErrada = await request(app)
      .post('/api/auth/login')
      .send({ email: NOVO_USUARIO.email, senha: 'senha-errada-mesmo' });

    const emailInexistente = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@diagrameria.dev', senha: NOVO_USUARIO.senha });

    expect(senhaErrada.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(senhaErrada.body).toEqual(emailInexistente.body);
  });
});

describe('GET /api/auth/eu', () => {
  async function cadastrarEObterToken() {
    const resposta = await request(app).post('/api/auth/cadastro').send(NOVO_USUARIO);
    return resposta.body.token;
  }

  it('devolve o usuario do token', async () => {
    const token = await cadastrarEObterToken();

    const resposta = await request(app).get('/api/auth/eu').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.email).toBe(NOVO_USUARIO.email);
    expect(resposta.body.usuario).not.toHaveProperty('senha_hash');
  });

  it('recusa requisicao sem header Authorization', async () => {
    const resposta = await request(app).get('/api/auth/eu');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });

  it('recusa token adulterado', async () => {
    const token = await cadastrarEObterToken();

    const resposta = await request(app)
      .get('/api/auth/eu')
      .set('Authorization', `Bearer ${token.slice(0, -3)}xyz`);

    expect(resposta.status).toBe(401);
  });

  it('recusa token sem o esquema Bearer', async () => {
    const token = await cadastrarEObterToken();

    const resposta = await request(app).get('/api/auth/eu').set('Authorization', token);

    expect(resposta.status).toBe(401);
  });
});

describe('erros gerais da API', () => {
  it('rota inexistente devolve 404 no formato padrao', async () => {
    const resposta = await request(app).get('/api/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });

  it('JSON malformado devolve 400, nao 500', async () => {
    const resposta = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('JSON_INVALIDO');
  });

  it('GET /api/saude responde ok', async () => {
    const resposta = await request(app).get('/api/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('ok');
  });
});
