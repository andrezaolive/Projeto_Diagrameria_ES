// Categorias de um modelo de pedido (para a lista de debug "Ver todos os pedidos"):
// o tipo de diagrama e o que ele exercita (relações e extras cobrados na nota).
import { temMembros } from './membros.js';

export const TIPOS_DIAGRAMA = [
  { id: 'casos', nome: 'Casos de uso' },
  { id: 'classes', nome: 'Classes' },
  { id: 'estados', nome: 'Estados' },
];

// Tipo do modelo de pedido (para filtros): 'jumbo' ou o tipo do único diagrama
export const tipoDoModelo = (modelo) => (modelo.partes ? 'jumbo' : tipoDoDiagrama(modelo.esperado));

export function tipoDoDiagrama(esperado) {
  const tipos = new Set(esperado.nodes.map((n) => n.tipo));
  if (['estado', 'estadoInicial', 'estadoFinal', 'decisao'].some((t) => tipos.has(t))) return 'estados';
  if (['ator', 'casoDeUso', 'sistema'].some((t) => tipos.has(t))) return 'casos';
  return 'classes';
}

const RELACOES = {
  include: 'Include',
  extend: 'Extend',
  heranca: 'Herança',
  dependencia: 'Dependência',
  agregacao: 'Agregação',
  composicao: 'Composição',
  transicao: 'Transições',
};

// ['Classes', 'Composição', 'Multiplicidade', 'Atributos e métodos', ...]
// Pedido JUMBO: 'Jumbo', os diagramas pedidos ('Casos de uso + Estados') e as categorias de cada parte
export function categoriasDoModelo(modelo) {
  if (modelo.partes) {
    const nomes = modelo.partes.map((p) => TIPOS_DIAGRAMA.find((t) => t.id === p.secao).nome);
    const resto = modelo.partes.flatMap((p) => categoriasDoModelo({ esperado: p.esperado }).slice(1));
    return ['Jumbo', nomes.join(' + '), ...new Set(resto)];
  }
  const { nodes, edges } = modelo.esperado;
  const tipo = tipoDoDiagrama(modelo.esperado);
  const out = [TIPOS_DIAGRAMA.find((t) => t.id === tipo).nome];
  if (modelo.complexo) out.push('Complexo');
  if (nodes.some((n) => n.tipo === 'sistema')) out.push('Sistema');
  if (nodes.some((n) => n.tipo === 'decisao')) out.push('Decisão');
  const usadas = new Set(edges.map((e) => e.tipo));
  for (const [t, nome] of Object.entries(RELACOES)) if (usadas.has(t)) out.push(nome);
  if (edges.some((e) => e.multDe || e.multPara)) out.push('Multiplicidade');
  if (nodes.some(temMembros)) out.push('Atributos e métodos');
  return out;
}
