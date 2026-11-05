import { useState } from 'react';
import escritorio from '../assets/scenes/office-320x180.png';
import mascote from '../assets/sprites/mascote-32x40.png';
import { Botao, Modal } from '../components/ui.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { useGame } from '../state/GameContext.jsx';
import Configuracoes from './Configuracoes.jsx';
import Perfil from './Perfil.jsx';
import Estatisticas from './Estatisticas.jsx';
import './abertura.css';
import './perfil.css';

export function FundoMenu() {
  return (
    <div className="fundo-menu">
      <img src={escritorio} alt="" className="pixel" />
    </div>
  );
}

// `sobreposto`: outra janela (nome/conta) está por cima; as janelas do menu ficam escondidas
// mas mantêm o estado, para voltar ao perfil depois de editar.
export default function Menu({ onJogar, onEditarPerfil, onConta, onResetado, sobreposto = false }) {
  const { state, dispatch } = useGame();
  const [modal, setModal] = useState(null);
  const { nome, avatar, conta } = state.perfil;

  const resetar = () => {
    dispatch({ type: 'RESETAR' });
    setModal(null);
    onResetado();
  };

  return (
    <div className="tela">
      <FundoMenu />
      <div className="menu">
        <h1 className="titulo-px logo">DIAGRAMERIA</h1>
        <p className="subtitulo">sua agência de diagramas sob demanda</p>
        <img src={mascote} alt="" className="mascote pixel flutuar" />
        <Botao variante="rosa" tamanho="grande" onClick={onJogar} autoFocus={!sobreposto}>
          Jogar
        </Botao>
        <div className="acoes">
          <Botao onClick={() => setModal('config')}>Configurações</Botao>
          <Botao onClick={() => setModal('creditos')}>Créditos</Botao>
        </div>
        <span className="versao">v0.1 · Eng. de Software II</span>
      </div>

      {/* aba de perfil/login no canto superior esquerdo */}
      <button className="menu-perfil" onClick={() => setModal('perfil')} aria-label="Abrir perfil">
        <Avatar avatar={avatar} tamanho={56} />
        <span>
          <strong>{nome}</strong>
          <small>{conta ? conta.email : 'sem conta · entrar'}</small>
        </span>
      </button>

      {!sobreposto && modal === 'perfil' && (
        <Modal titulo="PERFIL.EXE" w={520} h={conta ? 520 : 560} onFechar={() => setModal(null)}>
          <Perfil onEditar={onEditarPerfil} onConta={onConta} onEstatisticas={() => setModal('estatisticas')} onFechar={() => setModal(null)} />
        </Modal>
      )}
      {!sobreposto && modal === 'estatisticas' && (
        <Modal titulo="ESTATISTICAS.EXE" w={980} h={560} onFechar={() => setModal('perfil')}>
          <Estatisticas onVoltar={() => setModal('perfil')} />
        </Modal>
      )}
      {!sobreposto && modal === 'config' && (
        <Modal titulo="CONFIGURACOES.EXE" w={680} h={560} onFechar={() => setModal(null)}>
          <Configuracoes onFechar={() => setModal(null)} onResetar={() => setModal('reset')} />
        </Modal>
      )}
      {!sobreposto && modal === 'reset' && (
        <Modal titulo="RESETAR_DADOS.EXE" w={600} h={340} onFechar={() => setModal('config')}>
          <div className="confirmar-reset">
            <strong>APAGAR TODO O PROGRESSO?</strong>
            <span>
              Nome, avatar, dinheiro, campanha, itens da loja e estatísticas deste navegador serão apagados.
              {conta && ' O progresso guardado na sua conta continua lá.'} Não dá para desfazer.
            </span>
            <div className="rodape">
              <Botao variante="claro" som="voltar" onClick={() => setModal('config')} autoFocus>Cancelar</Botao>
              <Botao variante="rosa" onClick={resetar}>Resetar dados</Botao>
            </div>
          </div>
        </Modal>
      )}
      {!sobreposto && modal === 'creditos' && (
        <Modal titulo="CREDITOS.TXT" w={560} h={380} onFechar={() => setModal(null)}>
          <div className="creditos">
            <h3>Diagrameria</h3>
            <div>Engenharia de Software II</div>
            <h3>Arte e design</h3>
            <div>Equipe de Design</div>
            <h3>Desenvolvimento</h3>
            <div>Equipe Diagrameria</div>
            <div style={{ marginTop: 24 }}>
              <Botao tamanho="pequeno" onClick={() => setModal(null)}>Fechar</Botao>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
