import { avisarSpritesNovos, registrarSprites, spriteDoGrupo } from './spritesVivos.js';

// Fundos de tela do computador (assets/scenes/wallpaper-<id>-320x180.png, gerados por
// scripts/gen-assets.mjs): trocam na hora no `npm run dev` (data/spritesVivos.js)
registrarSprites('fundos', import.meta.glob('../assets/scenes/wallpaper-*-320x180.png', { eager: true, import: 'default' }));
export const urlDoFundo = (id) => spriteDoGrupo('fundos', `../assets/scenes/wallpaper-${id}-320x180.png`);

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
