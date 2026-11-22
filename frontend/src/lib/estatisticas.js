import { DIAS_CAMPANHA } from '../state/reducer.js';
import { TODOS_MODELOS } from '../data/pedidos.js';
import { MEDALHAS, medalhaDaNota } from './colecao.js';

// Estatísticas da aba ESTATISTICAS.EXE: cada uma responde a uma pergunta que ajuda o jogador a
// melhorar (onde erro, em que tipo de diagrama vou pior, entrego no prazo, para onde vai o
// dinheiro, as dicas compensam...) e traz uma `dica` do que fazer.
// Gráficos (dados puros; o desenho fica em components/Grafico.jsx):
//   { tipo: 'barras', barras: [{ rotulo, valor }], unidade?, destaque? }
//   { tipo: 'linha', pontos: [n...], referencia?: { valor, rotulo }, destaque?: indice, unidade?, min?, max? }
//   { tipo: 'dias', dias: [{ dia, media|null }] }
// `vazio` explica por que ainda não há o que mostrar.

const TIPOS = [
  { id: 'casos', nome: 'Casos de uso', curto: 'Casos' },
  { id: 'classes', nome: 'Classes', curto: 'Classes' },
  { id: 'estados', nome: 'Estados', curto: 'Estados' },
];
const NIVEIS = [
  { id: 'facil', nome: 'Fácil' },
  { id: 'medio', nome: 'Médio' },
  { id: 'dificil', nome: 'Difícil' },
];

// Problemas do feedback (lib/feedback.js): nome curto (barra), nome e o que fazer
export const ERROS = {
  grafia: { curto: 'Grafia', nome: 'Nome escrito diferente', conselho: 'Copie os nomes exatamente como estão entre aspas no e-mail.' },
  tipoErrado: { curto: 'Peça', nome: 'Peça do tipo errado', conselho: 'Confira na paleta se é ator, caso de uso, classe ou estado; o Guia mostra cada peça.' },
  faltando: { curto: 'Faltou', nome: 'Elemento faltando', conselho: 'Antes de entregar, confira cada nome entre aspas do e-mail no diagrama.' },
  sobrando: { curto: 'Sobrou', nome: 'Elemento a mais', conselho: 'Coloque só o que o e-mail pede: elementos a mais não ajudam.' },
  foraDoSistema: { curto: 'Fronteira', nome: 'Caso de uso fora do sistema', conselho: 'Casos de uso ficam dentro do retângulo do sistema; atores, fora.' },
  atorNoSistema: { curto: 'Ator', nome: 'Ator dentro do sistema', conselho: 'O ator usa o sistema de fora: deixe-o do lado de fora do retângulo.' },
  relacaoFaltando: { curto: 'Ligação', nome: 'Relação faltando', conselho: 'Cada frase do e-mail que liga duas coisas vira uma linha ou seta.' },
  relacaoSobrando: { curto: 'Lig. a mais', nome: 'Relação a mais', conselho: 'Ligue só o que o e-mail liga.' },
  relacaoTipoErrado: {
    curto: 'Tipo lig.',
    nome: 'Relação do tipo errado',
    conselho: '"Sempre" = include, "às vezes" = extend, "é um tipo de" = herança, "some junto" = composição, "continua existindo" = agregação.',
  },
  sentidoInvertido: { curto: 'Sentido', nome: 'Relação no sentido invertido', conselho: 'Herança sai do filho para o pai; composição e agregação saem do todo; extend sai do opcional.' },
  eventoErrado: { curto: 'Evento', nome: 'Evento errado na transição', conselho: 'O evento da seta é o que vem entre aspas no e-mail; condições da decisão vão entre colchetes.' },
  multiplicidade: { curto: 'Mult.', nome: 'Multiplicidade errada', conselho: 'O número fica na ponta da classe que está sendo contada (1, 0..1, 1..*, 0..*).' },
  membroFaltando: { curto: 'Membro', nome: 'Atributo/método faltando', conselho: 'Cada atributo e método entre aspas no e-mail vai na classe dele.' },
  membroNoLugarErrado: { curto: 'Classe', nome: 'Membro na classe errada', conselho: 'Releia de quem é cada atributo ou método.' },
  membroTipo: { curto: 'Tipo', nome: 'Tipo de atributo/método errado', conselho: 'O tipo vem depois dos dois-pontos: "saldo: float", "sacar(): bool".' },
  membroVisibilidade: { curto: 'Visib.', nome: 'Visibilidade errada', conselho: 'Clique no quadradinho da linha: - privado, + público, # protegido.' },
};

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const mediaDe = (x) => (x?.n ? Math.round(x.soma / x.n) : null);
const tempoTexto = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export function resumoEstatisticas(state) {
  const e = state.estatisticas;
  const notas = e.historico.map((h) => h.nota);
  const media = e.entregues ? Math.round(e.somaNotas / e.entregues) : null;
  const semEntregas = 'Entregue um pedido para ver o gráfico.';

  // tendência: as 5 últimas entregas contra as 5 anteriores
  const ultimas = notas.slice(-5), antes = notas.slice(-10, -5);
  const mediaLista = (l) => Math.round(l.reduce((t, n) => t + n, 0) / l.length);
  const tendencia = ultimas.length && antes.length ? mediaLista(ultimas) - mediaLista(antes) : null;

  // por tipo de diagrama e por dificuldade
  const tipos = TIPOS.map((t) => ({ ...t, media: mediaDe(e.porTipo?.[t.id]), n: e.porTipo?.[t.id]?.n ?? 0, tempo: e.porTipo?.[t.id]?.n ? e.porTipo[t.id].tempo / e.porTipo[t.id].n : null }));
  const jogados = tipos.filter((t) => t.n);
  const pior = jogados.length ? jogados.reduce((a, b) => (b.media < a.media ? b : a)) : null;
  const niveis = NIVEIS.map((n) => ({ ...n, media: mediaDe(e.porNivel?.[n.id]), n: e.porNivel?.[n.id]?.n ?? 0 }));

  // erros mais comuns
  const erros = Object.entries(e.erros ?? {}).filter(([tipo, q]) => q > 0 && ERROS[tipo]).sort((a, b) => b[1] - a[1]);
  const maisComum = erros[0] ? ERROS[erros[0][0]] : null;

  // prazo
  const expirados = e.expirados ?? 0;
  const noPrazo = e.noPrazo ?? 0, atrasados = e.atrasados ?? 0;
  const finalizados = noPrazo + atrasados + e.recusados + expirados;
  const tempoMedio = jogados.length ? jogados.reduce((t, x) => t + x.tempo * x.n, 0) / jogados.reduce((t, x) => t + x.n, 0) : null;

  // dinheiro
  const g = e.gastos ?? {};
  const saidas = [
    { rotulo: 'Loja', valor: g.loja ?? 0 },
    { rotulo: 'Dicas', valor: g.dicas ?? 0 },
    { rotulo: 'Café', valor: g.cafe ?? 0 },
    { rotulo: 'Imprevistos', valor: g.eventos ?? 0 }, // gerador e limpeza (eventos do modo infinito)
    { rotulo: 'Multas', valor: e.multas ?? 0 },
    { rotulo: 'Aluguel', valor: e.despesas ?? 0 },
  ];
  const gastoTotal = saidas.reduce((t, s) => t + s.valor, 0);
  const maiorGasto = saidas.reduce((a, b) => (b.valor > a.valor ? b : a));
  const lucro = e.ganhoTotal - gastoTotal;

  // dicas
  const comDica = mediaDe(e.comDica), semDica = mediaDe(e.semDica);

  // campanha e coleção
  const concluidos = state.campanha.concluidos;
  const diasConcluidos = Object.keys(concluidos).length;
  const fds = Object.keys(state.campanha.fimDeSemana ?? {}).length;
  const colecao = state.colecao ?? {};
  const desbloqueados = TODOS_MODELOS.filter((m) => colecao[m.id]?.entregas > 0);
  const porMedalha = Object.fromEntries(MEDALHAS.map((m) => [m.id, 0]));
  for (const m of desbloqueados) porMedalha[medalhaDaNota(colecao[m.id].melhorNota).id]++;
  const semOuro = desbloqueados.filter((m) => medalhaDaNota(colecao[m.id].melhorNota).id !== 'ouro').length;

  return [
    {
      id: 'media',
      rotulo: 'Média de acerto',
      valor: media === null ? '—' : `${media}%`,
      titulo: `Nota das últimas ${notas.length} entregas`,
      grafico: { tipo: 'linha', pontos: notas, min: 0, max: 100, unidade: '%', referencia: media === null ? null : { valor: media, rotulo: `média ${media}%` } },
      vazio: notas.length ? null : semEntregas,
      dica:
        tendencia == null
          ? 'Com 10 entregas dá para ver se você está melhorando.'
          : tendencia > 2
            ? `Subindo: as 5 últimas entregas estão ${tendencia} pontos acima das 5 anteriores.`
            : tendencia < -2
              ? `Caindo: as 5 últimas entregas estão ${-tendencia} pontos abaixo das 5 anteriores. Veja o erro mais comum.`
              : 'Estável nas últimas 10 entregas.',
    },
    {
      id: 'tipos',
      rotulo: 'Pior tipo de diagrama',
      valor: pior ? `${pior.curto} (${pior.media}%)` : '—',
      titulo: 'Nota média por tipo de diagrama',
      grafico: { tipo: 'barras', barras: tipos.map((t) => ({ rotulo: t.curto, valor: t.media ?? 0 })), unidade: '%', destaque: pior ? tipos.indexOf(pior) : null },
      vazio: jogados.length ? null : semEntregas,
      dica: pior
        ? jogados.length < TIPOS.length
          ? `Você ainda não entregou ${TIPOS.filter((t) => !tipos.find((x) => x.id === t.id).n).map((t) => t.nome.toLowerCase()).join(' nem ')}.`
          : `Treine ${pior.nome.toLowerCase()}: o Guia tem um exemplo pronto, peça por peça.`
        : null,
    },
    {
      id: 'erros',
      rotulo: 'Erro mais comum',
      valor: maisComum ? maisComum.curto : '—',
      titulo: 'Erros que mais aparecem no feedback',
      grafico: { tipo: 'barras', barras: erros.slice(0, 5).map(([tipo, q]) => ({ rotulo: ERROS[tipo].curto, valor: q })), destaque: 0 },
      vazio: erros.length ? null : e.entregues ? 'Nenhum erro até agora. Perfeito!' : semEntregas,
      dica: maisComum ? `${maisComum.nome}: ${maisComum.conselho}` : null,
    },
    {
      id: 'niveis',
      rotulo: 'Nota por dificuldade',
      valor: niveis.filter((n) => n.n).map((n) => `${n.nome[0]} ${n.media}%`).join(' · ') || '—',
      titulo: 'Nota média por dificuldade do pedido',
      grafico: { tipo: 'barras', barras: niveis.map((n) => ({ rotulo: n.nome, valor: n.media ?? 0 })), unidade: '%' },
      vazio: niveis.some((n) => n.n) ? null : semEntregas,
      dica: (() => {
        const d = niveis.find((n) => n.id === 'dificil');
        if (!d.n) return 'Os difíceis pagam mais: aparecem na campanha a partir do dia 18.';
        return d.media < 60 ? 'Nos difíceis, uma dica comprada pode valer mais do que errar a estrutura.' : 'Você vai bem até nos difíceis.';
      })(),
    },
    {
      id: 'prazo',
      rotulo: 'Entregas no prazo',
      valor: finalizados ? `${pct(noPrazo, finalizados)}%` : '—',
      titulo: 'Como os pedidos terminaram',
      grafico: {
        tipo: 'barras',
        barras: [
          { rotulo: 'No prazo', valor: noPrazo },
          { rotulo: 'Atrasados', valor: atrasados },
          { rotulo: 'Recusados', valor: e.recusados },
          { rotulo: 'Foram embora', valor: expirados },
        ],
      },
      vazio: finalizados ? null : 'Nenhum pedido finalizado ainda.',
      dica:
        expirados > e.recusados && expirados > 0
          ? 'Clientes indo embora custam multa: responda (aceite ou recuse) os e-mails logo; clicar no pop-up leva direto ao pedido.'
          : atrasados > noPrazo / 3
            ? 'Muitas entregas atrasadas: cada 30 s de atraso tira 10%. O café deixa o relógio mais lento.'
            : finalizados
              ? 'Bom ritmo: a maior parte sai no prazo.'
              : null,
    },
    {
      id: 'tempo',
      rotulo: 'Tempo médio por pedido',
      valor: tempoMedio == null ? '—' : tempoTexto(tempoMedio),
      titulo: 'Tempo médio por tipo de diagrama (segundos)',
      grafico: { tipo: 'barras', barras: tipos.map((t) => ({ rotulo: t.curto, valor: Math.round(t.tempo ?? 0) })) },
      vazio: jogados.length ? null : semEntregas,
      dica: jogados.length ? `Você leva mais tempo em ${jogados.reduce((a, b) => (b.tempo > a.tempo ? b : a)).nome.toLowerCase()}.` : null,
    },
    {
      id: 'lucro',
      rotulo: 'Lucro (ganhos − gastos)',
      valor: `${lucro < 0 ? '−' : ''}R$ ${Math.abs(lucro)}`,
      titulo: `Ganhos (R$ ${e.ganhoTotal}) e para onde foi o dinheiro`,
      grafico: { tipo: 'barras', barras: [{ rotulo: 'Ganhos', valor: e.ganhoTotal }, ...saidas], unidade: 'R$', destaque: 0 },
      vazio: e.ganhoTotal || gastoTotal ? null : semEntregas,
      dica: gastoTotal ? `O maior gasto é ${maiorGasto.rotulo.toLowerCase()} (R$ ${maiorGasto.valor}).` : null,
    },
    {
      id: 'dicas',
      rotulo: 'Pedaços de dica comprados',
      valor: e.pedacos ?? 0,
      titulo: 'Nota média com e sem dica',
      grafico: { tipo: 'barras', barras: [{ rotulo: 'Com dica', valor: comDica ?? 0 }, { rotulo: 'Sem dica', valor: semDica ?? 0 }], unidade: '%' },
      vazio: comDica != null || semDica != null ? null : semEntregas,
      dica:
        comDica == null
          ? 'Você ainda não comprou dicas. Cada pedaço revela parte da resposta (e o seguinte fica mais caro).'
          : semDica == null || comDica - semDica > 10
            ? `As dicas estão rendendo: ${comDica}% com dica contra ${semDica ?? '—'}% sem.`
            : `Com dica você tira ${comDica}% e sem dica ${semDica}%: talvez não valha o preço (R$ ${g.dicas ?? 0} gastos).`,
    },
    {
      id: 'calendario',
      rotulo: 'Campanha',
      valor: `${diasConcluidos}/${DIAS_CAMPANHA} dias${fds ? ` · ${fds} fds` : ''}`,
      titulo: 'Desempenho em cada dia da campanha',
      grafico: { tipo: 'dias', dias: Array.from({ length: DIAS_CAMPANHA }, (_, i) => ({ dia: i + 1, media: concluidos[i + 1]?.media ?? null })) },
      vazio: null,
      dica: (() => {
        const fracos = Object.entries(concluidos).filter(([, c]) => c.media < 70).map(([d]) => d);
        return fracos.length ? `Os dias ${fracos.join(', ')} ficaram abaixo de 70% (bronze): jogar de novo pode trocar a medalha.` : diasConcluidos ? 'Todos os dias concluídos estão com prata ou ouro.' : 'Conclua o dia 1 para começar.';
      })(),
    },
    {
      id: 'colecao',
      rotulo: 'Coleção',
      valor: `${desbloqueados.length}/${TODOS_MODELOS.length}`,
      titulo: 'Medalhas da coleção de pedidos',
      grafico: {
        tipo: 'barras',
        barras: [...MEDALHAS.map((m) => ({ rotulo: m.nome, valor: porMedalha[m.id] })), { rotulo: 'Faltam', valor: TODOS_MODELOS.length - desbloqueados.length }],
        destaque: 0,
      },
      vazio: desbloqueados.length ? null : 'Entregue pedidos para desbloquear a coleção.',
      dica: semOuro ? `${semOuro} pedido(s) da coleção ainda sem ouro (95%+): entregue de novo para melhorar.` : desbloqueados.length ? 'Todos os pedidos entregues estão com ouro!' : 'Entregue pedidos para desbloquear a coleção.',
    },
  ];
}
