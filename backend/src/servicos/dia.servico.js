const regras = require('../dominio/jogo/regras');
const relogio = require('../dominio/jogo/relogio');
const { transicionarDia, DIA_ENCERRADO } = require('../dominio/jogo/estados');
const { resumirDia } = require('../dominio/jogo/resumoDoDia');
const { ErroDeConflito, ErroNaoEncontrado } = require('../dominio/erros');
const { emTransacao, agora } = require('../repositorios/transacao');
const dias = require('../repositorios/dias.repositorio');
const pedidos = require('../repositorios/pedidos.repositorio');
const gabaritos = require('../repositorios/gabaritos.repositorio');
const usuarios = require('../repositorios/usuarios.repositorio');

/**
 * Dia de trabalho: iniciar, consultar, pausar e retomar (RF17, RF23, RF24, RF29).
 *
 * Nao ha cron. O estado de cada pedido e derivado do relogio a cada leitura, e
 * o dia se encerra sozinho na primeira leitura (ou acao) em que todos os
 * pedidos ja estao resolvidos — entregues ou expirados. E `sincronizar()`
 * quem faz isso, e toda operacao passa por ela.
 */

// --- Conversao de linha do banco para o dominio ----------------------------

function relogioDoDia(linha) {
  return {
    iniciadoEmMs: linha.iniciado_em.getTime(),
    tempoPausadoMs: linha.tempo_pausado_ms,
    pausadoEmMs: linha.pausado_em ? linha.pausado_em.getTime() : null,
  };
}

/** Tempo de jogo agora. Dia encerrado: o relogio parou no encerramento. */
function tempoDoDia(linhaDia, agoraMs) {
  const instante = linhaDia.encerrado_em ? linhaDia.encerrado_em.getTime() : agoraMs;
  return relogio.tempoDeJogo(relogioDoDia(linhaDia), instante);
}

function pedidoDoDominio(linha) {
  return { chegadaMs: linha.chegada_ms, pacienciaMs: linha.paciencia_ms, status: linha.status };
}

function resultadoDaEntrega(linha) {
  if (linha.entrega_nota === null || linha.entrega_nota === undefined) return null;
  return {
    nota: linha.entrega_nota,
    aceita: linha.entrega_aceita,
    pontos: linha.entrega_pontos,
    moedas: linha.entrega_moedas,
    gorjeta: linha.entrega_gorjeta,
  };
}

// --- Sincronizacao ---------------------------------------------------------

/**
 * Le os pedidos do dia no tempo atual e, se todos ja estiverem resolvidos,
 * encerra o dia: grava o resumo (RF23), decide Game Over (RF24), marca os
 * expirados para o historico e avanca a fase (RF17).
 *
 * Tem que rodar numa transacao com o dia travado (dias.buscar* ja travam).
 *
 * @returns {Promise<{dia: object, linhas: object[], tempo: number}>}
 */
async function sincronizar(linhaDia, trx) {
  const agoraMs = await agora(trx);
  const tempo = tempoDoDia(linhaDia, agoraMs);
  const linhas = await pedidos.listarDoDia(linhaDia.id, trx);

  // Pausado nada expira; encerrado ja foi resolvido.
  if (linhaDia.status !== 'em_andamento') return { dia: linhaDia, linhas, tempo };

  const estados = linhas.map((linha) => relogio.estadoDoPedido(pedidoDoDominio(linha), tempo));
  const resolvido = estados.every((estado) => estado === 'entregue' || estado === 'expirado');
  if (!resolvido) return { dia: linhaDia, linhas, tempo };

  const resumo = resumirDia(
    linhaDia.fase,
    linhas.map((linha, i) => ({
      dificuldade: linha.dificuldade,
      estado: estados[i],
      entrega: resultadoDaEntrega(linha),
    }))
  );

  await pedidos.marcarExpirados(
    linhas
      .filter((linha, i) => estados[i] === 'expirado' && linha.status !== 'expirado')
      .map((l) => l.id),
    trx
  );
  const dia = await dias.atualizar(
    linhaDia.id,
    {
      status: transicionarDia(linhaDia.status, resumo.gameOver ? 'dar_game_over' : 'concluir'),
      encerrado_em: new Date(agoraMs),
      resumo: JSON.stringify(resumo),
    },
    trx
  );
  if (!resumo.gameOver) {
    await usuarios.avancarFase(linhaDia.usuario_id, linhaDia.fase, trx);
  }

  return { dia, linhas: await pedidos.listarDoDia(dia.id, trx), tempo: tempoDoDia(dia, agoraMs) };
}

// --- Apresentacao ----------------------------------------------------------

/**
 * O pedido como o jogador ve. Nunca inclui o diagrama do gabarito: ele so sai
 * na resposta da entrega (RF15).
 */
function apresentarPedido(linha, tempo) {
  const status = relogio.estadoDoPedido(pedidoDoDominio(linha), tempo);
  const correndo = status === 'aguardando' || status === 'aceito';

  return {
    id: linha.id,
    ordem: linha.ordem,
    titulo: linha.titulo,
    enunciado: linha.enunciado,
    dificuldade: linha.dificuldade,
    status,
    pacienciaMs: linha.paciencia_ms,
    pacienciaRestanteMs: correndo ? relogio.pacienciaRestanteMs(pedidoDoDominio(linha), tempo) : 0,
    resultado: resultadoDaEntrega(linha),
  };
}

/**
 * O dia como o jogador ve. Pedido que ainda nao chegou fica de fora — o
 * frontend so sabe QUANDO chega o proximo (`proximaChegadaEmMs`), para saber
 * quando consultar de novo sem WebSocket.
 */
function apresentarDia({ dia, linhas, tempo }) {
  const encerrado = DIA_ENCERRADO.has(dia.status);
  const futuras = linhas.map((linha) => linha.chegada_ms).filter((chegada) => chegada > tempo);

  return {
    id: dia.id,
    fase: dia.fase,
    status: dia.status,
    tempoDeJogoMs: tempo,
    pausasRestantes: Math.max(0, regras.PAUSAS_POR_DIA - dia.pausas_usadas),
    clientesNoDia: linhas.length,
    proximaChegadaEmMs: encerrado || futuras.length === 0 ? null : Math.min(...futuras) - tempo,
    pedidos: linhas
      .filter((linha) => encerrado || linha.chegada_ms <= tempo)
      .map((linha) => apresentarPedido(linha, tempo)),
    resumo: dia.resumo ?? null,
  };
}

// --- Operacoes -------------------------------------------------------------

/** DIA_EM_ANDAMENTO com o id do dia aberto, para o frontend poder retoma-lo. */
class ErroConflitoDeDiaAberto extends ErroDeConflito {
  constructor(diaId) {
    super('Ja existe um dia de trabalho em andamento.', 'DIA_EM_ANDAMENTO');
    this.detalhes = { diaId };
  }
}

async function progresso(usuarioId) {
  const usuario = await usuarios.buscarPorId(usuarioId);
  if (!usuario) throw new ErroNaoEncontrado('Usuario nao encontrado.');
  return { fase: usuario.fase_atual, moedas: usuario.moedas };
}

/**
 * Abre o dia da fase atual: sorteia os clientes, o horario de chegada de cada
 * um e o gabarito de cada pedido, tudo de uma vez.
 *
 * Se houver um dia aberto que na verdade ja terminou (o jogador saiu e os
 * clientes expiraram), ele e encerrado aqui antes — e so entao o novo abre.
 */
async function iniciar(usuarioId) {
  return emTransacao(async (trx) => {
    const aberto = await dias.buscarAberto(usuarioId, trx);
    if (aberto) {
      const { dia } = await sincronizar(aberto, trx);
      if (!DIA_ENCERRADO.has(dia.status)) {
        throw new ErroConflitoDeDiaAberto(dia.id);
      }
    }

    // Lido depois da sincronizacao: encerrar o dia anterior pode ter avancado a fase.
    const { fase_atual: fase } = await usuarios.buscarPorId(usuarioId, trx);
    const chegadas = relogio.gerarChegadas(regras.clientesPorFase(fase), Math.random);
    const dificuldade = regras.dificuldadePorFase(fase);

    const dia = await dias.inserir({ usuarioId, fase }, trx);

    const sorteados = [];
    const linhas = [];
    for (const [i, chegadaMs] of chegadas.entries()) {
      const gabarito = await gabaritos.sortear(
        { dificuldade, usuarioId, jaSorteadosNoDia: sorteados },
        trx
      );
      if (!gabarito) {
        throw new ErroDeConflito('Nao ha gabaritos ativos para montar o dia.', 'SEM_GABARITOS');
      }
      sorteados.push(gabarito.id);
      linhas.push({
        dia_id: dia.id,
        gabarito_id: gabarito.id,
        ordem: i + 1,
        chegada_ms: chegadaMs,
        paciencia_ms: gabarito.tempo_limite_segundos * 1000,
        dificuldade: gabarito.dificuldade,
      });
    }
    await pedidos.inserirVarios(linhas, trx);

    return apresentarDia(await sincronizar(dia, trx));
  });
}

/** O dia aberto do jogador, ja sincronizado. Pode voltar encerrado, com o resumo. */
async function atual(usuarioId) {
  return emTransacao(async (trx) => {
    const aberto = await dias.buscarAberto(usuarioId, trx);
    if (!aberto) throw new ErroNaoEncontrado('Nenhum dia de trabalho em andamento.');
    return apresentarDia(await sincronizar(aberto, trx));
  });
}

async function consultar(diaId, usuarioId) {
  return emTransacao(async (trx) => {
    const dia = await dias.buscarDoUsuario(diaId, usuarioId, trx);
    if (!dia) throw new ErroNaoEncontrado('Dia de trabalho nao encontrado.');
    return apresentarDia(await sincronizar(dia, trx));
  });
}

/** RF29: congela o relogio. A area de montagem some no frontend. */
async function pausar(diaId, usuarioId) {
  return emTransacao(async (trx) => {
    const encontrado = await dias.buscarDoUsuario(diaId, usuarioId, trx);
    if (!encontrado) throw new ErroNaoEncontrado('Dia de trabalho nao encontrado.');

    // Sincroniza antes: pausar um dia que ja terminou tem que dar DIA_ENCERRADO.
    const { dia } = await sincronizar(encontrado, trx);
    const status = transicionarDia(dia.status, 'pausar');
    if (dia.pausas_usadas >= regras.PAUSAS_POR_DIA) {
      throw new ErroDeConflito(
        `Voce ja usou as ${regras.PAUSAS_POR_DIA} pausas deste dia.`,
        'LIMITE_DE_PAUSAS'
      );
    }

    const pausado = await dias.atualizar(
      dia.id,
      { status, pausado_em: new Date(await agora(trx)), pausas_usadas: dia.pausas_usadas + 1 },
      trx
    );
    return apresentarDia(await sincronizar(pausado, trx));
  });
}

async function retomar(diaId, usuarioId) {
  return emTransacao(async (trx) => {
    const dia = await dias.buscarDoUsuario(diaId, usuarioId, trx);
    if (!dia) throw new ErroNaoEncontrado('Dia de trabalho nao encontrado.');

    const status = transicionarDia(dia.status, 'retomar');
    const duracaoDaPausa = (await agora(trx)) - dia.pausado_em.getTime();

    const retomado = await dias.atualizar(
      dia.id,
      {
        status,
        pausado_em: null,
        tempo_pausado_ms: dia.tempo_pausado_ms + Math.max(0, duracaoDaPausa),
      },
      trx
    );
    return apresentarDia(await sincronizar(retomado, trx));
  });
}

module.exports = {
  progresso,
  iniciar,
  atual,
  consultar,
  pausar,
  retomar,
  // Usados pelo servico de pedidos, que age dentro de um dia.
  sincronizar,
  apresentarDia,
  apresentarPedido,
  pedidoDoDominio,
};
