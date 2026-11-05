import { useState } from 'react';
import { Botao, Modal } from '../components/ui.jsx';
import { EditorAvatar } from '../components/Avatar.jsx';
import { useGame } from '../state/GameContext.jsx';
import './perfil.css';

// Tela de nome: obrigatória na primeira vez que o jogo é aberto; depois serve para editar o perfil.
export default function Nome({ onConcluir, onCancelar }) {
  const { state, dispatch } = useGame();
  const primeiraVez = !state.perfil.nome;
  const [nome, setNome] = useState(state.perfil.nome ?? '');
  const [avatar, setAvatar] = useState(state.perfil.avatar);
  const valido = nome.trim().length > 0;

  const confirmar = (e) => {
    e?.preventDefault();
    if (!valido) return;
    dispatch({ type: 'DEFINIR_PERFIL', nome, avatar });
    onConcluir();
  };

  return (
    // janela sobre o menu (o menu continua visível ao fundo)
    <Modal titulo="PERFIL_JOGADOR.EXE" w={1020} h={580} onFechar={primeiraVez ? undefined : onCancelar}>
      <form className="tela-nome" onSubmit={confirmar}>
        <h2 className="titulo-px">{primeiraVez ? 'BEM-VINDO(A)!' : 'SEU PERFIL'}</h2>
        {primeiraVez && <p className="dica">Antes de abrir a agência, diga como devemos te chamar.</p>}
        <EditorAvatar avatar={avatar} onChange={setAvatar} />
        <div className="linha-nome">
          <label htmlFor="campo-nome">Nome</label>
          <input
            id="campo-nome"
            className="px-campo"
            value={nome}
            maxLength={20}
            placeholder="fulano de tal"
            autoFocus
            autoComplete="off"
            onChange={(e) => setNome(e.target.value)}
          />
          {!primeiraVez && (
            <Botao type="button" variante="claro" som="voltar" onClick={onCancelar}>Cancelar</Botao>
          )}
          <Botao type="submit" variante="menta" disabled={!valido}>Confirmar</Botao>
        </div>
      </form>
    </Modal>
  );
}
