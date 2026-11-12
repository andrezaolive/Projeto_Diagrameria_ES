import porDoSol from '../assets/scenes/wallpaper-por-do-sol-320x180.png';
import noiteChuvosa from '../assets/scenes/wallpaper-noite-chuvosa-320x180.png';
import campoLavanda from '../assets/scenes/wallpaper-campo-lavanda-320x180.png';
import aurora from '../assets/scenes/wallpaper-aurora-320x180.png';
import OBJETOS from '../art/objetos.json';
import { chaveSprite, membrosDoGrupo, metaDe, podeDeitar } from '../lib/decoracao.js';

// Sprites dos objetos do escritório, gerados por scripts/gen-assets.mjs
const SPRITES = import.meta.glob('../assets/objetos/*.png', { eager: true, import: 'default' });
export const spriteObjeto = (nome) => SPRITES[`../assets/objetos/${nome}.png`];
// { x, y, w, h, zona } em pixels de arte; zona = mesa | parede | fixo
export const metaObjeto = (nome) => OBJETOS[nome];

// Objetos que já vêm no escritório e não estão à venda (livros e vasinho ficam na estante)
export const OBJETOS_BASE = [
  'caneca',
  'papeis',
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

const fundo = (id, nome, preco, img) => ({ id: `fundo-${id}`, categoria: 'fundo', nome, preco, img });
const obj = (nome, rotulo, preco) => ({
  id: `obj-${nome}`,
  categoria: OBJETOS[nome].zona === 'mesa' ? 'mesa' : 'parede',
  nome: rotulo,
  preco,
  objeto: nome,
  img: spriteObjeto(nome),
});

export const ITENS_LOJA = [
  fundo('por-do-sol', 'Pôr do sol', 0, porDoSol),
  fundo('noite-chuvosa', 'Noite chuvosa', 150, noiteChuvosa),
  fundo('campo-lavanda', 'Campo de lavanda', 200, campoLavanda),
  fundo('aurora', 'Aurora', 250, aurora),

  obj('vela', 'Vela aromática', 50),
  obj('pato', 'Pato de borracha', 60),
  obj('cacto', 'Cacto', 70),
  obj('planta', 'Planta', 80),
  // a pilha vira 4 livros separados na mesa (objetos do grupo obj-livros)
  { ...obj('livros', 'Pilha de livros', 90), objetos: membrosDoGrupo('obj-livros') },
  // o pote vem com 10 canetas, cada uma um objeto (grupo obj-canetas)
  { ...obj('canetas', 'Pote de canetas', 60), objetos: membrosDoGrupo('obj-canetas') },
  obj('abajur', 'Abajur', 100),
  obj('fone', 'Fone de ouvido', 140),
  obj('radio', 'Toca-fitas', 180),
  obj('gato', 'Gato', 250),
  // aba Café: a cafeteira (as cápsulas ficam em data/cafe.js, compradas uma a uma)
  { ...obj('cafeteira', 'Cafeteira', 120), categoria: 'cafe' },

  obj('relogio', 'Relógio', 110),
  obj('poster', 'Pôster', 120),
  obj('cortica', 'Quadro de cortiça', 130),
  obj('luzinhas', 'Luzinhas', 150),
  obj('neon', 'Lua neon', 220),
];

export const itemPorId = (id) => ITENS_LOJA.find((i) => i.id === id);

// Nome do objeto para o inventário: o da loja, ou o rótulo do objeto-base
export const nomeObjeto = (nome) => ITENS_LOJA.find((i) => i.objeto === nome)?.nome ?? OBJETOS[nome]?.rotulo ?? nome;
// Item da loja correspondente ao objeto (null para os objetos-base)
export const itemDoObjeto = (nome) => ITENS_LOJA.find((i) => i.objeto === nome) ?? null;

// Objetos que um item da loja põe no escritório (a pilha de livros põe 4; os outros, 1)
export const objetosDoItem = (item) => item.objetos ?? (item.objeto ? [item.objeto] : []);
