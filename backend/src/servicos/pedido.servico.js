const regras = require('../dominio/jogo/regras');
const relogio = require('../dominio/jogo/relogio');
const { transicionarPedido, exigirDiaEmAndamento } = require('../dominio/jogo/estados');
const { calcularNota, calcularPagamento } = require('../dominio/jogo/pontuacao');
const { validarDiagrama, compararDiagramas } = require('../dominio/diagrama');
const { ErroDeValidacao, ErroNaoEncontrado } = require('../dominio/erros');
const { emTransacao } = require('../repositorios/transacao');
const dias = require('../repositorios/dias.repositorio');
const pedidos = require('../repositorios/pedidos.repositorio');
const entregas = require('../repositorios/entregas.repositorio');
const gabaritos = require('../repositorios/gabaritos.repositorio');
const usuarios = require('../repositorios/usuarios.repositorio');
const diaServico = require('./dia.servico');

/**
 * Pedido: aceitar (RF04) e entregar (RF12-RF15, RF21, RF22, RF26).
 *
 * As duas acoes travam o dia do pedido e sincronizam antes de decidir: o
 * pedido que "aguarda" no banco pode ja ter expirado no relogio.
 *
 * A ordem das checagens importa para o codigo de erro sair certo: primeiro o
 * pedido (expirado, ja entregue), depois o dia (pausado, encerrado). O ultimo
 * cliente expirado encerra o dia — quem tentar entregar para ele tem que ouvir
 * PEDIDO_EXPIRADO, nao DIA_ENCERRADO.
 */

/** Abre a transacao com o dia do pedido travado e ja sincronizado. */
async function noDiaDoPedido(pedidoId, usuarioId, trabalho) {
  return emTransacao(async (trx) => {
    const encontrado = await pedidos.buscarDoUsuario(pedidoId, usuarioId, trx);
    if (!encontrado) throw new ErroNaoEncontrado('Pedido nao encontrado.');

    const dia = await dias.buscarDoUsuario(encontrado.dia_id, usuarioId, trx);
    const sincronizado = await diaServico.sincronizar(dia, trx);
    const linha = sincronizado.linhas.find((pedido) => pedido.id === encontrado.id);
    const estado = relogio.estadoDoPedido(diaServico.pedidoDoDominio(linha), sincronizado.tempo);

    return trabalho({ trx, ...sincronizado, linha, estado });
  });
}

async function aceitar(pedidoId, usuarioId) {
  return noDiaDoPedido(pedidoId, usuarioId, async ({ trx, dia, linha, estado, tempo }) => {
    const status = transicionarPedido(estado, 'aceitar');
    exigirDiaEmAndamento(dia.status);

    await pedidos.atualizar(linha.id, { status, aceito_ms: tempo }, trx);
    return diaServico.apresentarPedido({ ...linha, status, aceito_ms: tempo }, tempo);
  });
}

/**
 * Entrega final: valida o diagrama, compara com o gabarito, calcula nota e
 * pagamento, grava tudo e credita as moedas — numa transacao so. Se o pedido
 * era o ultimo pendente, o dia se encerra na mesma transacao e o resumo volta
 * junto.
 *
 * @returns {Promise<object>} resultado, diff, o diagrama esperado (RF15/RF22) e o dia.
 */
async function entregar(pedidoId, usuarioId, diagrama) {
  // Diagrama malformado e erro de requisicao (400), nao entrega ruim: nao gasta
  // o pedido. Validado antes da transacao, sem travar nada.
  const problemas = validarDiagrama(diagrama);
  if (problemas.length > 0) {
    throw new ErroDeValidacao(
      'O diagrama enviado nao e valido.',
      problemas.map(({ campo, mensagem }) => ({
        campo: campo === '(corpo)' ? 'diagrama' : `diagrama/${campo}`,
        mensagem,
      }))
    );
  }

  return noDiaDoPedido(pedidoId, usuarioId, async ({ trx, dia, linha, estado, tempo }) => {
    const status = transicionarPedido(estado, 'entregar');
    exigirDiaEmAndamento(dia.status);

    const gabarito = await gabaritos.buscarPorId(linha.gabarito_id, trx);
    const diff = compararDiagramas(gabarito.diagrama, diagrama);
    const nota = calcularNota(diff, regras.pesosPorFase(dia.fase));
    const pagamento = calcularPagamento({
      nota: nota.nota,
      dificuldade: linha.dificuldade,
      tempoRestanteMs: relogio.pacienciaRestanteMs(diaServico.pedidoDoDominio(linha), tempo),
      pacienciaMs: linha.paciencia_ms,
    });

    await entregas.inserir(
      {
        pedidoId: linha.id,
        diagrama,
        diff,
        nota: nota.nota,
        ...pagamento,
        entregueMs: tempo,
      },
      trx
    );
    await pedidos.atualizar(linha.id, { status }, trx);
    // RF21: o credito sai na hora da entrega aceita, nao no fim do dia.
    await usuarios.creditarMoedas(usuarioId, pagamento.moedas + pagamento.gorjeta, trx);

    const depois = await diaServico.sincronizar(dia, trx);

    return {
      resultado: { nota: nota.nota, ...pagamento },
      // Para a tela de comparacao entender de onde veio a nota.
      detalheDaNota: { ganho: nota.ganho, desconto: nota.desconto, maximo: nota.maximo },
      diff,
      esperado: gabarito.diagrama,
      dia: diaServico.apresentarDia(depois),
    };
  });
}

module.exports = { aceitar, entregar };
