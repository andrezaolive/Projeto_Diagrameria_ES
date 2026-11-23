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
  decisao: 1,
};

export const NIVEIS = [
  { id: 'facil', nome: 'Fácil', max: 9 },
  { id: 'medio', nome: 'Médio', max: 12.5 },
  { id: 'dificil', nome: 'Difícil', max: Infinity },
];

const PESO_NO = { estadoInicial: 0.5, estadoFinal: 0.5, nota: 0 };

// Pedido JUMBO (dois diagramas): a pontuação é a soma das partes, e o nível sai da média delas
export function pontuacao(modelo) {
  if (modelo.partes) return modelo.partes.reduce((t, p) => t + pontuacao({ esperado: p.esperado }), 0);
  const { nodes, edges } = modelo.esperado;
  let pts = 0;
  const conceitos = new Set();
  for (const n of nodes) {
    pts += PESO_NO[n.tipo] ?? 1;
    if (n.tipo === 'sistema' || n.tipo === 'decisao') conceitos.add(n.tipo);
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
// Pedido complexo (data/complexos.js) declara o nível pelos conceitos (`complexo`): pela pontuação
// ele seria sempre difícil, por causa do tamanho
export const nivelDoModelo = (modelo) =>
  modelo.complexo ? NIVEIS.find((n) => n.id === modelo.complexo) : nivelDaPontuacao(pontuacao(modelo) / (modelo.partes?.length ?? 1));

// Campanha: quantos pedidos de cada nível chegam em cada dia. As faixas usam a DATA do calendário
// (mês de 31 dias começando na segunda; sábados e domingos são folga), convertida em dia de campanha.
const C = (facil, medio = 0, dificil = 0) => ({ facil, medio, dificil });
const COMPOSICAO_POR_DATA = [
  [[1, 3], C(2)], // dias 1 a 3: 2 fáceis
  [[4, 8], C(3)], // dias 4, 5 e 8: 3 fáceis
  [[9, 11], C(2, 1)], // dias 9 a 11: 2 fáceis e 1 médio
  [[12, 17], C(1, 3)], // dias 12, 15, 16 e 17: 1 fácil e 3 médios
  [[18, 22], C(1, 2, 1)], // dias 18, 19 e 22
  [[23, 25], C(1, 2, 2)], // dias 23 a 25
  [[26, 29], C(1, 2, 3)], // dias 26 e 29
  [[30, 31], C(0, 2, 4)], // dias 30 e 31: 2 médios e 4 difíceis
];
// Data do calendário (1..31) do dia de campanha (1..23): pula os fins de semana
export function dataDoDia(dia) {
  let n = 0;
  for (let d = 1; d <= 31; d++) if ((d - 1) % 7 < 5 && ++n === dia) return d;
  return 31;
}
export function composicaoDoDia(dia) {
  const data = dataDoDia(dia);
  return (COMPOSICAO_POR_DATA.find(([[de, ate]]) => data >= de && data <= ate) ?? COMPOSICAO_POR_DATA.at(-1))[1];
}
// Dia de campanha (1..23) de uma data útil do calendário; null no fim de semana
export function diaDaData(data) {
  for (let d = 1; d <= DIAS_UTEIS; d++) if (dataDoDia(d) === data) return d;
  return null;
}
const DIAS_UTEIS = 23;
export const ehFimDeSemana = (data) => data >= 1 && data <= 31 && (data - 1) % 7 >= 5;
// Fim de semana: o dia útil anterior (a sexta). O fim de semana abre quando a sexta é concluída e
// usa a sexta para a paciência e o pagamento dos clientes.
export const sextaAntes = (data) => diaDaData(data - ((data - 1) % 7) + 4);

// Fins de semana da campanha: abertos para mexer no escritório, com pedidos complexos (só eles).
// Não são obrigatórios: não travam a semana seguinte.
const COMPOSICAO_FIM_DE_SEMANA = {
  6: C(1), 7: C(1), // 1 fácil complexo
  13: C(0, 1), 14: C(0, 1), // 1 médio complexo
  20: C(1, 1), 21: C(1, 1), // 1 fácil e 1 médio complexos
  27: C(0, 1, 1), // 1 médio e 1 difícil complexos
  28: C(0, 0, 2), // 2 difíceis complexos
};
export const composicaoDoFimDeSemana = (data) => COMPOSICAO_FIM_DE_SEMANA[data] ?? C(0);

// Níveis que aparecem no dia (os que têm pelo menos um pedido na composição)
export const niveisDoDia = (dia) => Object.entries(composicaoDoDia(dia)).filter(([, q]) => q > 0).map(([id]) => id);

// Modo infinito: a dificuldade sobe com o número de pedidos que já chegaram na sessão
export function niveisNoInfinito(numeroDoPedido) {
  if (numeroDoPedido <= 3) return ['facil'];
  if (numeroDoPedido <= 8) return ['facil', 'medio'];
  return ['medio', 'dificil'];
}
