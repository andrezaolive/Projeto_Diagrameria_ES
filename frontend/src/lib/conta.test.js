import { describe, expect, it } from 'vitest';
import { criarServicoContas, validarSenha } from './conta.js';

// Servidor falso com as mesmas respostas do backend (backend/src/rotas): contas, token e progresso.
function servidorFalso() {
  const usuarios = new Map(); // email -> { nome, senha, id }
  const progresso = new Map(); // id -> dados
  const tokens = new Map(); // token -> id
  let n = 0;
  const erro = (status, codigo, mensagem = codigo) => ({ status, corpo: { erro: { codigo, mensagem } } });
  const emitir = (u) => {
    const t = `tok-${++n}`;
    tokens.set(t, u.id);
    return { usuario: { id: u.id, nome: u.nome, email: u.email }, token: t };
  };
  const quem = (h) => tokens.get((h.Authorization ?? '').replace('Bearer ', ''));

  const rotas = {
    'POST /auth/cadastro': (b) => {
      const email = b.email.toLowerCase();
      if (usuarios.has(email)) return erro(409, 'EMAIL_EM_USO');
      if (b.nome.length < 2) return erro(400, 'ENTRADA_INVALIDA');
      const u = { id: `u${usuarios.size + 1}`, nome: b.nome, email, senha: b.senha };
      usuarios.set(email, u);
      return { status: 201, corpo: emitir(u) };
    },
    'POST /auth/login': (b) => {
      const u = usuarios.get(b.email.toLowerCase());
      return u && u.senha === b.senha ? { status: 200, corpo: emitir(u) } : erro(401, 'NAO_AUTENTICADO');
    },
    'PATCH /auth/eu': (b, id) => {
      const u = [...usuarios.values()].find((x) => x.id === id);
      if (u.senha !== b.senhaAtual) return erro(401, 'NAO_AUTENTICADO');
      if (b.email) {
        if (usuarios.has(b.email.toLowerCase())) return erro(409, 'EMAIL_EM_USO');
        usuarios.delete(u.email);
        u.email = b.email.toLowerCase();
        usuarios.set(u.email, u);
      }
      if (b.senha) u.senha = b.senha;
      return { status: 200, corpo: emitir(u) };
    },
    'GET /progresso': (_b, id) => (progresso.has(id) ? { status: 200, corpo: { dados: progresso.get(id) } } : erro(404, 'SEM_PROGRESSO')),
    'PUT /progresso': (b, id) => {
      progresso.set(id, b.dados);
      return { status: 200, corpo: { dados: b.dados } };
    },
  };
  const autenticadas = new Set(['PATCH /auth/eu', 'GET /progresso', 'PUT /progresso']);

  const buscar = async (url, { method, headers, body }) => {
    const rota = `${method} ${url.replace('http://api', '')}`;
    const id = quem(headers);
    const r = autenticadas.has(rota) && !id ? erro(401, 'NAO_AUTENTICADO') : rotas[rota](body ? JSON.parse(body) : undefined, id);
    return { ok: r.status < 400, status: r.status, json: async () => r.corpo };
  };
  return { buscar, usuarios, progresso, tokens };
}

function memoria() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const criar = (srv, armazenamento = memoria()) => criarServicoContas({ api: 'http://api', buscar: srv.buscar, armazenamento });
const SAVE = { perfil: { nome: 'Ana' }, dinheiro: 5 };

describe('contas no backend', () => {
  it('registra com o nome do perfil e sobe o progresso atual', async () => {
    const srv = servidorFalso();
    const c = criar(srv);
    expect(await c.registrar('Ana@Email.com', 'segredo12', SAVE)).toBe('ana@email.com');
    expect(srv.usuarios.get('ana@email.com').nome).toBe('Ana');
    expect(srv.progresso.get('u1')).toEqual(SAVE);
    await expect(c.registrar('ana@email.com', 'outra1234', SAVE)).rejects.toThrow('Já existe uma conta com esse e-mail.');
  });

  it('nome curto demais para a conta vira "Jogador" (o do jogo continua no save)', async () => {
    const srv = servidorFalso();
    await criar(srv).registrar('a@b.co', 'segredo12', { perfil: { nome: 'A' } });
    expect(srv.usuarios.get('a@b.co').nome).toBe('Jogador');
  });

  it('entra em outro aparelho e recebe o progresso da conta', async () => {
    const srv = servidorFalso();
    const pc = criar(srv);
    await pc.registrar('ana@email.com', 'segredo12', SAVE);
    await pc.salvarProgresso('ana@email.com', { ...SAVE, dinheiro: 99 });

    const celular = criar(srv); // outro navegador: outro armazenamento
    await expect(celular.entrar('ana@email.com', 'errada12')).rejects.toThrow('E-mail ou senha incorretos.');
    expect(await celular.entrar('ana@email.com', 'segredo12')).toEqual({ ...SAVE, dinheiro: 99 });
  });

  it('conta sem progresso salvo devolve null', async () => {
    const srv = servidorFalso();
    await srv.buscar('http://api/auth/cadastro', { method: 'POST', headers: {}, body: JSON.stringify({ nome: 'Ana', email: 'a@b.co', senha: 'segredo12' }) });
    expect(await criar(srv).entrar('a@b.co', 'segredo12')).toBeNull();
  });

  it('altera e-mail e senha com a senha atual', async () => {
    const srv = servidorFalso();
    const c = criar(srv);
    await c.registrar('ana@email.com', 'segredo12', SAVE);
    await expect(c.alterar('ana@email.com', 'errada12', { senha: 'nova12345' })).rejects.toThrow('Senha atual incorreta.');
    expect(await c.alterar('ana@email.com', 'segredo12', { email: 'bia@email.com', senha: 'nova12345' })).toBe('bia@email.com');
    expect(await criar(srv).entrar('bia@email.com', 'nova12345')).toEqual(SAVE);
  });

  it('sem sessão (saiu ou nunca entrou) salvar falha com NAO_AUTENTICADO', async () => {
    const srv = servidorFalso();
    const c = criar(srv);
    await c.registrar('ana@email.com', 'segredo12', SAVE);
    c.sair();
    expect(c.temSessao()).toBe(false);
    await expect(c.salvarProgresso('ana@email.com', SAVE)).rejects.toMatchObject({ codigo: 'NAO_AUTENTICADO' });
  });

  it('servidor fora do ar vira mensagem amigável', async () => {
    const c = criarServicoContas({ api: 'http://api', armazenamento: memoria(), buscar: async () => { throw new TypeError('Failed to fetch'); } });
    await expect(c.entrar('a@b.co', 'segredo12')).rejects.toMatchObject({ codigo: 'SEM_CONEXAO' });
  });

  it('valida antes de chamar o servidor, com as regras do backend', async () => {
    const c = criar(servidorFalso());
    await expect(c.registrar('nao-e-email', 'segredo12')).rejects.toThrow(/E-mail/);
    await expect(c.registrar('a@b.co', '1234567')).rejects.toThrow(/8 caracteres/);
    expect(validarSenha('12345678')).toBe(true);
    expect(validarSenha('é'.repeat(37))).toBe(false); // 74 bytes
  });
});
