import { avisarSpritesNovos, registrarSprites, spriteDoGrupo, useSpritesAtualizados } from './spritesVivos.js';

// PNGs dos prêmios das conquistas (assets/conquistas/<subpasta>/, ver art/conquistas.js). São
// editáveis à mão: no `npm run dev`, salvar um deles troca o desenho na hora, sem recarregar a
// página (data/spritesVivos.js).
registrarSprites('premios', import.meta.glob('../assets/conquistas/**/*.png', { eager: true, import: 'default' }));

export const spriteDoArquivo = (arquivo) => spriteDoGrupo('premios', `../assets/conquistas/${arquivo}`);

// Faz o componente desenhar de novo quando um PNG muda (qualquer grupo de data/spritesVivos.js)
export const usePremiosAtualizados = useSpritesAtualizados;

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
