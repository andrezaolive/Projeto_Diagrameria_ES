/**
 * Regras numericas do jogo, num lugar so.
 *
 * Todo numero que a PO pode querer ajustar (pesos, valores, prazos, limiares)
 * mora aqui. A logica em pontuacao.js, relogio.js e resumoDoDia.js so le daqui:
 * mudar um valor nao exige mexer em regra nenhuma, e o teste de cada regra
 * continua valendo.
 *
 * Os valores atuais sao PROPOSTOS e ainda dependem da validacao da PO. Cada um
 * cita o requisito do documento de engenharia (docs/Projeto Engenharia de
 * Software.pdf) de onde saiu.
 */

/** Faixas de 10 fases: 1-10 e a faixa 0, 11-20 a faixa 1, e assim por diante. */
function faixaDaFase(fase) {
  return Math.floor((fase - 1) / 10);
}

// --- Clientes e gabaritos --------------------------------------------------

/** RF01 + PO: 3 clientes na fase 1, mais 1 a cada 10 fases. */
function clientesPorFase(fase) {
  return 3 + faixaDaFase(fase);
}

/** RF19: a complexidade sobe no mesmo ritmo dos clientes, ate a dificuldade 5. */
function dificuldadePorFase(fase) {
  return Math.min(5, 1 + faixaDaFase(fase));
}

/** Intervalo entre a chegada de um cliente e a do seguinte. O primeiro chega em 0. */
const CHEGADA = { intervaloMinimoMs: 45_000, intervaloMaximoMs: 90_000 };

/** RF20: paciencia do cliente entre 2 e 5 minutos. Tambem e CHECK no banco. */
const PACIENCIA = { minimaSegundos: 120, maximaSegundos: 300 };

/**
 * Folga depois do fim da paciencia antes de considerar o pedido expirado. O
 * relogio e do servidor: sem folga, uma entrega enviada no ultimo segundo
 * chegaria depois do prazo so por causa da rede.
 */
const TOLERANCIA_DE_LATENCIA_MS = 2_000;

// --- Pontuacao -------------------------------------------------------------

/**
 * RF18: peso de cada tipo de elemento, que muda com a fase. No comeco o que
 * importa e acertar as classes; a partir da fase 11, relacionamentos e
 * multiplicidades passam a pesar mais.
 *
 * `estereotipo` so conta nas classes em que o gabarito declara um estereotipo
 * diferente de 'classe' (abstrata, interface, enum). Senao todo diagrama
 * ganharia pontos de graca.
 */
const PESOS_BASE = {
  classe: 3,
  estereotipo: 1,
  atributo: 1,
  metodo: 1,
  relacionamento: 2,
  multiplicidade: 0.5,
};

const PESOS_A_PARTIR_DA_FASE_11 = { ...PESOS_BASE, relacionamento: 3, multiplicidade: 1 };

function pesosPorFase(fase) {
  return faixaDaFase(fase) === 0 ? PESOS_BASE : PESOS_A_PARTIR_DA_FASE_11;
}

/**
 * Atributo ou metodo com o nome certo, mas tipo/retorno ou visibilidade
 * errados, vale esta fracao do peso.
 */
const FRACAO_COM_DETALHE_ERRADO = 0.5;

/** RF21: abaixo desta nota o cliente recusa a entrega e nao paga. */
const NOTA_MINIMA_PARA_ACEITAR = 0.5;

/** RF21: valor base do pedido, em moedas, por ponto de dificuldade. */
const MOEDAS_POR_DIFICULDADE = 10;

/** RF26: a gorjeta maxima e esta fracao do valor base (com nota 1 e entrega imediata). */
const FRACAO_MAXIMA_DE_GORJETA = 0.5;

/** RF14: pontos de um pedido com nota 1, antes da gorjeta. */
const PONTOS_POR_PEDIDO = 100;

/** RF05: pontos perdidos por cliente que foi embora ou recusou a entrega. */
const PUNICAO_POR_CLIENTE_PERDIDO = 50;

// --- Dia de trabalho -------------------------------------------------------

/**
 * RF24: desempenho minimo do dia (pontos / maximo possivel) para nao dar Game
 * Over. Sobe com a dificuldade da fase.
 */
function limiarDeGameOver(fase) {
  const faixa = faixaDaFase(fase);
  if (faixa === 0) return 0.4;
  if (faixa === 1) return 0.5;
  return 0.6;
}

/** RF29: pausas permitidas por dia. Sem limite, pausar viraria tempo extra a vontade. */
const PAUSAS_POR_DIA = 3;

module.exports = {
  clientesPorFase,
  dificuldadePorFase,
  pesosPorFase,
  limiarDeGameOver,
  CHEGADA,
  PACIENCIA,
  TOLERANCIA_DE_LATENCIA_MS,
  FRACAO_COM_DETALHE_ERRADO,
  NOTA_MINIMA_PARA_ACEITAR,
  MOEDAS_POR_DIFICULDADE,
  FRACAO_MAXIMA_DE_GORJETA,
  PONTOS_POR_PEDIDO,
  PUNICAO_POR_CLIENTE_PERDIDO,
  PAUSAS_POR_DIA,
};
