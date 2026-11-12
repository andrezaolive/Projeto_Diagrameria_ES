// Ícones da área de trabalho do computador: grid invisível, posição padrão e onde um ícone solto fica.
// Posição = { col, lin } (célula do grid). Tudo puro, para testar sem a tela.

// Área útil: o palco tem 1280×720 e a barra de tarefas ocupa os 52px de baixo
export const GRADE = { x0: 16, y0: 16, w: 132, h: 124, colunas: 9, linhas: 5 };
export const PERTO = 2; // "região próxima": até 2 células de distância

export const pixelDaCelula = ({ col, lin }) => ({ x: GRADE.x0 + col * GRADE.w, y: GRADE.y0 + lin * GRADE.h });

const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

// Célula sob um ponto do palco (já limitada ao grid: nada sai da tela)
export function celulaDoPonto(x, y) {
  return {
    col: limitar(Math.floor((x - GRADE.x0) / GRADE.w), 0, GRADE.colunas - 1),
    lin: limitar(Math.floor((y - GRADE.y0) / GRADE.h), 0, GRADE.linhas - 1),
  };
}

// Ícones com lugar próprio na primeira abertura: o Guia fica sozinho no canto superior direito,
// separado dos ícones principais do jogo
export const POSICOES_FIXAS = { guia: { col: GRADE.colunas - 1, lin: 0 } };

// Padrão: os fixos no lugar deles; os outros em coluna, de cima para baixo (e na coluna seguinte se faltar espaço)
export function posicoesPadrao(ids, fixas = POSICOES_FIXAS) {
  const out = {};
  for (const id of ids) if (fixas[id]) out[id] = fixas[id];
  const ocupada = (c) => Object.values(out).some((o) => o.col === c.col && o.lin === c.lin);
  let i = 0;
  for (const id of ids) {
    if (out[id]) continue;
    let c;
    do c = { col: Math.floor(i / GRADE.linhas), lin: i++ % GRADE.linhas };
    while (ocupada(c));
    out[id] = c;
  }
  return out;
}

const dentro = ({ col, lin }) => col >= 0 && lin >= 0 && col < GRADE.colunas && lin < GRADE.linhas;
const mesma = (a, b) => a.col === b.col && a.lin === b.lin;

// Junta o salvo com o padrão e conserta posições inválidas ou repetidas (ex.: ícone novo, save antigo)
export function resolverPosicoes(ids, salvas = {}) {
  const padrao = posicoesPadrao(ids);
  const out = {};
  for (const id of ids) {
    const p = salvas[id];
    const ocupada = (c) => Object.values(out).some((o) => mesma(o, c));
    if (p && dentro(p) && !ocupada(p)) out[id] = p;
  }
  for (const id of ids) if (!out[id]) out[id] = soltarEm(out, id, padrao[id]);
  return out;
}

// Onde o ícone `id` fica ao ser solto na célula `alvo`:
//  1. a própria célula, se estiver livre (ou já for dele);
//  2. a célula livre mais próxima, até PERTO células de distância;
//  3. senão, a célula livre mais próxima numa das laterais (primeira ou última coluna);
//  4. se nem isso houver, a posição de antes.
export function soltarEm(posicoes, id, alvo) {
  const a = { col: limitar(alvo.col, 0, GRADE.colunas - 1), lin: limitar(alvo.lin, 0, GRADE.linhas - 1) };
  const livre = (c) => dentro(c) && !Object.entries(posicoes).some(([outro, p]) => outro !== id && mesma(p, c));
  if (livre(a)) return a;
  const dist = (c) => Math.hypot(c.col - a.col, c.lin - a.lin);
  const todas = [];
  for (let col = 0; col < GRADE.colunas; col++) for (let lin = 0; lin < GRADE.linhas; lin++) todas.push({ col, lin });
  const maisPerto = (lista) => lista.filter(livre).sort((x, y) => dist(x) - dist(y) || x.lin - y.lin || x.col - y.col)[0];
  const perto = maisPerto(todas.filter((c) => Math.max(Math.abs(c.col - a.col), Math.abs(c.lin - a.lin)) <= PERTO));
  if (perto) return perto;
  const lateral = maisPerto(todas.filter((c) => c.col === 0 || c.col === GRADE.colunas - 1));
  return lateral ?? posicoes[id] ?? a;
}
