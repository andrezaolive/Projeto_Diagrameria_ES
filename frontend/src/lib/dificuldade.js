// Dificuldade de um pedido: quanto o jogador precisa inserir e quão difíceis são os conceitos.
//   - cada elemento a criar (ator, caso de uso, classe, estado, sistema): 1 (início/fim: 0,5)
//   - cada relação: 1; cada evento de transição: 0,5; cada ponta de multiplicidade: 0,5
//   - cada atributo/método: 1 (cada linha é digitada inteira, com nome e tipo)
//   - conceitos que costumam confundir somam um bônus fixo (uma vez por pedido)
// A pontuação vira Fácil / Médio / Difícil pelos limites em NIVEIS.

export const BONUS_CONCEITO = {
  include: 0.5,
  extend: 1,
  heranca: 0.5,
  dependencia: 1,
  agregacao: 1,
  composicao: 1,
  sistema: 0.5,
  multiplicidade: 2,
  membros: 1,
};

export const NIVEIS = [
  { id: 'facil', nome: 'Fácil', max: 9 },
  { id: 'medio', nome: 'Médio', max: 12.5 },
  { id: 'dificil', nome: 'Difícil', max: Infinity },
];

const PESO_NO = { estadoInicial: 0.5, estadoFinal: 0.5, nota: 0 };

export function pontuacao(modelo) {
  const { nodes, edges } = modelo.esperado;
  let pts = 0;
  const conceitos = new Set();
  for (const n of nodes) {
    pts += PESO_NO[n.tipo] ?? 1;
    if (n.tipo === 'sistema') conceitos.add('sistema');
    const membros = (n.atributos?.length ?? 0) + (n.metodos?.length ?? 0);
    if (membros) conceitos.add('membros');
    pts += membros;
  }
  for (const e of edges) {
    pts += 1;
    if (e.tipo === 'transicao' && e.rotulo) pts += 0.5;
    const pontas = (e.multDe ? 1 : 0) + (e.multPara ? 1 : 0);
    if (pontas) conceitos.add('multiplicidade');
    pts += 0.5 * pontas;
    if (BONUS_CONCEITO[e.tipo]) conceitos.add(e.tipo);
  }
  for (const c of conceitos) pts += BONUS_CONCEITO[c];
  return pts;
}

export const nivelDaPontuacao = (pts) => NIVEIS.find((n) => pts <= n.max);
export const nivelDoModelo = (modelo) => nivelDaPontuacao(pontuacao(modelo));

// Tipo de diagrama, para alternar na progressão (casos de uso → classes → estados)
const tipoDe = ({ esperado }) => {
  const t = new Set(esperado.nodes.map((n) => n.tipo));
  if (t.has('estado') || t.has('estadoInicial')) return 'estados';
  if (t.has('ator') || t.has('casoDeUso')) return 'casos';
  return 'classes';
};
const ROTACAO = ['casos', 'classes', 'estados'];

// Ordem da campanha: do mais fácil ao mais difícil, nível por nível. Dentro de cada nível os tipos de
// diagrama se revezam (caso de uso, classes, estados...), cada fila em ordem de pontuação.
export function ordemPorDificuldade(modelos) {
  const ordem = [];
  for (const nivel of NIVEIS) {
    const filas = Object.fromEntries(ROTACAO.map((t) => [t, []]));
    for (const m of modelos) if (nivelDoModelo(m) === nivel) filas[tipoDe(m)].push(m);
    for (const t of ROTACAO) filas[t].sort((a, b) => pontuacao(a) - pontuacao(b) || a.id.localeCompare(b.id));
    for (let rodada = 0; ROTACAO.some((t) => filas[t].length); rodada++)
      for (const t of ROTACAO) if (filas[t].length) ordem.push(filas[t].shift());
  }
  return ordem.map((m) => m.id);
}

// Modo infinito: a dificuldade sobe com o número de pedidos que já chegaram na sessão
export function niveisNoInfinito(numeroDoPedido) {
  if (numeroDoPedido <= 3) return ['facil'];
  if (numeroDoPedido <= 8) return ['facil', 'medio'];
  return ['medio', 'dificil'];
}
