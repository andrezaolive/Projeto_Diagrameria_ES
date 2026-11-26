import { avisarSpritesNovos, registrarSprites, spriteDoGrupo } from './spritesVivos.js';

// Ícones 16×16 das cápsulas de café (assets/ui/capsula-*-16.png): trocam na hora no `npm run dev`
registrarSprites('capsulas', import.meta.glob('../assets/ui/capsula-*-16.png', { eager: true, import: 'default' }));
export const urlDaCapsula = (tipo) => spriteDoGrupo('capsulas', `../assets/ui/capsula-${tipo}-16.png`);

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
