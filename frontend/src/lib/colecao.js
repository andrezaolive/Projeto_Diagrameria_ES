// Coleção de pedidos: cada modelo já entregue pelo menos uma vez fica "desbloqueado", com a melhor
// nota e uma medalha (broche) pela melhor nota. state.colecao[modeloId] = { entregas, melhorNota }.

// Medalha pela nota (precisão) da melhor entrega, e também pelo desempenho de um dia do calendário.
// A ordem importa: a primeira cujo `min` a nota alcança.
export const MEDALHAS = [
  { id: 'ouro', nome: 'Ouro', numero: 1, min: 95 },
  { id: 'prata', nome: 'Prata', numero: 2, min: 70 },
  { id: 'bronze', nome: 'Bronze', numero: 3, min: 0 },
];

export const medalhaDaNota = (nota) => (nota == null ? null : MEDALHAS.find((m) => nota >= m.min));

// Cor da porcentagem de desempenho (carimbo do calendário): verde acima de 90%, amarelo de 70% a
// 90%, laranja abaixo. As cores vêm de TINTAS (art/palette.js).
export const corDoDesempenho = (nota) => (nota > 90 ? 'verde' : nota >= 70 ? 'amarelo' : 'laranja');

export const naColecao = (colecao, modeloId) => (colecao?.[modeloId]?.entregas ?? 0) > 0;

// Uma entrega a mais do modelo, guardando a melhor nota
export function registrarEntrega(colecao = {}, modeloId, nota) {
  const atual = colecao[modeloId] ?? { entregas: 0, melhorNota: 0 };
  return { ...colecao, [modeloId]: { entregas: atual.entregas + 1, melhorNota: Math.max(atual.melhorNota, nota) } };
}
