// Reação do mascote à nota de uma entrega (0–100)
export const REACOES = {
  espatifado: { fala: 'Ai... nada a ver com o pedido!', rotulo: 'Muito ruim' },
  triste: { fala: 'Hmm, o cliente não gostou...', rotulo: 'Ruim' },
  neutro: { fala: 'Dá pra melhorar!', rotulo: 'Médio' },
  feliz: { fala: 'Bom trabalho!', rotulo: 'Bom' },
  comemorando: { fala: 'PERFEITO! O cliente amou!', rotulo: 'Excelente' },
};

export function reacaoMascote(nota) {
  if (nota <= 0) return 'espatifado';
  if (nota < 30) return 'triste';
  if (nota < 60) return 'neutro';
  if (nota < 85) return 'feliz';
  return 'comemorando';
}
