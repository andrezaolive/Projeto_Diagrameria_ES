// Atributos e métodos das classes (diagrama de classes).
// No nó: `atributos` e `metodos` são listas de texto, uma linha por membro, como no UML:
//   atributo: "- saldo: float"            (visibilidade, nome, tipo)
//   método:   "+ sacar(valor: float): bool" (visibilidade, nome, parâmetros, retorno)
// A visibilidade (+ - # ~) não entra na nota; nome e tipo sim.

const normal = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '').trim();

// Lê uma linha de membro: { nome, tipo, visibilidade, texto }
export function lerMembro(texto = '') {
  const t = texto.trim();
  const vis = /^[+\-#~]/.test(t) ? t[0] : '';
  const corpo = t.replace(/^[+\-#~]\s*/, '');
  const metodo = corpo.includes('(');
  const nome = (metodo ? corpo.slice(0, corpo.indexOf('(')) : corpo.split(':')[0]).trim();
  // tipo do atributo (depois do ":") ou retorno do método (depois do ")" e do ":")
  const resto = metodo ? corpo.slice(corpo.lastIndexOf(')') + 1) : corpo.slice(nome.length);
  const tipo = resto.includes(':') ? resto.slice(resto.indexOf(':') + 1).trim() : '';
  return { nome, tipo, visibilidade: vis, texto: t };
}

// Linhas não vazias de um campo de texto (uma por membro)
export const linhas = (texto = '') =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const temMembros = (node) => Boolean(node?.atributos?.length || node?.metodos?.length);

// ------------------------------------------------------------------ tamanho da caixa da classe
// Cabeçalho de 32px, uma linha de 20px por membro (mínimo 1 em cada parte, para o espaço vazio),
// largura pelo texto mais comprido. Tudo arredondado para o grid (20).
export const LINHA_MEMBRO = 20;
export const TOPO_CLASSE = 32;
const PAD = 8;
const acima = (v, g = 20) => Math.ceil(v / g) * g;

export function medidasClasse(node) {
  const atr = node.atributos ?? [];
  const met = node.metodos ?? [];
  const altAtr = Math.max(1, atr.length) * LINHA_MEMBRO + PAD;
  const altMet = Math.max(1, met.length) * LINHA_MEMBRO + PAD;
  const maior = Math.max((node.rotulo ?? '').length * 11, ...[...atr, ...met].map((m) => m.length * 9));
  const w = Math.max(160, acima(maior + 28));
  const h = Math.max(100, acima(TOPO_CLASSE + altAtr + altMet));
  return { w, h, divisoria: TOPO_CLASSE + altAtr };
}

// ------------------------------------------------------------------ comparação com o gabarito
// Cada membro do gabarito vale 1: nome certo na classe certa e mesmo tipo (sem tipo no gabarito, o
// nome basta). Nome certo com tipo diferente vale metade. Membros a mais não tiram pontos.
function procurar(lista, alvo) {
  const lidos = lista.map(lerMembro);
  return lidos.find((m) => normal(m.nome) === normal(alvo.nome)) ?? null;
}

export function compararMembros(classeJogador, classeEsperada) {
  const out = [];
  for (const [campo, tipoMembro] of [['atributos', 'atributo'], ['metodos', 'metodo']]) {
    for (const texto of classeEsperada[campo] ?? []) {
      const esp = lerMembro(texto);
      const achou = classeJogador ? procurar(classeJogador[campo] ?? [], esp) : null;
      const tipoOk = !esp.tipo || (achou && normal(achou.tipo) === normal(esp.tipo));
      out.push({ campo, tipoMembro, esperado: esp, achou, pontos: !achou ? 0 : tipoOk ? 1 : 0.5 });
    }
  }
  return out;
}

const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Nota dos membros (0..1), ou null se o gabarito não pede atributos/métodos
export function avaliarMembros(jogador, esperado) {
  const classesE = esperado.nodes.filter((n) => n.tipo === 'classe' && temMembros(n));
  if (!classesE.length) return null;
  let total = 0, pontos = 0;
  for (const ce of classesE) {
    const cj = jogador.nodes.find((n) => n.tipo === 'classe' && norm(n.rotulo) === norm(ce.rotulo));
    for (const r of compararMembros(cj, ce)) {
      total++;
      pontos += r.pontos;
    }
  }
  return total ? pontos / total : null;
}
