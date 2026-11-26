import { useSyncExternalStore } from 'react';

// Sprites que trocam na hora no `npm run dev`: salvar um PNG não recarrega a página (o jogo continua
// onde estava). Cada grupo (prêmios, objetos, cápsulas, mascote) tem um módulo pequeno que só faz o
// import.meta.glob dos PNGs, registra aqui e se aceita no HMR (`import.meta.hot.accept`), avisando as
// telas para desenhar de novo. Sem isso, o PNG mudado subia até o reducer e o Vite recarregava tudo.
// O estado fica em globalThis porque cada atualização cria uma cópia nova dos módulos, e quem já
// importou continua com a primeira.
const estado = (globalThis.__spritesDiagrameria ??= { mapas: {}, versao: 0, ouvintes: new Set() });

export function registrarSprites(grupo, glob) {
  estado.mapas[grupo] = { ...(estado.mapas[grupo] ?? {}), ...glob };
}
export const spriteDoGrupo = (grupo, caminho) => estado.mapas[grupo]?.[caminho];

export function avisarSpritesNovos() {
  estado.versao++;
  estado.ouvintes.forEach((f) => f());
}

// Faz o componente desenhar de novo quando qualquer um desses PNGs muda
const assinar = (f) => {
  estado.ouvintes.add(f);
  return () => estado.ouvintes.delete(f);
};
export const useSpritesAtualizados = () => useSyncExternalStore(assinar, () => estado.versao);
