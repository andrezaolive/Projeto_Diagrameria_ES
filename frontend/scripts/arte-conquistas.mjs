// Prêmios das conquistas (src/art/conquistas.js), um por conquista, em pixel art:
//   broche (bronze/prata): placa com formato próprio, alfinete em cima e o glifo da conquista no meio
//   medalha (ouro): moeda presa numa fita, com o glifo
//   troféu: taça dourada com alças, haste e pedestal; o tamanho vem da dificuldade
// Cada prêmio vira um objeto do escritório (função `objeto` do gerador). Enquanto a conquista não foi
// desbloqueada, a aba de conquistas mostra só um '?' no lugar do prêmio.
import { Canvas } from './pixel.mjs';
import { CONQUISTAS, arquivoDoPremio, objetoDaConquista } from '../src/art/conquistas.js';
import { SALA } from '../src/art/layout.js';

// Glifos 7x7 ('#' = pixel)
const GLIFOS = {
  check: ['.......', '......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
  estrela: ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'],
  relogio: ['..###..', '.#.#.#.', '#..#..#', '#..##.#', '#.....#', '.#...#.', '..###..'],
  raio: ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....'],
  xicara: ['.#.#...', '#.#....', '######.', '#....##', '#....#.', '.####..', '######.'],
  moeda: ['...#...', '.#####.', '##.#...', '.#####.', '...#.##', '.#####.', '...#...'],
  calendario: ['.#...#.', '#######', '#.....#', '#######', '#.#.#.#', '#.....#', '#######'],
  coracao: ['.......', '.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  chama: ['...#...', '..##...', '..###.#', '.#####.', '##.####', '##..###', '.#####.'],
  classe: ['#######', '#.###.#', '#######', '#.##..#', '#.....#', '#.###.#', '#######'],
  ator: ['..###..', '..###..', '...#...', '#######', '...#...', '..#.#..', '.#...#.'],
  estado: ['.##....', '#..#...', '#..####', '.##..#.', '.....#.', '....###', '....###'],
  chave: ['.###...', '#...#..', '#...#..', '.###...', '...#...', '...##..', '...##..'],
  globo: ['..###..', '.#.#.#.', '#######', '#..#..#', '#######', '.#.#.#.', '..###..'],
  quebra: ['...##..', '.#####.', '.#...##', '##...##', '.#...#.', '.#####.', '.......'],
  casa: ['...#...', '..###..', '.#####.', '#######', '.#...#.', '.#.#.#.', '.#.#.#.'],
  planta: ['.##.##.', '#..#..#', '.#.#.#.', '..###..', '...#...', '.#####.', '..###..'],
  porta: ['.#####.', '.#...#.', '.#...#.', '.#..##.', '.#...#.', '.#...#.', '#######'],
  foto: ['..##...', '#######', '#..#..#', '#.###.#', '#..#..#', '#######', '.......'],
  nota: ['..#####', '..#...#', '..#...#', '..#...#', '###.###', '###.###', '.......'],
  livro: ['.##.##.', '#..#..#', '#..#..#', '#..#..#', '#..#..#', '.######', '.......'],
  infinito: ['.......', '.##.##.', '#..#..#', '#..#..#', '.##.##.', '.......', '.......'],
  maleta: ['..###..', '..#.#..', '#######', '#.....#', '#######', '#.....#', '#######'],
  seta: ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'],
  xis: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
  repetir: ['..###.#', '.#...##', '#...###', '#......', '#.....#', '.#...#.', '..###..'],
  torre: ['..##...', '..##...', '.####..', '.####..', '######.', '######.', '.......'],
};

function glifo(c, nome, x, y, cor) {
  const g = GLIFOS[nome];
  if (!g) throw new Error(`Glifo desconhecido: ${nome}`);
  g.forEach((linha, j) => [...linha].forEach((ch, i) => ch === '#' && c.px(x + i, y + j, cor)));
}

// Formatos das placas dos broches: dentro(dx, dy, r), com dx/dy a partir do centro (centro do pixel)
const FORMATOS = {
  redondo: (dx, dy, r) => Math.hypot(dx, dy) <= r + 0.3,
  hexagono: (dx, dy, r) => Math.abs(dy) <= r * 0.9 && Math.abs(dx) + Math.abs(dy) * 0.55 <= r + 0.3,
  escudo: (dx, dy, r) => (dy <= 1 ? Math.abs(dx) <= r && dy >= -r : Math.abs(dx) <= (r + 0.4) * (1 - (dy - 1) / (r - 0.5))),
  flor: (dx, dy, r) => Math.hypot(dx, dy) <= r - 0.4 + 0.7 * Math.cos(6 * Math.atan2(dy, dx)),
  octogono: (dx, dy, r) => Math.abs(dx) <= r && Math.abs(dy) <= r && Math.abs(dx) + Math.abs(dy) <= r * 1.45,
  losango: (dx, dy, r) => Math.abs(dx) + Math.abs(dy) <= r + 1.2,
};
const FORMATOS_BRONZE = ['redondo', 'flor', 'hexagono', 'escudo'];
const FORMATOS_PRATA = ['octogono', 'escudo', 'losango', 'hexagono', 'redondo'];
const FITAS = [['rose', 'blush'], ['sky', 'mist'], ['mint', 'cream'], ['orchid', 'lilac'], ['peach', 'butter'], ['violet', 'lavender']];

// Placa com contorno, brilho em cima à esquerda, sombra embaixo à direita e o glifo no meio
function placa(c, cx, cy, r, dentro, metal, nomeGlifo) {
  const m = (k) => `${metal}-${k}`;
  const em = (x, y) => dentro(x + 0.5 - (cx + 0.5), y + 0.5 - (cy + 0.5), r);
  for (let y = cy - r - 2; y <= cy + r + 2; y++)
    for (let x = cx - r - 2; x <= cx + r + 2; x++) {
      if (!em(x, y)) continue;
      const borda = !em(x - 1, y) || !em(x + 1, y) || !em(x, y - 1) || !em(x, y + 1);
      const dx = x - cx, dy = y - cy;
      c.px(x, y, borda ? 'ink' : dx + dy < -r * 0.7 ? m('brilho') : dx + dy > r * 0.7 ? m('sombra') : m('base'));
    }
  glifo(c, nomeGlifo, cx - 3, cy - 3, m('numero'));
}

// Alfinete do quadro de broches (cabeça redonda em cima do prêmio)
function alfinete(c, x, y, cor = 'rose') {
  c.rect(x - 1, y - 1, 3, 3, 'ink');
  c.px(x, y - 2, 'ink');
  c.px(x, y, cor);
  c.px(x - 1, y - 1, cor);
  c.px(x, y - 1, 'cream');
}

function desenharBroche(c, cq, i, x, y) {
  const prata = cq.raridade === 'prata';
  const r = prata ? 8 : 7;
  const formatos = prata ? FORMATOS_PRATA : FORMATOS_BRONZE;
  const cx = x + r, cy = y + r + 2;
  placa(c, cx, cy, r, FORMATOS[formatos[i % formatos.length]], prata ? 'prata' : 'bronze', cq.glifo);
  alfinete(c, cx, y + 1, ['rose', 'sky', 'mint', 'butter'][i % 4]);
}

function desenharMedalha(c, cq, i, x, y) {
  const [fita, listra] = FITAS[i % FITAS.length];
  const cx = x + 7;
  // fita em V até a moeda
  for (let j = 0; j < 9; j++) {
    c.px(cx - 4, y + j, 'ink');
    c.rect(cx - 3, y + j, 7, 1, fita);
    c.px(cx, y + j, listra);
    c.px(cx + 4, y + j, 'ink');
  }
  c.hline(cx - 4, cx + 4, y, 'ink');
  placa(c, cx, y + 15, 7, FORMATOS.redondo, 'ouro', cq.glifo);
  alfinete(c, cx, y + 1, 'butter');
}

// Troféus: [largura, altura] em pixels de arte, pela dificuldade
export const TAMANHOS_TROFEU = { p: [11, 14], m: [15, 19], g: [19, 24], gg: [23, 29], mestre: [27, 32] };

function desenharTrofeu(c, cq, x, base) {
  const [w, h] = TAMANHOS_TROFEU[cq.tamanho];
  const hb = Math.max(3, Math.round(h * 0.2)); // pedestal
  const hs = Math.max(2, Math.round(h * 0.14)); // haste
  const hc = h - hb - hs; // taça
  const y0 = base - h;
  const cx = x + Math.floor(w / 2);
  const wc = w - (w >= 15 ? 6 : 4); // a taça (as alças ocupam 2 ou 3 px de cada lado)
  const larguraEm = (t) => Math.max(3, Math.round(wc * (1 - 0.6 * t * t)));
  // alças: argola presa na borda e no meio da taça (com o furo transparente entre ela e a taça)
  const ah = Math.max(3, Math.round(hc * 0.5));
  const grossa = w >= 15;
  for (const lado of [-1, 1]) {
    const fora = lado < 0 ? x : x + w - 1;
    const meio = fora - lado; // segunda coluna da alça
    c.hline(fora, fora - lado * 2, y0 + 1, 'ink');
    // embaixo, a alça vai até encostar na taça (que ali já é mais estreita)
    const lw = larguraEm((2 + ah) / Math.max(1, hc - 1));
    const x1 = cx - Math.floor(lw / 2);
    c.hline(fora, lado < 0 ? x1 - 1 : x1 + lw, y0 + 2 + ah, 'ink');
    c.vline(fora, y0 + 1, y0 + 2 + ah, 'ink');
    if (grossa) c.vline(meio, y0 + 2, y0 + 1 + ah, lado < 0 ? 'ouro-brilho' : 'ouro-sombra');
  }
  // taça
  for (let j = 0; j < hc; j++) {
    const lw = larguraEm(j / Math.max(1, hc - 1));
    const x1 = cx - Math.floor(lw / 2), x2 = x1 + lw - 1;
    for (let xx = x1; xx <= x2; xx++) {
      const borda = xx === x1 || xx === x2 || j === 0 || j === hc - 1;
      c.px(xx, y0 + j, borda ? 'ink' : xx <= x1 + 1 ? 'ouro-brilho' : xx >= x2 - 1 ? 'ouro-sombra' : 'ouro-base');
    }
  }
  c.hline(cx - Math.floor(wc / 2) + 1, cx - Math.floor(wc / 2) + wc - 2, y0 + 1, 'ouro-brilho');
  // glifo na taça (troféus médios para cima); no pequeno, uma estrelinha
  if (w >= 15) glifo(c, cq.glifo, cx - 3, y0 + 2 + Math.max(0, Math.floor((hc - 9) / 2)), 'ouro-numero');
  else {
    c.px(cx, y0 + 3, 'ouro-numero');
    c.hline(cx - 1, cx + 1, y0 + 4, 'ouro-numero');
    c.px(cx, y0 + 5, 'ouro-numero');
  }
  // haste
  const sw = w >= 19 ? 4 : w >= 15 ? 3 : 2;
  const sx = cx - Math.floor(sw / 2);
  c.rect(sx - 1, y0 + hc, sw + 2, hs, 'ink');
  c.rect(sx, y0 + hc, sw, hs, 'ouro-base');
  c.px(sx, y0 + hc, 'ouro-brilho');
  c.hline(sx - 1, sx + sw, y0 + hc + hs - 1, 'ink');
  // pedestal de madeira, com plaquinha dourada nos maiores e uma pedra no mestre
  const wp = Math.max(7, Math.round(w * 0.8));
  const px0 = cx - Math.floor(wp / 2);
  c.box(px0, base - hb, wp, hb, 'grape');
  c.hline(px0 + 1, px0 + wp - 2, base - hb + 1, 'violet');
  if (w >= 19) {
    c.rect(px0 + 3, base - hb + 2, wp - 6, Math.max(1, hb - 4), 'ouro-base');
    c.hline(px0 + 3, px0 + wp - 4, base - hb + 2, 'ouro-brilho');
  }
  if (cq.tamanho === 'mestre') {
    c.rect(cx - 1, y0 - 3, 3, 3, 'ink');
    c.px(cx, y0 - 2, 'rose');
    for (const [sx2, sy2] of [[x - 2, y0 + 3], [x + w + 1, y0 + 6], [x - 1, y0 + 12]]) {
      c.px(sx2, sy2, 'butter');
      c.px(sx2 - 1, sy2, 'cream'); c.px(sx2 + 1, sy2, 'cream'); c.px(sx2, sy2 - 1, 'cream'); c.px(sx2, sy2 + 1, 'cream');
    }
  }
}

// `objeto(id, zona, draw, extra, opcoes)` do gerador devolve { sprite }; OUT = pasta src/assets/
// Os PNGs dos prêmios ficam em assets/conquistas/<subpasta>/ e são editáveis à mão: aqui só
// se criam os que faltam (apague um PNG para ele ser desenhado de novo pelo código).
export function conquistas(objeto, OUT) {
  const q = SALA.quadro;
  let b = 0, t = 0;
  for (const [i, cq] of CONQUISTAS.entries()) {
    const id = objetoDaConquista(cq.id);
    const extra = { sala: 'sala', conquista: cq.id, rotulo: cq.nome };
    const opcoes = { arquivo: OUT + 'conquistas/' + arquivoDoPremio(cq), preservar: true };
    if (cq.forma === 'trofeu') {
      // posição padrão no chão da sala (o jogo põe cada troféu numa vaga livre ao desbloquear)
      const p = SALA.prateleiras['p-baixo'];
      objeto(id, 'mesa', (c) => desenharTrofeu(c, cq, p.x + 4 + (t++ % 8) * 30, p.y), { ...extra, elevavel: true, apoio: 'p-baixo' }, opcoes);
    } else {
      const k = b++;
      const x = q.x + 6 + (k % 6) * 20, y = q.y + 6 + Math.floor(k / 6) % 5 * 22;
      objeto(id, 'parede', (c) => (cq.forma === 'medalha' ? desenharMedalha(c, cq, i, x, y) : desenharBroche(c, cq, i, x, y)), extra, opcoes);
    }
  }
}

// Livro de conquistas da sala: álbum deitado na prateleira; clicar abre a lista de conquistas
export function albumConquistas(objeto) {
  const p = SALA.prateleiras.p2;
  objeto('album-conquistas', 'mesa', (c) => {
    // álbum em pé, de frente: capa rosa com uma medalha dourada, lombada à esquerda
    const x = 286, b = p.y, w = 16, h = 20;
    c.box(x, b - h, w, h, 'rose');
    c.rect(x + 1, b - h + 1, 3, h - 2, 'blush');
    c.vline(x + 4, b - h + 1, b - 2, 'ink');
    c.hline(x + 6, x + w - 3, b - h + 3, 'cream');
    c.hline(x + 6, x + w - 3, b - 4, 'cream');
    // medalha na capa
    c.rect(x + 8, b - h + 5, 4, 3, 'sky');
    c.circle(x + 10, b - h + 11, 3, 'ink');
    c.circle(x + 10, b - h + 11, 2, 'ouro-base');
    c.px(x + 9, b - h + 10, 'ouro-brilho');
    // páginas aparecendo embaixo
    c.hline(x + 5, x + w - 2, b - 2, 'cream');
  }, { elevavel: true, sala: 'sala', apoio: 'p2', rotulo: 'Livro de conquistas' });
}
