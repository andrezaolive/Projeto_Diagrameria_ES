// Pedido de treino do tutorial: depois da apresentação do computador, chega um pedido bem simples
// (sorteado entre os três tipos de diagrama), já aceito, e o editor abre com um passo a passo
// (`TutorialEditor` em apps/Editor.jsx). Cada passo diz o que fazer, destaca onde (`alvo`) e só
// avança quando `feito(diagrama, secao)` vale; o passo mostrado é sempre o primeiro que ainda não
// foi feito (se o jogador desfizer algo, ele volta). O último é entregar.
// O treino paga pouco (RECOMPENSA_TREINO × nota) e não entra na média do dia, na coleção, nas
// estatísticas nem nas conquistas.
import { e, n, t } from './gabarito.js';
import { normalizar } from '../lib/avaliacao.js';
import { foraDoLugar } from '../lib/grid.js';

export const RECOMPENSA_TREINO = 50;

const tem = (d, tipo, rotulo) => d.nodes.some((x) => x.tipo === tipo && (rotulo == null || normalizar(x.rotulo) === normalizar(rotulo)));
const idDe = (d, tipo, rotulo) => d.nodes.find((x) => x.tipo === tipo && normalizar(x.rotulo) === normalizar(rotulo))?.id;
// elemento do tipo no lugar certo (caso de uso dentro do sistema, ator fora)
const noLugar = (d, tipo) => {
  const ruins = new Set(foraDoLugar(d.nodes).map((x) => x.id));
  return d.nodes.some((x) => x.tipo === tipo && !ruins.has(x.id));
};
const liga = (d, tipo, a, b, evento) =>
  Boolean(a && b) &&
  d.edges.some((x) => x.tipo === tipo && ((x.de === a && x.para === b) || (tipo === 'associacao' && x.de === b && x.para === a)) && (evento == null || normalizar((x.rotulo ?? '').replace(/[[\]]/g, '')) === normalizar(evento)));

export const TREINOS = [
  {
    id: 'treino-casos',
    cliente: 'Biblioteca de Treino',
    assunto: 'Treino: casos de uso',
    secao: 'casos',
    tempo: 300,
    recompensa: RECOMPENSA_TREINO,
    corpo: [
      'O sistema se chama "Biblioteca". O "Leitor" usa o sistema para "Pegar livro".',
    ],
    esperado: {
      nodes: [n('s', 'sistema', 'Biblioteca', 220, 40, 320, 220), n('a', 'ator', 'Leitor', 60, 120), n('u', 'casoDeUso', 'Pegar livro', 300, 130)],
      edges: [e('associacao', 'a', 'u')],
    },
    passos: [
      { texto: 'Este é um diagrama de CASOS DE USO (aba "Casos" da paleta). Arraste um "Sistema" da paleta para a área de montagem.', alvo: { paleta: 'sistema' }, feito: (d) => tem(d, 'sistema') },
      { texto: 'Com o sistema selecionado, escreva "Biblioteca" no campo Rótulo, lá em cima.', alvo: { rotulo: true }, feito: (d) => tem(d, 'sistema', 'Biblioteca') },
      { texto: 'Arraste um "Ator" para FORA do sistema (o ator é quem usa o sistema).', alvo: { paleta: 'ator' }, feito: (d) => noLugar(d, 'ator') },
      { texto: 'Dê a ele o nome "Leitor" no campo Rótulo.', alvo: { rotulo: true }, feito: (d) => tem(d, 'ator', 'Leitor') },
      { texto: 'Arraste um "Caso de uso" para DENTRO do sistema (é algo que o sistema faz).', alvo: { paleta: 'casoDeUso' }, feito: (d) => noLugar(d, 'casoDeUso') },
      { texto: 'Dê a ele o nome "Pegar livro".', alvo: { rotulo: true }, feito: (d) => tem(d, 'casoDeUso', 'Pegar livro') },
      {
        texto: 'Clique em "Associação" na paleta e depois clique no Leitor e no Pegar livro para ligar os dois.',
        alvo: { paleta: 'associacao' },
        feito: (d) => liga(d, 'associacao', idDe(d, 'ator', 'Leitor'), idDe(d, 'casoDeUso', 'Pegar livro')),
      },
    ],
  },
  {
    id: 'treino-classes',
    cliente: 'Petshop de Treino',
    assunto: 'Treino: classes',
    secao: 'classes',
    tempo: 300,
    recompensa: RECOMPENSA_TREINO,
    corpo: ['Aqui temos "Animal" e "Cachorro": todo cachorro é um tipo de animal.'],
    esperado: {
      nodes: [n('k1', 'classe', 'Animal', 200, 40), n('k2', 'classe', 'Cachorro', 200, 240)],
      edges: [e('heranca', 'k2', 'k1')],
    },
    passos: [
      { texto: 'Este é um diagrama de CLASSES. Arraste uma "Classe" para a área de montagem.', alvo: { paleta: 'classe' }, feito: (d) => tem(d, 'classe') },
      { texto: 'Com a classe selecionada, escreva "Animal" no campo Rótulo, lá em cima (ou clique no nome dentro da caixa).', alvo: { rotulo: true }, feito: (d) => tem(d, 'classe', 'Animal') },
      { texto: 'Arraste outra "Classe" para a área, embaixo da primeira.', alvo: { paleta: 'classe' }, feito: (d) => d.nodes.filter((x) => x.tipo === 'classe').length >= 2 },
      { texto: 'Dê a ela o nome "Cachorro".', alvo: { rotulo: true }, feito: (d) => tem(d, 'classe', 'Cachorro') },
      {
        texto: 'Cachorro é um tipo de Animal: clique em "Herança" e depois clique no Cachorro e no Animal (nessa ordem).',
        alvo: { paleta: 'heranca' },
        feito: (d) => liga(d, 'heranca', idDe(d, 'classe', 'Cachorro'), idDe(d, 'classe', 'Animal')),
      },
    ],
  },
  {
    id: 'treino-estados',
    cliente: 'Luminária de Treino',
    assunto: 'Treino: estados',
    secao: 'estados',
    tempo: 300,
    recompensa: RECOMPENSA_TREINO,
    corpo: ['A lâmpada começa "Apagada" e, com o evento "ligar", fica "Acesa".'],
    esperado: {
      nodes: [n('i', 'estadoInicial', 'Início', 20, 120), n('e1', 'estado', 'Apagada', 140, 100), n('e2', 'estado', 'Acesa', 420, 100)],
      edges: [t('i', 'e1'), t('e1', 'e2', 'ligar')],
    },
    passos: [
      { texto: 'Este é um diagrama de ESTADOS. Arraste um "Início" (a bolinha preta) para a área: é onde tudo começa.', alvo: { paleta: 'estadoInicial' }, feito: (d) => tem(d, 'estadoInicial') },
      { texto: 'Arraste um "Estado" para a área.', alvo: { paleta: 'estado' }, feito: (d) => tem(d, 'estado') },
      { texto: 'Com o estado selecionado, escreva "Apagada" no campo Rótulo, lá em cima.', alvo: { rotulo: true }, feito: (d) => tem(d, 'estado', 'Apagada') },
      { texto: 'Arraste outro "Estado" para a área.', alvo: { paleta: 'estado' }, feito: (d) => d.nodes.filter((x) => x.tipo === 'estado').length >= 2 },
      { texto: 'Dê a ele o nome "Acesa".', alvo: { rotulo: true }, feito: (d) => tem(d, 'estado', 'Acesa') },
      {
        texto: 'Clique em "Transição" e depois clique no Início e na Apagada: a lâmpada começa apagada.',
        alvo: { paleta: 'transicao' },
        feito: (d) => liga(d, 'transicao', d.nodes.find((x) => x.tipo === 'estadoInicial')?.id, idDe(d, 'estado', 'Apagada')),
      },
      {
        texto: 'Agora clique na Apagada e depois na Acesa para ligar as duas (se a Transição não estiver mais marcada na paleta, clique nela antes).',
        alvo: { paleta: 'transicao' },
        feito: (d) => liga(d, 'transicao', idDe(d, 'estado', 'Apagada'), idDe(d, 'estado', 'Acesa')),
      },
      {
        texto: 'Com essa seta selecionada, escreva o evento "ligar" no campo Evento, lá em cima.',
        alvo: { rotulo: true },
        feito: (d) => liga(d, 'transicao', idDe(d, 'estado', 'Apagada'), idDe(d, 'estado', 'Acesa'), 'ligar'),
      },
    ],
  },
];

export const treinoPorId = (id) => TREINOS.find((x) => x.id === id);
export const ehTreino = (modelo) => Boolean(modelo?.id?.startsWith('treino-'));

const NOME_DA_SECAO = { casos: 'Casos', classes: 'Classes', estados: 'Estados' };

// Passo atual do treino: na aba errada da paleta, voltar para a do treino; senão o primeiro passo
// ainda não feito; com todos feitos, o de entregar. `n` = número do passo, `total` = quantos são
// (os passos e mais o de entregar)
export const PASSO_ENTREGAR = {
  texto: 'Pronto! Aperte "Entregar". Depois chegam os clientes de verdade: clique no aviso do canto da tela para abrir cada um.',
  alvo: { entregar: true },
};
export function passoDoTreino(treino, diagrama, secao) {
  const total = treino.passos.length + 1;
  const i = treino.passos.findIndex((p) => !p.feito(diagrama));
  const n = i < 0 ? total : i + 1;
  if (secao !== treino.secao) return { texto: `Este pedido é um diagrama de outro tipo: clique na aba "${NOME_DA_SECAO[treino.secao]}" da paleta.`, alvo: { secao: treino.secao }, n, total };
  return i < 0 ? { ...PASSO_ENTREGAR, n, total } : { ...treino.passos[i], n, total };
}

// Pedido de treino (já aceito; `sorteio` em [0, 1) escolhe o tipo de diagrama)
export function criarPedidoDeTreino(sorteio = 0) {
  const m = TREINOS[Math.min(TREINOS.length - 1, Math.floor(sorteio * TREINOS.length))];
  return {
    id: `${m.id}-1`,
    modelo: m.id,
    cliente: m.cliente,
    assunto: m.assunto,
    recompensa: m.recompensa,
    tempo: m.tempo,
    tempoRestante: m.tempo,
    paciencia: null,
    pacienciaTotal: null,
    status: 'aceito',
    pedacos: [],
    treino: true,
  };
}
