const { ErroDeConflito } = require('../erros');

/**
 * Maquinas de estado do dia de trabalho e do pedido.
 *
 * Cada maquina diz, para cada estado, que eventos sao aceitos e para onde
 * levam. Evento nao previsto vira ErroDeConflito com um codigo que diz POR QUE
 * foi recusado — "pedido expirado" e "pedido ainda nao chegou" pedem reacoes
 * diferentes no frontend, entao nao podem sair como o mesmo erro.
 *
 * O estado do pedido que entra aqui e o DERIVADO (relogio.estadoDoPedido), nao
 * o gravado: um pedido "aguardando" no banco pode ja estar expirado no tempo.
 */

const DIA = {
  em_andamento: { pausar: 'pausado', concluir: 'concluido', dar_game_over: 'game_over' },
  pausado: { retomar: 'em_andamento' },
  concluido: {},
  game_over: {},
};

const RECUSAS_DO_DIA = {
  pausado: { codigo: 'DIA_PAUSADO', mensagem: 'O dia esta pausado. Retome para continuar.' },
  em_andamento: { codigo: 'DIA_NAO_PAUSADO', mensagem: 'O dia nao esta pausado.' },
  concluido: { codigo: 'DIA_ENCERRADO', mensagem: 'Este dia de trabalho ja terminou.' },
  game_over: { codigo: 'DIA_ENCERRADO', mensagem: 'Este dia de trabalho ja terminou.' },
};

const PEDIDO = {
  aguardando: { aceitar: 'aceito' },
  aceito: { entregar: 'entregue' },
  a_caminho: {},
  entregue: {},
  expirado: {},
};

const RECUSAS_DO_PEDIDO = {
  a_caminho: { codigo: 'PEDIDO_NAO_CHEGOU', mensagem: 'Este cliente ainda nao chegou.' },
  aguardando: {
    codigo: 'PEDIDO_NAO_ACEITO',
    mensagem: 'Aceite o pedido antes de entregar o diagrama.',
  },
  aceito: { codigo: 'PEDIDO_JA_ACEITO', mensagem: 'Este pedido ja foi aceito.' },
  entregue: { codigo: 'PEDIDO_JA_ENTREGUE', mensagem: 'Este pedido ja foi entregue.' },
  expirado: {
    codigo: 'PEDIDO_EXPIRADO',
    mensagem: 'A paciencia do cliente acabou e ele foi embora.',
  },
};

function transicionar(maquina, recusas, estado, evento) {
  const destino = maquina[estado]?.[evento];
  if (destino) return destino;

  const recusa = recusas[estado];
  throw new ErroDeConflito(recusa.mensagem, recusa.codigo);
}

/** @returns {string} novo estado do dia. @throws {ErroDeConflito} */
function transicionarDia(estado, evento) {
  return transicionar(DIA, RECUSAS_DO_DIA, estado, evento);
}

/** @returns {string} novo estado do pedido. @throws {ErroDeConflito} */
function transicionarPedido(estadoDerivado, evento) {
  return transicionar(PEDIDO, RECUSAS_DO_PEDIDO, estadoDerivado, evento);
}

const DIA_ENCERRADO = new Set(['concluido', 'game_over']);

/**
 * Aceitar e entregar pedido so valem com o dia correndo: pausado, a area de
 * montagem fica escondida (RF29); encerrado, nao ha mais cliente.
 *
 * @throws {ErroDeConflito} DIA_PAUSADO ou DIA_ENCERRADO.
 */
function exigirDiaEmAndamento(estado) {
  if (estado === 'em_andamento') return;
  const recusa = RECUSAS_DO_DIA[estado];
  throw new ErroDeConflito(recusa.mensagem, recusa.codigo);
}

module.exports = { transicionarDia, transicionarPedido, exigirDiaEmAndamento, DIA_ENCERRADO };
