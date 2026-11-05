import { useEffect } from 'react';
import keyart from '../assets/scenes/splash-keyart-1024x1024.png';
import { sfx } from '../lib/sfx.js';
import './abertura.css';

export default function Splash({ onContinuar }) {
  useEffect(() => {
    const tecla = () => { sfx.ligar(); onContinuar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onContinuar]);

  return (
    <div className="tela splash" onClick={() => { sfx.ligar(); onContinuar(); }}>
      <img src={keyart} alt="Diagrameria" className="splash-keyart" width={600} height={600} />
      <p className="splash-aperte piscar">APERTE EM QUALQUER LUGAR</p>
    </div>
  );
}
