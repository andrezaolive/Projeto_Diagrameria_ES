import { MODELOS, TOTAL_PEDACOS, URGENTE, criarPedido, criarPedidoUrgente, intervaloChegada, multaPedido, pedidosDoDia, precoPedaco } from '../data/pedidos.js';
import { ALEATORIA, faixasDoJogador, temTocaFitas } from '../data/musicas.js';
import { avatarPadrao } from '../lib/avatar.js';
import { niveisNoInfinito, nivelDoModelo } from '../lib/dificuldade.js';
import { CAPSULAS, EFEITO_SEGUNDOS, cafeInicial, motivoSemCafe, ritmoDoJogo, temCafeteira, tempoDePreparo } from '../data/cafe.js';
import { conteudoDe, ehPorta, grupoDoObjeto, membrosDoGrupo, moverComConteudo, soltarDependentes } from '../lib/decoracao.js';

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
  cafe: cafeInicial(), // cafeteira: cápsulas, preparo, caneca cheia e efeito (ver data/cafe.js)
  computador: { icones: {} }, // posição dos ícones da área de trabalho ({ id: { col, lin } }, ver lib/areaTrabalho.js)
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
    cafe: { ...base.cafe, ...salvo.cafe, capsulas: { ...base.cafe.capsulas, ...salvo.cafe?.capsulas } },
    computador: { ...base.computador, ...salvo.computador, icones: { ...salvo.computador?.icones } },
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

// Modo infinito: os primeiros pedidos são fáceis, depois entram os médios e, mais adiante, os difíceis
function novoPedidoAleatorio(sessao) {
  const ultimo = sessao.pedidos.at(-1)?.modelo;
  const niveis = niveisNoInfinito(sessao.seq);
  const opcoes = MODELOS.filter((m) => m.id !== ultimo && niveis.includes(nivelDoModelo(m).id));
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
export const temRelogio = (sessao) =>
  Boolean(sessao?.pedidos.some((p) => p.status === 'aceito' || (p.status === 'novo' && p.paciencia != null)));

// Vários pedidos podem estar aceitos ao mesmo tempo; `sessao.ativo` é o que está aberto no editor.
// Quando ele sai (entregue/recusado), o editor passa para outro aceito (o mais antigo), se houver.
export const pedidosAceitos = (sessao) => sessao?.pedidos.filter((p) => p.status === 'aceito') ?? [];
const proximoAtivo = (sessao) => pedidosAceitos(sessao)[0]?.id ?? null;

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
      // o efeito do café não passa de uma partida para outra
      const cafe = { ...state.cafe, efeito: null };
      return { ...state, diagramas, estatisticas, cafe, sessao: { modo, dia, pedidos, ativo: null, ganho: 0, notas: [], seq, segundos: 0, ...chegada } };
    }

    case 'ENCERRAR_SESSAO':
      return { ...state, sessao: null };

    // Aceitar não exige terminar o atual: o aceito vira o pedido aberto no editor, e os outros
    // aceitos continuam correndo o prazo (troca-se entre eles com ATIVAR)
    case 'ACEITAR': {
      const s = state.sessao;
      if (s?.pedidos.find((p) => p.id === action.id)?.status !== 'novo') return state;
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
      if (!s || !MODELOS.some((m) => m.id === action.modelo)) return state;
      const novo = criarPedido(action.modelo, s.seq, s.dia ?? 1);
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
      if (s.ativo === action.id) sessao = { ...sessao, ativo: proximoAtivo(sessao) };
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
      let s = state.sessao;
      if (!s) return state;
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
        if (p.status === 'aceito') return { ...p, tempoRestante: Math.max(0, p.tempoRestante - 1) };
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
      sessao = { ...sessao, ganho: s.ganho + valor, notas: [...s.notas, nota] };
      sessao = { ...sessao, ativo: s.ativo === id ? proximoAtivo(sessao) : s.ativo };
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

    // Cafeteira (data/cafe.js). Cápsulas: compradas uma a uma, ficam guardadas na cafeteira.
    case 'COMPRAR_CAPSULA': {
      const c = CAPSULAS.find((x) => x.id === action.tipo);
      if (!c || !temCafeteira(state) || state.dinheiro < c.preco) return state;
      const capsulas = { ...state.cafe.capsulas, [c.id]: (state.cafe.capsulas[c.id] ?? 0) + 1 };
      return { ...state, dinheiro: state.dinheiro - c.preco, cafe: { ...state.cafe, capsulas } };
    }

    // Fazer café: gasta uma cápsula; fica pronto em 5–10 s (`sorteio` escolhe o tempo)
    case 'FAZER_CAFE': {
      const { tipo } = action;
      if (!CAPSULAS.some((c) => c.id === tipo) || motivoSemCafe(state, tipo)) return state;
      const capsulas = { ...state.cafe.capsulas, [tipo]: state.cafe.capsulas[tipo] - 1 };
      return { ...state, cafe: { ...state.cafe, capsulas, preparando: { tipo, falta: tempoDePreparo(action.sorteio) } } };
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
      return { ...state, cafe: { ...state.cafe, xicara: null, efeito: { tipo: xicara, falta: EFEITO_SEGUNDOS } } };
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
      // item de vários objetos (pilha de livros): tira/põe todos, e volta empilhado
      const membros = membrosDoGrupo(action.id);
      if (membros.length) return { ...state, escritorio: reporGrupo(state.escritorio, membros, tirando), loja: { ...state.loja, moveis: novo } };
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

// Objetos de um grupo (pilha de livros) saem todos do escritório (`guardar`) ou voltam todos para a
// posição padrão, empilhados. Em ambos os casos esquecem as posições e saem da lista de guardados.
function reporGrupo(escritorio, membros, guardar) {
  let e = escritorio;
  if (guardar) for (const m of membros) e = soltarDoEscritorio(e, m);
  const posicoes = Object.fromEntries(Object.entries(e.posicoes).filter(([n]) => !membros.includes(n)));
  const guardadosDentro = Object.fromEntries(Object.entries(e.guardadosDentro ?? {}).filter(([n]) => !membros.includes(n)));
  return { ...e, posicoes, guardados: e.guardados.filter((g) => !membros.includes(g)), guardadosDentro };
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
