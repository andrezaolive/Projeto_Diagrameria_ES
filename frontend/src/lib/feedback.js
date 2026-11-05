// Feedback da entrega: explica o que o jogador errou, comparando com o gabarito.
// Segue as mesmas regras da nota (lib/avaliacao.js): nomes sem diferenciar acento/maiúscula,
// associação sem sentido, include/extend/herança/dependência com sentido.
import { TIPOS_AVALIADOS, normalizar } from './avaliacao.js';
import { multIgual, normalizarMult } from './multiplicidade.js';

export const NOME_TIPO = {
  ator: 'ator',
  casoDeUso: 'caso de uso',
  classe: 'classe',
  nota: 'nota',
  sistema: 'sistema',
  associacao: 'associação',
  include: 'include',
  extend: 'extend',
  heranca: 'herança',
  dependencia: 'dependência',
  agregacao: 'agregação',
  composicao: 'composição',
};

// O que é cada conceito, o que faz, e um exemplo (aparece nas dicas quando o conceito esteve num erro)
export const CONCEITOS = {
  ator: {
    titulo: 'Ator',
    texto: 'Alguém (ou outro sistema) de fora que usa o sistema. É desenhado como um boneco e tem nome de papel, no singular.',
    exemplo: 'Cliente, Aluno, Bibliotecário.',
  },
  casoDeUso: {
    titulo: 'Caso de uso',
    texto: 'Uma ação que o sistema oferece a um ator. Fica numa elipse e o nome começa com um verbo.',
    exemplo: '"Emprestar livro", "Fazer pedido".',
  },
  classe: {
    titulo: 'Classe',
    texto: 'Um molde para os objetos do sistema: um substantivo no singular, com atributos e operações. Aparece em diagramas de classes, não nos de casos de uso.',
    exemplo: 'Animal, Turma, Conta.',
  },
  associacao: {
    titulo: 'Associação',
    texto: 'Linha simples, sem seta. Liga um ator ao caso de uso de que ele participa, ou duas classes que se conhecem. Não tem sentido: A–B é igual a B–A.',
    exemplo: 'Aluno — "Consultar acervo".',
  },
  include: {
    titulo: 'Include (inclui)',
    texto: 'O caso base SEMPRE executa o caso incluído. Linha tracejada com «include», saindo do caso base e com a seta no incluído.',
    exemplo: '"Fazer pedido" → «include» → "Pagar": todo pedido passa pelo pagamento.',
  },
  extend: {
    titulo: 'Extend (estende)',
    texto: 'Comportamento OPCIONAL, que só acontece em certas condições. Linha tracejada com «extend», saindo do caso opcional e com a seta no caso base.',
    exemplo: '"Aplicar cupom" → «extend» → "Comprar ingresso": só às vezes há cupom.',
  },
  heranca: {
    titulo: 'Herança (generalização)',
    texto: 'A classe filha "é um tipo de" classe mãe e herda o que ela tem. Linha cheia com triângulo vazado, saindo da filha e apontando para a mãe.',
    exemplo: 'Cachorro → Animal ("Cachorro é um Animal").',
  },
  agregacao: {
    titulo: 'Agregação',
    texto: 'O "todo" reúne partes que continuam existindo sem ele. Linha cheia com losango VAZADO do lado do todo.',
    exemplo: 'Playlist ◇— Música: apagar a playlist não apaga as músicas.',
  },
  composicao: {
    titulo: 'Composição',
    texto: 'O "todo" é feito das partes, e elas não existem sem ele: se o todo some, as partes somem junto. Linha cheia com losango CHEIO do lado do todo.',
    exemplo: 'Pedido ◆— Item: sem o pedido, os itens não existem.',
  },
  multiplicidade: {
    titulo: 'Multiplicidade (1, 0..1, 1..*, 0..*)',
    texto:
      'Diz quantos objetos de um lado se ligam a cada objeto do outro. O número fica na ponta da classe que está sendo contada: ' +
      '1 = exatamente um · 0..1 = no máximo um · 1..* = um ou mais · 0..* (ou *) = zero ou mais. ' +
      'Padrões: 1:1 (País [1] — [1] Capital), 1:* (Departamento [1] — [1..*] Funcionário) e *:* (Filme [0..*] — [1..*] Ator).',
    exemplo: 'Cliente [1] — [1..*] Conta: cada cliente tem uma ou mais contas, e cada conta tem exatamente um cliente.',
  },
  dependencia: {
    titulo: 'Dependência',
    texto: 'Uma classe usa outra de forma passageira (por exemplo, recebe como parâmetro). Linha tracejada com seta aberta, de quem usa para quem é usado.',
    exemplo: 'Relatório ⇢ Impressora.',
  },
};

// ---------------------------------------------------------------- texto
// Distância de edição (Levenshtein) entre dois textos já normalizados
export function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// "Parecido" o bastante para ser erro de digitação (e não outro nome)
export function parecido(a, b) {
  const x = normalizar(a), y = normalizar(b);
  if (!x || !y || x === y) return false;
  return distancia(x, y) <= Math.max(1, Math.floor(Math.max(x.length, y.length) * 0.3));
}

// Compara letra a letra (sem acento/maiúscula) e marca o que difere.
// Devolve { escrito: [{ t, errado }], correto: [{ t, faltou }] } para destacar em vermelho.
export function diferencas(escrito, correto) {
  const base = (c) => normalizar(c) || c;
  const a = [...escrito], b = [...correto];
  const L = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      L[i][j] = base(a[i]) === base(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const okA = new Set(), okB = new Set();
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (base(a[i]) === base(b[j])) okA.add(i++), okB.add(j++);
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  // junta letras vizinhas com o mesmo estado em pedaços
  const pedacos = (letras, ok, chave) =>
    letras.reduce((out, t, i) => {
      const marcado = !ok.has(i) && t.trim() !== '';
      const ult = out.at(-1);
      if (ult && ult[chave] === marcado) ult.t += t;
      else out.push({ t, [chave]: marcado });
      return out;
    }, []);
  return { escrito: pedacos(a, okA, 'errado'), correto: pedacos(b, okB, 'faltou') };
}

// ---------------------------------------------------------------- comparação
const chaveRel = (tipo, a, b) => (tipo === 'associacao' ? `${tipo}|${[a, b].sort().join('|')}` : `${tipo}|${a}|${b}`);
const par = (a, b) => [a, b].sort().join('|');

// Lista de problemas da entrega. Cada problema:
//   { categoria: 'nome' | 'elemento' | 'relacao', tipo, conceitos: [...], ...dados para a tela }
// tipos: grafia, tipoErrado, faltando, sobrando, sentidoInvertido, relacaoTipoErrado, relacaoFaltando, relacaoSobrando
export function gerarFeedback(jogador, esperado) {
  const problemas = [];
  const avaliado = (n) => TIPOS_AVALIADOS.includes(n.tipo);
  const nosE = esperado.nodes.filter(avaliado);
  let livres = jogador.nodes.filter(avaliado);

  // nome "canônico" de cada nó do jogador: o do gabarito quando reconhecemos a quem ele corresponde
  // (mesmo com erro de digitação ou tipo trocado), para os erros de nome não virarem erros de relação também
  const canonico = {};
  const casados = new Map(); // nó do gabarito -> nó do jogador (sem mexer nos dados do gabarito)
  const casar = (filtro) =>
    nosE.forEach((ne) => {
      if (casados.has(ne)) return;
      const i = livres.findIndex((nj) => filtro(nj, ne));
      if (i < 0) return;
      const nj = livres[i];
      livres = livres.filter((_, k) => k !== i);
      casados.set(ne, nj);
      canonico[nj.id] = normalizar(ne.rotulo);
    });

  // 1) iguais  2) mesmo nome, outro tipo  3) mesmo tipo, nome parecido  4) tipo e nome errados, mas parecido
  casar((nj, ne) => nj.tipo === ne.tipo && normalizar(nj.rotulo) === normalizar(ne.rotulo));
  const exatos = new Set(casados.keys());
  casar((nj, ne) => normalizar(nj.rotulo) === normalizar(ne.rotulo));
  casar((nj, ne) => nj.tipo === ne.tipo && parecido(nj.rotulo, ne.rotulo));
  casar((nj, ne) => parecido(nj.rotulo, ne.rotulo));

  for (const ne of nosE) {
    if (exatos.has(ne)) continue;
    const nj = casados.get(ne);
    if (!nj) {
      problemas.push({ categoria: 'elemento', tipo: 'faltando', esperado: ne, conceitos: [ne.tipo] });
      continue;
    }
    const tipoErrado = nj.tipo !== ne.tipo;
    const grafia = normalizar(nj.rotulo) !== normalizar(ne.rotulo);
    if (grafia)
      problemas.push({ categoria: 'nome', tipo: 'grafia', escrito: nj.rotulo, correto: ne.rotulo, diff: diferencas(nj.rotulo, ne.rotulo), conceitos: [] });
    if (tipoErrado)
      problemas.push({ categoria: 'elemento', tipo: 'tipoErrado', rotulo: ne.rotulo, usado: nj.tipo, certo: ne.tipo, conceitos: [nj.tipo, ne.tipo] });
  }
  for (const nj of livres) problemas.push({ categoria: 'elemento', tipo: 'sobrando', jogador: nj, conceitos: [nj.tipo] });

  // relações, pelos nomes canônicos
  const nomeJ = (id) => {
    const n = jogador.nodes.find((x) => x.id === id);
    return n ? canonico[id] ?? normalizar(n.rotulo) : '';
  };
  const nomeE = (id) => normalizar(esperado.nodes.find((x) => x.id === id)?.rotulo);
  const exibir = Object.fromEntries(esperado.nodes.map((n) => [normalizar(n.rotulo), n.rotulo]));
  const rotuloDe = (nomeNormal, original) => exibir[nomeNormal] ?? original ?? nomeNormal;

  let relJ = jogador.edges.map((ed) => {
    const a = nomeJ(ed.de), b = nomeJ(ed.para);
    const orig = (id) => jogador.nodes.find((x) => x.id === id)?.rotulo;
    return { tipo: ed.tipo, a, b, ra: rotuloDe(a, orig(ed.de)), rb: rotuloDe(b, orig(ed.para)), ma: ed.multDe, mb: ed.multPara };
  });
  const relE = esperado.edges.map((ed) => {
    const a = nomeE(ed.de), b = nomeE(ed.para);
    return { tipo: ed.tipo, a, b, ra: rotuloDe(a), rb: rotuloDe(b), ma: ed.multDe, mb: ed.multPara };
  });

  // relação certa: confere a multiplicidade de cada ponta pedida (alinhando associação desenhada ao contrário)
  const conferirMult = (re, rj) => {
    const mesmaOrdem = rj.a === re.a;
    const usadoA = mesmaOrdem ? rj.ma : rj.mb;
    const usadoB = mesmaOrdem ? rj.mb : rj.ma;
    const pontas = [
      // ponta A (lado de "ra"): quantos A existem para cada B
      { esperado: re.ma, usado: usadoA, lado: re.ra, outro: re.rb },
      { esperado: re.mb, usado: usadoB, lado: re.rb, outro: re.ra },
    ];
    for (const pt of pontas)
      if (pt.esperado && !multIgual(pt.esperado, pt.usado))
        problemas.push({
          categoria: 'relacao',
          tipo: 'multiplicidade',
          certa: re,
          lado: pt.lado,
          outro: pt.outro,
          esperado: normalizarMult(pt.esperado),
          usado: normalizarMult(pt.usado),
          conceitos: ['multiplicidade'],
        });
  };

  const pendentes = [];
  for (const re of relE) {
    const i = relJ.findIndex((rj) => chaveRel(rj.tipo, rj.a, rj.b) === chaveRel(re.tipo, re.a, re.b));
    if (i >= 0) {
      conferirMult(re, relJ[i]);
      relJ = relJ.filter((_, k) => k !== i);
    } else pendentes.push(re);
  }
  for (const re of pendentes) {
    // mesmas pontas: sentido invertido ou tipo de relação trocado
    const i = relJ.findIndex((rj) => par(rj.a, rj.b) === par(re.a, re.b));
    if (i >= 0) {
      const rj = relJ[i];
      relJ = relJ.filter((_, k) => k !== i);
      if (rj.tipo === re.tipo) problemas.push({ categoria: 'relacao', tipo: 'sentidoInvertido', certa: re, conceitos: [re.tipo] });
      else problemas.push({ categoria: 'relacao', tipo: 'relacaoTipoErrado', usada: rj, certa: re, conceitos: [rj.tipo, re.tipo] });
    } else {
      problemas.push({ categoria: 'relacao', tipo: 'relacaoFaltando', certa: re, conceitos: [re.tipo] });
    }
  }
  for (const rj of relJ) problemas.push({ categoria: 'relacao', tipo: 'relacaoSobrando', usada: rj, conceitos: [rj.tipo] });

  // conceitos para as dicas (sem repetir, só os que têm explicação)
  const conceitos = [...new Set(problemas.flatMap((p) => p.conceitos))].filter((c) => CONCEITOS[c]);
  return { problemas, conceitos };
}

// Diagrama vazio: não há o que comentar (o botão de feedback não aparece)
export const diagramaVazio = (d) => !d || (d.nodes.length === 0 && d.edges.length === 0);
