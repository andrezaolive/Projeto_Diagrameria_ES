import { FATOR_INFINITO, FATOR_REPETICAO, MODELOS, despesaDoDia, TODOS_MODELOS, URGENTE, criarPedido, criarPedidoUrgente, ehComplexo, ehJumbo, intervaloChegada, modeloPorId, multaPedido, partesDoModelo, pedacosDoModelo, pedidosDoFimDeSemana, precoPedaco, sortearPedidosDoDia } from '../data/pedidos.js';
import { registrarEntrega } from '../lib/colecao.js';
import { CANSACO, depoisDoCafe, derramouCafe, nivelDoCansaco, quedaDeEnergia, resolverEvento, sortearCansaco, sortearEvento } from '../lib/eventos.js';
import { RETORNO, arquivar, criarRetorno, podeChegarRetorno, registroCerto, registroDaEntrega } from '../lib/retorno.js';
import { NOTA_AUDITORIA, aplicarModificador, avancarCiclo, caixaInicial, chanceDeUrgente, cicloInicial, crescerCaixa, precoNoExpediente, tamanhoDaCaixa, temModificador } from '../lib/modificadores.js';
import { ALEATORIA, faixasDoJogador, temTocaFitas } from '../data/musicas.js';
import { avatarPadrao } from '../lib/avatar.js';
import { dataDoDia, niveisNoInfinito, nivelDoModelo, sextaAntes } from '../lib/dificuldade.js';
import { AUMENTO_CLODE, PRECO_CLODE, PRECO_CLODE_INFINITO, acaoDoClode } from '../lib/clode.js';
import { CAPSULAS, EFEITO_SEGUNDOS, cafeInicial, motivoSemCafe, ritmoDoJogo, temCafeteira, tempoDePreparo } from '../data/cafe.js';
import { conteudoDe, ehPorta, grupoDoObjeto, membrosDoGrupo, moverComConteudo, soltarDependentes } from '../lib/decoracao.js';
import { arrumarPremios, desbloquear, marcosIniciais, verificarConquistas } from '../lib/conquistas.js';
import { pagamentoDaEntrega } from '../lib/avaliacao.js';
import { CONQUISTAS } from '../art/conquistas.js';
import { criarPedidoDeTreino } from '../data/treino.js';

export const DIAS_CAMPANHA = 23; // dias úteis de um mês de 31 dias começando na segunda

export const ITENS_INICIAIS = ['fundo-por-do-sol'];

export const MAX_HISTORICO = 30;
// Desempenho mínimo do dia (ver desempenhoDoDia) para liberar o próximo dia da campanha
export const MEDIA_MINIMA = 60;
// Modo infinito: corações da partida. Some um quando um cliente vai embora (pedido perdido) ou quando
// um pedido é entregue atrasado; sem nenhum, a partida acaba (`sessao.fimDeJogo`).
export const VIDAS_INFINITO = 3;
// Modo infinito: no máximo 3 pedidos aceitos (em andamento) ao mesmo tempo
export const MAX_ACEITOS_INFINITO = 3;
export const NIVEIS_INTERFACE = ['reduzido', 'auto', 'grande'];

const estatisticasIniciais = () => ({
  jogos: 0,
  jogosPorModo: { campanha: 0, infinito: 0 },
  entregues: 0,
  recusados: 0,
  expirados: 0, // clientes que cansaram de esperar e foram embora
  multas: 0, // total pago em multas por pedidos perdidos
  somaNotas: 0,
  melhorNota: 0,
  excelentes: 0,
  ganhoTotal: 0,
  historico: [], // últimas entregas: { nota, valor }
  // para a aba de estatísticas (lib/estatisticas.js): o que ajuda o jogador a melhorar
  porTipo: { casos: { n: 0, soma: 0, tempo: 0 }, classes: { n: 0, soma: 0, tempo: 0 }, estados: { n: 0, soma: 0, tempo: 0 } },
  porNivel: { facil: { n: 0, soma: 0 }, medio: { n: 0, soma: 0 }, dificil: { n: 0, soma: 0 } },
  noPrazo: 0,
  atrasados: 0,
  erros: {}, // tipo do problema do feedback (lib/feedback.js) → quantas vezes
  gastos: { loja: 0, dicas: 0, cafe: 0 },
  pedacos: 0, // pedaços de dica comprados
  comDica: { n: 0, soma: 0 }, // entregas em que o jogador comprou dica, e as outras
  semDica: { n: 0, soma: 0 },
  despesas: 0, // aluguel e luz
  recordeInfinito: 0, // mais pedidos entregues numa partida do modo infinito
});

// Soma uma entrega nas estatísticas de desempenho: nota por tipo de diagrama (JUMBO: cada parte com a
// sua nota, `notasPartes`), por dificuldade, prazo, tempo usado (prazo gasto + atraso), erros do
// feedback (`erros`, contados no editor) e se usou dica.
function registrarDesempenho(e, pedido, { nota, atrasado, erros, notasPartes }) {
  const m = pedido && modeloPorId(pedido.modelo);
  if (!m) return e;
  const tempo = Math.max(0, (pedido.tempo ?? 0) - (pedido.tempoRestante ?? 0) + (pedido.atraso ?? 0));
  const partes = partesDoModelo(m);
  const porTipo = { ...e.porTipo };
  partes.forEach((p, i) => {
    const t = porTipo[p.secao] ?? { n: 0, soma: 0, tempo: 0 };
    porTipo[p.secao] = { n: t.n + 1, soma: t.soma + (notasPartes?.[i] ?? nota), tempo: t.tempo + tempo / partes.length };
  });
  const nivel = nivelDoModelo(m).id;
  const nv = e.porNivel?.[nivel] ?? { n: 0, soma: 0 };
  const errosTotal = { ...e.erros };
  for (const [tipo, q] of Object.entries(erros ?? {})) errosTotal[tipo] = (errosTotal[tipo] ?? 0) + q;
  const dica = (pedido.pedacos ?? []).length || pedido.clode ? 'comDica' : 'semDica'; // (o Clode conta como dica)
  return {
    ...e,
    porTipo,
    porNivel: { ...e.porNivel, [nivel]: { n: nv.n + 1, soma: nv.soma + nota } },
    noPrazo: (e.noPrazo ?? 0) + (atrasado ? 0 : 1),
    atrasados: (e.atrasados ?? 0) + (atrasado ? 1 : 0),
    erros: errosTotal,
    [dica]: { n: (e[dica]?.n ?? 0) + 1, soma: (e[dica]?.soma ?? 0) + nota },
  };
}
const gastar = (e, onde, valor) => ({ ...e, gastos: { ...e.gastos, [onde]: (e.gastos?.[onde] ?? 0) + valor } });

export const estadoInicial = () => ({
  perfil: { nome: null, avatar: avatarPadrao(), conta: null }, // conta = { email } quando logado
  estatisticas: estatisticasIniciais(),
  dinheiro: 100,
  config: { musica: 60, efeitos: 70, interface: 'auto', vhsAtivo: false, vhsIntensidade: 50, nomesNegrito: false }, // interface: reduzido | auto | grande; nomesNegrito: nomes dos pedidos em negrito no lugar das aspas (components/TextoPedido.jsx)
  // concluidos[dia] = { ganho, media }; fimDeSemana[data do calendário] = { ganho, media }
  campanha: { desbloqueado: 1, concluidos: {}, fimDeSemana: {} },
  loja: { possui: [...ITENS_INICIAIS], fundo: 'fundo-por-do-sol', moveis: [], musica: null }, // musica: escolhida no toca-fitas
  // posicoes[objeto]: ver lib/decoracao.js (sem entrada = posição padrão)
  // guardados: objetos-base guardados no inventário (os da loja usam loja.moveis)
  escritorio: { posicoes: {}, guardados: [] },
  cafe: cafeInicial(), // cafeteira: cápsulas, preparo, caneca cheia e efeito (ver data/cafe.js)
  computador: { icones: {} }, // posição dos ícones da área de trabalho ({ id: { col, lin } }, ver lib/areaTrabalho.js)
  sessao: null,
  diagramas: {},
  colecao: {}, // pedidos já entregues: { [modeloId]: { entregas, melhorNota } } (ver lib/colecao.js)
  arquivo: [], // últimas entregas (desta e das partidas anteriores), para os pedidos de retorno (lib/retorno.js)
  // conquistas desbloqueadas ({ [id]: { ordem } }), contadores que as regras usam e os avisos ainda
  // não mostrados ({ id, noBau }); ver lib/conquistas.js
  conquistas: {},
  marcos: marcosIniciais(),
  avisosConquista: [],
  // tutorial da primeira vez no computador (screens/Tutorial.jsx); até ele acabar, os pedidos da
  // primeira partida esperam em `sessao.esperaTutorial`
  tutorial: { visto: false },
});

// Junta um save antigo com o formato atual
export function migrar(salvo) {
  const base = estadoInicial();
  const renomear = (ids = []) => ids.map((id) => id.replace(/^movel-/, 'obj-'));
  const loja = { ...base.loja, ...salvo.loja };
  return {
    ...base,
    ...salvo,
    loja: { ...loja, possui: renomear(loja.possui), moveis: renomear(loja.moveis) },
    escritorio: { ...base.escritorio, ...salvo.escritorio },
    colecao: { ...salvo.colecao },
    conquistas: { ...salvo.conquistas },
    marcos: { ...base.marcos, ...salvo.marcos },
    avisosConquista: [...(salvo.avisosConquista ?? [])],
    // saves de antes do tutorial: quem já jogou não vê ele de novo
    tutorial: { visto: Boolean(salvo.tutorial?.visto ?? (salvo.estatisticas?.jogos ?? 0) > 0) },
    campanha: { ...base.campanha, ...salvo.campanha, fimDeSemana: { ...salvo.campanha?.fimDeSemana } },
    cafe: { ...base.cafe, ...salvo.cafe, capsulas: { ...base.cafe.capsulas, ...salvo.cafe?.capsulas } },
    computador: { ...base.computador, ...salvo.computador, icones: { ...salvo.computador?.icones } },
    perfil: { ...base.perfil, ...salvo.perfil, avatar: { ...base.perfil.avatar, ...salvo.perfil?.avatar } },
    estatisticas: {
      ...base.estatisticas,
      ...salvo.estatisticas,
      jogosPorModo: { ...base.estatisticas.jogosPorModo, ...salvo.estatisticas?.jogosPorModo },
      porTipo: { ...base.estatisticas.porTipo, ...salvo.estatisticas?.porTipo },
      porNivel: { ...base.estatisticas.porNivel, ...salvo.estatisticas?.porNivel },
      gastos: { ...base.estatisticas.gastos, ...salvo.estatisticas?.gastos },
    },
    // versões antigas guardavam a interface como número de 0 a 100
    config: {
      ...base.config,
      ...salvo.config,
      interface: NIVEIS_INTERFACE.includes(salvo.config?.interface) ? salvo.config.interface : 'auto',
    },
  };
}

const vazio = () => ({ nodes: [], edges: [] });

// Modo infinito: os primeiros pedidos são fáceis, depois entram os médios e, mais adiante, os difíceis.
// Pedidos JUMBO (dois diagramas) só depois dos primeiros pedidos, e os complexos mais adiante.
export const JUMBO_A_PARTIR_DE = 4;
export const COMPLEXO_A_PARTIR_DE = 6;
function novoPedidoAleatorio(sessao) {
  const ultimo = sessao.pedidos.at(-1)?.modelo;
  const niveis = niveisNoInfinito(sessao.seq);
  const base = (sessao.seq >= JUMBO_A_PARTIR_DE ? TODOS_MODELOS : MODELOS).filter((m) => sessao.seq >= COMPLEXO_A_PARTIR_DE || !ehComplexo(m));
  const opcoes = base.filter((m) => m.id !== ultimo && niveis.includes(nivelDoModelo(m).id));
  const m = opcoes[Math.floor(Math.random() * opcoes.length)];
  return naSessao({ ...sessao, modo: 'infinito' }, criarPedido(m.id, sessao.seq, 1));
}

export const NA_FILA = ['novo', 'aceito'];

// Cansaço que chegou ao fim (tela preta) sem café: o jogador dorme CANSACO.sono s e acorda com tudo
// atrasado. Campanha: chegam de uma vez todos os pedidos que faltavam no dia, mais 1 ou 2 urgentes, e
// todos os em aberto viram aceitos com o prazo esgotado. Infinito: os em aberto viram aceitos com o
// prazo esgotado (marcados `dormiu`: entregar atrasado não tira outro coração), chegam 2 pedidos já
// aceitos com metade do prazo, e o jogador perde 1 coração. `sessao.acordou` mostra o aviso.
function adormecer(state, action) {
  const s = state.sessao;
  if (!s?.cansaco || s.dormindo || partidaEncerrada(s) || nivelDoCansaco(s) < 1) return state;
  const atrasar = (p) => (NA_FILA.includes(p.status) && !p.retorno ? { ...p, status: 'aceito', tempoRestante: 0, atraso: p.atraso ?? 0, dormiu: true } : p);
  let sessao = { ...s, cansaco: null, semCansacoAte: s.segundos + CANSACO.descanso, dormindo: { falta: CANSACO.sono, total: CANSACO.sono } };
  let novos = [];
  if (s.modo === 'campanha') {
    let seq = s.seq;
    for (const id of s.fila ?? []) novos.push(naSessao(sessao, criarPedido(id, seq++, s.dia)));
    const [min, max] = CANSACO.urgentesAoDormir;
    const quantos = (action?.sorteio ?? 0) < 0.5 ? min : max;
    const usados = new Set([...s.pedidos, ...novos].map((p) => p.modelo));
    const opcoes = MODELOS.filter((m) => !usados.has(m.id));
    for (let k = 0; k < quantos; k++) {
      const m = (opcoes.length ? opcoes : MODELOS)[(Math.floor((action?.sorteioChegada ?? 0.5) * 997) + k * 7) % (opcoes.length || MODELOS.length)];
      novos.push(naSessao(sessao, criarPedidoUrgente(m.id, seq++, s.dia)));
    }
    sessao = { ...sessao, seq, fila: [], proximoEm: null, pedidos: [...s.pedidos, ...novos].map(atrasar) };
  } else {
    sessao = { ...sessao, pedidos: s.pedidos.map(atrasar) };
    for (let k = 0; k < CANSACO.novosAoDormir; k++) {
      const p = novoPedidoAleatorio(sessao);
      const metade = { ...p, status: 'aceito', tempoRestante: Math.ceil(p.tempo / 2), dormiu: true };
      sessao = { ...sessao, pedidos: [...sessao.pedidos, metade], seq: sessao.seq + 1 };
      novos.push(metade);
    }
  }
  const atrasados = sessao.pedidos.filter((p) => p.dormiu).length;
  const ativo = sessao.pedidos.some((p) => p.id === sessao.ativo && p.status === 'aceito') ? sessao.ativo : sessao.pedidos.find((p) => p.status === 'aceito')?.id ?? null;
  sessao = { ...sessao, ativo, acordou: { n: (s.acordou?.n ?? 0) + 1, atrasados, chegaram: novos.length } };
  const depois = { ...state, sessao };
  return s.modo === 'infinito' ? perderVidas(depois, 1) : depois;
}

// Modo infinito: o pedido que substitui um terminado não chega na hora; chega de 10 a 20 s de jogo
// depois (`sessao.chegadas` = segundos de jogo em que cada um chega, liberados no TICK)
export const ESPERA_INFINITO = { min: 10, max: 20 };
export const esperaDoProximo = (sorteio = 0.5) => ESPERA_INFINITO.min + Math.min(ESPERA_INFINITO.max - ESPERA_INFINITO.min, Math.floor(sorteio * (ESPERA_INFINITO.max - ESPERA_INFINITO.min + 1)));
const abertosNaCaixa = (sessao) => sessao.pedidos.filter((p) => !p.urgente && NA_FILA.includes(p.status)).length;

// Modo infinito: conta os pedidos que terminaram no ciclo do expediente (pode virar o ciclo e sortear
// o modificador seguinte) e agenda a chegada dos que faltam para a caixa ter `tamanhoDaCaixa`
// pedidos normais em aberto. Urgentes não contam na caixa: chegam por fora e não são repostos.
function reporInfinito(state, sessao, terminados, sorteio = 0.5) {
  if (sessao.modo !== 'infinito') return sessao;
  const ciclo = avancarCiclo(sessao.ciclo, terminados, sorteio, { temCafeteira: temCafeteira(state) });
  if (ciclo !== sessao.ciclo) sessao = { ...sessao, ciclo };
  // escalada: a caixa cresce de 2 até 6 a cada 5 a 10 pedidos terminados
  const caixa = crescerCaixa(sessao.caixa, terminados, (sorteio * 13) % 1);
  if (caixa !== sessao.caixa) sessao = { ...sessao, caixa };
  const chegadas = [...(sessao.chegadas ?? [])];
  const faltam = tamanhoDaCaixa(sessao) - abertosNaCaixa(sessao) - chegadas.length;
  // um número por vaga, tirado do mesmo sorteio, para dois pedidos não chegarem juntos sempre
  for (let i = 0; i < faltam; i++) chegadas.push((sessao.segundos ?? 0) + esperaDoProximo((sorteio * (i + 3) * 7) % 1));
  return { ...sessao, chegadas };
}

// TICK do modo infinito: chegam os pedidos agendados para este segundo (se ainda houver vaga na caixa).
// Com `sorteio` abaixo de RETORNO.chance (e arquivo com entregas), o que chega é um pedido de retorno.
export function chegarPedidosInfinito(sessao, { arquivo, partida, sorteio } = {}) {
  if (!sessao.chegadas?.length) return sessao;
  const agora = sessao.segundos ?? 0;
  const prontos = sessao.chegadas.filter((t) => t <= agora).length;
  if (!prontos) return sessao;
  sessao = { ...sessao, chegadas: sessao.chegadas.filter((t) => t > agora) };
  for (let i = 0; i < prontos && abertosNaCaixa(sessao) < tamanhoDaCaixa(sessao); i++) {
    const retorno = sorteio != null && sorteio < RETORNO.chance && podeChegarRetorno(sessao, arquivo);
    const pedido = retorno ? naSessao(sessao, criarRetorno(arquivo, sessao.seq, partida, sorteio / RETORNO.chance)) : novoPedidoAleatorio(sessao);
    sessao = { ...sessao, pedidos: [...sessao.pedidos, pedido], seq: sessao.seq + 1 };
  }
  return sessao;
}

// Um urgente por vez na fila. `sorteio` em [0, 1): abaixo da chance chega um, e o mesmo
// número (reescalado) escolhe o modelo entre os que não estão na fila. Sem `sorteio`, nunca chega.
// Chance: URGENTE.chance (1/5); no modo infinito sobe a cada ciclo do expediente até 1/3 (chanceDeUrgente).
export function sortearUrgente(sessao, segundos, sorteio) {
  if (temModificador(sessao, 'tranquila')) return null; // hora tranquila: nada de urgentes
  const chance = chanceDeUrgente(sessao, URGENTE.chance);
  if (sorteio == null || segundos % URGENTE.intervalo !== 0 || sorteio >= chance) return null;
  if (sessao.pedidos.some((p) => p.urgente && NA_FILA.includes(p.status))) return null;
  const naFila = new Set(sessao.pedidos.filter((p) => NA_FILA.includes(p.status)).map((p) => p.modelo));
  const opcoes = MODELOS.filter((m) => !naFila.has(m.id));
  const lista = opcoes.length ? opcoes : MODELOS;
  const m = lista[Math.min(lista.length - 1, Math.floor((sorteio / chance) * lista.length))];
  return naSessao(sessao, criarPedidoUrgente(m.id, sessao.seq, sessao.modo === 'campanha' ? sessao.dia : 1));
}

// Pagamento conforme a sessão: dia já concluído jogado de novo paga FATOR_REPETICAO; o modo infinito
// paga FATOR_INFINITO. Vale para todo pedido que chega na sessão (e a multa acompanha).
export function naSessao(sessao, pedido) {
  if (!pedido) return pedido;
  const infinito = sessao?.modo === 'infinito';
  const fator = (sessao?.repeticao ? FATOR_REPETICAO : 1) * (infinito ? FATOR_INFINITO : 1);
  // modo infinito: o modificador do expediente (lib/modificadores.js) vale para quem chega agora
  if (fator === 1) return aplicarModificador(sessao, pedido);
  return aplicarModificador(sessao, {
    ...pedido,
    recompensa: Math.round(pedido.recompensa * fator),
    ...(pedido.recompensaNormal ? { recompensaNormal: Math.round(pedido.recompensaNormal * fator) } : {}),
    ...(sessao.repeticao ? { repeticao: true } : {}),
    ...(infinito ? { infinito: true } : {}),
  });
}

const atualizarPedido = (sessao, id, f) => ({
  ...sessao,
  pedidos: sessao.pedidos.map((p) => (p.id === id ? { ...p, ...f(p) } : p)),
});

// Pedidos que já não pedem nada do jogador
export const FINALIZADOS = ['entregue', 'recusado', 'expirado'];
// Relógio do jogo precisa correr? (pedido em andamento, cliente esperando resposta ou pedido a
// caminho: `sessao.chegadas` no modo infinito, a fila do dia na campanha)
// (durante o tutorial e o pedido de treino, `esperaTutorial`, o relógio fica parado)
export const temRelogio = (sessao) =>
  Boolean(
    !sessao?.esperaTutorial &&
    (sessao?.chegadas?.length ||
      (sessao?.fila?.length && !sessao.esperaTutorial) ||
      sessao?.dormindo ||
      sessao?.pedidos.some((p) => p.status === 'aceito' || (p.status === 'novo' && p.paciencia != null))),
  );

// Vários pedidos podem estar aceitos ao mesmo tempo; `sessao.ativo` é o que está aberto no editor.
// Quando ele sai (entregue/recusado), o editor passa para outro aceito (o mais antigo), se houver.
export const pedidosAceitos = (sessao) => sessao?.pedidos.filter((p) => p.status === 'aceito') ?? [];
const proximoAtivo = (sessao) => pedidosAceitos(sessao)[0]?.id ?? null;
// Dá para aceitar mais um? (na campanha, sem limite; no infinito, até MAX_ACEITOS_INFINITO normais
// em andamento; urgentes não contam e sempre podem ser aceitos)
export const podeAceitar = (sessao, pedido) =>
  sessao?.modo !== 'infinito' || Boolean(pedido?.urgente) || pedidosAceitos(sessao).filter((p) => !p.urgente).length < MAX_ACEITOS_INFINITO;

// O dia só acaba quando todos os pedidos chegaram (fila vazia) e terminaram
export const diaEncerrado = (sessao) =>
  sessao?.modo === 'campanha' && !sessao.esperaTutorial && !sessao.fila?.length && sessao.pedidos.every((p) => FINALIZADOS.includes(p.status));
// A partida acabou: fim do dia da campanha ou, no modo infinito, sem corações
export const partidaEncerrada = (sessao) => diaEncerrado(sessao) || Boolean(sessao?.fimDeJogo);

// Modo infinito: tira `n` corações; no último, a partida acaba e o recorde de entregas é atualizado
function perderVidas(state, n) {
  const s = state.sessao;
  if (!n || s?.vidas == null || s.fimDeJogo) return state;
  const vidas = Math.max(0, s.vidas - n);
  if (vidas > 0) return { ...state, sessao: { ...s, vidas } };
  const entregues = s.pedidos.filter((p) => p.status === 'entregue').length;
  const e = state.estatisticas;
  const recorde = e.recordeInfinito ?? 0;
  return {
    ...state,
    sessao: { ...s, vidas, fimDeJogo: { entregues, recorde: entregues > recorde, recordeAnterior: recorde } },
    estatisticas: { ...e, recordeInfinito: Math.max(recorde, entregues) },
  };
}

// Libera o próximo pedido da fila do dia na hora marcada (`proximoEm`, em segundos de jogo). Se não
// sobrou nenhum pedido normal em aberto (o jogador entregou/recusou o anterior antes), a hora é
// adiantada para daqui a 10 a 20 s (`esperaDoProximo`, como no modo infinito); não chega na hora.
export function liberarFila(sessao, sorteio) {
  if (!sessao.fila?.length) return sessao;
  const segundos = sessao.segundos ?? 0;
  const semPendente = !sessao.pedidos.some((p) => !p.urgente && NA_FILA.includes(p.status));
  if (segundos < sessao.proximoEm) {
    const cedo = segundos + esperaDoProximo(sorteio);
    return semPendente && cedo < sessao.proximoEm ? { ...sessao, proximoEm: cedo } : sessao;
  }
  const [id, ...fila] = sessao.fila;
  return {
    ...sessao,
    pedidos: [...sessao.pedidos, naSessao(sessao, criarPedido(id, sessao.seq, sessao.dia))],
    seq: sessao.seq + 1,
    fila,
    proximoEm: fila.length ? segundos + intervaloChegada(sorteio) : null,
  };
}

// Toda ação passa também pelas conquistas (lib/conquistas.js): contadores e desbloqueios
export function reducer(state, action) {
  return verificarConquistas(state, reducerBase(state, action), action);
}

function reducerBase(state, action) {
  switch (action.type) {
    case 'INICIAR_SESSAO': {
      const { modo } = action;
      // fim de semana da campanha (`fimDeSemana` = data do calendário): pedidos complexos, com a
      // paciência e o pagamento da sexta anterior
      const fimDeSemana = modo === 'campanha' ? action.fimDeSemana ?? null : null;
      const dia = fimDeSemana ? sextaAntes(fimDeSemana) : action.dia ?? 1;
      let seq = 1;
      let pedidos;
      let fila = [];
      // dia já concluído: pagamento pela metade e só pedidos já desbloqueados (na coleção)
      const repeticao = modo === 'campanha' && Boolean(fimDeSemana ? state.campanha.fimDeSemana?.[fimDeSemana] : state.campanha.concluidos[dia]);
      if (modo === 'campanha') {
        // sorteio dos pedidos do dia (ver sortearPedidosDoDia); só o primeiro chega agora, o resto
        // entra pela fila (liberarFila)
        const opcoes = { colecao: state.colecao, repeticao, semente: action.semente ?? fimDeSemana ?? dia };
        const [primeiro, ...resto] = fimDeSemana ? pedidosDoFimDeSemana(fimDeSemana, opcoes) : sortearPedidosDoDia(dia, opcoes);
        pedidos = [naSessao({ repeticao }, criarPedido(primeiro, seq++, dia))];
        fila = resto;
      } else {
        const s = { pedidos: [], seq };
        pedidos = [];
        for (let i = 0; i < 2; i++) {
          s.seq = seq++;
          const p = novoPedidoAleatorio(s);
          s.pedidos.push(p);
          pedidos.push(p);
        }
      }
      // diagramas de sessões antigas não devem reaparecer em pedidos novos com o mesmo id
      const diagramas = state.diagramas.livre ? { livre: state.diagramas.livre } : {};
      const e = state.estatisticas;
      const estatisticas = { ...e, jogos: e.jogos + 1, jogosPorModo: { ...e.jogosPorModo, [modo]: (e.jogosPorModo[modo] ?? 0) + 1 } };
      const chegada = fila.length ? { fila, proximoEm: intervaloChegada(action.sorteio) } : {};
      // o efeito do café não passa de uma partida para outra
      const cafe = { ...state.cafe, efeito: null };
      // primeira partida (`action.tutorial`): os pedidos só chegam quando o tutorial acaba
      // (CONCLUIR_TUTORIAL); sem pedidos na tela, o relógio fica parado
      const espera = action.tutorial ? { esperaTutorial: pedidos } : {};
      if (action.tutorial) pedidos = [];
      return { ...state, diagramas, estatisticas, cafe, sessao: { modo, dia, pedidos, ativo: null, ganho: 0, notas: [], seq, segundos: 0, ...(fimDeSemana ? { fimDeSemana } : {}), ...(repeticao ? { repeticao } : {}), ...(modo === 'infinito' ? { vidas: VIDAS_INFINITO, ciclo: cicloInicial(action.semente), caixa: caixaInicial(((action.semente ?? 0.5) * 11) % 1) } : {}), ...chegada, ...espera } };
    }

    case 'ENCERRAR_SESSAO':
      return { ...state, sessao: null };

    // Aceitar não exige terminar o atual: o aceito vira o pedido aberto no editor, e os outros
    // aceitos continuam correndo o prazo (troca-se entre eles com ATIVAR)
    case 'ACEITAR': {
      const s = state.sessao;
      const pedido = s?.pedidos.find((p) => p.id === action.id);
      // pedido de retorno não se aceita: o jogador reenvia do arquivo (ENVIAR_RETORNO)
      if (pedido?.status !== 'novo' || pedido.retorno || !podeAceitar(s, pedido)) return state;
      return { ...state, sessao: { ...atualizarPedido(s, action.id, () => ({ status: 'aceito' })), ativo: action.id } };
    }

    // Escolhe qual dos pedidos aceitos fica aberto no editor
    case 'ATIVAR': {
      const s = state.sessao;
      if (s?.pedidos.find((p) => p.id === action.id)?.status !== 'aceito') return state;
      return { ...state, sessao: { ...s, ativo: action.id } };
    }

    // DEBUG: troca os pedidos ainda não aceitos pelos próximos modelos da lista, em sequência
    // (dá a volta). Serve para passar por todos os modelos sem esperar. Não cobra multa nem conta estatística.
    // DEBUG ("Ver todos os pedidos", só em npm run dev): troca o pedido `alvo` (o primeiro da caixa)
    // por um novo do `modelo` escolhido, na mesma posição. Sem alvo, o pedido entra na caixa.
    case 'DEBUG_TROCAR_PEDIDO': {
      const s = state.sessao;
      if (!s || !modeloPorId(action.modelo)) return state;
      const novo = naSessao(s, criarPedido(action.modelo, s.seq, s.dia ?? 1));
      const existe = s.pedidos.some((p) => p.id === action.alvo);
      const pedidos = existe ? s.pedidos.map((p) => (p.id === action.alvo ? novo : p)) : [...s.pedidos, novo];
      let sessao = { ...s, pedidos, seq: s.seq + 1 };
      if (s.ativo === action.alvo) sessao = { ...sessao, ativo: proximoAtivo(sessao) };
      return { ...state, sessao, diagramas: semDiagrama(state.diagramas, action.alvo) };
    }

    // DEBUG (painel "⚙ Dev" do e-mail, só em npm run dev): define o saldo (pode ser negativo)
    case 'DEBUG_DINHEIRO':
      if (!Number.isFinite(action.valor)) return state;
      return { ...state, dinheiro: Math.round(action.valor) };

    // DEBUG: para/continua o relógio da partida (Jogo.jsx não manda TICK enquanto `relogioParado`)
    case 'DEBUG_PARAR_RELOGIO':
      if (!state.sessao) return state;
      return { ...state, sessao: { ...state.sessao, relogioParado: Boolean(action.parado) } };

    // DEBUG (painel "⚙ Dev", só em npm run dev): entrega o pedido `id` (ou o aberto no editor) com a
    // nota dada, como se o jogador tivesse montado o diagrama esperado. Passa pelo ENTREGAR normal
    // (pagamento, coleção, estatísticas e conquistas contam igual).
    case 'DEBUG_ENTREGAR': {
      const s = state.sessao;
      const id = action.id ?? s?.ativo;
      const pedido = s?.pedidos.find((p) => p.id === id);
      if (!pedido || (pedido.status !== 'novo' && pedido.status !== 'aceito')) return state;
      return entregaDebug(state, pedido, action.nota);
    }

    // DEBUG: termina o dia da campanha entregando todos os pedidos em aberto (e os que ainda iam
    // chegar na fila) com a nota dada. O resumo do dia abre como num fim de dia normal.
    case 'DEBUG_TERMINAR_DIA': {
      let s = state;
      for (let i = 0; i < 200 && s.sessao && !diaEncerrado(s.sessao); i++) {
        let aberto = s.sessao.pedidos.find((p) => p.status === 'novo' || p.status === 'aceito');
        if (!aberto) {
          // sobrou só a fila (pedidos que chegam mais tarde): chama o próximo agora
          if (!s.sessao.fila?.length) break;
          s = { ...s, sessao: liberarFila({ ...s.sessao, proximoEm: 0 }, action.sorteio) };
          aberto = s.sessao.pedidos.find((p) => p.status === 'novo');
          if (!aberto) break;
        }
        s = entregaDebug(s, aberto, action.nota);
      }
      return s;
    }

    // DEBUG: desbloqueia a conquista `id` (ou todas, com `todas`), com prêmio e aviso como de verdade
    // DEBUG (painel Dev): chega agora um pedido de retorno do tipo escolhido (precisa de algo no arquivo)
    case 'DEBUG_RETORNO': {
      const s = state.sessao;
      if (s?.modo !== 'infinito' || !state.arquivo?.length) return state;
      const pedido = naSessao(s, criarRetorno(state.arquivo, s.seq, state.estatisticas.jogos, Math.random(), action.tipo));
      return { ...state, sessao: { ...s, pedidos: [...s.pedidos, pedido], seq: s.seq + 1 } };
    }

    // DEBUG (painel Dev): faz um evento aleatório acontecer agora (modo infinito)
    case 'DEBUG_EVENTO':
      if (!state.sessao || partidaEncerrada(state.sessao) || state.sessao.evento) return state;
      if (action.tipo === 'energia') return { ...state, sessao: { ...state.sessao, bloqueio: quedaDeEnergia(action.sorteio ?? 0) } };
      if (action.tipo === 'cansaco') return { ...state, sessao: { ...state.sessao, cansaco: { inicio: state.sessao.segundos ?? 0 } } };
      if (action.tipo === 'cafe') return temCafeteira(state) ? { ...state, cafe: { ...state.cafe, preparando: null }, sessao: { ...state.sessao, cafeDerramado: true } } : state;
      return { ...state, sessao: { ...state.sessao, evento: { tipo: action.tipo }, bloqueio: null } };

    case 'DEBUG_CONQUISTA':
      return desbloquear(state, action.todas ? CONQUISTAS.map((c) => c.id) : [action.id]);

    case 'DEBUG_REFRESH_PEDIDOS': {
      const s = state.sessao;
      if (!s) return state;
      const mantidos = s.pedidos.filter((p) => p.status !== 'novo');
      const qtd = Math.max(2, s.pedidos.length - mantidos.length);
      let indice = s.debugIndice ?? 0;
      let seq = s.seq;
      const novos = [];
      for (let i = 0; i < qtd; i++) {
        const m = MODELOS[indice % MODELOS.length];
        novos.push(criarPedido(m.id, seq++, s.dia ?? 1));
        indice++;
      }
      const removidos = new Set(s.pedidos.filter((p) => p.status === 'novo').map((p) => p.id));
      const diagramas = Object.fromEntries(Object.entries(state.diagramas).filter(([k]) => !removidos.has(pedidoDaChave(k))));
      return { ...state, diagramas, sessao: { ...s, pedidos: [...mantidos, ...novos], seq, debugIndice: indice % MODELOS.length } };
    }

    // Recusar custa uma multa (metade do pagamento do pedido). O saldo pode ficar negativo (dívida).
    case 'RECUSAR': {
      const s = state.sessao;
      const pedido = s?.pedidos.find((p) => p.id === action.id);
      if (pedido?.treino) return terminarTreino(state, pedido.id, 0); // recusar o treino = pular, sem multa
      if (!pedido || (pedido.status !== 'novo' && pedido.status !== 'aceito')) return state;
      const multa = multaPedido(pedido, state.dinheiro);
      const estatisticas = { ...state.estatisticas, recusados: state.estatisticas.recusados + 1, multas: (state.estatisticas.multas ?? 0) + multa };
      let sessao = atualizarPedido(s, action.id, () => ({ status: 'recusado', multa }));
      sessao = { ...sessao, ganho: s.ganho - multa };
      if (s.ativo === action.id) sessao = { ...sessao, ativo: proximoAtivo(sessao) };
      sessao = reporInfinito(state, sessao, 1, action.sorteio);
      sessao = liberarFila(sessao, action.sorteio);
      return concluirDiaSeFor({ ...state, dinheiro: state.dinheiro - multa, estatisticas, sessao, diagramas: semDiagrama(state.diagramas, action.id) });
    }

    // Um segundo de jogo: corre o prazo do pedido em andamento e a paciência dos pedidos novos.
    // Quem fica sem paciência vai embora (status "expirado"); no modo infinito chega outro pedido.
    // DEBUG (botão do e-mail em npm run dev): chega um pedido urgente agora, sem esperar o sorteio
    case 'DEBUG_URGENTE': {
      const s = state.sessao;
      if (!s) return state;
      const u = sortearUrgente({ ...s, pedidos: s.pedidos.map((p) => (p.urgente ? { ...p, urgente: false } : p)) }, 0, Math.random() * URGENTE.chance);
      return u ? { ...state, sessao: { ...s, pedidos: [...s.pedidos, u], seq: s.seq + 1 } } : state;
    }

    case 'TICK': {
      let s = state.sessao;
      // evento aleatório esperando a escolha do jogador (lib/eventos.js): o relógio fica parado
      if (!s || s.fimDeJogo || s.evento) return state;
      // dormindo (cansaço sem café): o relógio do jogo fica parado; cada TICK é 1 s real de sono
      if (s.dormindo) return { ...state, sessao: { ...s, dormindo: s.dormindo.falta > 1 ? { ...s.dormindo, falta: s.dormindo.falta - 1 } : null } };
      // café: o relógio anda mais devagar. Cada TICK (1 s real) avança só `ritmo` de um segundo de jogo;
      // o segundo de jogo só passa quando a fração acumulada (`sessao.passo`) chega a 1.
      const ritmo = ritmoDoJogo(state.cafe);
      if (ritmo < 1) {
        const passo = (s.passo ?? 0) + ritmo;
        if (passo < 1 - 1e-9) return { ...state, sessao: { ...s, passo } };
        s = { ...s, passo: passo - 1 };
      } else if (s.passo) s = { ...s, passo: 0 };
      let foram = 0;
      let multas = 0;
      const pedidos = s.pedidos.map((p) => {
        // o prazo corre para todos os aceitos, não só para o que está aberto no editor
        // depois do prazo, conta o atraso (o pagamento cai com ele: fatorAtraso em lib/avaliacao.js)
        if (p.status === 'aceito') return p.tempoRestante > 0 ? { ...p, tempoRestante: p.tempoRestante - 1 } : { ...p, atraso: (p.atraso ?? 0) + 1 };
        if (p.status !== 'novo' || p.paciencia == null) return p; // saves antigos não têm paciência
        if (p.paciencia > 1) return { ...p, paciencia: p.paciencia - 1 };
        // cliente foi embora: multa (menor se o saldo já estiver negativo, contando as multas deste segundo)
        const multa = multaPedido(p, state.dinheiro - multas);
        foram++;
        multas += multa;
        return { ...p, paciencia: 0, status: 'expirado', multa };
      });
      const segundos = (s.segundos ?? 0) + 1;
      let sessao = { ...s, pedidos, segundos };
      if (foram) sessao = reporInfinito(state, sessao, foram, action.sorteio);
      sessao = chegarPedidosInfinito(sessao, { arquivo: state.arquivo, partida: state.estatisticas.jogos, sorteio: action.sorteioRetorno });
      // próximo pedido do dia (campanha), se chegou a hora ou não sobrou nada em aberto
      sessao = liberarFila(sessao, action.sorteioChegada);
      // pedido urgente: sorteio a cada minuto de jogo (o número vem na ação, para o reducer seguir puro)
      const urgente = sortearUrgente(sessao, segundos, action.sorteio);
      if (urgente) sessao = { ...sessao, pedidos: [...sessao.pedidos, urgente], seq: sessao.seq + 1 };
      // contratempo de um evento (tela apagada, computador reiniciando...): conta os segundos de jogo
      if (sessao.bloqueio) sessao = { ...sessao, bloqueio: sessao.bloqueio.falta > 1 ? { ...sessao.bloqueio, falta: sessao.bloqueio.falta - 1 } : null };
      // evento aleatório (pane ou queda de energia), sorteado a cada minuto de jogo (infinito e campanha)
      // cansaço (a tela vai escurecendo até o jogador tomar um café), sorteado a cada minuto depois dos 5
      if (!partidaEncerrada(sessao) && sortearCansaco(sessao, action.sorteioCansaco, temCafeteira(state))) sessao = { ...sessao, cansaco: { inicio: sessao.segundos } };
      const evento = !partidaEncerrada(sessao) && sortearEvento(sessao, action.sorteioEvento);
      // a queda de energia não abre janela: vira direto o contratempo (o preço do gerador sai do sorteio)
      if (evento?.tipo === 'energia') sessao = { ...sessao, bloqueio: quedaDeEnergia((action.sorteioEvento * 97) % 1) };
      else if (evento) sessao = { ...sessao, evento };
      if (!foram) return adormecer({ ...state, sessao }, action);
      sessao = { ...sessao, ganho: s.ganho - multas };
      const e = state.estatisticas;
      const estatisticas = { ...e, expirados: (e.expirados ?? 0) + foram, multas: (e.multas ?? 0) + multas };
      return adormecer(perderVidas(concluirDiaSeFor({ ...state, dinheiro: state.dinheiro - multas, estatisticas, sessao }), foram), action);
    }

    case 'SET_DIAGRAMA':
      return { ...state, diagramas: { ...state.diagramas, [action.chave]: action.diagrama } };

    case 'ENTREGAR': {
      const s = state.sessao;
      if (!s) return state;
      const { id, nota, valor } = action;
      // pedido de treino do tutorial: só paga (pouco) e libera os pedidos de verdade
      if (s.pedidos.find((p) => p.id === id)?.treino) return terminarTreino(state, id, valor);
      // o diagrama entregue fica no pedido, para o resumo do dia mostrar de novo (com o esperado e o feedback)
      // pedido JUMBO: `partes` = [{ secao, diagrama }] (um diagrama por aba do editor)
      // atraso: guarda o fator aplicado e se o urgente perdeu o bônus (o resumo do dia mostra igual)
      const atraso = action.atrasado ? { atrasado: true, fatorAtraso: action.fatorAtraso ?? 1, perdeuBonus: Boolean(action.perdeuBonus) } : { atrasado: false };
      const entrega = action.partes ? { partes: action.partes, ...atraso } : action.diagrama ? { diagrama: action.diagrama, ...atraso } : {};
      let sessao = atualizarPedido(s, id, () => ({ status: 'entregue', nota, valor, ...entrega }));
      sessao = { ...sessao, ganho: s.ganho + valor, notas: [...s.notas, nota] };
      sessao = { ...sessao, ativo: s.ativo === id ? proximoAtivo(sessao) : s.ativo };
      sessao = reporInfinito(state, sessao, 1, action.sorteio);
      sessao = liberarFila(sessao, action.sorteio);
      const e = registrarDesempenho(state.estatisticas, s.pedidos.find((p) => p.id === id), action);
      const estatisticas = {
        ...e,
        entregues: e.entregues + 1,
        somaNotas: e.somaNotas + nota,
        melhorNota: Math.max(e.melhorNota, nota),
        excelentes: e.excelentes + (nota >= 85 ? 1 : 0),
        ganhoTotal: e.ganhoTotal + valor,
        historico: [...e.historico, { nota, valor }].slice(-MAX_HISTORICO),
      };
      // coleção: o modelo fica desbloqueado, com a melhor nota (medalha)
      const modelo = s.pedidos.find((p) => p.id === id)?.modelo;
      const colecao = modelo ? registrarEntrega(state.colecao, modelo, nota) : state.colecao;
      // arquivo de pedidos entregues (o jogador procura neles quando um cliente pede um reenvio)
      const entregue = s.pedidos.find((p) => p.id === id);
      const arquivo = entregue && !entregue.retorno ? arquivar(state.arquivo, registroDaEntrega(entregue, nota, state.estatisticas.jogos)) : state.arquivo;
      const depois = concluirDiaSeFor({ ...state, dinheiro: state.dinheiro + valor, estatisticas, colecao, arquivo, sessao, diagramas: semDiagrama(state.diagramas, id) });
      // semana de auditoria (modificador do ciclo em que o pedido foi entregue): nota baixa custa um coração
      const auditoria = temModificador(s, 'auditoria') && nota < NOTA_AUDITORIA ? 1 : 0;
      // (atrasado por ter dormido não tira coração de novo: o sono já tirou um)
      return perderVidas(depois, (action.atrasado && !entregue?.dormiu ? 1 : 0) + auditoria);
    }

    // Cafeteira (data/cafe.js). Cápsulas: compradas uma a uma, ficam guardadas na cafeteira.
    case 'COMPRAR_CAPSULA': {
      const c = CAPSULAS.find((x) => x.id === action.tipo);
      const preco = precoNoExpediente(c?.preco, state.sessao);
      if (!c || !temCafeteira(state) || state.dinheiro < preco) return state;
      const capsulas = { ...state.cafe.capsulas, [c.id]: (state.cafe.capsulas[c.id] ?? 0) + 1 };
      return { ...state, dinheiro: state.dinheiro - preco, cafe: { ...state.cafe, capsulas }, estatisticas: gastar(state.estatisticas, 'cafe', preco) };
    }

    // Fazer café: gasta uma cápsula; fica pronto em 5–10 s (`sorteio` escolhe o tempo)
    case 'FAZER_CAFE': {
      const { tipo } = action;
      if (!CAPSULAS.some((c) => c.id === tipo) || motivoSemCafe(state, tipo)) return state;
      // café grátis (modificador do expediente): não gasta a cápsula
      const capsulas = temModificador(state.sessao, 'cafe') ? state.cafe.capsulas : { ...state.cafe.capsulas, [tipo]: state.cafe.capsulas[tipo] - 1 };
      // modo infinito: às vezes o café derrama (evento aleatório); a cápsula se perde e não sai café
      // (fica a poça debaixo da cafeteira e o computador só volta depois de limpar: LIMPAR_CAFE)
      if (!partidaEncerrada(state.sessao) && derramouCafe(state.sessao, action.derrame)) return { ...state, cafe: { ...state.cafe, capsulas }, sessao: { ...state.sessao, cafeDerramado: true } };
      return { ...state, cafe: { ...state.cafe, capsulas, preparando: { tipo, falta: tempoDePreparo(action.sorteio) } } };
    }

    // Pedido de retorno (lib/retorno.js): reenvia um registro do arquivo. O certo conta como pedido
    // entregue (paga e abre vaga na caixa); o errado tira RETORNO.penalidade s de paciência do cliente.
    case 'ENVIAR_RETORNO': {
      const s = state.sessao;
      const pedido = s?.pedidos.find((p) => p.id === action.id);
      const registro = state.arquivo.find((r) => r.id === action.registro);
      if (!pedido?.retorno || pedido.status !== 'novo' || !registro) return state;
      if (!registroCerto(pedido, registro))
        return { ...state, sessao: atualizarPedido(s, pedido.id, (p) => ({ paciencia: Math.max(1, p.paciencia - RETORNO.penalidade) })) };
      const valor = pedido.recompensa;
      let sessao = atualizarPedido(s, pedido.id, () => ({ status: 'entregue', nota: 100, valor, reenviado: registro.id }));
      sessao = reporInfinito(state, { ...sessao, ganho: s.ganho + valor }, 1, action.sorteio);
      const e = state.estatisticas;
      return { ...state, dinheiro: state.dinheiro + valor, estatisticas: { ...e, ganhoTotal: e.ganhoTotal + valor, reenvios: (e.reenvios ?? 0) + 1 }, sessao };
    }

    // Resultado do minijogo da pane (consertou/falhou)
    case 'RESOLVER_EVENTO': {
      const s = state.sessao;
      const r = s?.evento && resolverEvento(s.evento.tipo, action.escolha);
      if (!r) return state;
      const custo = precoNoExpediente(r.custo, s);
      if (custo > state.dinheiro) return state;
      const bloqueio = r.bloqueio ? { tipo: s.evento.tipo, falta: r.bloqueio, total: r.bloqueio } : null;
      return {
        ...state,
        dinheiro: state.dinheiro - custo,
        estatisticas: custo ? gastar(state.estatisticas, 'eventos', custo) : state.estatisticas,
        sessao: { ...s, evento: null, bloqueio },
      };
    }

    // Café derramado: o jogador terminou de limpar a poça (o tempo da limpeza corre no Escritorio)
    case 'LIMPAR_CAFE':
      if (!state.sessao?.cafeDerramado) return state;
      return { ...state, sessao: { ...state.sessao, cafeDerramado: false } };

    // Queda de energia: um clique num raio espalhado pela sala (lib/eventos.js, raiosDaQueda); o raio
    // some depois de 1 a 3 cliques, e com todos coletados a energia volta de graça
    case 'COLETAR_RAIO': {
      const s = state.sessao;
      const b = s?.bloqueio;
      if (b?.tipo !== 'energia' || !b.raios?.some((r) => r.id === action.id)) return state;
      const raios = b.raios.map((r) => (r.id === action.id ? { ...r, falta: r.falta - 1 } : r)).filter((r) => r.falta > 0);
      return { ...state, sessao: { ...s, bloqueio: raios.length ? { ...b, raios } : null } };
    }

    // Queda de energia: ligar o gerador (preço sorteado na queda) faz a energia voltar na hora
    case 'LIGAR_GERADOR': {
      const s = state.sessao;
      if (s?.bloqueio?.tipo !== 'energia') return state;
      const custo = precoNoExpediente(s.bloqueio.preco, s);
      if (custo > state.dinheiro) return state;
      return { ...state, dinheiro: state.dinheiro - custo, estatisticas: gastar(state.estatisticas, 'eventos', custo), sessao: { ...s, bloqueio: null } };
    }

    // Um segundo real com o jogo correndo: avança o preparo e o efeito do café
    case 'CAFE_TICK': {
      const { preparando, efeito } = state.cafe;
      if (!preparando && !efeito) return state;
      let cafe = { ...state.cafe };
      if (preparando)
        cafe = preparando.falta > 1 ? { ...cafe, preparando: { ...preparando, falta: preparando.falta - 1 } } : { ...cafe, preparando: null, xicara: preparando.tipo };
      if (efeito) cafe = { ...cafe, efeito: efeito.falta > 1 ? { ...efeito, falta: efeito.falta - 1 } : null };
      return { ...state, cafe };
    }

    // Beber o café da caneca: o efeito começa (outro café por cima recomeça a contagem com o novo tipo)
    case 'BEBER_CAFE': {
      const { xicara } = state.cafe;
      if (!xicara) return state;
      // o café também tira o cansaço e deixa o jogador livre dele por 1 a 3 minutos (lib/eventos.js)
      return { ...state, cafe: { ...state.cafe, xicara: null, efeito: { tipo: xicara, falta: EFEITO_SEGUNDOS } }, sessao: depoisDoCafe(state.sessao, xicara) };
    }

    case 'COMPRAR': {
      const { id, preco } = action;
      if (state.loja.possui.includes(id) || state.dinheiro < preco) return state;
      return { ...state, dinheiro: state.dinheiro - preco, loja: { ...state.loja, possui: [...state.loja.possui, id] }, estatisticas: gastar(state.estatisticas, 'loja', preco) };
    }

    // Toca-fitas: escolhe a música (id de data/musicas.js ou 'aleatoria'). Precisa ter o toca-fitas
    // e, se for uma música, tê-la (de graça ou comprada).
    case 'ESCOLHER_MUSICA': {
      const { id } = action;
      if (!temTocaFitas(state.loja.possui)) return state;
      if (id !== ALEATORIA && !faixasDoJogador(state.loja.possui).some((f) => f.id === id)) return state;
      return { ...state, loja: { ...state.loja, musica: id } };
    }

    case 'USAR_FUNDO':
      if (!state.loja.possui.includes(action.id)) return state;
      return { ...state, loja: { ...state.loja, fundo: action.id } };

    case 'ALTERNAR_MOVEL': {
      const { moveis, possui } = state.loja;
      if (!possui.includes(action.id)) return state;
      const tirando = moveis.includes(action.id);
      const novo = tirando ? moveis.filter((m) => m !== action.id) : [...moveis, action.id];
      // item de vários objetos (pilha de livros): tira/põe todos, e volta empilhado
      const membros = membrosDoGrupo(action.id);
      if (membros.length) return { ...state, escritorio: reporGrupo(state.escritorio, membros, tirando), loja: { ...state.loja, moveis: novo } };
      // ao tirar um objeto do escritório, o que estava em cima dele cai
      const escritorio = tirando ? soltarDoEscritorio(state.escritorio, action.id.replace(/^obj-/, '')) : state.escritorio;
      return { ...state, escritorio, loja: { ...state.loja, moveis: novo } };
    }

    // Dica: compra um pedaço da imagem-resposta do pedido em andamento
    // Clode (lib/clode.js): o editor calcula a ação e manda o diagrama já mexido; aqui só cobra e grava.
    // Preço pelo nível do pedido (PRECO_CLODE, "bem caro"), com o orçamento apertado do infinito.
    // A ação é calculada AQUI, com o diagrama e o preço do momento: vários cliques seguidos viram
    // várias ações em sequência, cada uma cobrada pelo preço certo. `secao`: aba do JUMBO; `n`: número
    // do clique (id do que ele criar e da fala). A fala vai para `sessao.falaClode` (o editor mostra).
    case 'USAR_CLODE': {
      const s = state.sessao;
      const p = s?.pedidos.find((x) => x.id === action.id && x.status === 'aceito');
      if (!p || !action.chave) return state;
      const m = modeloPorId(p.modelo);
      const esperado = ehJumbo(m) ? m.partes.find((x) => x.secao === action.secao)?.esperado : m.esperado;
      const n = action.n ?? (s.falaClode?.n ?? 0) + 1;
      const a = acaoDoClode(diagramaDe(state, action.chave), esperado, () => `cl${n}`);
      if (a.tipo === 'nada') return { ...state, sessao: { ...s, falaClode: { n, texto: a.texto, nada: true } } };
      const preco = precoDoClode(p, s);
      if (state.dinheiro < preco) return { ...state, sessao: { ...s, falaClode: { n, texto: 'Dinheiro insuficiente.', nada: true } } };
      const clode = { usos: (s.clode?.usos ?? 0) + 1, ultimo: precoBrutoDoClode(p, s) };
      return {
        ...state,
        dinheiro: state.dinheiro - preco,
        estatisticas: gastar(state.estatisticas, 'clode', preco),
        diagramas: { ...state.diagramas, [action.chave]: a.diagrama },
        sessao: { ...s, clode, falaClode: { n, texto: a.texto }, pedidos: s.pedidos.map((x) => (x.id === p.id ? { ...x, clode: (x.clode ?? 0) + 1 } : x)) },
      };
    }

    case 'COMPRAR_PEDACO': {
      const s = state.sessao;
      const p = s?.pedidos.find((x) => x.id === s.ativo);
      const { indice } = action;
      // pedido JUMBO: cada diagrama tem os seus pedaços (parte k usa os índices k*pedaços...);
      // pedido complexo tem 16 pedaços (pedacosDoModelo)
      const m = p && modeloPorId(p.modelo);
      if (!p || indice < 0 || indice >= pedacosDoModelo(m) * partesDoModelo(m).length) return state;
      const preco = precoNoExpediente(precoPedaco(p, Math.floor(indice / pedacosDoModelo(m))), s);
      if ((p.pedacos ?? []).includes(indice) || state.dinheiro < preco) return state;
      const comDica = gastar(state.estatisticas, 'dicas', preco);
      return {
        ...state,
        dinheiro: state.dinheiro - preco,
        estatisticas: { ...comDica, pedacos: (comDica.pedacos ?? 0) + 1 },
        sessao: atualizarPedido(s, p.id, (x) => ({ pedacos: [...(x.pedacos ?? []), indice] })),
      };
    }

    // posicao no formato de lib/decoracao.js
    // (mover o pote leva junto as canetas que estão dentro dele)
    case 'MOVER_OBJETO':
      return {
        ...state,
        escritorio: { ...state.escritorio, posicoes: moverComConteudo(state.escritorio.posicoes, action.objeto, action.posicao) },
      };

    // Tirou um objeto do lugar (está na mão): quem estava em cima dele cai
    // Grupo inteiro (pilha de livros, pote com canetas) tirado do baú e solto onde o jogador quis:
    // volta a ficar em uso, cada membro na posição calculada (posicoesDoGrupo em lib/decoracao.js)
    case 'COLOCAR_GRUPO': {
      const { grupo, posicoes } = action;
      if (!state.loja.possui.includes(grupo)) return state;
      const membros = membrosDoGrupo(grupo);
      const e = reporGrupo(state.escritorio, membros, false);
      const moveis = state.loja.moveis.includes(grupo) ? state.loja.moveis : [...state.loja.moveis, grupo];
      return { ...state, escritorio: { ...e, posicoes: { ...e.posicoes, ...posicoes } }, loja: { ...state.loja, moveis } };
    }

    // Rabisco da folha de rascunho (papel da mesa): imagem PNG em data URL, ou null
    case 'SALVAR_RABISCO':
      return { ...state, escritorio: { ...state.escritorio, rabisco: action.dados ?? null } };

    // Ícone da área de trabalho do computador arrastado para uma célula do grid (já resolvida em lib/areaTrabalho.js)
    case 'MOVER_ICONE':
      return { ...state, computador: { ...state.computador, icones: { ...state.computador?.icones, [action.id]: action.posicao } } };

    case 'PEGAR_OBJETO':
      return { ...state, escritorio: { ...state.escritorio, posicoes: soltarDependentes(state.escritorio.posicoes, action.objeto) } };

    // Guarda no inventário: some do escritório. Itens da loja saem de "em uso"; os do jogo vão para `guardados`.
    case 'GUARDAR_OBJETO': {
      const { objeto } = action;
      // pote: as canetas que estão dentro dele vão junto para o baú (e voltam com ele); a posição do pote
      // fica guardada, para elas reaparecerem no mesmo lugar dentro dele
      const grupo = grupoDoObjeto(objeto);
      const porta = ehPorta(objeto);
      const dentro = porta && grupo ? conteudoDe(objeto, state.escritorio.posicoes, membrosDoGrupo(grupo).filter((m) => !state.escritorio.guardados.includes(m))) : [];
      const escritorio = porta
        ? { ...state.escritorio, guardadosDentro: { ...state.escritorio.guardadosDentro, [objeto]: dentro } }
        : soltarDoEscritorio(state.escritorio, objeto);
      // livro da pilha / pote e canetas: guardam sozinhos; com o grupo todo no baú, viram de novo o item da loja
      if (grupo) {
        const membros = membrosDoGrupo(grupo);
        const novos = [objeto, ...dentro].filter((n) => !escritorio.guardados.includes(n));
        const guardados = [...escritorio.guardados, ...novos];
        if (membros.every((m) => guardados.includes(m)))
          return { ...state, escritorio: reporGrupo({ ...escritorio, guardados }, membros, true), loja: { ...state.loja, moveis: state.loja.moveis.filter((m) => m !== grupo) } };
        return { ...state, escritorio: { ...escritorio, guardados } };
      }
      const idLoja = `obj-${objeto}`;
      if (state.loja.possui.includes(idLoja))
        return { ...state, escritorio, loja: { ...state.loja, moveis: state.loja.moveis.filter((m) => m !== idLoja) } };
      const guardados = escritorio.guardados.includes(objeto) ? escritorio.guardados : [...escritorio.guardados, objeto];
      return { ...state, escritorio: { ...escritorio, guardados } };
    }

    // Tira do inventário (o jogador vai posicionar em seguida)
    case 'RETIRAR_OBJETO': {
      const { objeto } = action;
      const idLoja = `obj-${objeto}`;
      if (state.loja.possui.includes(idLoja)) {
        const moveis = state.loja.moveis.includes(idLoja) ? state.loja.moveis : [...state.loja.moveis, idLoja];
        // a pilha inteira sai do baú e volta para a mesa empilhada (posições padrão)
        const membros = membrosDoGrupo(idLoja);
        const escritorio = membros.length ? reporGrupo(state.escritorio, membros, false) : state.escritorio;
        return { ...state, escritorio, loja: { ...state.loja, moveis } };
      }
      // pote retirado sozinho: as canetas que foram guardadas dentro dele saem junto (continuam dentro)
      const { [objeto]: junto = [], ...outrosDentro } = state.escritorio.guardadosDentro ?? {};
      const saem = new Set([objeto, ...junto]);
      return {
        ...state,
        escritorio: { ...state.escritorio, guardados: state.escritorio.guardados.filter((g) => !saem.has(g)), guardadosDentro: outrosDentro },
      };
    }

    // posições de volta ao padrão; os prêmios das conquistas voltam ao quadro e às prateleiras
    case 'ARRUMAR_ESCRITORIO':
      return arrumarPremios({ ...state, escritorio: { ...state.escritorio, posicoes: {} } });

    // Entrou na sala de exposição (só conta para as conquistas)
    case 'VISITAR_SALA':
      return state;

    // O aviso de conquista desbloqueada (o primeiro da fila) já foi mostrado
    case 'CONQUISTA_VISTA':
      return state.avisosConquista?.length ? { ...state, avisosConquista: state.avisosConquista.slice(1) } : state;

    // Tutorial terminado (ou pulado): não aparece mais e os pedidos retidos chegam agora
    case 'CONCLUIR_TUTORIAL': {
      const s = state.sessao;
      const tutorial = { visto: true };
      if (!s?.esperaTutorial) return { ...state, tutorial };
      // "Vamos nessa!" (`treino`): antes dos pedidos de verdade, um pedido de treino já aceito e aberto
      // no editor (data/treino.js, tipo sorteado); os retidos continuam esperando até ele acabar
      if (action.treino && !s.pedidos.some((p) => p.treino)) {
        const treino = criarPedidoDeTreino(action.sorteio ?? 0);
        return { ...state, tutorial, sessao: { ...s, pedidos: [...s.pedidos, treino], ativo: treino.id } };
      }
      const { esperaTutorial, ...sessao } = s;
      return { ...state, tutorial, sessao: { ...sessao, pedidos: [...sessao.pedidos, ...esperaTutorial] } };
    }

    // "Pular treino" no editor
    case 'PULAR_TREINO': {
      const p = state.sessao?.pedidos.find((x) => x.treino);
      return p ? terminarTreino(state, p.id, 0) : state;
    }

    case 'CONFIG':
      return { ...state, config: { ...state.config, ...action.config } };

    case 'DEFINIR_PERFIL': {
      const nome = action.nome === undefined ? state.perfil.nome : action.nome.trim().slice(0, 20) || state.perfil.nome;
      const avatar = action.avatar ? { ...state.perfil.avatar, ...action.avatar } : state.perfil.avatar;
      return { ...state, perfil: { ...state.perfil, nome, avatar } };
    }

    case 'ENTRAR_CONTA':
      return { ...state, perfil: { ...state.perfil, conta: { email: action.email } } };

    case 'SAIR_CONTA':
      return { ...state, perfil: { ...state.perfil, conta: null } };

    // Apaga todo o progresso deste navegador (nome, avatar, dinheiro, campanha, loja...)
    case 'RESETAR':
      return estadoInicial();

    case 'CARREGAR':
      return action.state;

    default:
      return state;
  }
}

// Remove o objeto do escritório: quem estava em cima cai e a posição dele é esquecida
function soltarDoEscritorio(escritorio, objeto) {
  const { [objeto]: _, ...posicoes } = soltarDependentes(escritorio.posicoes, objeto);
  return { ...escritorio, posicoes };
}

// Objetos de um grupo (pilha de livros) saem todos do escritório (`guardar`) ou voltam todos para a
// posição padrão, empilhados. Em ambos os casos esquecem as posições e saem da lista de guardados.
function reporGrupo(escritorio, membros, guardar) {
  let e = escritorio;
  if (guardar) for (const m of membros) e = soltarDoEscritorio(e, m);
  const posicoes = Object.fromEntries(Object.entries(e.posicoes).filter(([n]) => !membros.includes(n)));
  const guardadosDentro = Object.fromEntries(Object.entries(e.guardadosDentro ?? {}).filter(([n]) => !membros.includes(n)));
  return { ...e, posicoes, guardados: e.guardados.filter((g) => !membros.includes(g)), guardadosDentro };
}

// Fim do pedido de treino (entregue, pulado ou recusado): ele sai da sessão (não conta na média do
// dia, na coleção, nas estatísticas nem nas conquistas), paga `valor` e os pedidos retidos chegam
function terminarTreino(state, id, valor = 0) {
  const { esperaTutorial = [], ...s } = state.sessao;
  const pedidos = [...s.pedidos.filter((p) => p.id !== id), ...esperaTutorial];
  const sessao = { ...s, pedidos, ganho: s.ganho + valor, ativo: s.ativo === id ? null : s.ativo };
  return { ...state, dinheiro: state.dinheiro + valor, sessao, diagramas: semDiagrama(state.diagramas, id) };
}

// Tira os diagramas do pedido (o único dele ou, no JUMBO, um por aba: pedido:<id>:<secao>)
function semDiagrama(diagramas, pedidoId) {
  return Object.fromEntries(Object.entries(diagramas).filter(([k]) => pedidoDaChave(k) !== pedidoId));
}
const pedidoDaChave = (chave) => chave.replace(/^pedido:/, '').replace(/:(casos|classes|estados)$/, '');

// Desempenho do dia: média de todos os pedidos normais do dia. Entregue vale a nota, recusado vale
// DESEMPENHO_RECUSADO (10%) e perdido (cliente foi embora) vale 0%. Urgentes não entram na média.
// Sem nenhuma entrega no dia (recusou tudo), os recusados também valem 0%: o dia fica em 0%.
export const DESEMPENHO_RECUSADO = 10;
export const desempenhoDoPedido = (p, entregouAlgum = true) =>
  p.status === 'entregue' ? p.nota ?? 0 : p.status === 'recusado' && entregouAlgum ? DESEMPENHO_RECUSADO : 0;
export const entregouAlgumNoDia = (pedidos) => pedidos.some((p) => !p.urgente && p.status === 'entregue');
export function desempenhoDoDia(pedidos) {
  const contam = pedidos.filter((p) => !p.urgente && FINALIZADOS.includes(p.status));
  const algum = entregouAlgumNoDia(pedidos);
  return contam.length ? Math.round(contam.reduce((t, p) => t + desempenhoDoPedido(p, algum), 0) / contam.length) : 0;
}

// Fim do dia da campanha: com média >= MEDIA_MINIMA o dia conta como concluído e libera o seguinte;
// abaixo disso o próximo continua bloqueado (o dia pode ser jogado de novo). O dinheiro ganho e as
// multas valem nos dois casos. `sessao.relatorio` guarda o resultado para a tela de fim do dia.
// DEBUG: aceita (se preciso) e entrega o pedido com a nota dada, com o diagrama esperado como entrega.
// Passa pelo `reducer` completo, para as conquistas verem o ACEITAR e o ENTREGAR.
function entregaDebug(state, pedido, notaPedida) {
  const nota = Math.max(0, Math.min(100, Math.round(Number(notaPedida) || 0)));
  const modelo = modeloPorId(pedido.modelo);
  if (pedido.status === 'novo') state = reducer(state, { type: 'ACEITAR', id: pedido.id });
  const atual = state.sessao.pedidos.find((p) => p.id === pedido.id);
  const entrega = !modelo ? {} : ehJumbo(modelo) ? { partes: partesDoModelo(modelo).map((p) => ({ secao: p.secao, diagrama: p.esperado })), notasPartes: partesDoModelo(modelo).map(() => nota) } : { diagrama: modelo.esperado };
  return reducer(state, { type: 'ENTREGAR', id: pedido.id, nota, ...pagamentoDaEntrega(atual, nota), erros: {}, ...entrega, sorteio: Math.random() });
}

function concluirDiaSeFor(state) {
  const s = state.sessao;
  if (!diaEncerrado(s) || s.relatorio) return state;
  const media = desempenhoDoDia(s.pedidos);
  const aprovado = media >= MEDIA_MINIMA;
  // aluguel e luz do escritório: no fim de todo dia útil (aprovado ou não; fim de semana não paga)
  const despesa = s.fimDeSemana ? 0 : despesaDoDia(s.dia);
  const sessao = { ...s, relatorio: { media, aprovado, ganho: s.ganho, despesa } };
  const e = state.estatisticas;
  state = { ...state, dinheiro: state.dinheiro - despesa, estatisticas: { ...e, despesas: (e.despesas ?? 0) + despesa } };
  if (!aprovado) return { ...state, sessao };
  // fim de semana: só guarda o resultado (a medalha no calendário); não libera nada
  if (s.fimDeSemana) {
    const anterior = state.campanha.fimDeSemana?.[s.fimDeSemana];
    const melhor = anterior && anterior.media > media ? anterior : { ganho: s.ganho, media };
    return { ...state, sessao, campanha: { ...state.campanha, fimDeSemana: { ...state.campanha.fimDeSemana, [s.fimDeSemana]: melhor } } };
  }
  const antes = state.campanha.concluidos[s.dia];
  // rejogando um dia já concluído: fica o melhor resultado
  const registro = antes && antes.media > media ? antes : { ganho: s.ganho, media };
  return {
    ...state,
    sessao,
    campanha: {
      ...state.campanha,
      desbloqueado: Math.min(DIAS_CAMPANHA, Math.max(state.campanha.desbloqueado, s.dia + 1)),
      concluidos: { ...state.campanha.concluidos, [s.dia]: registro },
    },
  };
}

// Nome do dia da sessão da campanha: "Dia 3" ou, no fim de semana, "Sábado 6" / "Domingo 7"
export const nomeDoDia = (sessao) =>
  sessao?.fimDeSemana ? `${(sessao.fimDeSemana - 1) % 7 === 5 ? 'Sábado' : 'Domingo'} ${sessao.fimDeSemana}` : `Dia ${dataDoDia(sessao?.dia)}`;
// (o número mostrado é a data do calendário, não o índice do dia útil da campanha)

export const chaveDiagrama = (sessao) => (sessao?.ativo ? `pedido:${sessao.ativo}` : 'livre');
// Pedido JUMBO: cada diagrama fica salvo na aba (seção) do editor em que é montado
export const chaveDaParte = (pedidoId, secao) => `pedido:${pedidoId}:${secao}`;
// Preço do Clode no dia (`sessao.clode = { usos, ultimo }`, zera só numa partida nova): o do nível do
// pedido + 10% dele a cada uso já feito no dia (AUMENTO_CLODE), e nunca menos que o último pago (usar
// num pedido difícil e depois num fácil mantém o preço alto). `precoBrutoDoClode` é antes do
// orçamento apertado do modo infinito, que `precoDoClode` aplica por cima.
export function precoBrutoDoClode(pedido, sessao) {
  const { usos = 0, ultimo = 0 } = sessao?.clode ?? {};
  const base = (sessao?.modo === 'infinito' ? PRECO_CLODE_INFINITO : PRECO_CLODE)[nivelDoModelo(modeloPorId(pedido.modelo)).id];
  return Math.max(Math.round(base * (1 + AUMENTO_CLODE * usos)), ultimo);
}
export const precoDoClode = (pedido, sessao) => precoNoExpediente(precoBrutoDoClode(pedido, sessao), sessao);
export const pedidoEhJumbo = (pedido) => Boolean(pedido) && ehJumbo(modeloPorId(pedido.modelo));
export const diagramaDe = (state, chave) => state.diagramas[chave] || vazio();
