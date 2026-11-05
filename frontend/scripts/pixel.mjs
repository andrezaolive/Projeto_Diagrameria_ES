// Mini biblioteca de pixel art: desenha num buffer RGBA e exporta PNG sem dependências.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PALETTE } from '../src/art/palette.js';

const rgba = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  255,
];
const COLORS = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, rgba(v)]));

// Letras usadas nos sprites em ASCII
export const LEGEND = {
  k: 'ink', n: 'night', p: 'plum', g: 'grape', v: 'violet', o: 'orchid',
  l: 'lavender', i: 'lilac', m: 'mist', c: 'cream', b: 'blush', e: 'peach',
  y: 'butter', t: 'mint', s: 'sky', r: 'rose',
};

// PRNG determinístico para os assets saírem sempre iguais
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }

  px(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    const col = COLORS[c];
    if (!col) throw new Error(`Cor fora da paleta: ${c}`);
    this.data.set(col, (y * this.w + x) * 4);
  }

  clear(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data.fill(0, (y * this.w + x) * 4, (y * this.w + x) * 4 + 4);
  }

  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, c);
  }

  // Retângulo com contorno de 1px
  box(x, y, w, h, fill, outline = 'ink') {
    this.rect(x, y, w, h, outline);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  // Dithering em xadrez (ou padrão 25% com sparse=true)
  dither(x, y, w, h, c, sparse = false) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        const on = sparse ? i % 2 === 0 && j % 2 === 0 && (i + j) % 4 === 0 : (i + j) % 2 === 0;
        if (on) this.px(i, j, c);
      }
  }

  hline(x1, x2, y, c) {
    for (let i = Math.min(x1, x2); i <= Math.max(x1, x2); i++) this.px(i, y, c);
  }

  vline(x, y1, y2, c) {
    for (let j = Math.min(y1, y2); j <= Math.max(y1, y2); j++) this.px(x, j, c);
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // Elipse preenchida (opcionalmente só pixels em xadrez)
  ellipse(cx, cy, rx, ry, c, mode = 'solid') {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
      for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
        const d = ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2;
        if (d > 1) continue;
        if (mode === 'dither' && (i + j) % 2) continue;
        if (mode === 'sparse' && !(i % 2 === 0 && j % 2 === 0)) continue;
        this.px(i, j, c);
      }
  }

  circle(cx, cy, r, c, mode) {
    this.ellipse(cx, cy, r, r, c, mode);
  }

  // Desenha sprite ASCII (ver LEGEND); '.' é transparente
  sprite(rows, x = 0, y = 0) {
    const w = rows[0].length;
    rows.forEach((row, j) => {
      if (row.length !== w) throw new Error(`Linha ${j} com ${row.length} chars (esperado ${w})`);
      [...row].forEach((ch, i) => {
        if (ch !== '.') this.px(x + i, y + j, LEGEND[ch]);
      });
    });
  }

  // Recorta ao retângulo dos pixels visíveis; devolve o sprite e onde ele estava
  crop() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.data[(y * this.w + x) * 4 + 3]) {
          x0 = Math.min(x0, x); y0 = Math.min(y0, y);
          x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
    if (x1 < 0) throw new Error('Sprite vazio');
    const out = new Canvas(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++)
      out.data.set(this.data.subarray((y * this.w + x0) * 4, (y * this.w + x1 + 1) * 4), ((y - y0) * out.w) * 4);
    return { sprite: out, x: x0, y: y0, w: out.w, h: out.h };
  }

  save(path) {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 4 + 1)] = 0;
      Buffer.from(this.data.buffer, y * this.w * 4, this.w * 4).copy(raw, y * (this.w * 4 + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bits por canal
    ihdr[9] = 6; // RGBA
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, png);
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
