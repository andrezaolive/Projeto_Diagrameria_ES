// Contas de jogador.
// O backend ainda não existe: por enquanto as contas ficam no localStorage deste navegador,
// atrás de uma API assíncrona que pode ser trocada por chamadas HTTP sem mexer nas telas.
const CHAVE = 'diagrameria-contas-v1';

export const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const validarSenha = (senha) => senha.length >= 6;

function ler(armazenamento) {
  try {
    return JSON.parse(armazenamento.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}
function gravar(armazenamento, contas) {
  armazenamento.setItem(CHAVE, JSON.stringify(contas));
}

async function hash(senha, sal) {
  const dados = new TextEncoder().encode(`${sal}:${senha}`);
  const dig = await crypto.subtle.digest('SHA-256', dados);
  return [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const novoSal = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');

const normal = (email) => email.trim().toLowerCase();

export function criarServicoContas(armazenamento = globalThis.localStorage) {
  async function conferir(contas, email, senha) {
    const c = contas[normal(email)];
    if (!c || (await hash(senha, c.sal)) !== c.hash) throw new Error('E-mail ou senha incorretos.');
    return c;
  }

  return {
    async registrar(email, senha, save) {
      if (!validarEmail(email)) throw new Error('E-mail inválido.');
      if (!validarSenha(senha)) throw new Error('A senha precisa ter 6 caracteres ou mais.');
      const contas = ler(armazenamento);
      if (contas[normal(email)]) throw new Error('Já existe uma conta com esse e-mail.');
      const sal = novoSal();
      contas[normal(email)] = { sal, hash: await hash(senha, sal), save };
      gravar(armazenamento, contas);
      return normal(email);
    },

    // Devolve o progresso salvo na conta
    async entrar(email, senha) {
      const c = await conferir(ler(armazenamento), email, senha);
      return c.save ?? null;
    },

    async alterar(emailAtual, senhaAtual, { email, senha }) {
      const contas = ler(armazenamento);
      const c = await conferir(contas, emailAtual, senhaAtual);
      const novoEmail = email ? normal(email) : normal(emailAtual);
      if (email && !validarEmail(email)) throw new Error('Novo e-mail inválido.');
      if (senha && !validarSenha(senha)) throw new Error('A nova senha precisa ter 6 caracteres ou mais.');
      if (novoEmail !== normal(emailAtual) && contas[novoEmail]) throw new Error('Já existe uma conta com esse e-mail.');
      let atual = { ...c };
      if (senha) {
        atual.sal = novoSal();
        atual.hash = await hash(senha, atual.sal);
      }
      delete contas[normal(emailAtual)];
      contas[novoEmail] = atual;
      gravar(armazenamento, contas);
      return novoEmail;
    },

    salvarProgresso(email, save) {
      const contas = ler(armazenamento);
      const c = contas[normal(email)];
      if (!c) return;
      c.save = save;
      gravar(armazenamento, contas);
    },
  };
}

export const contas = criarServicoContas();
