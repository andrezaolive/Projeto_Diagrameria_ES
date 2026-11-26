import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { registrarAcao } from '../components/ErroDoJogo.jsx';
import { estadoInicial, migrar, reducer } from './reducer.js';
import { setVolumeEfeitos } from '../lib/sfx.js';
import { setVolumeMusica } from '../lib/musica.js';
import { contas } from '../lib/conta.js';

const CHAVE = 'diagrameria-save-v1';
// Logado, o progresso também vai para a conta no servidor, mas no máximo uma vez a cada
// INTERVALO_CONTA (o localStorage continua gravando a cada mudança e é o save principal).
export const INTERVALO_CONTA = 15000;
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
  const [state, despachar] = useReducer(reducer, undefined, carregar);
  // guarda as últimas ações (ErroDoJogo mostra junto com o erro, se o jogo travar)
  const dispatch = useCallback((action) => {
    registrarAcao(action);
    despachar(action);
  }, []);

  // Salva com atraso para não gravar a cada movimento de arraste
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(state));
      } catch {
        /* ignora */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  // Envio para a conta, juntando as mudanças: guarda o estado mais recente e manda um só.
  const conta = useRef({ state, pendente: false, enviando: false, ultimo: 0, timer: null });
  conta.current.state = state;

  const enviarParaConta = useCallback(async () => {
    const c = conta.current;
    clearTimeout(c.timer);
    c.timer = null;
    if (!c.pendente || c.enviando || !c.state.perfil.conta) return;
    c.pendente = false;
    c.enviando = true;
    c.ultimo = Date.now();
    try {
      await contas.salvarProgresso(c.state.perfil.conta.email, { ...c.state, sessao: null });
    } catch (e) {
      // sessão expirou (ou conta antiga, só deste navegador): sai da conta, o save local fica
      if (e.codigo === 'NAO_AUTENTICADO') despachar({ type: 'SAIR_CONTA' });
      else c.pendente = true; // sem conexão: tenta de novo no próximo salvamento
    } finally {
      c.enviando = false;
    }
  }, []);

  useEffect(() => {
    const c = conta.current;
    if (!state.perfil.conta) return;
    c.pendente = true;
    if (c.timer) return;
    c.timer = setTimeout(enviarParaConta, Math.max(300, c.ultimo + INTERVALO_CONTA - Date.now()));
  }, [state, enviarParaConta]);

  // Fechou ou trocou de aba: manda o que falta na hora
  useEffect(() => {
    const aoEsconder = () => document.visibilityState === 'hidden' && enviarParaConta();
    document.addEventListener('visibilitychange', aoEsconder);
    window.addEventListener('pagehide', enviarParaConta);
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder);
      window.removeEventListener('pagehide', enviarParaConta);
    };
  }, [enviarParaConta]);

  // Saiu da conta (botão Sair, resetar, sessão expirada): o token deixa de valer aqui
  const logado = !!state.perfil.conta;
  useEffect(() => {
    if (!logado) contas.sair();
  }, [logado]);

  useEffect(() => setVolumeEfeitos(state.config.efeitos / 100), [state.config.efeitos]);
  useEffect(() => setVolumeMusica(state.config.musica / 100), [state.config.musica]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useGame = () => useContext(Ctx);
