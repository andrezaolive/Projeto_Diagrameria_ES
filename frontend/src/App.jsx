import { useEffect, useState } from 'react';
import { Palco } from './components/ui.jsx';
import Splash from './screens/Splash.jsx';
import Menu from './screens/Menu.jsx';
import Nome from './screens/Nome.jsx';
import Conta from './screens/Conta.jsx';
import Modos from './screens/Modos.jsx';
import Calendario from './screens/Calendario.jsx';
import Jogo from './screens/Jogo.jsx';
import { useGame } from './state/GameContext.jsx';
import { EXCESSO_MENU_DB, LOOP_MENU, pararMusica, tocarMusica } from './lib/musica.js';
import musicaMenu from './assets/audio/musica-menu.mp3';

// telas que tocam a música do menu (o jogo em si fica em silêncio por enquanto)
const TELAS_MENU = ['menu', 'nome', 'conta', 'modos', 'calendario'];

// Fluxo: splash -> (nome, na primeira vez) -> menu -> modos -> (calendário ->) jogo (escritório <-> computador)
// Do menu: perfil (editar nome/avatar) e conta (registrar / entrar / alterar)
export default function App() {
  const { state, dispatch } = useGame();
  const [tela, setTela] = useState('splash');
  const [modoConta, setModoConta] = useState('registrar');

  useEffect(() => {
    if (TELAS_MENU.includes(tela)) tocarMusica(musicaMenu, { loop: LOOP_MENU, excessoDb: EXCESSO_MENU_DB });
    else if (tela !== 'splash') pararMusica();
  }, [tela]);

  const iniciar = (modo, dia) => {
    dispatch({ type: 'INICIAR_SESSAO', modo, dia });
    setTela('jogo');
  };
  const abrirConta = (modo) => {
    setModoConta(modo);
    setTela('conta');
  };

  return (
    <Palco nivel={state.config.interface} vhs={{ ativo: state.config.vhsAtivo, intensidade: state.config.vhsIntensidade }}>
      {tela === 'splash' && <Splash onContinuar={() => setTela(state.perfil.nome ? 'menu' : 'nome')} />}
      {/* nome e conta abrem por cima do menu */}
      {(tela === 'menu' || tela === 'nome' || tela === 'conta') && (
        <Menu
          sobreposto={tela !== 'menu'}
          onJogar={() => setTela('modos')}
          onEditarPerfil={() => setTela('nome')}
          onConta={abrirConta}
          onResetado={() => setTela('nome')}
        />
      )}
      {tela === 'nome' && <Nome onConcluir={() => setTela('menu')} onCancelar={() => setTela('menu')} />}
      {tela === 'conta' && <Conta modo={modoConta} onVoltar={() => setTela('menu')} onTrocarModo={setModoConta} key={modoConta} />}
      {tela === 'modos' && (
        <Modos onInfinito={() => iniciar('infinito')} onCampanha={() => setTela('calendario')} onVoltar={() => setTela('menu')} />
      )}
      {tela === 'calendario' && <Calendario onEscolher={(dia) => iniciar('campanha', dia)} onVoltar={() => setTela('modos')} />}
      {tela === 'jogo' && <Jogo onMenu={() => setTela('menu')} onCalendario={() => setTela('calendario')} />}
    </Palco>
  );
}
