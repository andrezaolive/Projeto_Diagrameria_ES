// Contas de jogador, no backend (backend/src/rotas/autenticacao.rotas.js e progresso.rotas.js).
// Só login e progresso passam pelo servidor: a correção e o jogo continuam no navegador. A
// interface (registrar, entrar, alterar, salvarProgresso) é a mesma de quando as contas ficavam
// no localStorage, então as telas não mudaram.
//
// O token JWT fica no localStorage deste navegador. O save local (diagrameria-save-v1, no
// GameContext) continua sendo o principal: o do servidor é a cópia que leva o progresso para
// outro aparelho.

const CHAVE_TOKEN = 'diagrameria-token-v1';
export const API_PADRAO = 'http://localhost:3000/api';

// Mesmas regras do backend (schemaCadastro): senha de 8 caracteres a 72 bytes (o bcrypt ignora o
// que passar de 72 bytes; acento e emoji contam mais de um).
export const SENHA_MIN = 8;
const SENHA_MAX_BYTES = 72;
export const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const validarSenha = (senha) => senha.length >= SENHA_MIN && new TextEncoder().encode(senha).length <= SENHA_MAX_BYTES;
const MSG_SENHA = `precisa ter ${SENHA_MIN} caracteres ou mais (e no máximo ${SENHA_MAX_BYTES} bytes).`;

// O nome do jogo pode ter 1 letra; a conta pede de 2 a 80. O nome da conta é só cadastro (o jogo
// mostra o do perfil, que vai junto no save), então um nome curto demais vira "Jogador".
const nomeDaConta = (nome) => {
  const n = (nome ?? '').trim();
  return n.length >= 2 ? n.slice(0, 80) : 'Jogador';
};

const normal = (email) => email.trim().toLowerCase();

// Mensagens em português (com acento) para os códigos que o backend devolve.
const MENSAGENS = {
  EMAIL_EM_USO: 'Já existe uma conta com esse e-mail.',
  MUITAS_TENTATIVAS: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  CORPO_GRANDE_DEMAIS: 'O progresso ficou grande demais para salvar na conta.',
};

// Erro com o `codigo` do backend, para quem chamou ramificar (ex.: NAO_AUTENTICADO = sessão expirou).
export class ErroDeConta extends Error {
  constructor(mensagem, codigo) {
    super(mensagem);
    this.codigo = codigo;
  }
}

export function criarServicoContas({ api = import.meta.env?.VITE_API_URL || API_PADRAO, buscar = (...a) => globalThis.fetch(...a), armazenamento = globalThis.localStorage } = {}) {
  const lerToken = () => {
    try {
      return armazenamento.getItem(CHAVE_TOKEN);
    } catch {
      return null;
    }
  };
  const gravarToken = (token) => {
    try {
      if (token) armazenamento.setItem(CHAVE_TOKEN, token);
      else armazenamento.removeItem(CHAVE_TOKEN);
    } catch {
      /* sem storage: fica só nesta aba */
    }
  };

  // Chama a API e devolve o JSON; erro vira ErroDeConta com a mensagem certa para a tela.
  async function chamar(metodo, caminho, corpo, { autenticado = false, msgNaoAutenticado } = {}) {
    const cabecalhos = { 'Content-Type': 'application/json' };
    if (autenticado) {
      const token = lerToken();
      if (!token) throw new ErroDeConta('Entre na conta de novo.', 'NAO_AUTENTICADO');
      cabecalhos.Authorization = `Bearer ${token}`;
    }
    let resposta;
    try {
      resposta = await buscar(`${api}${caminho}`, { method: metodo, headers: cabecalhos, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    } catch {
      throw new ErroDeConta('Não foi possível falar com o servidor. Confira a internet e tente de novo.', 'SEM_CONEXAO');
    }
    const json = await resposta.json().catch(() => ({}));
    if (resposta.ok) return json;

    const { codigo = 'ERRO', mensagem, detalhes } = json.erro ?? {};
    if (codigo === 'NAO_AUTENTICADO') throw new ErroDeConta(msgNaoAutenticado ?? 'Sua sessão expirou. Entre na conta de novo.', codigo);
    if (codigo === 'ENTRADA_INVALIDA' && detalhes?.length) {
      const [d] = detalhes;
      throw new ErroDeConta(`Campo "${d.campo}" ${d.mensagem}.`, codigo);
    }
    throw new ErroDeConta(MENSAGENS[codigo] ?? mensagem ?? 'Algo deu errado no servidor.', codigo);
  }

  return {
    // Cria a conta e já sobe o progresso atual deste navegador para ela.
    async registrar(email, senha, save) {
      if (!validarEmail(email)) throw new ErroDeConta('E-mail inválido.', 'ENTRADA_INVALIDA');
      if (!validarSenha(senha)) throw new ErroDeConta(`A senha ${MSG_SENHA}`, 'ENTRADA_INVALIDA');
      const { usuario, token } = await chamar('POST', '/auth/cadastro', { nome: nomeDaConta(save?.perfil?.nome), email: email.trim(), senha });
      gravarToken(token);
      if (save) await this.salvarProgresso(usuario.email, save).catch(() => {}); // sobe de novo no próximo salvamento
      return usuario.email;
    },

    // Devolve o progresso salvo na conta (null se ela ainda não tem).
    async entrar(email, senha) {
      if (!validarEmail(email)) throw new ErroDeConta('E-mail inválido.', 'ENTRADA_INVALIDA');
      const { token } = await chamar('POST', '/auth/login', { email: email.trim(), senha }, { msgNaoAutenticado: 'E-mail ou senha incorretos.' });
      gravarToken(token);
      try {
        return (await chamar('GET', '/progresso', undefined, { autenticado: true })).dados;
      } catch (e) {
        if (e.codigo === 'SEM_PROGRESSO') return null;
        throw e;
      }
    },

    // Troca e-mail e/ou senha (exige a senha atual). Devolve o e-mail da conta depois da troca.
    async alterar(emailAtual, senhaAtual, { email, senha }) {
      if (email && !validarEmail(email)) throw new ErroDeConta('Novo e-mail inválido.', 'ENTRADA_INVALIDA');
      if (senha && !validarSenha(senha)) throw new ErroDeConta(`A nova senha ${MSG_SENHA}`, 'ENTRADA_INVALIDA');
      const corpo = { senhaAtual };
      if (email && normal(email) !== normal(emailAtual)) corpo.email = email.trim();
      if (senha) corpo.senha = senha;
      const { usuario, token } = await chamar('PATCH', '/auth/eu', corpo, { autenticado: true, msgNaoAutenticado: 'Senha atual incorreta.' });
      gravarToken(token);
      return usuario.email;
    },

    // Grava o save na conta. Rejeita com ErroDeConta (codigo NAO_AUTENTICADO quando a sessão expirou).
    async salvarProgresso(_email, save) {
      await chamar('PUT', '/progresso', { dados: save }, { autenticado: true });
    },

    // Saiu da conta: o token deixa de valer neste navegador.
    sair() {
      gravarToken(null);
    },

    temSessao: () => !!lerToken(),
  };
}

export const contas = criarServicoContas();
