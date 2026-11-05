import { createContext, useContext, useEffect, useReducer } from 'react';
import { estadoInicial, migrar, reducer } from './reducer.js';
import { setVolumeEfeitos } from '../lib/sfx.js';
import { setVolumeMusica } from '../lib/musica.js';
import { contas } from '../lib/conta.js';

const CHAVE = 'diagrameria-save-v1';
const Ctx = createContext(null);

function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) return migrar(JSON.parse(raw));
  } catch {
    /* sem storage: começa do zero */
  }
  return estadoInicial();
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, carregar);

  // Salva com atraso para não gravar a cada movimento de arraste
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(state));
        // logado: o progresso também vai para a conta
        if (state.perfil.conta) contas.salvarProgresso(state.perfil.conta.email, { ...state, sessao: null });
      } catch {
        /* ignora */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => setVolumeEfeitos(state.config.efeitos / 100), [state.config.efeitos]);
  useEffect(() => setVolumeMusica(state.config.musica / 100), [state.config.musica]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useGame = () => useContext(Ctx);
