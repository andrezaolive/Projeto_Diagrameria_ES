// Gera os assets em pixel art (PNG) usando só a paleta oficial.
// Uso: npm run assets
import { Canvas, rng } from './pixel.mjs';
import { DESK_Y, ESTANTE, MONITOR, MONITOR_SCREEN, SCENE_W, SCENE_H } from '../src/art/layout.js';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const OUT = fileURLToPath(new URL('../src/assets/', import.meta.url));
const W = SCENE_W, H = SCENE_H;

// ---------------------------------------------------------------- escritório
function office() {
  const c = new Canvas(W, H);
  const r = rng(7);

  // Parede escura com luz do monitor (lofi noturno)
  c.rect(0, 0, W, DESK_Y, 'night');
  for (let x = 0; x < W; x += 20) c.vline(x, 0, DESK_Y, 'ink');
  c.ellipse(160, 80, 150, 90, 'plum', 'dither');
  c.ellipse(160, 80, 105, 66, 'plum');
  c.ellipse(160, 80, 70, 48, 'grape', 'dither');
  for (let x = 0; x < W; x += 20) c.vline(x, 0, DESK_Y, null);

  // Janela com noite chuvosa
  const wx = 20, wy = 14, ww = 74, wh = 66;
  c.box(wx, wy, ww, wh, 'ink', 'ink');
  c.rect(wx + 3, wy + 3, ww - 6, wh - 6, 'ink');
  c.dither(wx + 3, wy + 3, ww - 6, 20, 'night');
  for (let i = 0; i < 14; i++) c.px(wx + 4 + r() * (ww - 8), wy + 4 + r() * 30, 'cream');
  c.circle(wx + 54, wy + 16, 7, 'mist');
  c.circle(wx + 51, wy + 14, 2, 'lilac');
  c.px(wx + 57, wy + 19, 'lilac');
  // prédios
  let bx = wx + 3;
  while (bx < wx + ww - 3) {
    const bw = 6 + Math.floor(r() * 8);
    const bh = 10 + Math.floor(r() * 22);
    const right = Math.min(bx + bw, wx + ww - 3);
    c.rect(bx, wy + wh - 3 - bh, right - bx, bh, r() > 0.5 ? 'plum' : 'night');
    for (let j = wy + wh - bh; j < wy + wh - 4; j += 3)
      for (let i = bx + 1; i < right - 1; i += 2) if (r() > 0.6) c.px(i, j, 'butter');
    bx = right + 1;
  }
  // chuva
  for (let i = 0; i < 40; i++) {
    const x = wx + 4 + Math.floor(r() * (ww - 8));
    const y = wy + 4 + Math.floor(r() * (wh - 12));
    c.vline(x, y, y + 2, 'sky');
  }
  // moldura e travessas
  c.rect(wx, wy, ww, 3, 'grape');
  c.rect(wx, wy + wh - 3, ww, 3, 'grape');
  c.rect(wx, wy, 3, wh, 'grape');
  c.rect(wx + ww - 3, wy, 3, wh, 'grape');
  c.rect(wx + ww / 2 - 1, wy, 2, wh, 'grape');
  c.rect(wx, wy + wh / 2 - 1, ww, 2, 'grape');
  c.hline(wx, wx + ww - 1, wy, 'violet');
  c.rect(wx - 3, wy + wh, ww + 6, 3, 'violet');
  c.hline(wx - 3, wx + ww + 2, wy + wh, 'orchid');
  c.hline(wx - 3, wx + ww + 2, wy + wh + 3, 'ink');

  // Prateleira (os livros e o vasinho em cima dela são objetos: ver officeItems)
  const sx = ESTANTE.x, sy = ESTANTE.y;
  c.box(sx, sy, ESTANTE.w, 4, 'violet');
  c.hline(sx + 1, sx + ESTANTE.w - 2, sy + 1, 'orchid');
  c.rect(sx + 6, sy + 4, 2, 4, 'ink');
  c.rect(sx + ESTANTE.w - 8, sy + 4, 2, 4, 'ink');

  // Mesa
  c.rect(0, DESK_Y, W, H - DESK_Y, 'grape');
  c.hline(0, W, DESK_Y, 'ink');
  c.hline(0, W, DESK_Y + 1, 'orchid');
  c.hline(0, W, DESK_Y + 2, 'violet');
  for (let i = 0; i < 26; i++) {
    const gx = Math.floor(r() * W), gy = DESK_Y + 6 + Math.floor(r() * 56);
    c.hline(gx, gx + 6 + Math.floor(r() * 14), gy, 'plum');
  }
  c.ellipse(160, 140, 110, 30, 'violet', 'dither');

  // Monitor CRT
  const m = MONITOR, s = MONITOR_SCREEN;
  c.box(m.x - 6, m.y + 6, m.w + 12, m.h - 4, 'violet'); // corpo traseiro
  c.box(m.x, m.y, m.w, m.h, 'lavender');
  c.hline(m.x + 1, m.x + m.w - 2, m.y + 1, 'lilac');
  c.vline(m.x + 1, m.y + 1, m.y + m.h - 2, 'lilac');
  c.rect(m.x + m.w - 4, m.y + 2, 3, m.h - 3, 'orchid');
  c.rect(m.x + 2, m.y + m.h - 4, m.w - 3, 3, 'orchid');
  c.box(s.x - 4, s.y - 3, s.w + 8, s.h + 6, 'violet');
  c.rect(s.x, s.y, s.w, s.h, 'lilac');
  c.dither(s.x, s.y, s.w, s.h, 'mist');
  for (let j = s.y; j < s.y + s.h; j += 2) c.hline(s.x, s.x + s.w - 1, j, 'lilac');
  // mini diagrama na tela
  c.box(s.x + 8, s.y + 8, 14, 10, 'cream');
  c.box(s.x + 40, s.y + 6, 16, 10, 'cream');
  c.box(s.x + 26, s.y + 30, 16, 10, 'cream');
  c.line(s.x + 22, s.y + 13, s.x + 40, s.y + 11, 'grape');
  c.line(s.x + 15, s.y + 18, s.x + 28, s.y + 30, 'grape');
  c.line(s.x + 48, s.y + 16, s.x + 40, s.y + 30, 'grape');
  c.px(s.x + 39, s.y + 10, 'ink'); c.px(s.x + 39, s.y + 12, 'ink');
  // cantos arredondados da tela
  for (const [cx, cy] of [[s.x, s.y], [s.x + s.w - 1, s.y], [s.x, s.y + s.h - 1], [s.x + s.w - 1, s.y + s.h - 1]])
    c.px(cx, cy, 'violet');
  c.rect(m.x + m.w - 14, m.y + m.h - 9, 3, 2, 'mint');
  c.hline(m.x + 8, m.x + 30, m.y + m.h - 8, 'violet');
  // suporte
  c.box(m.x + 30, m.y + m.h - 1, 28, 7, 'violet');
  c.box(m.x + 20, m.y + m.h + 5, 48, 4, 'orchid');

  // Teclado
  const kx = 112, ky = 132;
  c.box(kx, ky, 96, 18, 'lavender');
  c.rect(kx + 1, ky + 15, 94, 2, 'orchid');
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 15; col++) {
      const px = kx + 3 + col * 6 + (row % 2) * 2;
      if (px > kx + 90) continue;
      c.rect(px, ky + 2 + row * 4, 5, 3, 'mist');
      c.hline(px, px + 4, ky + 4 + row * 4, 'lilac');
    }
  c.rect(kx + 30, ky + 14, 34, 2, 'mist');
  // Mouse e fio
  c.box(216, 136, 10, 14, 'lavender');
  c.vline(221, 137, 141, 'grape');
  c.line(221, 136, 214, 124, 'ink');
  c.line(214, 124, 204, 116, 'ink');

  c.save(OUT + 'scenes/office-320x180.png');
}

// ------------------------------------------- objetos móveis do escritório
// Cada objeto é desenhado nas coordenadas da cena, recortado e salvo como sprite.
// A posição original vira a posição padrão; a zona define onde ele pode ser arrastado.
const OBJETOS = {};
// extra: metadados a mais
//   elevavel: pode subir em superfícies altas (monitor, estante) e em cima de objetos empilháveis
//   empilhavel: outros objetos podem ficar em cima dele (livros)
//   rotulo: nome exibido no inventário (itens da loja usam o nome da loja)
//   variante: sprite alternativo de outro objeto (ex.: livro deitado); não é um objeto próprio
function objeto(id, zona, draw, extra = {}) {
  const c = new Canvas(W, H);
  draw(c);
  const { sprite, x, y, w, h } = c.crop();
  sprite.save(OUT + `objetos/${id}.png`);
  OBJETOS[id] = { x, y, w, h, zona, ...extra };
}
const overlay = (id, draw, zona = 'mesa') => objeto(id, zona, draw);

function officeItems() {
  // Livros da estante: cada um é um objeto, em pé (padrão) ou deitado (variante "-deitado")
  const livros = [
    ['livro-rosa', 'Livro rosa', 5, 14, 'blush'],
    ['livro-azul', 'Livro azul', 4, 16, 'sky'],
    ['livro-menta', 'Livro menta', 6, 13, 'mint'],
    ['livro-amarelo', 'Livro amarelo', 5, 17, 'butter'],
    ['livro-lilas', 'Livro lilás', 4, 15, 'orchid'],
    ['livro-vermelho', 'Livro vermelho', 6, 12, 'rose'],
    ['livro-lavanda', 'Livro lavanda', 5, 16, 'lilac'],
    ['livro-pessego', 'Livro pêssego', 5, 15, 'peach'],
  ];
  let lx = ESTANTE.x + 3;
  for (const [id, rotulo, bw, bh, col] of livros) {
    const x0 = lx;
    objeto(id, 'mesa', (c) => {
      c.box(x0, ESTANTE.y - bh, bw, bh, col);
      c.hline(x0 + 1, x0 + bw - 2, ESTANTE.y - bh + 3, 'cream');
    }, { elevavel: true, empilhavel: true, apoio: 'estante', rotulo });
    // deitado: largura e altura trocadas, lombada (faixa clara) na ponta esquerda
    objeto(`${id}-deitado`, 'mesa', (c) => {
      c.box(x0, 100, bh, bw, col);
      c.vline(x0 + 3, 101, 100 + bw - 2, 'cream');
    }, { elevavel: true, empilhavel: true, variante: true });
    lx += bw;
  }
  // vasinho com cacto na ponta da estante
  objeto('vaso-estante', 'mesa', (c) => {
    const vx = ESTANTE.x + 62, vy = ESTANTE.y;
    c.box(vx, vy - 9, 8, 9, 'blush');
    c.rect(vx + 2, vy - 14, 1, 5, 'mint');
    c.rect(vx + 4, vy - 16, 1, 7, 'mint');
  }, { elevavel: true, apoio: 'estante', rotulo: 'Cacto da estante' });

  // Notas adesivas ao redor do monitor: objetos de parede, arrastáveis
  const notas = [['postit-amarelo', 100, 46, 'butter'], ['postit-rosa', 96, 62, 'blush'], ['postit-menta', 210, 44, 'mint'], ['postit-azul', 212, 64, 'sky']];
  for (const [id, nx, ny, col] of notas)
    objeto(id, 'parede', (c) => {
      c.box(nx, ny, 10, 10, col);
      c.hline(nx + 2, nx + 7, ny + 3, 'grape');
      c.hline(nx + 2, nx + 6, ny + 5, 'grape');
      c.px(nx + 4, ny, 'rose');
    }, { rotulo: `Post-it ${{ butter: 'amarelo', blush: 'rosa', mint: 'menta', sky: 'azul' }[col]}` });

  objeto('caneca', 'mesa', (c) => {
    c.box(240, 126, 12, 14, 'blush');
    c.rect(241, 127, 10, 2, 'peach');
    c.box(251, 129, 5, 7, 'blush');
    c.rect(252, 130, 3, 5, 'grape');
    c.vline(243, 132, 136, 'cream');
    for (let j = 0; j < 7; j++) {
      c.px(245 + (j % 2), 124 - j * 1.5, 'mist');
      c.px(249 - (j % 2), 122 - j * 1.4, 'lilac');
    }
  }, { elevavel: true, rotulo: 'Caneca' });

  objeto('papeis', 'mesa', (c) => {
    c.box(36, 140, 30, 20, 'mist');
    c.box(40, 136, 30, 20, 'cream');
    for (let j = 0; j < 4; j++) c.hline(44, 60 - j * 2, 141 + j * 4, 'lavender');
    c.line(56, 162, 76, 154, 'butter');
    c.line(56, 163, 76, 155, 'peach');
    c.px(55, 163, 'ink');
    c.px(77, 154, 'rose');
  }, { rotulo: 'Papéis' });

  overlay('planta', (c) => {
    const r = rng(3);
    // folhas
    const leaves = [[-14, -40], [-6, -48], [4, -44], [12, -36], [-18, -26], [16, -24], [0, -54]];
    for (const [dx, dy] of leaves) {
      const tx = 290 + dx, ty = 130 + dy;
      c.line(290, 126, tx, ty, 'grape');
      c.ellipse(tx, ty, 5, 3, 'ink');
      c.ellipse(tx, ty, 4, 2, 'mint');
      c.px(tx - 1, ty - 1, 'cream');
      if (r() > 0.5) c.px(tx + 2, ty + 1, 'sky');
    }
    c.box(280, 124, 20, 22, 'rose');
    c.rect(281, 125, 18, 3, 'blush');
    c.vline(283, 129, 142, 'blush');
    c.rect(280, 144, 20, 2, 'ink');
  });

  objeto('gato', 'mesa', (c) => {
    // gato dormindo enrolado ao lado do teclado
    const cx = 86, cy = 128;
    c.ellipse(cx, cy, 16, 9, 'ink');
    c.ellipse(cx, cy, 15, 8, 'orchid');
    c.ellipse(cx + 2, cy + 2, 11, 5, 'lavender', 'dither');
    c.ellipse(cx - 11, cy - 3, 7, 6, 'ink');
    c.ellipse(cx - 11, cy - 3, 6, 5, 'orchid');
    c.line(cx - 16, cy - 7, cx - 15, cy - 12, 'ink');
    c.line(cx - 15, cy - 12, cx - 12, cy - 8, 'ink');
    c.px(cx - 15, cy - 9, 'blush');
    c.line(cx - 9, cy - 8, cx - 7, cy - 12, 'ink');
    c.line(cx - 7, cy - 12, cx - 5, cy - 7, 'ink');
    c.px(cx - 7, cy - 9, 'blush');
    c.hline(cx - 15, cx - 13, cy - 3, 'ink');
    c.hline(cx - 10, cx - 8, cy - 3, 'ink');
    c.px(cx - 12, cy - 1, 'rose');
    // rabo
    c.line(cx + 14, cy + 2, cx + 18, cy + 8, 'ink');
    c.line(cx + 18, cy + 8, cx + 8, cy + 9, 'ink');
    c.line(cx + 13, cy + 3, cx + 16, cy + 7, 'orchid');
    // zzz
    c.sprite(['kkk', '..k', '.k.', 'kkk'], cx - 22, cy - 22);
    c.sprite(['kk', '.k', 'kk'], cx - 26, cy - 28);
  }, { elevavel: true });

  objeto('poster', 'parede', (c) => {
    const x = 238, y = 46, w = 52, h = 60;
    c.box(x, y, w, h, 'mist');
    c.rect(x + 3, y + 3, w - 6, 34, 'plum');
    c.rect(x + 3, y + 3, w - 6, 8, 'grape');
    c.dither(x + 3, y + 11, w - 6, 6, 'violet');
    c.rect(x + 3, y + 17, w - 6, 8, 'orchid');
    c.dither(x + 3, y + 25, w - 6, 4, 'blush');
    c.rect(x + 3, y + 29, w - 6, 8, 'blush');
    c.circle(x + w / 2, y + 31, 10, 'butter');
    c.circle(x + w / 2, y + 31, 10, 'peach', 'dither');
    for (let j = y + 28; j < y + 38; j += 3) c.hline(x + 10, x + w - 11, j, 'blush');
    c.rect(x + 3, y + 37, w - 6, 2, 'grape');
    c.hline(x + 8, x + w - 9, y + 44, 'grape');
    c.hline(x + 12, x + w - 13, y + 48, 'lavender');
    c.hline(x + 14, x + w - 15, y + 52, 'lavender');
    c.px(x + w / 2, y + 1, 'rose');
    c.px(x + w / 2, y + 2, 'rose');
  });

  objeto('luzinhas', 'fixo', (c) => {
    const cols = ['butter', 'blush', 'sky', 'mint'];
    let prev = null, n = 0;
    for (let x = 0; x <= W; x += 2) {
      const y = 6 + Math.round(Math.abs(Math.sin((x / W) * Math.PI * 3)) * 10);
      if (prev) c.line(prev[0], prev[1], x, y, 'ink');
      prev = [x, y];
      if (x % 16 === 8) {
        const col = cols[n++ % cols.length];
        c.circle(x, y + 3, 4, col, 'sparse');
        c.rect(x - 1, y + 1, 3, 4, col);
        c.px(x, y + 1, 'cream');
      }
    }
  });

  overlay('abajur', (c) => {
    const X = -70; // canto esquerdo da mesa (brilho inteiro dentro da cena)
    // luz no chão da mesa
    c.ellipse(X + 108, 132, 34, 10, 'peach', 'sparse');
    c.ellipse(X + 108, 132, 22, 6, 'peach', 'dither');
    c.box(X + 96, 140, 22, 5, 'violet');
    c.line(X + 106, 140, X + 100, 118, 'ink');
    c.line(X + 107, 140, X + 101, 118, 'ink');
    c.line(X + 100, 118, X + 108, 104, 'ink');
    c.line(X + 101, 118, X + 109, 104, 'ink');
    // cúpula: trapézio estreito em cima (x 104–116, y 95) e largo embaixo (x 96–124, y 105).
    // Cada linha do preenchimento acompanha as laterais, abrindo 0,8px por linha para baixo.
    for (let k = 1; k <= 9; k++) {
      const esq = Math.round(X + 104 - 0.8 * k) + 1;
      const dir = Math.round(X + 116 + 0.8 * k) - 1;
      c.hline(esq, dir, 95 + k, 'butter');
      c.hline(dir - 1, dir, 95 + k, 'peach'); // sombra do lado direito, longe do abajur da cena
    }
    c.hline(X + 96, X + 124, 105, 'ink');
    c.line(X + 96, 105, X + 104, 95, 'ink');
    c.line(X + 124, 105, X + 116, 95, 'ink');
    c.hline(X + 104, X + 116, 95, 'ink');
    c.dither(X + 100, 106, 22, 6, 'peach');
  });

  // ---------- novos itens de mesa
  objeto('pato', 'mesa', (c) => {
    c.ellipse(208, 166, 9, 6, 'ink');
    c.ellipse(208, 166, 8, 5, 'butter');
    c.hline(202, 213, 170, 'peach');
    c.circle(202, 158, 5, 'ink');
    c.circle(202, 158, 4, 'butter');
    c.rect(195, 158, 4, 2, 'peach');
    c.hline(195, 198, 160, 'rose');
    c.px(201, 157, 'ink');
    c.px(203, 156, 'cream');
    c.line(207, 165, 212, 163, 'peach');
    c.px(216, 162, 'ink');
    c.px(216, 163, 'butter');
  }, { elevavel: true });

  objeto('cacto', 'mesa', (c) => {
    c.box(262, 162, 14, 11, 'peach');
    c.rect(263, 163, 12, 2, 'butter');
    c.hline(262, 275, 165, 'ink');
    c.box(266, 146, 7, 17, 'mint');
    c.box(261, 151, 6, 4, 'mint');
    c.box(261, 148, 3, 6, 'mint');
    c.box(272, 153, 6, 4, 'mint');
    c.box(275, 150, 3, 6, 'mint');
    c.vline(268, 148, 160, 'cream');
    for (const [x, y] of [[270, 149], [270, 154], [270, 158], [262, 150], [276, 152]]) c.px(x, y, 'ink');
    c.rect(268, 144, 3, 2, 'blush');
    c.px(269, 143, 'rose');
  }, { elevavel: true });

  objeto('radio', 'mesa', (c) => {
    // toca-fitas lofi com notinhas
    c.line(178, 156, 186, 144, 'ink');
    c.px(186, 143, 'rose');
    c.box(150, 156, 36, 20, 'grape');
    c.hline(151, 184, 157, 'violet');
    c.box(156, 152, 24, 5, 'violet');
    c.rect(158, 153, 20, 3, 'night');
    for (const cx of [157, 179]) {
      c.circle(cx, 167, 6, 'ink');
      c.circle(cx, 167, 5, 'lavender');
      c.circle(cx, 167, 5, 'violet', 'dither');
      c.px(cx, 167, 'ink');
    }
    c.box(163, 161, 10, 9, 'mist');
    c.px(166, 165, 'ink');
    c.px(170, 165, 'ink');
    c.hline(165, 171, 163, 'lavender');
    c.rect(164, 172, 2, 2, 'butter');
    c.rect(168, 172, 2, 2, 'rose');
    c.rect(172, 172, 2, 2, 'mint');
    c.sprite(['.kk', '.kk', '.k.', 'kk.', 'kk.'], 148, 141);
    c.sprite(['.kkk', '.k.k', 'kk.k', 'kkkk'], 190, 136);
  }, { elevavel: true });

  objeto('livros', 'mesa', (c) => {
    c.box(6, 168, 32, 7, 'sky');
    c.vline(35, 169, 173, 'mist');
    c.box(9, 161, 28, 7, 'blush');
    c.vline(34, 162, 166, 'mist');
    c.hline(12, 20, 164, 'cream');
    c.box(7, 154, 26, 7, 'mint');
    c.vline(30, 155, 159, 'mist');
    c.box(12, 147, 20, 7, 'butter');
    c.vline(29, 148, 152, 'mist');
    c.hline(14, 22, 150, 'peach');
  }, { elevavel: true });

  objeto('fone', 'mesa', (c) => {
    c.hline(232, 248, 156, 'ink');
    c.hline(232, 248, 157, 'orchid');
    c.line(231, 157, 227, 165, 'ink');
    c.line(249, 157, 253, 165, 'ink');
    c.box(224, 164, 8, 11, 'orchid');
    c.rect(225, 165, 2, 9, 'lavender');
    c.box(248, 164, 8, 11, 'orchid');
    c.rect(253, 165, 2, 9, 'lavender');
    c.px(228, 169, 'blush');
    c.px(252, 169, 'blush');
  }, { elevavel: true });

  objeto('vela', 'mesa', (c) => {
    c.circle(116, 156, 9, 'peach', 'sparse');
    c.box(110, 162, 13, 13, 'lilac');
    c.rect(111, 165, 11, 9, 'blush');
    c.hline(111, 121, 164, 'cream');
    c.vline(116, 158, 162, 'ink');
    c.rect(115, 155, 3, 3, 'butter');
    c.px(116, 154, 'peach');
    c.px(116, 153, 'butter');
  }, { elevavel: true });

  // ---------- novos itens de parede
  objeto('relogio', 'parede', (c) => {
    c.circle(110, 22, 11, 'ink');
    c.circle(110, 22, 10, 'cream');
    c.circle(110, 22, 10, 'mist', 'sparse');
    for (const [dx, dy] of [[0, -8], [8, 0], [0, 8], [-8, 0]]) c.px(110 + dx, 22 + dy, 'grape');
    c.line(110, 22, 110, 15, 'ink');
    c.line(110, 22, 115, 24, 'ink');
    c.px(110, 22, 'rose');
  });

  objeto('cortica', 'parede', (c) => {
    c.box(140, 4, 44, 30, 'grape');
    c.rect(142, 6, 40, 26, 'peach');
    c.dither(142, 6, 40, 26, 'butter');
    c.box(145, 9, 12, 11, 'blush');
    c.box(160, 8, 10, 10, 'sky');
    c.box(172, 12, 9, 12, 'mint');
    c.box(147, 22, 16, 8, 'cream');
    c.hline(149, 159, 25, 'lavender');
    c.hline(149, 156, 27, 'lavender');
    c.box(162, 20, 7, 5, 'cream');
    c.line(165, 25, 167, 29, 'ink');
    for (const [x, y] of [[151, 9], [165, 8], [176, 12], [155, 22]]) c.px(x, y, 'rose');
  });

  objeto('neon', 'parede', (c) => {
    // lua crescente em neon
    const cx = 302, cy = 70;
    c.circle(cx, cy, 14, 'rose', 'sparse');
    for (let y = cy - 11; y <= cy + 11; y++)
      for (let x = cx - 11; x <= cx + 11; x++) {
        const fora = (x - cx) ** 2 + (y - cy) ** 2 <= 121;
        const dentro = (x - cx - 6) ** 2 + (y - cy + 4) ** 2 <= 100;
        if (fora && !dentro) c.px(x, y, (x + y) % 3 ? 'blush' : 'cream');
      }
    c.px(cx + 8, cy + 8, 'butter');
    c.px(cx + 9, cy + 7, 'butter');
    c.px(cx + 10, cy + 8, 'butter');
    c.px(cx + 9, cy + 9, 'butter');
  });
}

function wallpaperAurora() {
  const c = new Canvas(W, H);
  const r = rng(41);
  bands(c, 0, ['ink', 'night', 'plum'], 40);
  c.rect(0, 120, W, 60, 'night');
  for (let i = 0; i < 70; i++) c.px(r() * W, r() * 100, r() > 0.8 ? 'butter' : 'cream');
  // cortinas da aurora
  const cores = ['mint', 'sky', 'lilac'];
  cores.forEach((col, k) => {
    for (let x = 0; x < W; x++) {
      const topo = 20 + k * 10 + Math.sin(x / 22 + k) * 12 + Math.sin(x / 7) * 3;
      const alt = 18 + Math.sin(x / 13 + k * 2) * 8;
      for (let y = topo; y < topo + alt; y++) if ((x + Math.round(y)) % (y < topo + alt / 2 ? 1 : 2) === 0) c.px(x, y, col);
    }
  });
  // montanhas nevadas
  for (const [px, alt, larg] of [[40, 50, 70], [130, 70, 90], [230, 56, 80], [300, 44, 60]]) {
    for (let x = px - larg; x <= px + larg; x++) {
      const y = 120 - alt * (1 - Math.abs(x - px) / larg);
      c.vline(x, y, 120, 'grape');
      if (y < 120 - alt * 0.6) c.vline(x, y, 120 - alt * 0.6, 'mist');
    }
  }
  // lago com reflexo
  for (let j = 124; j < H; j += 3)
    for (let x = (j * 7) % 11; x < W; x += 9 + Math.floor(r() * 8)) c.hline(x, x + 3, j, ['mint', 'sky', 'lilac'][j % 3]);
  c.save(OUT + 'scenes/wallpaper-aurora-320x180.png');
}

// -------------------------------------------------------- papéis de parede
function bands(c, y0, colors, bandH) {
  colors.forEach((col, i) => {
    const y = y0 + i * bandH;
    c.rect(0, y, W, bandH, col);
    if (i > 0) c.dither(0, y - 2, W, 4, colors[i - 1]);
  });
}

function wallpaperSunset() {
  const c = new Canvas(W, H);
  const r = rng(11);
  bands(c, 0, ['night', 'plum', 'grape', 'violet', 'orchid', 'blush', 'peach'], 18);
  for (let i = 0; i < 40; i++) c.px(r() * W, r() * 30, r() > 0.7 ? 'butter' : 'cream');
  // sol retrô listrado
  const cx = 160, cy = 120;
  for (let j = cy - 44; j < cy; j++) {
    const gap = j > cy - 22 && (j - cy) % 5 === 0;
    if (gap) continue;
    const half = Math.sqrt(Math.max(0, 44 * 44 - (j - cy) ** 2));
    c.hline(cx - half, cx + half, j, j < cy - 26 ? 'butter' : 'peach');
  }
  // nuvens
  for (const [x, y, w] of [[30, 50, 50], [230, 40, 60], [70, 78, 40], [250, 86, 36]]) {
    c.rect(x, y, w, 3, 'lilac');
    c.rect(x + 8, y - 2, w - 18, 2, 'lilac');
    c.hline(x, x + w - 1, y + 3, 'orchid');
  }
  // morros
  for (let x = 0; x < W; x++) {
    const h1 = 10 + Math.sin(x / 26) * 6 + Math.sin(x / 9) * 2;
    c.vline(x, 120 - h1, 120, 'grape');
  }
  // mar
  c.rect(0, 120, W, 60, 'plum');
  c.dither(0, 140, W, 40, 'night');
  for (let j = 122; j < 178; j += 4) {
    const half = 40 - (j - 122) * 0.5;
    const col = j < 140 ? 'peach' : 'blush';
    for (let x = cx - half; x < cx + half; x += 6 + Math.floor(r() * 4)) c.hline(x, x + 3, j, col);
  }
  c.save(OUT + 'scenes/wallpaper-por-do-sol-320x180.png');
}

function wallpaperRain() {
  const c = new Canvas(W, H);
  const r = rng(21);
  bands(c, 0, ['ink', 'night', 'plum', 'grape'], 36);
  c.rect(0, 144, W, 36, 'night');
  c.circle(250, 36, 18, 'mist');
  c.circle(250, 36, 22, 'lilac', 'sparse');
  c.circle(244, 30, 4, 'lilac');
  c.circle(256, 42, 3, 'lilac');
  for (let i = 0; i < 50; i++) c.px(r() * W, r() * 70, 'cream');
  // cidade em 2 camadas
  for (const [base, col, win] of [[150, 'plum', 'lavender'], [160, 'night', 'butter']]) {
    let x = 0;
    while (x < W) {
      const bw = 12 + Math.floor(r() * 20), bh = 20 + Math.floor(r() * 50);
      c.rect(x, base - bh, bw, bh, col);
      if (r() > 0.6) c.vline(x + bw / 2, base - bh - 8, base - bh, col);
      for (let j = base - bh + 4; j < base - 4; j += 5)
        for (let i = x + 2; i < x + bw - 2; i += 4) if (r() > 0.55) c.rect(i, j, 2, 2, win);
      x += bw + 1;
    }
  }
  c.rect(0, 160, W, 20, 'ink');
  for (let i = 0; i < 60; i++) {
    const x = r() * W;
    c.hline(x, x + 4 + r() * 8, 162 + r() * 16, ['butter', 'lavender', 'blush'][i % 3]);
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * 160);
    c.vline(x, y, y + 3, 'sky');
  }
  c.save(OUT + 'scenes/wallpaper-noite-chuvosa-320x180.png');
}

function wallpaperLavender() {
  const c = new Canvas(W, H);
  const r = rng(31);
  bands(c, 0, ['sky', 'lilac', 'mist', 'blush'], 30);
  c.circle(70, 40, 14, 'cream');
  c.circle(70, 40, 18, 'mist', 'sparse');
  for (const [x, y, w] of [[150, 26, 60], [240, 50, 50], [20, 70, 44]]) {
    c.ellipse(x + w / 2, y, w / 2, 5, 'cream');
    c.ellipse(x + w / 2 - 8, y - 4, w / 4, 4, 'cream');
    c.hline(x + 4, x + w - 4, y + 5, 'lilac');
  }
  const hills = [[110, 'orchid', 40], [125, 'violet', 30], [145, 'grape', 22], [165, 'plum', 16]];
  hills.forEach(([base, col, amp], k) => {
    for (let x = 0; x < W; x++) {
      const y = base - Math.sin(x / (30 + k * 10) + k) * amp * 0.4 - amp * 0.3;
      c.vline(x, y, H, col);
      if (x % 3 === 0 && k > 0) c.px(x, y + 2 + (x % 7), k % 2 ? 'lavender' : 'orchid');
    }
  });
  // fileiras de lavanda
  for (let j = 150; j < H; j += 4)
    for (let x = (j % 8); x < W; x += 6) c.vline(x, j, j + 2, r() > 0.3 ? 'orchid' : 'lavender');
  c.save(OUT + 'scenes/wallpaper-campo-lavanda-320x180.png');
}

// ------------------------------------------------------------------ ícones
const ICONS = {
  bau: [
    '................',
    '..kkkkkkkkkkkk..',
    '.kooooooooooook.',
    '.koyvvvvvvvvyok.',
    '.kvyvvvvvvvvyvk.',
    '.kvvvvvvvvvvvvk.',
    '.kkkkkkyykkkkkk.',
    '.kggggkyykggggk.',
    '.kvvvvkeykvvvvk.',
    '.kvvvvvkkvvvvvk.',
    '.kyvvvvvvvvvvyk.',
    '.kvvvvvvvvvvvvk.',
    '.kggggggggggggk.',
    '.kkkkkkkkkkkkkk.',
    '..kk........kk..',
    '................',
  ],
  email: [
    '................',
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kckmmmmmmmmkck.',
    '.kmckmmmmmmkcmk.',
    '.kmmckmmmmkcmmk.',
    '.kmmmckmmkcmmmk.',
    '.kmmmmckkcmmmmk.',
    '.kmmmmmccmmmmmk.',
    '.kmmmmmmmmmmmmk.',
    '.kmmmmmmmmmmmmk.',
    '.kiiiiiiiiiiiik.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
    '................',
  ],
  editor: [
    '................',
    '..kkkkkkkkkk....',
    '..kmmmmmmmmkk...',
    '..kmkkkmmmmkmk..',
    '..kmksskmmmkkkk.',
    '..kmkkkkmmmmmmk.',
    '..kmmkmmmmmmmmk.',
    '..kmmkkkkkmmmmk.',
    '..kmmmmmmkmmmmk.',
    '..kmmmmmkkkmmmk.',
    '..kmmmmmkbkmmmk.',
    '..kmmmmmkkkmmmk.',
    '..kmmmmmmmmmmmk.',
    '..kiiiiiiiiiiik.',
    '..kkkkkkkkkkkkk.',
    '................',
  ],
  dicas: [
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '...kyycyyyyyk...',
    '...kycyyyyyyk...',
    '...kyyyyyyyyk...',
    '...kyyyyyyyek...',
    '....kyyyyyek....',
    '.....kyyyek.....',
    '.....kkkkkk.....',
    '.....kllllk.....',
    '.....kkkkkk.....',
    '.....kllllk.....',
    '......kkkk......',
    '................',
    '................',
  ],
  loja: [
    '................',
    '......kkkk......',
    '.....k....k.....',
    '.....k....k.....',
    '..kkkkkkkkkkkk..',
    '..kbbbbbbbbbbk..',
    '..kbcbbbbbbbbk..',
    '..kbbbbbbbbbbk..',
    '..kbbbbyybbbbk..',
    '..kbbbyyyybbbk..',
    '..kbbbbyybbbbk..',
    '..kbbbbbbbbbbk..',
    '..krrrrrrrrrrk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ],
  escritorio: [
    '................',
    '....kkkkkkkk....',
    '....kggggggk....',
    '....kgvvvvgk....',
    '....kgvovvgk....',
    '....kgvvvvgk....',
    '....kgvvvvgk....',
    '....kgvvvygk....',
    '....kgvvvvgk....',
    '....kgvvvvgk....',
    '....kgvvvvgk....',
    '....kgvvvvgk....',
    '....kggggggk....',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ],
  cadeado: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kk....kk....',
    '....k......k....',
    '....k......k....',
    '...kkkkkkkkkk...',
    '...kyyyyyyyyk...',
    '...kyycyyyyyk...',
    '...kyyykkyyyk...',
    '...kyyykkyyyk...',
    '...kyyyykyyyk...',
    '...keeeeeeeek...',
    '...kkkkkkkkkk...',
    '................',
    '................',
  ],
  moeda: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '...kyycyyyyek...',
    '..kyycyykyyyek..',
    '..kyyyykkkyyek..',
    '..kyyyyykyyyek..',
    '..kyyyykkkyyek..',
    '..kyyyyykyyyek..',
    '...kyyyyyyyek...',
    '....keeeeeek....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
  ],
  relogio: [
    '................',
    '.....kkkkkk.....',
    '...kkmmmmmmkk...',
    '..kmmmmkmmmmmk..',
    '..kmmmmkmmmmmk..',
    '.kmmmmmkmmmmmmk.',
    '.kmmmmmkmmmmmmk.',
    '.kmmmmmkkkkkmmk.',
    '.kmmmmmmmmmmmmk.',
    '.kmmmmmmmmmmmmk.',
    '..kmmmmmmmmmmk..',
    '..kimmmmmmmmik..',
    '...kkiiiiiikk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
};

function icons() {
  for (const [name, rows] of Object.entries(ICONS)) {
    const c = new Canvas(16, 16);
    c.sprite(rows);
    c.save(OUT + `ui/icon-${name}-16.png`);
  }
}

// ------------------------------------------------------------------ mascote
// Folha de papel do mascote (18x26) com a orelha dobrada; (x, y) = canto superior esquerdo
function folha(c, x, y) {
  c.box(x, y, 18, 26, 'mist');
  c.rect(x + 1, y + 1, 16, 2, 'cream');
  for (let i = 0; i < 6; i++) c.clear(x + 17 - i, y + i);
  c.line(x + 12, y, x + 17, y + 5, 'ink');
  c.rect(x + 12, y + 1, 1, 5, 'ink');
  c.hline(x + 12, x + 17, y + 5, 'ink');
  c.line(x + 13, y + 2, x + 15, y + 4, 'lilac');
  c.vline(x + 16, y + 6, y + 24, 'lilac');
  // "texto" do documento
  c.hline(x + 2, x + 14, y + 19, 'lavender');
  c.hline(x + 2, x + 11, y + 21, 'lavender');
}
const ROSTO = {
  olhosPonto(c, x, y) {
    c.rect(x + 4, y + 9, 2, 3, 'ink');
    c.rect(x + 11, y + 9, 2, 3, 'ink');
    c.px(x + 4, y + 9, 'cream');
    c.px(x + 11, y + 9, 'cream');
  },
  olhosFelizes(c, x, y) {
    for (const ox of [3, 10]) {
      c.px(x + ox, y + 11, 'ink');
      c.px(x + ox + 1, y + 10, 'ink');
      c.px(x + ox + 2, y + 10, 'ink');
      c.px(x + ox + 3, y + 11, 'ink');
    }
  },
  olhosTristes(c, x, y) {
    c.rect(x + 4, y + 10, 2, 2, 'ink');
    c.rect(x + 11, y + 10, 2, 2, 'ink');
    c.line(x + 3, y + 9, x + 5, y + 8, 'ink'); // sobrancelhas caídas
    c.line(x + 12, y + 8, x + 14, y + 9, 'ink');
  },
  bochechas(c, x, y) {
    c.rect(x + 2, y + 13, 2, 1, 'blush');
    c.rect(x + 13, y + 13, 2, 1, 'blush');
  },
  sorriso(c, x, y) {
    c.hline(x + 6, x + 10, y + 15, 'ink');
    c.px(x + 5, y + 14, 'ink');
    c.px(x + 11, y + 14, 'ink');
  },
  bocaAberta(c, x, y) {
    c.rect(x + 5, y + 13, 7, 3, 'ink');
    c.rect(x + 6, y + 15, 5, 1, 'rose');
    c.clear(x + 5, y + 15);
    c.clear(x + 11, y + 15);
  },
  bocaReta(c, x, y) {
    c.hline(x + 6, x + 10, y + 15, 'ink');
  },
  bocaTriste(c, x, y) {
    c.hline(x + 6, x + 10, y + 14, 'ink');
    c.px(x + 5, y + 15, 'ink');
    c.px(x + 11, y + 15, 'ink');
  },
};
// braços: mãos como bolinhas de 1px de raio
function braco(c, pontos) {
  for (let i = 1; i < pontos.length; i++) c.line(...pontos[i - 1], ...pontos[i], 'ink');
  const [hx, hy] = pontos.at(-1);
  c.circle(hx, hy, 1, 'ink');
}
function pernas(c, x, y, abertas = false) {
  const d = abertas ? 2 : 0;
  c.line(x + 5, y + 26, x + 5 - d, y + 33, 'ink');
  c.line(x + 12, y + 26, x + 12 + d, y + 33, 'ink');
  c.hline(x + 2 - d, x + 5 - d, y + 34, 'ink');
  c.hline(x + 12 + d, x + 15 + d, y + 34, 'ink');
  c.hline(x + 2 - d, x + 5 - d, y + 35, 'violet');
  c.hline(x + 12 + d, x + 15 + d, y + 35, 'violet');
}
function estrela(c, x, y, cor) {
  c.px(x, y, cor);
  c.px(x - 1, y, cor);
  c.px(x + 1, y, cor);
  c.px(x, y - 1, cor);
  c.px(x, y + 1, cor);
}

const REACOES = {
  // >= 85%: pulando com os braços para cima e confete
  comemorando(c) {
    const x = 11, y = 3;
    braco(c, [[x - 1, y + 12], [x - 5, y + 4]]);
    braco(c, [[x + 18, y + 12], [x + 22, y + 4]]);
    pernas(c, x, y, true);
    folha(c, x, y);
    ROSTO.olhosFelizes(c, x, y);
    ROSTO.bochechas(c, x, y);
    ROSTO.bocaAberta(c, x, y);
    const confete = [[2, 3, 'butter'], [36, 2, 'blush'], [1, 16, 'sky'], [38, 14, 'mint'], [4, 28, 'blush'], [36, 26, 'butter'], [8, 1, 'mint'], [31, 8, 'sky']];
    for (const [cx, cy, cor] of confete) c.rect(cx, cy, 2, 2, cor);
    estrela(c, 3, 9, 'butter');
    estrela(c, 36, 20, 'butter');
  },
  // 60–85%: acenando (pose original)
  feliz(c) {
    const x = 11, y = 2;
    braco(c, [[x - 1, y + 14], [x - 6, y + 8], [x - 7, y + 4]]);
    braco(c, [[x + 18, y + 14], [x + 22, y + 21]]);
    pernas(c, x, y);
    folha(c, x, y);
    ROSTO.olhosPonto(c, x, y);
    ROSTO.bochechas(c, x, y);
    ROSTO.sorriso(c, x, y);
  },
  // 30–60%: mãos na cintura, cara de "dá pra melhorar"
  neutro(c) {
    const x = 11, y = 2;
    braco(c, [[x - 1, y + 12], [x - 4, y + 15], [x - 1, y + 18]]);
    braco(c, [[x + 18, y + 12], [x + 21, y + 15], [x + 18, y + 18]]);
    pernas(c, x, y);
    folha(c, x, y);
    ROSTO.olhosPonto(c, x, y);
    ROSTO.bocaReta(c, x, y);
  },
  // 0–30%: braços caídos, lágrima
  triste(c) {
    const x = 11, y = 2;
    braco(c, [[x - 1, y + 15], [x - 3, y + 22]]);
    braco(c, [[x + 18, y + 15], [x + 20, y + 22]]);
    pernas(c, x, y);
    folha(c, x, y);
    ROSTO.olhosTristes(c, x, y);
    ROSTO.bocaTriste(c, x, y);
    c.rect(x + 4, y + 12, 1, 2, 'sky');
    c.rect(x + 3, y + 14, 2, 2, 'sky');
  },
  // 0%: deitado espatifado no chão, olhos em X, estrelinhas rodando
  espatifado(c) {
    c.hline(2, 37, 38, 'plum'); // sombra no chão
    c.hline(4, 35, 39, 'plum');
    braco(c, [[7, 28], [2, 25]]);
    braco(c, [[32, 28], [37, 25]]);
    c.line(14, 35, 11, 37, 'ink');
    c.line(25, 35, 28, 37, 'ink');
    c.hline(8, 11, 37, 'violet');
    c.hline(28, 31, 37, 'violet');
    // folha achatada e amassada
    c.box(6, 23, 27, 13, 'mist');
    c.rect(7, 24, 25, 1, 'cream');
    for (let i = 0; i < 4; i++) c.clear(32 - i, 23 + i);
    c.line(28, 23, 32, 27, 'ink');
    c.vline(28, 24, 27, 'ink');
    c.hline(28, 32, 27, 'ink');
    c.px(29, 25, 'lilac');
    c.line(9, 31, 12, 33, 'lilac'); // vincos
    c.line(24, 33, 27, 31, 'lilac');
    // olhos em X
    for (const ox of [12, 22]) {
      c.line(ox, 26, ox + 2, 28, 'ink');
      c.line(ox + 2, 26, ox, 28, 'ink');
    }
    // boca torta
    [[15, 31], [16, 30], [17, 31], [18, 30], [19, 31], [20, 30]].forEach(([px, py]) => c.px(px, py, 'ink'));
    estrela(c, 11, 17, 'butter');
    estrela(c, 19, 14, 'butter');
    estrela(c, 27, 17, 'butter');
    c.line(13, 18, 17, 16, 'lavender');
    c.line(21, 15, 25, 17, 'lavender');
  },
};

function mascot() {
  // sprite principal (menu, favicon): o mesmo desenho do "feliz", em 32x40
  const c = new Canvas(32, 40);
  braco(c, [[7, 16], [2, 10], [1, 6]]);
  braco(c, [[26, 16], [30, 23]]);
  pernas(c, 8, 2);
  folha(c, 8, 2);
  ROSTO.olhosPonto(c, 8, 2);
  ROSTO.bochechas(c, 8, 2);
  ROSTO.sorriso(c, 8, 2);
  c.save(OUT + 'sprites/mascote-32x40.png');
  c.save(fileURLToPath(new URL('../public/favicon.png', import.meta.url)));

  for (const [nome, desenha] of Object.entries(REACOES)) {
    const r = new Canvas(40, 40);
    desenha(r);
    r.save(OUT + `sprites/mascote-${nome}-40x40.png`);
  }
}

office();
officeItems();
wallpaperSunset();
wallpaperRain();
wallpaperLavender();
wallpaperAurora();
icons();
mascot();
writeFileSync(fileURLToPath(new URL('../src/art/objetos.json', import.meta.url)), JSON.stringify(OBJETOS, null, 2) + '\n');
console.log('Assets gerados em', OUT);
