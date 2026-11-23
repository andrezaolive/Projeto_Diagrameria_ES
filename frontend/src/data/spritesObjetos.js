import { avisarSpritesNovos, registrarSprites, spriteDoGrupo } from './spritesVivos.js';

// PNGs dos objetos do escritório e da sala (assets/objetos/, gerados por scripts/gen-assets.mjs e
// editáveis à mão): trocam na hora no `npm run dev` (data/spritesVivos.js)
registrarSprites('objetos', import.meta.glob('../assets/objetos/*.png', { eager: true, import: 'default' }));
export const urlDoObjeto = (nome) => spriteDoGrupo('objetos', `../assets/objetos/${nome}.png`);

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
