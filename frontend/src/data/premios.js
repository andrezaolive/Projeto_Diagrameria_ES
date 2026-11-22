import { useSyncExternalStore } from 'react';

// PNGs dos prêmios das conquistas (assets/conquistas/<subpasta>/, ver art/conquistas.js). São
// editáveis à mão: no `npm run dev`, salvar um deles troca o desenho na hora, sem recarregar a
// página (o jogo continua onde estava). O estado fica em globalThis porque cada atualização cria
// uma nova cópia deste módulo, e quem já importou continua com a primeira.
const glob = import.meta.glob('../assets/conquistas/**/*.png', { eager: true, import: 'default' });
const estado = (globalThis.__premiosDiagrameria ??= { mapa: {}, versao: 0, ouvintes: new Set() });
Object.assign(estado.mapa, glob);

export const spriteDoArquivo = (arquivo) => estado.mapa[`../assets/conquistas/${arquivo}`];

// Faz o componente desenhar de novo quando um PNG de prêmio muda
const assinar = (f) => {
  estado.ouvintes.add(f);
  return () => estado.ouvintes.delete(f);
};
export const usePremiosAtualizados = () => useSyncExternalStore(assinar, () => estado.versao);

if (import.meta.hot)
  import.meta.hot.accept(() => {
    estado.versao++;
    estado.ouvintes.forEach((f) => f());
  });
