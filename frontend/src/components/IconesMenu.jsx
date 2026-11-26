import engrenagem from '../assets/ui/menu-engrenagem-16.png';
import grafico from '../assets/ui/menu-grafico-16.png';
import medalha from '../assets/ui/menu-medalha-12x17.png';

// Ícones dos botões da tela inicial (Referência_tela_inicial.png): engrenagem (configurações),
// gráfico de barras (estatísticas) e medalha (conquistas). São PNGs editáveis à mão em
// assets/ui/menu-*.png (não são gerados pelo `npm run assets`), ampliados 5× no jogo.
const Icone = ({ src, w, h }) => (
  <span className="menu-icone-moldura">
    <img src={src} alt="" className="pixel" width={w * 5} height={h * 5} draggable={false} />
  </span>
);

export const IconeEngrenagem = () => <Icone src={engrenagem} w={16} h={16} />;
export const IconeGrafico = () => <Icone src={grafico} w={16} h={16} />;
export const IconeMedalha = () => <Icone src={medalha} w={12} h={17} />;
