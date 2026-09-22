const regras = require('./regras');
const { pontosMaximosDoPedido } = require('./pontuacao');

/**
 * RF23/RF24: consolidacao do dia de trabalho, e a decisao de Game Over.
 *
 * Recebe os pedidos ja resolvidos (entregue ou expirado). Pedido entregue traz
 * o resultado da entrega; entrega recusada (nota abaixo do minimo) ja vem com
 * a punicao nos pontos, calculada por calcularPagamento().
 *
 * @param {number} fase
 * @param {Array<{dificuldade: number, estado: string,
 *   entrega?: {aceita: boolean, pontos: number, moedas: number, gorjeta: number}}>} pedidos
 */
function resumirDia(fase, pedidos) {
  let pontos = 0;
  let pontosMaximos = 0;
  let moedas = 0;
  let gorjetas = 0;
  let aceitas = 0;
  let recusadas = 0;
  let expirados = 0;

  for (const pedido of pedidos) {
    pontosMaximos += pontosMaximosDoPedido(pedido.dificuldade);

    if (pedido.estado === 'entregue') {
      pontos += pedido.entrega.pontos;
      moedas += pedido.entrega.moedas + pedido.entrega.gorjeta;
      gorjetas += pedido.entrega.gorjeta;
      if (pedido.entrega.aceita) aceitas += 1;
      else recusadas += 1;
    } else {
      expirados += 1;
      pontos -= regras.PUNICAO_POR_CLIENTE_PERDIDO;
    }
  }

  const desempenho = pontosMaximos === 0 ? 0 : Math.max(0, pontos) / pontosMaximos;
  const limiar = regras.limiarDeGameOver(fase);
  const gameOver = desempenho < limiar;

  return {
    fase,
    clientes: pedidos.length,
    aceitas,
    recusadas,
    expirados,
    clientesPerdidos: recusadas + expirados,
    pontos,
    pontosMaximos,
    desempenho: Math.round(desempenho * 10_000) / 10_000,
    limiar,
    // Moedas ja creditadas pedido a pedido (RF21); aqui so o total do dia.
    moedas,
    gorjetas,
    gameOver,
    // Game Over repete a fase (RF24); senao, o progresso avanca (RF17).
    proximaFase: gameOver ? fase : fase + 1,
  };
}

module.exports = { resumirDia };
