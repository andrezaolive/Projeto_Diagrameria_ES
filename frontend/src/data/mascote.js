import feliz1 from '../assets/sprites/mascote-feliz-50x50.png';
import feliz2 from '../assets/sprites/mascote-feliz2-50x50.png';

// Os dois desenhos do mascote feliz (acenando e com as mãos na cintura). Onde ele aparece (menu,
// favicon e a reação "feliz" do resultado), o jogo sorteia um deles a cada vez.
export const MASCOTES_FELIZES = [feliz1, feliz2];
export const sortearMascoteFeliz = (aleatorio = Math.random) => MASCOTES_FELIZES[Math.floor(aleatorio() * MASCOTES_FELIZES.length)];
