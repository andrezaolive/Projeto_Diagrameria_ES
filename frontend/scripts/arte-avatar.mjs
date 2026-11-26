// Partes do avatar (cabelos, roupas e acessórios) como PNGs editáveis em src/assets/avatar/.
// São geradas a partir dos retângulos de src/lib/avatar.js, com as cores de referência
// (CORES_CHAVE): cabelo em plum, roupa em violet, pele no tom "média clara". O jogo troca essas
// cores pela escolha do jogador. Só se criam os PNGs que faltam: os editados à mão ficam como estão
// (apague um para ele ser desenhado de novo). Uso: npm run assets (ou node scripts/arte-avatar.mjs).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Canvas } from './pixel.mjs';
import { TAM_AVATAR, avatarPadrao, camadasExportaveis, gradeDaCamada, montarAvatar } from '../src/lib/avatar.js';

const rgba = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];

export function gradeParaCanvas(grade) {
  const c = new Canvas(TAM_AVATAR, TAM_AVATAR);
  grade.forEach((linha, y) => linha.forEach((hex, x) => hex && c.data.set(rgba(hex), (y * TAM_AVATAR + x) * 4)));
  return c;
}

export function avatar(OUT) {
  let novos = 0;
  for (const { chave } of camadasExportaveis()) {
    const arquivo = `${OUT}avatar/${chave}.png`;
    if (existsSync(arquivo)) continue;
    gradeParaCanvas(gradeDaCamada(chave)).save(arquivo);
    novos++;
  }
  return novos;
}

// Corpo de referência (avatar sem cabelo, com camiseta): base para desenhar partes novas por cima
export const corpoDeReferencia = () => gradeParaCanvas(montarAvatar({ ...avatarPadrao(), cabelo: 'careca' }));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const OUT = fileURLToPath(new URL('../src/assets/', import.meta.url));
  console.log(`${avatar(OUT)} PNG(s) do avatar criados em ${OUT}avatar/`);
}
