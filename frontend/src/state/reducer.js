import { MODELOS, TOTAL_PEDACOS, URGENTE, criarPedido, criarPedidoUrgente, intervaloChegada, multaPedido, pedidosDoDia, precoPedaco } from '../data/pedidos.js';
import { ALEATORIA, faixasDoJogador, temTocaFitas } from '../data/musicas.js';
import { avatarPadrao } from '../lib/avatar.js';
import { soltarDependentes } from '../lib/decoracao.js';

export const DIAS_CAMPANHA = 23; // dias úteis de um mês de 31 dias começando na segunda

export const ITENS_INICIAIS = ['fundo-por-do-sol'];

export const MAX_HISTORICO = 30;
// Desempenho mínimo do dia (ver desempenhoDoDia) para liberar o próximo dia da campanha
export const MEDIA_MINIMA = 60;
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
});

export const estadoInicial = () => ({
  perfil: { nome: null, avatar: avatarPadrao(), conta: null }, // conta = { email } quando logado
  estatisticas: estatisticasIniciais(),
  dinheiro: 100,
  config: { musica: 60, efeitos: 70, interface: 'auto', vhsAtivo: false, vhsIntensidade: 50 }, // interface: reduzido | auto | grande
  campanha: { desbloqueado: 1, concluidos: {} }, // concluidos[dia] = { ganho, media }
  loja: { possui: [...ITENS_INICIAIS], fundo: 'fundo-por-do-sol', moveis: [], musica: null }, // musica: escolhida no toca-fitas
  // posicoes[objeto]: ver lib/decoracao.js (sem entrada = posição padrão)
  // guardados: objetos-base guardados no inventário (os da loja usam loja.moveis)
  escritorio: { posicoes: {}, guardados: [] },
  sessao: null,
  diagramas: {},
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
    perfil: { ...base.perfil, ...salvo.perfil, avatar: { ...base.perfil.avatar, ...salvo.perfil?.avatar } },
    estatisticas: {
      ...base.estatisticas,
      ...salvo.estatisticas,
      jogosPorModo: { ...base.estatisticas.jogosPorModo, ...salvo.estatisticas?.jogosPorModo },
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

function novoPedidoAleatorio(sessao) {
  const ultimo = sessao.pedidos.at(-1)?.modelo;
  const opcoes = MODELOS.filter((m) => m.id !== ultimo);
  const m = opcoes[Math.floor(Math.random() * opcoes.length)];
  return criarPedido(m.id, sessao.seq, 1);
}

const NA_FILA = ['novo', 'aceito'];

// Um urgente por vez na fila. `sorteio` em [0, 1): abaixo de URGENTE.chance chega um, e o mesmo
// número (reescalado) escolhe o modelo entre os que não estão na fila. Sem `sorteio`, nunca chega.
export function sortearUrgente(sessao, segundos, sorteio) {
  if (sorteio == null || segundos % URGENTE.intervalo !== 0 || sorteio >= URGENTE.chance) return null;
  if (sessao.pedidos.some((p) => p.urgente && NA_FILA.includes(p.status))) return null;
  const naFila = new Set(sessao.pedidos.filter((p) => NA_FILA.includes(p.status)).map((p) => p.modelo));
  const opcoes = MODELOS.filter((m) => !naFila.has(m.id));
  const lista = opcoes.length ? opcoes : MODELOS;
  const m = lista[Math.min(lista.length - 1, Math.floor((sorteio / URGENTE.chance) * lista.length))];
  return criarPedidoUrgente(m.id, sessao.seq, sessao.modo === 'campanha' ? sessao.dia : 1);
}

const atualizarPedido = (sessao, id, f) => ({
  ...sessao,
  pedidos: sessao.pedidos.map((p) => (p.id === id ? { ...p, ...f(p) } : p)),
});

// Pedidos que já não pedem nada do jogador
export const FINALIZADOS = ['entregue', 'recusado', 'expirado'];
// Relógio do jogo precisa correr? (pedido em andamento ou cliente esperando resposta)
export const temRelogio = (sessao) => Boolean(sessao?.ativo || sessao?.pedidos.some((p) => p.status === 'novo' && p.paciencia != null));

// O dia só acaba quando todos os pedidos chegaram (fila vazia) e terminaram
export const diaEncerrado = (sessao) =>
  sessao?.modo === 'campanha' && !sessao.fila?.length && sessao.pedidos.every((p) => FINALIZADOS.includes(p.status));

// Libera o próximo pedido da fila do dia: na hora marcada (`proximoEm`, em segundos de jogo) ou na
// hora, se não sobrou nenhum pedido normal em aberto (o jogador entregou/recusou o anterior antes).
function liberarFila(sessao, sorteio) {
  if (!sessao.fila?.length) return sessao;
  const segundos = sessao.segundos ?? 0;
  const semPendente = !sessao.pedidos.some((p) => !p.urgente && NA_FILA.includes(p.status));
  if (!semPendente && segundos < sessao.proximoEm) return sessao;
  const [id, ...fila] = sessao.fila;
  return {
    ...sessao,
    pedidos: [...sessao.pedidos, criarPedido(id, sessao.seq, sessao.dia)],
    seq: sessao.seq + 1,
    fila,
    proximoEm: fila.length ? segundos + intervaloChegada(sorteio) : null,
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'INICIAR_SESSAO': {
      const { modo, dia = 1 } = action;
      let seq = 1;
      let pedidos;
      let fila = [];
      if (modo === 'campanha') {
        // só o primeiro chega agora; o resto entra pela fila (liberarFila)
        const [primeiro, ...resto] = pedidosDoDia(dia);
        pedidos = [criarPedido(primeiro, seq++, dia)];
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
      return { ...state, diagramas, estatisticas, sessao: { modo, dia, pedidos, ativo: null, ganho: 0, notas: [], seq, segundos: 0, ...chegada } };
    }

    case 'ENCERRAR_SESSAO':
      return { ...state, sessao: null };

    case 'ACEITAR': {
      const s = state.sessao;
      if (!s || s.ativo) return state;
      return { ...state, sessao: { ...atualizarPedido(s, action.id, () => ({ status: 'aceito' })), ativo: action.id } };
    }

    // DEBUG: troca os pedidos ainda não aceitos pelos próximos modelos da lista, em sequência
    // (dá a volta). Serve para passar por todos os modelos sem esperar. Não cobra multa nem conta estatística.
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
      const diagramas = Object.fromEntries(Object.entries(state.diagramas).filter(([k]) => !removidos.has(k.replace(/^pedido:/, ''))));
      return { ...state, diagramas, sessao: { ...s, pedidos: [...mantidos, ...novos], seq, debugIndice: indice % MODELOS.length } };
    }

    // Recusar custa uma multa (metade do pagamento do pedido). O saldo pode ficar negativo (dívida).
    case 'RECUSAR': {
      const s = state.sessao;
      const pedido = s?.pedidos.find((p) => p.id === action.id);
      if (!pedido || (pedido.status !== 'novo' && pedido.status !== 'aceito')) return state;
      const multa = multaPedido(pedido, state.dinheiro);
      const estatisticas = { ...state.estatisticas, recusados: state.estatisticas.recusados + 1, multas: (state.estatisticas.multas ?? 0) + multa };
      let sessao = atualizarPedido(s, action.id, () => ({ status: 'recusado', multa }));
      sessao = { ...sessao, ganho: s.ganho - multa };
      if (s.ativo === action.id) sessao = { ...sessao, ativo: null };
      if (s.modo === 'infinito') sessao = { ...sessao, pedidos: [...sessao.pedidos, novoPedidoAleatorio(sessao)], seq: s.seq + 1 };
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
      const s = state.sessao;
      if (!s) return state;
      let foram = 0;
      let multas = 0;
      const pedidos = s.pedidos.map((p) => {
        if (p.id === s.ativo) return { ...p, tempoRestante: Math.max(0, p.tempoRestante - 1) };
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
      if (s.modo === 'infinito')
        for (let i = 0; i < foram; i++) sessao = { ...sessao, pedidos: [...sessao.pedidos, novoPedidoAleatorio(sessao)], seq: sessao.seq + 1 };
      // próximo pedido do dia (campanha), se chegou a hora ou não sobrou nada em aberto
      sessao = liberarFila(sessao, action.sorteioChegada);
      // pedido urgente: sorteio a cada minuto de jogo (o número vem na ação, para o reducer seguir puro)
      const urgente = sortearUrgente(sessao, segundos, action.sorteio);
      if (urgente) sessao = { ...sessao, pedidos: [...sessao.pedidos, urgente], seq: sessao.seq + 1 };
      if (!foram) return { ...state, sessao };
      sessao = { ...sessao, ganho: s.ganho - multas };
      const e = state.estatisticas;
      const estatisticas = { ...e, expirados: (e.expirados ?? 0) + foram, multas: (e.multas ?? 0) + multas };
      return concluirDiaSeFor({ ...state, dinheiro: state.dinheiro - multas, estatisticas, sessao });
    }

    case 'SET_DIAGRAMA':
      return { ...state, diagramas: { ...state.diagramas, [action.chave]: action.diagrama } };

    case 'ENTREGAR': {
      const s = state.sessao;
      if (!s) return state;
      const { id, nota, valor } = action;
      // o diagrama entregue fica no pedido, para o resumo do dia mostrar de novo (com o esperado e o feedback)
      const entrega = action.diagrama ? { diagrama: action.diagrama, atrasado: Boolean(action.atrasado) } : {};
      let sessao = atualizarPedido(s, id, () => ({ status: 'entregue', nota, valor, ...entrega }));
      sessao = { ...sessao, ativo: null, ganho: s.ganho + valor, notas: [...s.notas, nota] };
      if (s.modo === 'infinito') sessao = { ...sessao, pedidos: [...sessao.pedidos, novoPedidoAleatorio(sessao)], seq: s.seq + 1 };
      sessao = liberarFila(sessao, action.sorteio);
      const e = state.estatisticas;
      const estatisticas = {
        ...e,
        entregues: e.entregues + 1,
        somaNotas: e.somaNotas + nota,
        melhorNota: Math.max(e.melhorNota, nota),
        excelentes: e.excelentes + (nota >= 85 ? 1 : 0),
        ganhoTotal: e.ganhoTotal + valor,
        historico: [...e.historico, { nota, valor }].slice(-MAX_HISTORICO),
      };
      return concluirDiaSeFor({ ...state, dinheiro: state.dinheiro + valor, estatisticas, sessao, diagramas: semDiagrama(state.diagramas, id) });
    }

    case 'COMPRAR': {
      const { id, preco } = action;
      if (state.loja.possui.includes(id) || state.dinheiro < preco) return state;
      return { ...state, dinheiro: state.dinheiro - preco, loja: { ...state.loja, possui: [...state.loja.possui, id] } };
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
      // ao tirar um objeto do escritório, o que estava em cima dele cai
      const escritorio = tirando ? soltarDoEscritorio(state.escritorio, action.id.replace(/^obj-/, '')) : state.escritorio;
      return { ...state, escritorio, loja: { ...state.loja, moveis: novo } };
    }

    // Dica: compra um pedaço da imagem-resposta do pedido em andamento
    case 'COMPRAR_PEDACO': {
      const s = state.sessao;
      const p = s?.pedidos.find((x) => x.id === s.ativo);
      const { indice } = action;
      if (!p || indice < 0 || indice >= TOTAL_PEDACOS) return state;
      const preco = precoPedaco(p);
      if ((p.pedacos ?? []).includes(indice) || state.dinheiro < preco) return state;
      return {
        ...state,
        dinheiro: state.dinheiro - preco,
        sessao: atualizarPedido(s, p.id, (x) => ({ pedacos: [...(x.pedacos ?? []), indice] })),
      };
    }

    // posicao no formato de lib/decoracao.js
    case 'MOVER_OBJETO':
      return {
        ...state,
        escritorio: { ...state.escritorio, posicoes: { ...state.escritorio.posicoes, [action.objeto]: action.posicao } },
      };

    // Tirou um objeto do lugar (está na mão): quem estava em cima dele cai
    case 'PEGAR_OBJETO':
      return { ...state, escritorio: { ...state.escritorio, posicoes: soltarDependentes(state.escritorio.posicoes, action.objeto) } };

    // Guarda no inventário: some do escritório. Itens da loja saem de "em uso"; os do jogo vão para `guardados`.
    case 'GUARDAR_OBJETO': {
      const { objeto } = action;
      const escritorio = soltarDoEscritorio(state.escritorio, objeto);
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
        return { ...state, loja: { ...state.loja, moveis } };
      }
      return { ...state, escritorio: { ...state.escritorio, guardados: state.escritorio.guardados.filter((g) => g !== objeto) } };
    }

    case 'ARRUMAR_ESCRITORIO':
      return { ...state, escritorio: { ...state.escritorio, posicoes: {} } };

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

function semDiagrama(diagramas, pedidoId) {
  const { ['pedido:' + pedidoId]: _, ...resto } = diagramas;
  return resto;
}

// Desempenho do dia: média de todos os pedidos normais do dia. Entregue vale a nota, recusado vale
// DESEMPENHO_RECUSADO (10%) e perdido (cliente foi embora) vale 0%. Urgentes não entram na média.
export const DESEMPENHO_RECUSADO = 10;
export const desempenhoDoPedido = (p) => (p.status === 'entregue' ? p.nota ?? 0 : p.status === 'recusado' ? DESEMPENHO_RECUSADO : 0);
export function desempenhoDoDia(pedidos) {
  const contam = pedidos.filter((p) => !p.urgente && FINALIZADOS.includes(p.status));
  return contam.length ? Math.round(contam.reduce((t, p) => t + desempenhoDoPedido(p), 0) / contam.length) : 0;
}

// Fim do dia da campanha: com média >= MEDIA_MINIMA o dia conta como concluído e libera o seguinte;
// abaixo disso o próximo continua bloqueado (o dia pode ser jogado de novo). O dinheiro ganho e as
// multas valem nos dois casos. `sessao.relatorio` guarda o resultado para a tela de fim do dia.
function concluirDiaSeFor(state) {
  const s = state.sessao;
  if (!diaEncerrado(s) || s.relatorio) return state;
  const media = desempenhoDoDia(s.pedidos);
  const aprovado = media >= MEDIA_MINIMA;
  const sessao = { ...s, relatorio: { media, aprovado, ganho: s.ganho } };
  if (!aprovado) return { ...state, sessao };
  const antes = state.campanha.concluidos[s.dia];
  // rejogando um dia já concluído: fica o melhor resultado
  const registro = antes && antes.media > media ? antes : { ganho: s.ganho, media };
  return {
    ...state,
    sessao,
    campanha: {
      desbloqueado: Math.min(DIAS_CAMPANHA, Math.max(state.campanha.desbloqueado, s.dia + 1)),
      concluidos: { ...state.campanha.concluidos, [s.dia]: registro },
    },
  };
}

export const chaveDiagrama = (sessao) => (sessao?.ativo ? `pedido:${sessao.ativo}` : 'livre');
export const diagramaDe = (state, chave) => state.diagramas[chave] || vazio();
