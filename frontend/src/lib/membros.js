// Atributos e métodos das classes (diagrama de classes).
// No nó: `atributos` e `metodos` são listas de texto, uma linha por membro, como no UML:
//   atributo: "- saldo: float"            (visibilidade, nome, tipo)
//   método:   "+ sacar(valor: float): bool" (visibilidade, nome, parâmetros, retorno)
// Nome, tipo e visibilidade (+ público, - privado, # protegido) entram na nota.

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
// Cada membro do gabarito vale 1: nome certo na classe certa, mesmo tipo (sem tipo no gabarito, o
// nome basta) e mesma visibilidade (sem visibilidade no gabarito, qualquer uma vale). Tipo errado
// tira metade; visibilidade errada tira um quarto (`PERDA_MEMBRO`). Membros a mais não tiram pontos.
function procurar(lista, alvo) {
  const lidos = lista.map(lerMembro);
  return lidos.find((m) => normal(m.nome) === normal(alvo.nome)) ?? null;
}

export const PERDA_MEMBRO = { tipo: 0.5, visibilidade: 0.25 };
// Visibilidades que o editor oferece (botões ao lado de cada linha)
export const VISIBILIDADES = [
  { simbolo: '-', nome: 'privado' },
  { simbolo: '+', nome: 'público' },
  { simbolo: '#', nome: 'protegido' },
];

// Editor (EscritaNaClasse): o texto da linha fica sem o símbolo, escolhido nos botões
// Visibilidade de uma linha de membro: o símbolo do começo ("-", "+", "#", "~") e o resto
export const SIMBOLO = /^\s*([+\-#~])\s*/;
export const separarMembro = (linha = '') => {
  const m = linha.match(SIMBOLO);
  return m ? { vis: m[1], corpo: linha.slice(m[0].length) } : { vis: '', corpo: linha };
};
// Toda linha nova nasce privada ("-"); o botão da linha troca, em ciclo: - → + → #
export const VIS_PADRAO = { atributos: '-', metodos: '-' };
export const proximaVisibilidade = (atual) => {
  const i = VISIBILIDADES.findIndex((v) => v.simbolo === atual);
  return VISIBILIDADES[(i + 1) % VISIBILIDADES.length].simbolo;
};

// Depois de editar o texto, mantém cada visibilidade na sua linha: casa as linhas iguais do começo e
// do fim; as do meio que já existiam ficam com a visibilidade antiga, as novas ganham a padrão.
export function alinharVisibilidades(antigas, visAntigas, novas, padrao) {
  let ini = 0;
  while (ini < antigas.length && ini < novas.length && antigas[ini] === novas[ini]) ini++;
  let fim = 0;
  while (fim < antigas.length - ini && fim < novas.length - ini && antigas[antigas.length - 1 - fim] === novas[novas.length - 1 - fim]) fim++;
  const meio = novas.length - ini - fim;
  const meioAntigo = antigas.length - ini - fim;
  return [
    ...visAntigas.slice(0, ini),
    ...Array.from({ length: meio }, (_, k) => (k < meioAntigo ? visAntigas[ini + k] : padrao)),
    ...visAntigas.slice(visAntigas.length - fim),
  ];
}

export function compararMembros(classeJogador, classeEsperada) {
  const out = [];
  for (const [campo, tipoMembro] of [['atributos', 'atributo'], ['metodos', 'metodo']]) {
    for (const texto of classeEsperada[campo] ?? []) {
      const esp = lerMembro(texto);
      const achou = classeJogador ? procurar(classeJogador[campo] ?? [], esp) : null;
      const tipoOk = !esp.tipo || (achou && normal(achou.tipo) === normal(esp.tipo));
      const visibilidadeOk = !esp.visibilidade || (achou && achou.visibilidade === esp.visibilidade);
      const pontos = !achou ? 0 : 1 - (tipoOk ? 0 : PERDA_MEMBRO.tipo) - (visibilidadeOk ? 0 : PERDA_MEMBRO.visibilidade);
      out.push({ campo, tipoMembro, esperado: esp, achou, tipoOk: Boolean(tipoOk), visibilidadeOk: Boolean(visibilidadeOk), pontos });
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
