import { modeloPorId } from '../data/pedidos.js';
import { tipoDoModelo } from './categorias.js';

// Pedido de retorno (modo infinito): um cliente escreve de novo pedindo um diagrama que a agência
// já entregou. O jogador procura no Arquivo (aba do e-mail, com as entregas desta e das partidas
// anteriores, `state.arquivo`) e reenvia o registro certo. Dois tipos:
//  - reenvio: o cliente diz quem é e qual era o pedido; é só achar no meio dos outros registros.
//  - ambiguo: o e-mail não tem assinatura e só dá pistas (tipo de diagrama, inicial da empresa,
//    quando foi, como saiu a nota...), as suficientes para sobrar um registro só.
// Reenviar o certo paga e conta como pedido entregue; o errado tira paciência do cliente.

export const RETORNO = {
  chance: 0.25, // de um pedido que chega ser um retorno
  aPartirDe: 5, // número do pedido na partida
  minRegistros: 3, // diagramas diferentes no arquivo
  chanceAmbiguo: 0.4,
  maxArquivo: 40,
  penalidade: 10, // segundos de paciência perdidos ao reenviar o registro errado
  recompensa: { reenvio: 80, ambiguo: 140 }, // antes do fator do modo infinito
  paciencia: 30, // segundos de tolerância do cliente
};

export const NOME_DO_TIPO = { casos: 'de casos de uso', classes: 'de classes', estados: 'de estados', jumbo: 'duplo (dois diagramas de uma vez)' };

// Registro do arquivo para uma entrega (`partida` = número do jogo, estatisticas.jogos)
export function registroDaEntrega(pedido, nota, partida) {
  const m = modeloPorId(pedido.modelo);
  return { id: `${pedido.id}@${partida}`, modelo: pedido.modelo, cliente: pedido.cliente, assunto: pedido.assunto.replace(/^URGENTE: /, ''), nota, partida, tipo: m ? tipoDoModelo(m) : null };
}
export const arquivar = (arquivo, registro) => [...(arquivo ?? []), registro].slice(-RETORNO.maxArquivo);

// Diagramas diferentes no arquivo (o mesmo pedido entregue duas vezes conta uma)
const modelosDe = (registros) => new Set(registros.map((r) => r.modelo));

const faixaDaNota = (nota) => (nota >= 90 ? 'alta' : nota >= 70 ? 'media' : 'baixa');
const palavraDoAssunto = (assunto) => assunto.split(/[^\p{L}]+/u).reduce((a, b) => (b.length > a.length ? b : a), '');

// Pistas possíveis, na ordem em que entram no e-mail ambíguo: { texto, vale(registro) }
function pistasPossiveis(alvo, partidaAtual) {
  const hoje = alvo.partida === partidaAtual;
  const faixa = faixaDaNota(alvo.nota);
  const palavra = palavraDoAssunto(alvo.assunto);
  return [
    { texto: `Era um diagrama ${NOME_DO_TIPO[alvo.tipo] ?? ''}.`, vale: (r) => r.tipo === alvo.tipo },
    { texto: `O nome da nossa empresa começa com "${alvo.cliente[0]}".`, vale: (r) => r.cliente[0] === alvo.cliente[0] },
    { texto: hoje ? 'Vocês entregaram hoje mesmo, nesta partida.' : 'Foi numa partida anterior, não hoje.', vale: (r) => (r.partida === partidaAtual) === hoje },
    {
      texto: faixa === 'alta' ? 'O diagrama saiu quase perfeito.' : faixa === 'media' ? 'O diagrama saiu bom, mas não perfeito.' : 'Lembro que o diagrama tinha alguns erros.',
      vale: (r) => faixaDaNota(r.nota) === faixa,
    },
    { texto: `Tinha a ver com "${palavra.toLowerCase()}".`, vale: (r) => palavraDoAssunto(r.assunto) === palavra },
    { texto: `O pedido se chamava "${alvo.assunto}".`, vale: (r) => r.assunto === alvo.assunto },
  ];
}

// As pistas do e-mail ambíguo: entram na ordem até sobrar só o diagrama certo (pelo menos 2). Uma
// pista que não descarta nenhum registro fica de fora (não ajudaria), menos a primeira (o tipo).
export function pistasDoRetorno(alvo, arquivo, partidaAtual) {
  const escolhidas = [];
  let restam = arquivo;
  for (const p of pistasPossiveis(alvo, partidaAtual)) {
    const depois = restam.filter(p.vale);
    const descarta = modelosDe(depois).size < modelosDe(restam).size;
    if (escolhidas.length && !descarta && modelosDe(restam).size > 1) continue;
    escolhidas.push(p);
    restam = depois;
    if (escolhidas.length >= 2 && modelosDe(restam).size <= 1) break;
  }
  return escolhidas.map((p) => p.texto);
}

// Pode chegar um retorno agora? (nenhum outro em aberto, arquivo com diagramas suficientes)
export const podeChegarRetorno = (sessao, arquivo) =>
  sessao.modo === 'infinito' &&
  sessao.seq >= RETORNO.aPartirDe &&
  modelosDe(arquivo ?? []).size >= RETORNO.minRegistros &&
  !sessao.pedidos.some((p) => p.retorno && ['novo', 'aceito'].includes(p.status));

// Monta o pedido de retorno: `sorteio` em [0, 1) escolhe o registro e o tipo (ou `tipoForcado`)
export function criarRetorno(arquivo, seq, partidaAtual, sorteio = 0.5, tipoForcado = null) {
  const alvo = arquivo[Math.min(arquivo.length - 1, Math.floor(sorteio * arquivo.length))];
  const tipo = tipoForcado ?? ((sorteio * 7) % 1 < RETORNO.chanceAmbiguo ? 'ambiguo' : 'reenvio');
  const texto =
    tipo === 'reenvio'
      ? [
          `Olá! Aqui é da ${alvo.cliente} de novo.`,
          `Vocês fizeram para nós o diagrama "${alvo.assunto}", mas perdemos o arquivo. Poderiam reenviar?`,
          'Deve estar guardado no arquivo de pedidos de vocês.',
        ]
      : [
          'Oi! Vocês fizeram um diagrama para a gente faz um tempo e precisamos dele de novo.',
          'Não lembro o nome do pedido, mas lembro disto:',
          ...pistasDoRetorno(alvo, arquivo, partidaAtual).map((p) => `• ${p}`),
          'Consegue achar no arquivo e reenviar?',
        ];
  return {
    id: `retorno-${seq}`,
    modelo: alvo.modelo,
    cliente: tipo === 'reenvio' ? alvo.cliente : 'Contato sem assinatura',
    assunto: tipo === 'reenvio' ? `Reenvio: ${alvo.assunto}` : 'Aquele diagrama de antes...',
    recompensa: RETORNO.recompensa[tipo],
    tempo: 0,
    tempoRestante: 0,
    paciencia: RETORNO.paciencia,
    pacienciaTotal: RETORNO.paciencia,
    status: 'novo',
    pedacos: [],
    retorno: { tipo, texto },
  };
}

// O registro reenviado é o diagrama que o cliente pediu?
export const registroCerto = (pedido, registro) => Boolean(pedido?.retorno && registro && registro.modelo === pedido.modelo);
