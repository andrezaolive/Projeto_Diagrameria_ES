import { urlDoFundo } from './spritesFundos.js';
import OBJETOS from '../art/objetos.json';
import { chaveSprite, membrosDoGrupo, metaDe, podeDeitar } from '../lib/decoracao.js';
import { arquivoDoPremio, conquistaDoObjeto, objetoDaConquista } from '../art/conquistas.js';
import { spriteDoArquivo } from './premios.js';
import { urlDoObjeto } from './spritesObjetos.js';
import { ITENS_AVATAR } from '../lib/avatar.js';

export { spriteDoArquivo };

// Sprites dos objetos do escritório, gerados por scripts/gen-assets.mjs (trocam na hora no dev:
// data/spritesObjetos.js)
// prêmio de conquista: PNG editável de assets/conquistas/ (data/premios.js)
export const spriteObjeto = (nome) => {
  const cq = conquistaDoObjeto(nome);
  return cq ? spriteDoArquivo(arquivoDoPremio(cq)) : urlDoObjeto(nome);
};
// { x, y, w, h, zona } em pixels de arte; zona = mesa | parede | fixo
export const metaObjeto = (nome) => OBJETOS[nome];

// Objetos que já vêm no escritório e não estão à venda (livros e vasinho ficam na estante)
export const OBJETOS_BASE = [
  // sala de exposição (nasce lá: metadado `sala` no gerador); os outros da sala estão à venda (aba Sala)
  'porta-retrato',
  'album-conquistas', // livro de conquistas: clicar abre a lista (ver Escritorio.jsx)
  'caneca',
  'papeis',
  'calendario-mesa', // clicar mostra o calendário da campanha (Escritorio.jsx)
  'postit-amarelo',
  'postit-rosa',
  'postit-menta',
  'postit-azul',
  ...Object.keys(OBJETOS).filter((n) => n.startsWith('livro-') && !OBJETOS[n].variante),
  'vaso-estante',
];

// Livros (e o que mais tiver variante "-deitado") podem girar entre em pé e deitado
export { podeDeitar, metaDe };
export const spriteDe = (nome, deitado = false) => spriteObjeto(chaveSprite(nome, deitado));

// `img` é lida na hora (getter): o PNG editado no `npm run dev` aparece sem recarregar a página
const fundo = (id, nome, preco) => ({ id: `fundo-${id}`, categoria: 'fundo', nome, preco, get img() { return urlDoFundo(id); } });
const obj = (nome, rotulo, preco) => ({
  id: `obj-${nome}`,
  categoria: OBJETOS[nome].zona === 'mesa' ? 'mesa' : 'parede',
  nome: rotulo,
  preco,
  objeto: nome,
  get img() {
    return spriteObjeto(nome);
  },
});

export const ITENS_LOJA = [
  fundo('por-do-sol', 'Pôr do sol', 0),
  fundo('noite-chuvosa', 'Noite chuvosa', 380),
  fundo('campo-lavanda', 'Campo de lavanda', 500),
  fundo('aurora', 'Aurora', 620),
  fundo('grade-neon', 'Grade neon', 550),
  fundo('planetas', 'Planetas pastel', 650),
  fundo('cerejeiras', 'Cerejeiras', 1000),

  obj('vela', 'Vela aromática', 130),
  obj('pato', 'Pato de borracha', 150),
  obj('cacto', 'Cacto', 180),
  obj('planta', 'Planta', 200),
  // a pilha vira 4 livros separados na mesa (objetos do grupo obj-livros)
  { ...obj('livros', 'Pilha de livros', 230), objetos: membrosDoGrupo('obj-livros') },
  // o pote vem com 10 canetas, cada uma um objeto (grupo obj-canetas)
  { ...obj('canetas', 'Pote de canetas', 150), objetos: membrosDoGrupo('obj-canetas') },
  obj('abajur', 'Abajur', 250),
  obj('fone', 'Fone de ouvido', 350),
  obj('radio', 'Toca-fitas', 450),
  obj('gato', 'Gato', 1500),
  // aba Café: a cafeteira (as cápsulas ficam em data/cafe.js, compradas uma a uma)
  { ...obj('cafeteira', 'Cafeteira', 300), categoria: 'cafe' },
  // aba Sala: decoração que vai para a sala de exposição (o lugar padrão é lá: metadado `sala`)
  { ...obj('boneco-mascote', 'Boneco do mascote', 400), categoria: 'sala' },
  { ...obj('globo', 'Globo', 350), categoria: 'sala' },
  { ...obj('discos', 'Discos de vinil', 300), categoria: 'sala' },
  { ...obj('planta-sala', 'Planta grande', 450), categoria: 'sala' },
  { ...obj('vaso-flor', 'Vasinho com flor', 200), categoria: 'sala' },

  obj('relogio', 'Relógio', 280),
  obj('poster', 'Pôster', 300),
  obj('cortica', 'Quadro de cortiça', 330),
  obj('luzinhas', 'Luzinhas', 380),
  obj('neon', 'Lua neon', 1200),
  obj('poster-vaporwave', 'Pôster vaporwave', 250),
  obj('poster-fita', 'Pôster fita cassete', 230),
  obj('poster-gato', 'Pôster gato e lua', 280),

  // aba Avatar: cabelos, roupas e acessórios do avatar (lib/avatar.js; sem objeto no escritório)
  ...ITENS_AVATAR,
];

export const itemPorId = (id) => ITENS_LOJA.find((i) => i.id === id);

// Nome do objeto para o inventário: o da loja, ou o rótulo do objeto-base
export const nomeObjeto = (nome) => ITENS_LOJA.find((i) => i.objeto === nome)?.nome ?? OBJETOS[nome]?.rotulo ?? nome;
// Item da loja correspondente ao objeto (null para os objetos-base)
export const itemDoObjeto = (nome) => ITENS_LOJA.find((i) => i.objeto === nome) ?? null;

// Objetos que um item da loja põe no escritório (a pilha de livros põe 4; os outros, 1)
export const objetosDoItem = (item) => item.objetos ?? (item.objeto ? [item.objeto] : []);

// Objetos que não vêm da loja: os de sempre e os prêmios das conquistas já desbloqueadas
// (broches, medalhas e troféus: art/conquistas.js). Guardados no baú, ficam em escritorio.guardados.
export const objetosDoJogo = (state) => [...OBJETOS_BASE, ...Object.keys(state.conquistas ?? {}).map(objetoDaConquista)];

// Tudo o que está fora do baú, nas duas salas: os do jogo e os itens da loja em uso
export function objetosPresentes(state) {
  const { guardados } = state.escritorio;
  const usados = ITENS_LOJA.filter((i) => i.objeto && state.loja.possui.includes(i.id) && state.loja.moveis.includes(i.id));
  return [...objetosDoJogo(state), ...usados.flatMap(objetosDoItem)].filter((n) => !guardados.includes(n));
}
