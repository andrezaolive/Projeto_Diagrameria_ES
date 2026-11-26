// Modificadores de expediente (modo infinito): a partida é dividida em ciclos de 3 a 5 pedidos
// terminados (entregues, recusados ou perdidos). O primeiro ciclo é normal; cada ciclo seguinte
// sorteia um modificador que muda uma regra até o ciclo acabar. Estado em `sessao.ciclo`:
// { n, mod, faltam, total } (mod = id de MODIFICADORES ou null). Funções puras: o sorteio vem de fora.

export const CICLO = { min: 3, max: 5 };
export const NOTA_AUDITORIA = 70; // semana de auditoria: entrega abaixo disso custa um coração
export const FATOR = {
  impaciente: 0.7, // prazo dos pedidos que chegam
  tranquila: 1.5, // paciência dos clientes que chegam
  generoso: 1.5, // recompensa dos pedidos que chegam
  apertado: 1.5, // preço de dicas, itens da lojinha e cápsulas
};
// Escalada do modo infinito: a caixa de e-mail (pedidos normais em aberto, novos + aceitos) começa
// com 2 e ganha mais 1 a cada 5 a 10 pedidos terminados, até 6 (`sessao.caixa = { tam, faltam }`).
// A sobrecarga põe 1 a mais por cima disso. Urgentes não contam na caixa.
export const CAIXA = { inicial: 2, max: 6, crescerMin: 5, crescerMax: 10, sobrecarga: 1 };
// Chance de urgente a cada minuto: 1/5 no primeiro ciclo do expediente, subindo a cada ciclo até 1/3
export const URGENTE_INFINITO = { inicial: 1 / 5, max: 1 / 3, ciclosAteOMax: 5 };

export const MODIFICADORES = [
  { id: 'impaciente', nome: 'Cliente impaciente', efeito: 'Os pedidos que chegarem têm prazo 30% menor.', tom: 'ruim' },
  { id: 'tranquila', nome: 'Hora tranquila', efeito: 'Nada de pedidos urgentes, e os clientes que chegarem esperam 50% a mais.', tom: 'bom' },
  { id: 'auditoria', nome: 'Semana de auditoria', efeito: `Entrega abaixo de ${NOTA_AUDITORIA}% custa um coração.`, tom: 'ruim' },
  { id: 'cafe', nome: 'Café grátis', efeito: 'Fazer café não gasta cápsula.', tom: 'bom', soComCafeteira: true },
  { id: 'sobrecarga', nome: 'Sobrecarga', efeito: 'Um pedido a mais na caixa ao mesmo tempo.', tom: 'ruim' },
  { id: 'generoso', nome: 'Cliente generoso', efeito: 'Os pedidos que chegarem pagam 50% a mais.', tom: 'bom' },
  { id: 'apertado', nome: 'Orçamento apertado', efeito: 'Dicas, itens da lojinha e cápsulas custam 50% a mais.', tom: 'ruim' },
];
export const modificadorPorId = (id) => MODIFICADORES.find((m) => m.id === id) ?? null;

// Quantos pedidos dura um ciclo (3 a 5), a partir de um número em [0, 1)
export const tamanhoDoCiclo = (sorteio = 0.5) => CICLO.min + Math.min(CICLO.max - CICLO.min, Math.floor(sorteio * (CICLO.max - CICLO.min + 1)));

export const cicloInicial = (sorteio) => {
  const total = tamanhoDoCiclo(sorteio);
  return { n: 1, mod: null, faltam: total, total };
};

// Sorteia o modificador do próximo ciclo: nunca o mesmo do ciclo anterior; o café grátis só entra
// para quem tem a cafeteira
export function sortearModificador(sorteio, anterior, { temCafeteira = false } = {}) {
  const opcoes = MODIFICADORES.filter((m) => m.id !== anterior && (!m.soComCafeteira || temCafeteira));
  return opcoes[Math.min(opcoes.length - 1, Math.floor(sorteio * opcoes.length))].id;
}

// Conta `n` pedidos terminados no ciclo; ao fechar, começa o próximo com um modificador sorteado.
// Um único `sorteio` dá o modificador e o tamanho do ciclo (a parte fracionária de sorteio × 7).
export function avancarCiclo(ciclo, n, sorteio = 0.5, opcoes = {}) {
  if (!ciclo || !n) return ciclo;
  const faltam = ciclo.faltam - n;
  if (faltam > 0) return { ...ciclo, faltam };
  const total = tamanhoDoCiclo((sorteio * 7) % 1);
  return { n: ciclo.n + 1, mod: sortearModificador(sorteio, ciclo.mod, opcoes), faltam: total, total };
}

export const modificadorAtivo = (sessao) => (sessao?.modo === 'infinito' ? sessao.ciclo?.mod ?? null : null);
export const temModificador = (sessao, id) => modificadorAtivo(sessao) === id;

// Preço com o "Orçamento apertado" (dicas, lojinha, cápsulas)
export const precoNoExpediente = (preco, sessao) => (temModificador(sessao, 'apertado') ? Math.round(preco * FATOR.apertado) : preco);

// Quantos pedidos terminados até a caixa crescer de novo (5 a 10), a partir de um número em [0, 1)
export const pedidosParaCrescer = (sorteio = 0.5) => CAIXA.crescerMin + Math.min(CAIXA.crescerMax - CAIXA.crescerMin, Math.floor(sorteio * (CAIXA.crescerMax - CAIXA.crescerMin + 1)));
export const caixaInicial = (sorteio) => ({ tam: CAIXA.inicial, faltam: pedidosParaCrescer(sorteio) });

// Conta `n` pedidos terminados; ao chegar a hora, a caixa ganha mais um lugar (até CAIXA.max)
export function crescerCaixa(caixa, n, sorteio = 0.5) {
  if (!caixa || !n || caixa.tam >= CAIXA.max) return caixa;
  const faltam = caixa.faltam - n;
  if (faltam > 0) return { ...caixa, faltam };
  const tam = caixa.tam + 1;
  return { tam, faltam: tam >= CAIXA.max ? 0 : pedidosParaCrescer(sorteio) };
}

// Quantos pedidos normais ficam em aberto na caixa do modo infinito (save antigo sem `caixa`: 2)
export const tamanhoDaCaixa = (sessao) => (sessao?.caixa?.tam ?? CAIXA.inicial) + (temModificador(sessao, 'sobrecarga') ? CAIXA.sobrecarga : 0);

// Chance de chegar um urgente no sorteio do minuto: no infinito sobe com o ciclo do expediente
export function chanceDeUrgente(sessao, base) {
  if (sessao?.modo !== 'infinito') return base;
  const { inicial, max, ciclosAteOMax } = URGENTE_INFINITO;
  const ciclo = sessao.ciclo?.n ?? 1;
  return Math.min(max, inicial + ((max - inicial) * (ciclo - 1)) / ciclosAteOMax);
}

// Aplica o modificador ativo num pedido que acabou de chegar (marca `pedido.mod` para o e-mail mostrar)
export function aplicarModificador(sessao, pedido) {
  const mod = modificadorAtivo(sessao);
  if (!pedido || !mod) return pedido;
  if (mod === 'impaciente') {
    const tempo = Math.max(30, Math.round(pedido.tempo * FATOR.impaciente));
    return { ...pedido, tempo, tempoRestante: tempo, mod };
  }
  if (mod === 'tranquila') {
    const paciencia = Math.round(pedido.paciencia * FATOR.tranquila);
    return { ...pedido, paciencia, pacienciaTotal: paciencia, mod };
  }
  if (mod === 'generoso') {
    return {
      ...pedido,
      recompensa: Math.round(pedido.recompensa * FATOR.generoso),
      ...(pedido.recompensaNormal ? { recompensaNormal: Math.round(pedido.recompensaNormal * FATOR.generoso) } : {}),
      mod,
    };
  }
  return pedido;
}

