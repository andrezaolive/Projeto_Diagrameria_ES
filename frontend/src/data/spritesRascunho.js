import { avisarSpritesNovos, registrarSprites, spriteDoGrupo } from './spritesVivos.js';

// Cursor da folha de rascunho (assets/ui/rascunho/cursor-<lapis|borracha|caneta-COR>-12.png, 12×12,
// editáveis à mão; cópia em ../arte e sprites/ui/rascunho/): trocam na hora no `npm run dev`
registrarSprites('rascunho', import.meta.glob('../assets/ui/rascunho/cursor-*-12.png', { eager: true, import: 'default' }));
export const urlDoCursor = (nome) => spriteDoGrupo('rascunho', `../assets/ui/rascunho/cursor-${nome}-12.png`);

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
