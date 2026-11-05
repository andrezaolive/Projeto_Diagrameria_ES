// Alertas de clientes impacientes (pop-ups no canto inferior direito).
//  - "atencao": pedido novo com 25% ou menos da paciência → o cliente cobra uma resposta
//  - "saiu": o cliente foi embora, mas ainda há outros pedidos na fila
//    (se era o último pedido do dia, nada aparece)

export const LIMITE_ATENCAO = 0.25;

export const FRASES = {
  atencao: [
    'Olá? Tem alguém aí?',
    'Oi! Alguém leu meu e-mail?',
    'Ainda estão vendo meu pedido?',
    'Estou esperando uma resposta...',
    'Tic-tac... vou acabar procurando outra agência.',
    'Psiu! Esqueceram de mim?',
  ],
  saiu: [
    'Cansei de esperar. Vou procurar outra agência.',
    'Ninguém me respondeu... tchau!',
    'Desisto. Fica para a próxima.',
    'Esperei demais. Até nunca mais!',
  ],
};

// `evitar`: frases já na tela, para dois pop-ups juntos não dizerem a mesma coisa
export const sortearFrase = (tipo, aleatorio = Math.random, evitar = []) => {
  const livres = FRASES[tipo].filter((f) => !evitar.includes(f));
  const lista = livres.length ? livres : FRASES[tipo];
  return lista[Math.min(lista.length - 1, Math.floor(aleatorio() * lista.length))];
};

const NA_FILA = ['novo', 'aceito'];

// Compara os pedidos com o que já foi avisado e devolve os alertas novos.
// `vistos` = { atencao: Set<id>, saiu: Set<id> } (não é alterado: devolve cópias atualizadas)
export function detectarAlertas(pedidos = [], vistos = { atencao: new Set(), saiu: new Set() }) {
  const atencao = new Set(vistos.atencao);
  const saiu = new Set(vistos.saiu);
  const alertas = [];
  for (const p of pedidos) {
    if (p.status === 'novo' && p.paciencia != null && !atencao.has(p.id) && p.paciencia / p.pacienciaTotal <= LIMITE_ATENCAO) {
      atencao.add(p.id);
      alertas.push({ tipo: 'atencao', pedido: p });
    }
    if (p.status === 'expirado' && !saiu.has(p.id)) {
      saiu.add(p.id);
      const temFila = pedidos.some((o) => o.id !== p.id && NA_FILA.includes(o.status));
      if (temFila) alertas.push({ tipo: 'saiu', pedido: p });
    }
  }
  return { alertas, vistos: { atencao, saiu } };
}

// Ponto de partida ao abrir o jogo: o que já estava expirado não gera alerta de novo
export const vistosIniciais = (pedidos = []) => ({
  atencao: new Set(pedidos.filter((p) => p.status !== 'novo').map((p) => p.id)),
  saiu: new Set(pedidos.filter((p) => p.status === 'expirado').map((p) => p.id)),
});
