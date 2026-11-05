// Compara o diagrama do jogador com o gabarito do pedido.
import { normalizarMult } from './multiplicidade.js';
export const TIPOS_AVALIADOS = ['ator', 'casoDeUso', 'classe'];

export const normalizar = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

function contar(lista, chave, filtro = () => true) {
  const out = {};
  for (const item of lista) if (filtro(item)) out[item[chave]] = (out[item[chave]] || 0) + 1;
  return out;
}

// Proporção min/max por tipo; tipos ausentes nos dois lados não contam
function similaridade(a, b) {
  const tipos = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (tipos.size === 0) return 1;
  let soma = 0;
  for (const t of tipos) {
    const x = a[t] || 0, y = b[t] || 0;
    soma += Math.min(x, y) / Math.max(x, y);
  }
  return soma / tipos.size;
}

export function avaliar(jogador, esperado) {
  const avaliado = (n) => TIPOS_AVALIADOS.includes(n.tipo);
  const nosJ = jogador.nodes.filter(avaliado);
  const nosE = esperado.nodes.filter(avaliado);

  const estrutura =
    (similaridade(contar(nosJ, 'tipo'), contar(nosE, 'tipo')) +
      similaridade(contar(jogador.edges, 'tipo'), contar(esperado.edges, 'tipo'))) / 2;

  // Rótulos: cada elemento esperado casa com no máximo um do jogador
  const livres = [...nosJ];
  let rotulosOk = 0;
  for (const ne of nosE) {
    const i = livres.findIndex((nj) => nj.tipo === ne.tipo && normalizar(nj.rotulo) === normalizar(ne.rotulo));
    if (i >= 0) { rotulosOk++; livres.splice(i, 1); }
  }
  const rotulos = nosE.length ? rotulosOk / nosE.length : 1;

  // Relações: mesmo tipo e mesmas pontas (pelos rótulos); associação vale nos dois sentidos
  const rot = (nodes, id) => normalizar(nodes.find((x) => x.id === id)?.rotulo);
  const chave = (nodes, ed) => {
    const a = rot(nodes, ed.de), b = rot(nodes, ed.para);
    const [p, q] = ed.tipo === 'associacao' ? [a, b].sort() : [a, b];
    return `${ed.tipo}|${p}|${q}`;
  };
  const restantes = jogador.edges.map((ed) => ({ ed, k: chave(jogador.nodes, ed) }));
  let relOk = 0;
  // Multiplicidades: cada ponta pedida no gabarito vale um ponto, conferida só nas relações certas
  let multTotal = 0, multOk = 0;
  for (const ed of esperado.edges) {
    multTotal += (ed.multDe ? 1 : 0) + (ed.multPara ? 1 : 0);
    const i = restantes.findIndex((r) => r.k === chave(esperado.nodes, ed));
    if (i < 0) continue;
    relOk++;
    const jg = restantes.splice(i, 1)[0].ed;
    // associação pode estar desenhada no outro sentido: alinha as pontas pelos nomes
    const mesmaOrdem = rot(jogador.nodes, jg.de) === rot(esperado.nodes, ed.de);
    const [jDe, jPara] = mesmaOrdem ? [jg.multDe, jg.multPara] : [jg.multPara, jg.multDe];
    if (ed.multDe && normalizarMult(jDe) === normalizarMult(ed.multDe)) multOk++;
    if (ed.multPara && normalizarMult(jPara) === normalizarMult(ed.multPara)) multOk++;
  }
  const relacoes = esperado.edges.length ? relOk / esperado.edges.length : 1;
  // null = o pedido não cobra multiplicidade (a nota segue a fórmula de sempre)
  const multiplicidades = multTotal ? multOk / multTotal : null;

  const nota =
    multiplicidades == null
      ? Math.round(100 * (0.4 * estrutura + 0.3 * rotulos + 0.3 * relacoes))
      : Math.round(100 * (0.35 * estrutura + 0.25 * rotulos + 0.25 * relacoes + 0.15 * multiplicidades));
  return { nota, estrutura, rotulos, relacoes, multiplicidades };
}

export function pagamento(recompensa, nota, atrasado) {
  return Math.round(recompensa * (nota / 100) * (atrasado ? 0.5 : 1));
}
