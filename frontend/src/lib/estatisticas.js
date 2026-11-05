import { DIAS_CAMPANHA, ITENS_INICIAIS } from '../state/reducer.js';
import { ITENS_LOJA } from '../data/loja.js';
import { REACOES, reacaoMascote } from './mascote.js';

// Gráficos (dados puros; o desenho fica em components/Grafico.jsx):
//   { tipo: 'barras', barras: [{ rotulo, valor }], unidade? }
//   { tipo: 'linha', pontos: [n...], referencia?: { valor, rotulo }, destaque?: indice, unidade?, min?, max? }
//   { tipo: 'dias', dias: [{ dia, media|null }] }
// `vazio` explica por que ainda não há o que mostrar.

const CATEGORIAS = { fundo: 'Fundos', mesa: 'Mesa', parede: 'Parede' };
const FAIXAS = ['espatifado', 'triste', 'neutro', 'feliz', 'comemorando'];

export function resumoEstatisticas(state) {
  const e = state.estatisticas;
  const notas = e.historico.map((h) => h.nota);
  const semEntregas = 'Entregue um pedido para ver o gráfico.';

  const comprados = state.loja.possui.filter((id) => !ITENS_INICIAIS.includes(id));
  const porCategoria = Object.fromEntries(Object.keys(CATEGORIAS).map((c) => [c, 0]));
  for (const id of comprados) {
    const cat = ITENS_LOJA.find((i) => i.id === id)?.categoria;
    if (cat in porCategoria) porCategoria[cat]++;
  }

  const concluidos = state.campanha.concluidos;
  const diasConcluidos = Object.keys(concluidos).length;
  const media = e.entregues ? Math.round(e.somaNotas / e.entregues) : null;

  let acumulado = 0;
  const ganhoAcumulado = e.historico.map((h) => (acumulado += h.valor));

  const porFaixa = Object.fromEntries(FAIXAS.map((f) => [f, 0]));
  for (const n of notas) porFaixa[reacaoMascote(n)]++;

  const expirados = e.expirados ?? 0;
  const totalFinalizados = e.entregues + e.recusados + expirados;
  const finalizados = {
    tipo: 'barras',
    barras: [
      { rotulo: 'Entregues', valor: e.entregues },
      { rotulo: 'Recusados', valor: e.recusados },
      { rotulo: 'Foram embora', valor: expirados },
    ],
  };

  return [
    {
      id: 'jogos',
      rotulo: 'Jogos jogados',
      valor: e.jogos,
      titulo: 'Jogos por modo',
      grafico: { tipo: 'barras', barras: [{ rotulo: 'Campanha', valor: e.jogosPorModo.campanha }, { rotulo: 'Infinito', valor: e.jogosPorModo.infinito }] },
      vazio: e.jogos ? null : 'Comece um jogo para ver o gráfico.',
    },
    {
      id: 'entregues',
      rotulo: 'Pedidos entregues',
      valor: e.entregues,
      titulo: 'Como os pedidos terminaram',
      grafico: finalizados,
      vazio: totalFinalizados ? null : 'Nenhum pedido finalizado ainda.',
    },
    {
      id: 'recusados',
      rotulo: 'Pedidos recusados',
      valor: e.recusados,
      titulo: 'Como os pedidos terminaram',
      grafico: finalizados,
      vazio: totalFinalizados ? null : 'Nenhum pedido finalizado ainda.',
    },
    {
      id: 'expirados',
      rotulo: 'Clientes que foram embora',
      valor: expirados,
      titulo: 'Como os pedidos terminaram',
      grafico: finalizados,
      vazio: totalFinalizados ? null : 'Nenhum pedido finalizado ainda.',
    },
    {
      id: 'media',
      rotulo: 'Média de acerto',
      valor: media === null ? '—' : `${media}%`,
      titulo: `Nota das últimas ${notas.length} entregas`,
      grafico: { tipo: 'linha', pontos: notas, min: 0, max: 100, unidade: '%', referencia: media === null ? null : { valor: media, rotulo: `média ${media}%` } },
      vazio: notas.length ? null : semEntregas,
    },
    {
      id: 'melhor',
      rotulo: 'Melhor nota',
      valor: e.entregues ? `${e.melhorNota}%` : '—',
      titulo: `Nota das últimas ${notas.length} entregas`,
      grafico: { tipo: 'linha', pontos: notas, min: 0, max: 100, unidade: '%', destaque: notas.length ? notas.lastIndexOf(Math.max(...notas)) : null },
      vazio: notas.length ? null : semEntregas,
    },
    {
      id: 'excelentes',
      rotulo: 'Entregas excelentes (85%+)',
      valor: e.excelentes,
      titulo: 'Entregas por reação do mascote',
      grafico: { tipo: 'barras', barras: FAIXAS.map((f) => ({ rotulo: REACOES[f].rotulo, valor: porFaixa[f] })), destaque: FAIXAS.length - 1 },
      vazio: notas.length ? null : semEntregas,
    },
    {
      id: 'itens',
      rotulo: 'Itens adquiridos',
      valor: comprados.length,
      titulo: 'Itens por categoria',
      grafico: { tipo: 'barras', barras: Object.entries(CATEGORIAS).map(([c, rotulo]) => ({ rotulo, valor: porCategoria[c] })) },
      vazio: comprados.length ? null : 'Compre algo na lojinha para ver o gráfico.',
    },
    {
      id: 'calendario',
      rotulo: 'Progresso no calendário',
      valor: `${diasConcluidos}/${DIAS_CAMPANHA} dias (${Math.round((diasConcluidos / DIAS_CAMPANHA) * 100)}%)`,
      titulo: 'Nota média por dia da campanha',
      grafico: { tipo: 'dias', dias: Array.from({ length: DIAS_CAMPANHA }, (_, i) => ({ dia: i + 1, media: concluidos[i + 1]?.media ?? null })) },
      vazio: null,
    },
    {
      id: 'multas',
      rotulo: 'Multas pagas',
      valor: `R$ ${e.multas ?? 0}`,
      titulo: 'Como os pedidos terminaram',
      grafico: finalizados,
      vazio: totalFinalizados ? null : 'Nenhum pedido finalizado ainda.',
    },
    {
      id: 'ganho',
      rotulo: 'Total ganho',
      valor: `R$ ${e.ganhoTotal}`,
      titulo: `Ganho acumulado (últimas ${ganhoAcumulado.length} entregas)`,
      grafico: { tipo: 'linha', pontos: ganhoAcumulado, min: 0, unidade: 'R$' },
      vazio: ganhoAcumulado.length ? null : semEntregas,
    },
  ];
}
