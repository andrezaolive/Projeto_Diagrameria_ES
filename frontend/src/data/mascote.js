import { avisarSpritesNovos, registrarSprites, spriteDoGrupo } from './spritesVivos.js';

// Sprites do mascote (assets/sprites/mascote-<nome>-50x50.png, desenhados à mão pela equipe): trocam
// na hora no `npm run dev` (data/spritesVivos.js). Quem guarda um sorteio guarda o NOME, e não a URL,
// para pegar o desenho novo quando o PNG muda.
registrarSprites('mascote', import.meta.glob('../assets/sprites/mascote-*-50x50.png', { eager: true, import: 'default' }));
export const spriteMascote = (nome) => spriteDoGrupo('mascote', `../assets/sprites/mascote-${nome}-50x50.png`);

// Os dois desenhos do mascote feliz (acenando e com as mãos na cintura). Onde ele aparece (menu,
// favicon e a reação "feliz" do resultado), o jogo sorteia um deles a cada vez.
export const NOMES_FELIZES = ['feliz', 'feliz2'];
export const sortearNomeFeliz = (aleatorio = Math.random) => NOMES_FELIZES[Math.floor(aleatorio() * NOMES_FELIZES.length)];
export const sortearMascoteFeliz = (aleatorio = Math.random) => spriteMascote(sortearNomeFeliz(aleatorio));

if (import.meta.hot) import.meta.hot.accept(() => avisarSpritesNovos());
