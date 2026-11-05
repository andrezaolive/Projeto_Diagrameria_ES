import { Botao } from '../components/ui.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { useGame } from '../state/GameContext.jsx';
import './perfil.css';

// Aba de perfil/login aberta pelo menu inicial
export default function Perfil({ onEditar, onConta, onEstatisticas, onFechar }) {
  const { state, dispatch } = useGame();
  const { nome, avatar, conta } = state.perfil;
  return (
    <div className="perfil">
      <button className="perfil-avatar" onClick={onEditar} title="Editar avatar e nome">
        <Avatar avatar={avatar} tamanho={160} />
        <span className="lapis">EDITAR</span>
      </button>
      <strong className="perfil-nome">{nome}</strong>

      {conta ? (
        <>
          <div className="perfil-email">
            <span title={conta.email}>{conta.email}</span>
            <Botao tamanho="pequeno" variante="claro" onClick={() => onConta('alterar')}>Alterar</Botao>
          </div>
          <div className="perfil-acoes">
            <Botao variante="menta" onClick={onEstatisticas}>Estatisticas</Botao>
            <Botao variante="claro" som="voltar" onClick={() => dispatch({ type: 'SAIR_CONTA' })}>Sair</Botao>
          </div>
        </>
      ) : (
        <>
          <div className="perfil-registro">
            <Botao variante="rosa" onClick={() => onConta('registrar')} aria-describedby="dica-registro">Registrar-se</Botao>
            <span className="tooltip" id="dica-registro" role="tooltip">
              faça seu registro para salvar seu progresso em qualquer navegador
            </span>
          </div>
          <button className="link-px" onClick={() => onConta('entrar')}>Já tenho conta · entrar</button>
        </>
      )}
      <Botao tamanho="pequeno" variante="claro" som="voltar" className="perfil-fechar" onClick={onFechar}>Fechar</Botao>
    </div>
  );
}
