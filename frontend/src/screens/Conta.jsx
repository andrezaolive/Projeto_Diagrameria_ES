import { useState } from 'react';
import { Botao, Modal } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { migrar } from '../state/reducer.js';
import { contas } from '../lib/conta.js';
import './perfil.css';

const TITULOS = {
  registrar: ['REGISTRO.EXE', 'CRIAR CONTA'],
  entrar: ['LOGIN.EXE', 'ENTRAR'],
  alterar: ['CONTA.EXE', 'ALTERAR CONTA'],
};

// Registro, login e alteração de e-mail/senha
export default function Conta({ modo, onVoltar, onTrocarModo }) {
  const { state, dispatch } = useGame();
  const emailAtual = state.perfil.conta?.email ?? '';
  const [f, setF] = useState({ email: modo === 'alterar' ? emailAtual : '', senha: '', novaSenha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);
  const campo = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setOk('');
    const senhaNova = modo === 'alterar' ? f.novaSenha : f.senha;
    if ((modo === 'registrar' || (modo === 'alterar' && f.novaSenha)) && senhaNova !== f.confirmar) {
      setErro('As senhas não conferem.');
      return;
    }
    setEnviando(true);
    try {
      if (modo === 'registrar') {
        const email = await contas.registrar(f.email, f.senha, { ...state, sessao: null });
        dispatch({ type: 'ENTRAR_CONTA', email });
        onVoltar();
      } else if (modo === 'entrar') {
        const save = await contas.entrar(f.email, f.senha);
        const email = f.email.trim().toLowerCase();
        if (save) dispatch({ type: 'CARREGAR', state: migrar({ ...save, sessao: null, perfil: { ...save.perfil, conta: { email } } }) });
        else dispatch({ type: 'ENTRAR_CONTA', email });
        onVoltar();
      } else {
        const mudouEmail = f.email.trim().toLowerCase() !== emailAtual;
        if (!mudouEmail && !f.novaSenha) {
          setErro('Nada para alterar.');
          return;
        }
        const email = await contas.alterar(emailAtual, f.senha, { email: mudouEmail ? f.email : null, senha: f.novaSenha || null });
        dispatch({ type: 'ENTRAR_CONTA', email });
        setF((x) => ({ ...x, email, senha: '', novaSenha: '', confirmar: '' }));
        setOk('Conta atualizada!');
      }
    } catch (err) {
      setErro(err.message || 'Algo deu errado.');
    } finally {
      setEnviando(false);
    }
  };

  const [janela, titulo] = TITULOS[modo];
  return (
    // janela sobre o menu (o menu continua visível ao fundo)
    <Modal titulo={janela} w={700} h={580} onFechar={onVoltar}>
      <form className="conta" onSubmit={enviar}>
        <h2 className="titulo-px">{titulo}</h2>
        <label>
          <span>E-mail</span>
          <input className="px-campo" type="email" value={f.email} onChange={campo('email')} autoComplete="email" autoFocus required />
        </label>
        <label>
          <span>{modo === 'alterar' ? 'Senha atual' : 'Senha'}</span>
          <input
            className="px-campo"
            type="password"
            value={f.senha}
            onChange={campo('senha')}
            autoComplete={modo === 'registrar' ? 'new-password' : 'current-password'}
            required
          />
        </label>
        {modo === 'alterar' && (
          <label>
            <span>Nova senha</span>
            <input className="px-campo" type="password" value={f.novaSenha} onChange={campo('novaSenha')} autoComplete="new-password" placeholder="deixe vazio para manter" />
          </label>
        )}
        {(modo === 'registrar' || modo === 'alterar') && (
          <label>
            <span>Confirmar senha</span>
            <input
              className="px-campo"
              type="password"
              value={f.confirmar}
              onChange={campo('confirmar')}
              autoComplete="new-password"
              required={modo === 'registrar' || !!f.novaSenha}
            />
          </label>
        )}
        {erro && <p className="msg erro" role="alert">{erro}</p>}
        {ok && <p className="msg ok" role="status">{ok}</p>}
        <div className="rodape">
          {modo === 'registrar' && <button type="button" className="link-px" onClick={() => onTrocarModo('entrar')}>Já tenho conta</button>}
          {modo === 'entrar' && <button type="button" className="link-px" onClick={() => onTrocarModo('registrar')}>Criar conta</button>}
          <span className="espaco" />
          <Botao type="button" variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>
          <Botao type="submit" variante="menta" disabled={enviando}>{modo === 'alterar' ? 'Salvar' : modo === 'entrar' ? 'Entrar' : 'Registrar'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
