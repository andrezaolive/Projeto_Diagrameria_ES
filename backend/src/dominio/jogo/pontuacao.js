const regras = require('./regras');

/**
 * Do diff do ValidadorUML ate a nota, e da nota ate moedas, gorjeta e pontos.
 *
 * Funcoes puras: tempo e pesos chegam por parametro. O servico le o relogio e a
 * fase; aqui so ha conta.
 */

/**
 * Nota proporcional com desconto por sobra (decisao da Sprint 2):
 *
 *   nota = max(0, (ganho - desconto) / maximo)
 *
 * - maximo: soma dos pesos de tudo que o gabarito tem;
 * - ganho: o que o jogador acertou (atributo/metodo com detalhe errado vale
 *   uma fracao do peso);
 * - desconto: o que o jogador inventou. Sem ele, desenhar "de tudo" tiraria 100%.
 *
 * @param {object} diff  Saida de compararDiagramas().
 * @param {object} pesos  Saida de regras.pesosPorFase().
 * @returns {{nota: number, ganho: number, desconto: number, maximo: number}}
 */
function calcularNota(diff, pesos) {
  const { classes, estereotipos, atributos, metodos, relacionamentos, multiplicidades } = diff;
  const fracao = regras.FRACAO_COM_DETALHE_ERRADO;

  const membros = (grupo, peso) => ({
    ganho: (grupo.corretos.length + grupo.comDetalheErrado.length * fracao) * peso,
    maximo: (grupo.corretos.length + grupo.comDetalheErrado.length + grupo.faltando.length) * peso,
    desconto: grupo.extras.length * peso,
  });
  const doAtributo = membros(atributos, pesos.atributo);
  const doMetodo = membros(metodos, pesos.metodo);

  const maximo =
    (classes.corretas.length + classes.faltando.length) * pesos.classe +
    (estereotipos.corretos.length + estereotipos.errados.length) * pesos.estereotipo +
    doAtributo.maximo +
    doMetodo.maximo +
    (relacionamentos.corretos.length +
      relacionamentos.invertidos.length +
      relacionamentos.tipoErrado.length +
      relacionamentos.faltando.length) *
      pesos.relacionamento +
    (multiplicidades.corretas.length +
      multiplicidades.erradas.length +
      multiplicidades.semRelacionamento.length) *
      pesos.multiplicidade;

  const ganho =
    classes.corretas.length * pesos.classe +
    estereotipos.corretos.length * pesos.estereotipo +
    doAtributo.ganho +
    doMetodo.ganho +
    relacionamentos.corretos.length * pesos.relacionamento +
    multiplicidades.corretas.length * pesos.multiplicidade;

  const desconto =
    classes.extras.length * pesos.classe +
    estereotipos.indevidos.length * pesos.estereotipo +
    doAtributo.desconto +
    doMetodo.desconto +
    relacionamentos.extras.length * pesos.relacionamento;

  // Gabarito vazio: nao ha o que acertar. Entregar vazio e perfeito; qualquer
  // coisa a mais e erro.
  if (maximo === 0) {
    return { nota: desconto === 0 ? 1 : 0, ganho: 0, desconto, maximo };
  }

  const nota = Math.max(0, (ganho - desconto) / maximo);
  return { nota: arredondar(nota, 4), ganho, desconto, maximo };
}

/**
 * RF14, RF21, RF26: o que o pedido paga.
 *
 * Abaixo da nota minima o cliente recusa: nao paga e conta como cliente
 * perdido, com a mesma punicao de quem foi embora (RF05).
 *
 * @param {object} entrada
 * @param {number} entrada.nota  0 a 1.
 * @param {number} entrada.dificuldade  1 a 5.
 * @param {number} entrada.tempoRestanteMs  Paciencia que sobrava na entrega.
 * @param {number} entrada.pacienciaMs  Paciencia total do cliente.
 * @returns {{aceita: boolean, moedas: number, gorjeta: number, pontos: number}}
 */
function calcularPagamento({ nota, dificuldade, tempoRestanteMs, pacienciaMs }) {
  if (nota < regras.NOTA_MINIMA_PARA_ACEITAR) {
    return { aceita: false, moedas: 0, gorjeta: 0, pontos: -regras.PUNICAO_POR_CLIENTE_PERDIDO };
  }

  const valorBase = regras.MOEDAS_POR_DIFICULDADE * dificuldade;
  const fracaoDoTempo = limitar(tempoRestanteMs / pacienciaMs, 0, 1);

  const moedas = Math.round(valorBase * nota);
  const gorjeta = Math.round(valorBase * regras.FRACAO_MAXIMA_DE_GORJETA * nota * fracaoDoTempo);
  const pontos = Math.round(regras.PONTOS_POR_PEDIDO * nota) + gorjeta;

  return { aceita: true, moedas, gorjeta, pontos };
}

/** Maior pontuacao possivel de um pedido: nota 1, entregue no instante da chegada. */
function pontosMaximosDoPedido(dificuldade) {
  return calcularPagamento({ nota: 1, dificuldade, tempoRestanteMs: 1, pacienciaMs: 1 }).pontos;
}

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function arredondar(valor, casas) {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

module.exports = { calcularNota, calcularPagamento, pontosMaximosDoPedido };
