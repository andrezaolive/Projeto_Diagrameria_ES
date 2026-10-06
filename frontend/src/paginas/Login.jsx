import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../contextos/Autenticacao';

export default function Login() {
  const [ehCadastro, setEhCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { entrar, cadastrar } = useAutenticacao();
  const navigate = useNavigate();

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      if (ehCadastro) {
        await cadastrar(nome.trim(), email.trim(), senha);
      } else {
        await entrar(email.trim(), senha);
      }
      navigate('/balcao');
    } catch (err) {
      setErro(err.mensagem || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={estilos.container}>
      <div style={estilos.card}>
        <h1 style={estilos.titulo}>Diagrameria</h1>
        <p style={estilos.subtitulo}>
          {ehCadastro ? 'Crie sua conta para jogar' : 'Entre no balcão de pedidos'}
        </p>

        {erro && <div style={estilos.alertaErro}>{erro}</div>}

        <form onSubmit={submeter} style={estilos.form}>
          {ehCadastro && (
            <div style={estilos.campo}>
              <label style={estilos.label}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                style={estilos.input}
              />
            </div>
          )}

          <div style={estilos.campo}>
            <label style={estilos.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={estilos.input}
            />
          </div>

          <div style={estilos.campo}>
            <label style={estilos.label}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={ehCadastro ? 8 : undefined}
              style={estilos.input}
            />
          </div>

          <button type="submit" disabled={enviando} style={estilos.botao}>
            {enviando ? 'Processando...' : ehCadastro ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => {
            setEhCadastro(!ehCadastro);
            setErro('');
          }}
          style={estilos.botaoTroca}
        >
          {ehCadastro ? 'Já possui conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

const estilos = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
  titulo: { margin: '0 0 8px 0', fontSize: '24px', textAlign: 'center' },
  subtitulo: { margin: '0 0 24px 0', fontSize: '14px', textAlign: 'center', color: '#94a3b8' },
  alertaErro: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 'bold' },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  },
  botao: {
    padding: '10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  botaoTroca: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
  },
};