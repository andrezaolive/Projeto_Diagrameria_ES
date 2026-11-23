import { useSyncExternalStore } from 'react';
import { TAM_AVATAR } from '../lib/avatar.js';

// PNGs editáveis das partes do avatar (assets/avatar/cabelos|roupas|acessorios, ver lib/avatar.js).
// Cada PNG é lido pixel a pixel numa grade 32x32 de hex, que montarAvatar usa no lugar dos
// retângulos. No `npm run dev`, salvar um PNG troca o desenho na hora, sem recarregar a página
// (o estado fica em globalThis porque cada atualização cria uma nova cópia deste módulo).
const glob = import.meta.glob('../assets/avatar/**/*.png', { eager: true, import: 'default' });
const estado = (globalThis.__avatarDiagrameria ??= { grades: {}, versao: 0, ouvintes: new Set() });

const avisar = () => {
  estado.versao++;
  estado.ouvintes.forEach((f) => f());
};
const hex = (n) => n.toString(16).padStart(2, '0');

function ler(chave, url) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = TAM_AVATAR;
    c.height = TAM_AVATAR;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, TAM_AVATAR, TAM_AVATAR);
    const grade = Array.from({ length: TAM_AVATAR }, (_, y) =>
      Array.from({ length: TAM_AVATAR }, (_, x) => {
        const k = (y * TAM_AVATAR + x) * 4;
        return data[k + 3] < 128 ? null : `#${hex(data[k])}${hex(data[k + 1])}${hex(data[k + 2])}`;
      }),
    );
    estado.grades = { ...estado.grades, [chave]: grade };
    avisar();
  };
  img.src = url;
}

if (typeof Image !== 'undefined') {
  const chaves = Object.keys(glob).map((caminho) => caminho.replace('../assets/avatar/', '').replace(/\.png$/, ''));
  // PNG apagado: volta a usar os retângulos do código
  const sobra = Object.keys(estado.grades).filter((k) => !chaves.includes(k));
  if (sobra.length) {
    estado.grades = Object.fromEntries(Object.entries(estado.grades).filter(([k]) => chaves.includes(k)));
    avisar();
  }
  for (const [caminho, url] of Object.entries(glob)) ler(caminho.replace('../assets/avatar/', '').replace(/\.png$/, ''), url);
}

// Grades lidas até agora (chave → grade); o componente desenha de novo quando uma muda
export const gradesDoAvatar = () => estado.grades;
const assinar = (f) => {
  estado.ouvintes.add(f);
  return () => estado.ouvintes.delete(f);
};
export const useSpritesAvatar = () => useSyncExternalStore(assinar, () => estado.versao);

if (import.meta.hot) import.meta.hot.accept();
