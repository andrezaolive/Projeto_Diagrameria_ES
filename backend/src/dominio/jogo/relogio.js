const regras = require('./regras');

/**
 * Tempo de jogo: o relogio do dia de trabalho, que para durante a pausa (RF29).
 *
 * Tudo dentro do dia e medido nele, nao em horario de parede. O pedido guarda
 * quando o cliente chega e quanto dura a paciencia em tempo de jogo; pausar so
 * para o relogio, sem reescrever prazo nenhum.
 *
 * O estado do pedido e derivado aqui na leitura — nao ha cron marcando pedido
 * como expirado. `agora` sempre chega por parametro (o servico le o now() do
 * Postgres): nada neste arquivo le o relogio.
 */

/**
 * @param {object} dia
 * @param {number} dia.iniciadoEmMs
 * @param {number} dia.tempoPausadoMs  Soma das pausas ja encerradas.
 * @param {number|null} dia.pausadoEmMs  Inicio da pausa em curso, se houver.
 * @param {number} agoraMs
 * @returns {number} milissegundos de jogo desde o inicio do dia.
 */
function tempoDeJogo(dia, agoraMs) {
  const pausaEmCurso = dia.pausadoEmMs === null ? 0 : agoraMs - dia.pausadoEmMs;
  return Math.max(0, agoraMs - dia.iniciadoEmMs - dia.tempoPausadoMs - pausaEmCurso);
}

/**
 * Estado visivel do pedido. `status` e o que esta gravado (aguardando, aceito,
 * entregue, expirado); `a_caminho` e `expirado` tambem sao derivados do tempo.
 *
 * @param {{chegadaMs: number, pacienciaMs: number, status: string}} pedido
 * @param {number} tempo  Tempo de jogo atual.
 */
function estadoDoPedido(pedido, tempo) {
  if (pedido.status === 'entregue' || pedido.status === 'expirado') return pedido.status;
  if (tempo < pedido.chegadaMs) return 'a_caminho';
  if (tempo > prazoDoPedido(pedido) + regras.TOLERANCIA_DE_LATENCIA_MS) return 'expirado';
  return pedido.status;
}

/** Instante, em tempo de jogo, em que a paciencia acaba (sem a tolerancia). */
function prazoDoPedido(pedido) {
  return pedido.chegadaMs + pedido.pacienciaMs;
}

/** Paciencia que sobra, para o cronometro do frontend e para a gorjeta. */
function pacienciaRestanteMs(pedido, tempo) {
  return Math.max(0, prazoDoPedido(pedido) - tempo);
}

/**
 * Horario de chegada de cada cliente do dia, em tempo de jogo. O primeiro chega
 * na abertura; os seguintes em intervalos sorteados entre o minimo e o maximo.
 *
 * @param {number} quantidade
 * @param {() => number} aleatorio  Retorna [0, 1). Injetado para o teste fixar o sorteio.
 * @returns {number[]}
 */
function gerarChegadas(quantidade, aleatorio) {
  const { intervaloMinimoMs, intervaloMaximoMs } = regras.CHEGADA;
  const chegadas = [];
  let instante = 0;

  for (let i = 0; i < quantidade; i += 1) {
    if (i > 0) {
      instante += Math.round(
        intervaloMinimoMs + aleatorio() * (intervaloMaximoMs - intervaloMinimoMs)
      );
    }
    chegadas.push(instante);
  }

  return chegadas;
}

module.exports = {
  tempoDeJogo,
  estadoDoPedido,
  prazoDoPedido,
  pacienciaRestanteMs,
  gerarChegadas,
};
