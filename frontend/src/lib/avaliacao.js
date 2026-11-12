// Compara o diagrama do jogador com o gabarito do pedido.
import { normalizarMult } from './multiplicidade.js';
import { foraDoLugar } from './grid.js';
import { avaliarMembros } from './membros.js';
// O sistema (fronteira) conta como elemento: tipo e nome (o e-mail diz como ele se chama)
export const TIPOS_AVALIADOS = ['ator', 'casoDeUso', 'classe', 'sistema', 'estadoInicial', 'estado', 'estadoFinal', 'decisao'];

// Transição (diagrama de estados): vale com o evento certo; associação não tem sentido
export const chaveRelacao = (tipo, a, b, evento) => {
  if (tipo === 'associacao') return `${tipo}|${[a, b].sort().join('|')}`;
  if (tipo === 'transicao') return `${tipo}|${a}|${b}|${normalizarEvento(evento)}`;
  return `${tipo}|${a}|${b}`;
};

// Fronteira do sistema (só em pedidos cujo gabarito tem sistema): fração dos casos de uso do jogador
// que estão dentro de um sistema + atores que estão fora. null = o pedido não cobra fronteira.
export function avaliarFronteira(jogador, esperado) {
  if (!esperado.nodes.some((n) => n.tipo === 'sistema')) return null;
  const conferidos = jogador.nodes.filter((n) => n.tipo === 'casoDeUso' || n.tipo === 'ator');
  if (!conferidos.length) return 0;
  const temSistema = jogador.nodes.some((n) => n.tipo === 'sistema');
  // sem sistema nenhum: os casos de uso estão todos fora (atores, por definição, também estão fora)
  const errados = temSistema ? foraDoLugar(jogador.nodes).length : conferidos.filter((n) => n.tipo === 'casoDeUso').length;
  return (conferidos.length - errados) / conferidos.length;
}

export const normalizar = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
// Evento/condição da transição: os colchetes da condição são opcionais ("[sim]" = "sim")
export const normalizarEvento = (s = '') => normalizar(s.replace(/[[\]]/g, ' '));

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
  const chave = (nodes, ed) => chaveRelacao(ed.tipo, rot(nodes, ed.de), rot(nodes, ed.para), ed.rotulo);
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

  const fronteira = avaliarFronteira(jogador, esperado);
  const membros = avaliarMembros(jogador, esperado);
  const nota = calcularNota({ estrutura, rotulos, relacoes, multiplicidades, fronteira, membros });
  return { nota, estrutura, rotulos, relacoes, multiplicidades, fronteira, membros };
}

// Pesos: base 40/30/30 (estrutura/nomes/relações). Cada extra cobrado pelo pedido entra com o seu
// peso e a base encolhe na mesma proporção: multiplicidade ou sistema 15% (35/25/25 + 15 na prática),
// atributos e métodos 30% (28/21/21 + 30).
export const PESO_EXTRA = { multiplicidades: 0.15, fronteira: 0.15, membros: 0.3 };
export function calcularNota(partes) {
  const extras = Object.keys(PESO_EXTRA).filter((k) => partes[k] != null);
  const pesoExtras = extras.reduce((t, k) => t + PESO_EXTRA[k], 0);
  const base = 0.4 * partes.estrutura + 0.3 * partes.rotulos + 0.3 * partes.relacoes;
  const extra = extras.reduce((t, k) => t + PESO_EXTRA[k] * partes[k], 0);
  return Math.round(100 * ((1 - pesoExtras) * base + extra));
}

export function pagamento(recompensa, nota, atrasado) {
  return Math.round(recompensa * (nota / 100) * (atrasado ? 0.5 : 1));
}
