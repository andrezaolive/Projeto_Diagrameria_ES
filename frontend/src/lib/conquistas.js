// Regras das conquistas (os dados e o desenho dos prêmios ficam em art/conquistas.js).
//
// Como funciona: o reducer chama `verificarConquistas(antes, depois, action)` depois de cada ação.
//  1. `eventos` resume o que a ação acabou de fazer (pedido entregue, dia encerrado...);
//  2. `atualizarMarcos` atualiza os contadores que as estatísticas não guardam (state.marcos:
//     sequências, cafés bebidos, objetos movidos...). Sequências interrompidas voltam a zero;
//  3. cada regra de REGRAS ainda não desbloqueada é testada; as que passam são desbloqueadas.
// Desbloquear põe o prêmio na sala de exposição: broches e medalhas numa vaga livre do quadro de
// broches; troféus numa vaga das prateleiras (primeiro dentro do armário). Sem vaga, o prêmio vai
// direto para o baú, e o aviso (state.avisosConquista) diz para procurar lá.
// Tudo puro: nada de relógio nem sorteio aqui.
import OBJETOS from '../art/objetos.json';
import { SALA } from '../art/layout.js';
import { CONQUISTAS, conquistaPorId, objetoDaConquista, vaiNoQuadro } from '../art/conquistas.js';
import { CENARIOS, grupoDoObjeto, resolverCena, salaDe } from './decoracao.js';
import { naColecao } from './colecao.js';
import { dataDoDia, nivelDoModelo } from './dificuldade.js';
import { FAIXAS_JOGO } from '../data/musicas.js';
import { ITENS_LOJA, objetosPresentes } from '../data/loja.js';
import { TODOS_MODELOS, ehComplexo, modeloPorId, partesDoModelo, pedacosDoModelo } from '../data/pedidos.js';

export { CONQUISTAS, conquistaPorId, objetoDaConquista };

const DIAS_CAMPANHA = 23;
const FINS_DE_SEMANA = [6, 7, 13, 14, 20, 21, 27, 28];
const OURO = 95;
const BRONZE_ABAIXO = 70;

export const marcosIniciais = () => ({
  seqCem: 0, // entregas seguidas com 100%
  saldoSeguido: 0, // dias úteis seguidos com saldo do dia positivo
  cafes: 0,
  tiposCafe: [],
  movidos: 0,
  visitouSala: false,
  mudouAvatar: false,
  escolheuMusica: false,
  ultimoInicio: null, // dia (ou fim de semana) da última partida da campanha, e quantas vezes seguidas
  inicios: 0,
  infinitoEntregues: 0, // na partida atual do modo infinito
  infinitoSeguidos: 0, // seguidos com 90%+ na partida atual do modo infinito
  urgentesNoPrazo: 0, // no dia atual
  malabares: null, // ids de 3+ pedidos aceitos ao mesmo tempo, esperando a entrega de todos
  malabarismo: false,
  encapsulamento: 0,
  dicasPedido: null, // { id, total }: gasto em dicas no pedido em andamento
  maiorPilha: 0,
  urgenteFoiEmbora: false,
  gabaritoComprado: false,
});

// ---------------------------------------------------------------- o que a ação fez
function eventos(antes, depois, action) {
  const ev = {};
  const sa = antes.sessao, sd = depois.sessao;
  if (action.type === 'ENTREGAR' && sa && sd !== sa) {
    const p = sa.pedidos.find((x) => x.id === action.id);
    const pd = sd?.pedidos.find((x) => x.id === action.id);
    if (p && pd?.status === 'entregue') {
      const m = modeloPorId(p.modelo);
      ev.entrega = {
        pedido: p,
        modelo: m,
        nota: action.nota,
        atrasado: Boolean(action.atrasado),
        atraso: p.atraso ?? 0,
        tempo: p.tempo ?? 0,
        restante: p.tempoRestante ?? 0,
        pedacos: (p.pedacos ?? []).length,
        modo: sa.modo,
        erros: action.erros ?? {},
        cafe: antes.cafe.efeito?.tipo ?? null,
        nivel: m ? nivelDoModelo(m).id : null,
        complexo: ehComplexo(m),
      };
    }
  }
  if (sd?.relatorio && !sa?.relatorio) {
    const despesa = sd.relatorio.despesa ?? 0;
    ev.fimDia = { sessao: sd, relatorio: sd.relatorio, saldo: sd.ganho - despesa };
  }
  return ev;
}

const temVisibilidadeEspecial = (m) =>
  partesDoModelo(m).some((p) => p.secao === 'classes' && p.esperado.nodes.some((n) => [...(n.atributos ?? []), ...(n.metodos ?? [])].some((l) => /^\s*[+#]/.test(l))));

// Maior altura de pilha nas duas salas (0 = nada empilhado; 3 = quatro objetos um em cima do outro)
function maiorPilha(state) {
  const presentes = objetosPresentes(state);
  const { posicoes } = state.escritorio;
  let maior = 0;
  for (const [id, cen] of Object.entries(CENARIOS)) {
    const cena = resolverCena(presentes.filter((n) => salaDe(n, posicoes) === id), posicoes, cen);
    for (const o of cena) if (!o.dentro && o.nivel > maior) maior = o.nivel;
  }
  return maior;
}

const MOVEM = ['MOVER_OBJETO', 'COLOCAR_GRUPO'];

function atualizarMarcos(antes, depois, action, ev) {
  const m0 = depois.marcos ?? marcosIniciais();
  const m = { ...m0 };
  const sd = depois.sessao;
  switch (action.type) {
    case 'INICIAR_SESSAO': {
      m.infinitoEntregues = 0;
      m.infinitoSeguidos = 0;
      m.urgentesNoPrazo = 0;
      m.malabares = null;
      m.dicasPedido = null;
      if (action.modo === 'campanha') {
        const chave = action.fimDeSemana ? `fds-${action.fimDeSemana}` : `dia-${action.dia ?? 1}`;
        m.inicios = m.ultimoInicio === chave ? m.inicios + 1 : 1;
        m.ultimoInicio = chave;
      } else m.ultimoInicio = null;
      break;
    }
    case 'BEBER_CAFE':
      if (antes.cafe.xicara && !depois.cafe.xicara) {
        m.cafes += 1;
        if (!m.tiposCafe.includes(antes.cafe.xicara)) m.tiposCafe = [...m.tiposCafe, antes.cafe.xicara];
      }
      break;
    case 'VISITAR_SALA':
      m.visitouSala = true;
      break;
    case 'DEFINIR_PERFIL':
      // so vale mudar depois de criar o perfil (a tela de nome do save novo tambem manda o avatar)
      if (action.avatar && antes.perfil.nome && JSON.stringify(antes.perfil.avatar) !== JSON.stringify(depois.perfil.avatar)) m.mudouAvatar = true;
      break;
    case 'ESCOLHER_MUSICA':
      if (depois !== antes) m.escolheuMusica = true;
      break;
    case 'COMPRAR_PEDACO': {
      const gasto = antes.dinheiro - depois.dinheiro;
      if (gasto > 0 && sd?.ativo) {
        const total = (m.dicasPedido?.id === sd.ativo ? m.dicasPedido.total : 0) + gasto;
        m.dicasPedido = { id: sd.ativo, total };
        const p = sd.pedidos.find((x) => x.id === sd.ativo);
        const mod = p && modeloPorId(p.modelo);
        if (mod && ehComplexo(mod) && (p.pedacos ?? []).length >= pedacosDoModelo(mod) * partesDoModelo(mod).length) m.gabaritoComprado = true;
      }
      break;
    }
    default:
  }
  if (MOVEM.includes(action.type) && depois.escritorio !== antes.escritorio) {
    m.movidos += 1;
    m.maiorPilha = Math.max(m.maiorPilha, maiorPilha(depois));
  }

  // pedido entregue
  const e = ev.entrega;
  if (e) {
    m.seqCem = e.nota >= 100 ? m.seqCem + 1 : 0;
    if (e.modo === 'infinito') {
      m.infinitoEntregues += 1;
      m.infinitoSeguidos = e.nota >= 90 ? m.infinitoSeguidos + 1 : 0;
    }
    if (e.pedido.urgente && !e.atrasado) m.urgentesNoPrazo += 1;
    const errosDeMembro = Object.keys(e.erros).some((k) => k.startsWith('membro') && e.erros[k] > 0);
    if (e.modelo && temVisibilidadeEspecial(e.modelo) && !errosDeMembro) m.encapsulamento += 1;
  }

  // malabarismo: 3 ou mais aceitos ao mesmo tempo; vale se todos forem entregues no prazo
  if (sd) {
    const aceitos = sd.pedidos.filter((p) => p.status === 'aceito');
    if (!m.malabares && aceitos.length >= 3) m.malabares = aceitos.map((p) => p.id);
    if (m.malabares) {
      const grupo = m.malabares.map((id) => sd.pedidos.find((p) => p.id === id));
      if (grupo.some((p) => !p || p.status === 'recusado' || p.status === 'expirado' || (p.status === 'entregue' && p.atrasado))) m.malabares = null;
      else if (grupo.every((p) => p.status === 'entregue')) {
        m.malabarismo = true;
        m.malabares = null;
      }
    }
    // cliente de pedido urgente que foi embora
    const foram = (s) => s?.pedidos.filter((p) => p.urgente && p.status === 'expirado').length ?? 0;
    if (foram(sd) > foram(antes.sessao)) m.urgenteFoiEmbora = true;
  }

  // fim do dia útil: saldo positivo seguido
  if (ev.fimDia && !ev.fimDia.sessao.fimDeSemana && ev.fimDia.sessao.modo === 'campanha') m.saldoSeguido = ev.fimDia.saldo > 0 ? m.saldoSeguido + 1 : 0;

  const mudou = Object.keys(m).some((k) => m[k] !== m0[k]);
  return mudou ? m : m0;
}

// ---------------------------------------------------------------- regras
const media = (t) => (t?.n ? t.soma / t.n : 0);
const golds = (s) => Object.values(s.campanha.concluidos).filter((r) => r.media >= OURO).length;
// Quantos diagramas de um tipo ja foram entregues (barra de 3 das conquistas de primeiros diagramas)
const entreguesDoTipo = (tipo) => (s) => s.estatisticas.porTipo[tipo]?.n ?? 0;
const primeiros = (tipo) => ({ cond: (s) => entreguesDoTipo(tipo)(s) >= 3, progresso: entreguesDoTipo(tipo) });
// O dia tem pedido medio ou dificil?
const diaPuxado = (sessao) => sessao.pedidos.some((p) => { const m = modeloPorId(p.modelo); return m && nivelDoModelo(m).id !== 'facil'; });
const SEMANAS = [0, 1, 2, 3, 4].map((k) => Array.from({ length: DIAS_CAMPANHA }, (_, i) => i + 1).filter((d) => Math.floor((dataDoDia(d) - 1) / 7) === k));
const especialista = (tipo) => ({
  cond: (s) => (s.estatisticas.porTipo[tipo]?.n ?? 0) >= 15 && media(s.estatisticas.porTipo[tipo]) >= 80,
  progresso: (s) => s.estatisticas.porTipo[tipo]?.n ?? 0,
});
const pedidosNormais = (sessao) => sessao.pedidos.filter((p) => !p.urgente);
const loja = ITENS_LOJA.filter((i) => i.preco > 0);
const musicasPagas = FAIXAS_JOGO.filter((f) => f.preco > 0);

// cond(state, ev) → desbloqueia? · progresso(state) → número (para a barra, com `meta` dos dados)
export const REGRAS = {
  'primeiro-pedido': { cond: (s) => s.estatisticas.entregues >= 1 },
  'primeiro-expediente': { cond: (s) => Boolean(s.campanha.concluidos[1]) },
  carimbo: { cond: (s, ev) => ev.entrega?.nota >= 100 },
  'fregues-fiel': { cond: (s) => Object.values(s.colecao ?? {}).some((c) => c.entregas >= 2) },
  cafezinho: { cond: (s) => s.marcos.cafes >= 1 },

  'medalha-no-peito': { cond: (s, ev) => Boolean(ev.fimDia) && ev.fimDia.relatorio.media >= OURO && pedidosNormais(ev.fimDia.sessao).length >= 3 },
  'volta-por-cima': {
    cond: (s, ev) => {
      const f = ev.fimDia;
      if (!f || f.sessao.fimDeSemana || f.sessao.modo !== 'campanha' || f.relatorio.media < OURO) return false;
      const ontem = s.campanha.concluidos[f.sessao.dia - 1];
      return Boolean(ontem) && ontem.media < BRONZE_ABAIXO;
    },
  },
  'sequencia-perfeita': { cond: (s) => s.marcos.seqCem >= 5, progresso: (s) => s.marcos.seqCem },
  'sem-rabisco': {
    cond: (s, ev) => {
      const f = ev.fimDia;
      if (!f) return false;
      const normais = pedidosNormais(f.sessao);
      return normais.length >= 4 && normais.every((p) => p.status === 'entregue' && p.nota >= 100);
    },
  },
  'na-raca': { cond: (s, ev) => ev.entrega?.nivel === 'dificil' && ev.entrega.nota >= 100 && ev.entrega.pedacos === 0 },
  'semana-dourada': { cond: (s) => SEMANAS.some((dias) => dias.length && dias.every((d) => s.campanha.concluidos[d]?.media >= OURO)) },
  'arquiteto-senior': { cond: (s, ev) => Boolean(ev.entrega?.complexo) && ev.entrega.nivel === 'dificil' && ev.entrega.nota >= 90 && ev.entrega.pedacos === 0 },
  'calendario-reluzente': { cond: (s) => golds(s) >= DIAS_CAMPANHA, progresso: golds },

  pontualidade: {
    cond: (s, ev) => {
      const f = ev.fimDia;
      if (!f) return false;
      const entregues = f.sessao.pedidos.filter((p) => p.status === 'entregue');
      return entregues.length >= 3 && entregues.every((p) => !p.atrasado) && !f.sessao.pedidos.some((p) => p.status === 'expirado');
    },
  },
  relampago: { cond: (s, ev) => Boolean(ev.entrega) && ev.entrega.nivel !== 'facil' && !ev.entrega.atrasado && ev.entrega.nota >= 90 && ev.entrega.tempo > 0 && ev.entrega.tempo - ev.entrega.restante <= ev.entrega.tempo / 4 },
  malabarista: { cond: (s) => s.marcos.malabarismo },
  bombeiro: { cond: (s) => s.marcos.urgentesNoPrazo >= 3, progresso: (s) => s.marcos.urgentesNoPrazo },

  'primeira-classe': primeiros('classes'),
  'ator-principal': primeiros('casos'),
  'mudanca-de-estado': primeiros('estados'),
  'especialista-classes': especialista('classes'),
  'especialista-casos': especialista('casos'),
  'especialista-estados': especialista('estados'),
  encapsulamento: { cond: (s) => s.marcos.encapsulamento >= 10, progresso: (s) => s.marcos.encapsulamento },
  'poliglota-uml': { cond: (s) => ['casos', 'classes', 'estados'].every((t) => (s.estatisticas.porTipo[t]?.n ?? 0) >= 10 && media(s.estatisticas.porTipo[t]) >= 90) },

  'hora-extra': { cond: (s) => Object.keys(s.campanha.fimDeSemana ?? {}).length >= 1 },
  'quebra-cabeca': { cond: (s, ev) => Boolean(ev.entrega?.complexo) && ev.entrega.nota >= 90 && ev.entrega.pedacos <= 4 },
  'sem-folga': {
    cond: (s) => FINS_DE_SEMANA.every((d) => s.campanha.fimDeSemana?.[d]),
    progresso: (s) => FINS_DE_SEMANA.filter((d) => s.campanha.fimDeSemana?.[d]).length,
  },
  'grande-final': { cond: (s) => (s.campanha.fimDeSemana?.[28]?.media ?? 0) >= OURO },

  'primeiro-salario': { cond: (s) => s.dinheiro >= 1000, progresso: (s) => Math.max(0, s.dinheiro) },
  'aluguel-em-dia': { cond: (s) => s.marcos.saldoSeguido >= 10, progresso: (s) => s.marcos.saldoSeguido },
  'pao-duro': { cond: (s, ev) => Boolean(ev.fimDia) && ev.fimDia.relatorio.media >= OURO && diaPuxado(ev.fimDia.sessao) && !ev.fimDia.sessao.pedidos.some((p) => (p.pedacos ?? []).length) },
  'pe-de-meia': { cond: (s) => s.dinheiro >= 10000, progresso: (s) => Math.max(0, s.dinheiro) },
  'cliente-vip': { cond: (s) => loja.every((i) => s.loja.possui.includes(i.id)), progresso: (s) => loja.filter((i) => s.loja.possui.includes(i.id)).length, meta: loja.length },

  'movido-a-cafeina': { cond: (s, ev) => ev.entrega?.cafe === 'forte' },
  barista: { cond: (s) => s.marcos.tiposCafe.length >= 3, progresso: (s) => s.marcos.tiposCafe.length },
  viciado: { cond: (s) => s.marcos.cafes >= 50, progresso: (s) => s.marcos.cafes },

  decorador: { cond: (s) => s.loja.possui.some((id) => ITENS_LOJA.some((i) => i.id === id && i.preco > 0)) },
  'abra-a-porta': { cond: (s) => s.marcos.visitouSala },
  'foto-de-familia': { cond: (s) => s.marcos.mudouAvatar },
  dj: { cond: (s) => s.marcos.escolheuMusica },
  museu: {
    cond: (s, ev, a) => MOVEM.concat('VISITAR_SALA', 'ALTERNAR_MOVEL', 'RETIRAR_OBJETO', 'ARRUMAR_ESCRITORIO').includes(a.type) && naSala(s) >= 10,
    progresso: (s) => naSala(s),
  },
  colecionador: {
    cond: (s) => colecao(s) * 2 >= TODOS_MODELOS.length,
    progresso: colecao,
    meta: Math.ceil(TODOS_MODELOS.length / 2),
  },
  playlist: { cond: (s) => musicasPagas.every((f) => s.loja.possui.includes(f.id)), progresso: (s) => musicasPagas.filter((f) => s.loja.possui.includes(f.id)).length, meta: musicasPagas.length },
  'album-completo': {
    cond: (s) => TODOS_MODELOS.every((m) => (s.colecao?.[m.id]?.melhorNota ?? 0) >= OURO),
    progresso: (s) => TODOS_MODELOS.filter((m) => (s.colecao?.[m.id]?.melhorNota ?? 0) >= OURO).length,
    meta: TODOS_MODELOS.length,
  },

  'sem-fim': { cond: (s) => (s.estatisticas.jogosPorModo?.infinito ?? 0) >= 1 },
  maratonista: { cond: (s) => s.marcos.infinitoEntregues >= 30, progresso: (s) => s.marcos.infinitoEntregues },
  inabalavel: { cond: (s) => s.marcos.infinitoSeguidos >= 15, progresso: (s) => s.marcos.infinitoSeguidos },

  'errar-e-humano': { cond: (s, ev) => Boolean(ev.entrega) && ev.entrega.nota < 30 },
  'antes-tarde': { cond: (s, ev) => Boolean(ev.entrega?.atrasado) && ev.entrega.atraso > 60 },
  'no-vermelho': { cond: (s, ev) => Boolean(ev.fimDia) && ev.fimDia.saldo < 0 },
  'comprei-o-gabarito': { cond: (s) => s.marcos.gabaritoComprado },
  'alergia-a-prazo': { cond: (s) => s.marcos.urgenteFoiEmbora },
  'tentar-de-novo': { cond: (s) => s.marcos.inicios >= 3, progresso: (s) => s.marcos.inicios },
  organizador: { cond: (s) => s.marcos.movidos >= 100, progresso: (s) => s.marcos.movidos },
  'por-um-fio': { cond: (s, ev) => Boolean(ev.entrega) && !ev.entrega.atrasado && ev.entrega.restante <= 3 },
  'torre-de-pisa': { cond: (s) => s.marcos.maiorPilha >= 3 },
  placebo: { cond: (s, ev) => ev.entrega?.cafe === 'descafeinado' && ev.entrega.nota >= 100 },
  investidor: { cond: (s) => (s.marcos.dicasPedido?.total ?? 0) > 1000 },

  mestre: {
    cond: (s) => CONQUISTAS.every((c) => c.id === 'mestre' || s.conquistas[c.id]),
    progresso: (s) => CONQUISTAS.filter((c) => c.id !== 'mestre' && s.conquistas[c.id]).length,
    meta: CONQUISTAS.length - 1,
  },
};

// Itens na sala de exposição (Museu Particular): os prêmios das conquistas não contam, e os itens
// de várias peças (pilha de livros, pote de canetas) contam uma vez só
export function naSala(s) {
  const itens = objetosPresentes(s)
    .filter((n) => !OBJETOS[n]?.conquista && salaDe(n, s.escritorio.posicoes) === 'sala')
    .map((n) => grupoDoObjeto(n) ?? n);
  return new Set(itens).size;
}
function colecao(s) {
  return TODOS_MODELOS.filter((m) => naColecao(s.colecao, m.id)).length;
}

// Alvo da barra de progresso (dos dados ou da regra); null = sem barra
export const metaDe = (cq) => REGRAS[cq.id]?.meta ?? cq.meta ?? null;
export function progressoDe(state, cq) {
  const r = REGRAS[cq.id];
  const meta = metaDe(cq);
  if (!r?.progresso || !meta) return null;
  const atual = Math.min(meta, Math.floor(r.progresso({ ...state, marcos: { ...marcosIniciais(), ...state.marcos } })));
  return { atual, meta };
}

// ---------------------------------------------------------------- vagas na sala
const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const retangulo = (o) => ({ x: o.x, y: o.y, w: o.meta.w, h: o.meta.h });

function cenaDaSala(state, ignorar = []) {
  const { posicoes } = state.escritorio;
  const nomes = objetosPresentes(state).filter((n) => !ignorar.includes(n) && salaDe(n, posicoes) === 'sala');
  return resolverCena(nomes, posicoes, CENARIOS.sala);
}

// Primeira vaga livre do quadro de broches (de cima para baixo, da esquerda para a direita)
export function vagaNoQuadro(nome, cena) {
  const meta = OBJETOS[nome];
  const q = SALA.quadro;
  const ocupados = cena.map(retangulo);
  for (let y = q.y + 5; y + meta.h <= q.y + q.h - 4; y += 2)
    for (let x = q.x + 5; x + meta.w <= q.x + q.w - 4; x += 2) {
      const r = { x: x - 1, y: y - 1, w: meta.w + 2, h: meta.h + 2 };
      if (!ocupados.some((o) => sobrepoe(r, o))) return { sala: 'sala', x, y };
    }
  return null;
}

// Prateleiras, na ordem de preferência dos troféus (o armário de vidro primeiro)
const PREFERENCIA = ['armario-cima', 'armario-baixo', 'p1', 'p2', 'p-baixo'];
// Até onde o troféu pode subir: o que está acima da prateleira (tampo do armário, outra prateleira, o quadro)
function teto(id, x, w) {
  if (SALA.tetos[id] != null) return SALA.tetos[id];
  const q = SALA.quadro;
  const p2 = SALA.prateleiras.p2;
  let t = 0;
  if (x < q.x + q.w && x + w > q.x) t = Math.max(t, q.y + q.h);
  if (x < p2.x + p2.w && x + w > p2.x) t = Math.max(t, p2.y + 8);
  return t;
}

export function vagaNaPrateleira(nome, cena) {
  const meta = OBJETOS[nome];
  const ocupados = cena.map(retangulo);
  for (const id of PREFERENCIA) {
    const p = SALA.prateleiras[id];
    const y = p.y - meta.h;
    for (let x = p.x + 3; x + meta.w <= p.x + p.w - 3; x++) {
      if (y < teto(id, x, meta.w)) continue;
      const r = { x: x - 2, y, w: meta.w + 4, h: meta.h };
      if (!ocupados.some((o) => sobrepoe(r, o))) return { sala: 'sala', x, sobre: id };
    }
  }
  return null;
}

// Põe o prêmio numa vaga da sala; sem vaga, vai para o baú. Devolve { state, noBau }.
function colocarPremio(state, id, cena) {
  const nome = objetoDaConquista(id);
  const cq = conquistaPorId(id);
  const vaga = vaiNoQuadro(cq) ? vagaNoQuadro(nome, cena) : vagaNaPrateleira(nome, cena);
  const e = state.escritorio;
  if (vaga) return { state: { ...state, escritorio: { ...e, posicoes: { ...e.posicoes, [nome]: vaga } } }, noBau: false };
  const { [nome]: _, ...posicoes } = e.posicoes;
  return { state: { ...state, escritorio: { ...e, posicoes, guardados: e.guardados.includes(nome) ? e.guardados : [...e.guardados, nome] } }, noBau: true };
}

export function desbloquear(state, ids) {
  let s = state;
  for (const id of ids) {
    if (s.conquistas[id] || !conquistaPorId(id)) continue;
    const ordem = Object.keys(s.conquistas).length + 1;
    s = { ...s, conquistas: { ...s.conquistas, [id]: { ordem } } };
    const r = colocarPremio(s, id, cenaDaSala(s, [objetoDaConquista(id)]));
    s = { ...r.state, avisosConquista: [...(s.avisosConquista ?? []), { id, noBau: r.noBau }] };
  }
  return s;
}

// "Arrumar" (posições de volta ao padrão): os prêmios fora do baú voltam ao quadro e às prateleiras,
// na ordem em que foram conquistados (os que não couberem vão para o baú)
export function arrumarPremios(state) {
  const ids = Object.entries(state.conquistas ?? {})
    .sort(([, a], [, b]) => a.ordem - b.ordem)
    .map(([id]) => id)
    .filter((id) => !state.escritorio.guardados.includes(objetoDaConquista(id)));
  const nomes = ids.map(objetoDaConquista);
  let s = state;
  ids.forEach((id, i) => {
    s = colocarPremio(s, id, cenaDaSala(s, nomes.slice(i))).state;
  });
  return s;
}

// ---------------------------------------------------------------- verificação depois de cada ação
const SEM_VERIFICAR = ['CONQUISTA_VISTA', 'CARREGAR', 'RESETAR'];

export function verificarConquistas(antes, depois, action) {
  if (SEM_VERIFICAR.includes(action.type) || !depois.conquistas) return depois;
  const ev = eventos(antes, depois, action);
  const marcos = atualizarMarcos(antes, depois, action, ev);
  let s = marcos === depois.marcos ? depois : { ...depois, marcos };
  const novas = [];
  for (const cq of CONQUISTAS) {
    if (s.conquistas[cq.id] || cq.id === 'mestre') continue;
    if (REGRAS[cq.id]?.cond(s, ev, action)) novas.push(cq.id);
  }
  if (novas.length) s = desbloquear(s, novas);
  if (!s.conquistas.mestre && REGRAS.mestre.cond(s)) s = desbloquear(s, ['mestre']);
  return s;
}
