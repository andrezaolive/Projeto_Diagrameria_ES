import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErroDoJogo from './components/ErroDoJogo.jsx';
import { GameProvider } from './state/GameContext.jsx';
import './styles/global.css';
import { sortearMascoteFeliz } from './data/mascote.js';

// favicon: um dos dois mascotes felizes, sorteado a cada vez que o jogo abre
// (public/favicon.png fica de reserva até o script carregar)
const icone = document.querySelector('link[rel="icon"]');
if (icone) icone.href = sortearMascoteFeliz();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* erro de renderização ou do reducer: mostra o que aconteceu em vez da tela vazia */}
    <ErroDoJogo>
      <GameProvider>
        <App />
      </GameProvider>
    </ErroDoJogo>
  </StrictMode>,
);
