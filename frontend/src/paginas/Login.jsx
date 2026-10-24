import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../contextos/Autenticacao';
import { tema } from '../estilos/Tema';
import MonitorMascote from '../componentes/MonitorMascote';
import BotaoConfig from '../componentes/BotaoConfig';
import PixelIcone from '../componentes/PixelIcone';

const { cores, fontes } = tema;

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
      <div style={estilos.canto}>
        <BotaoConfig />
      </div>

      <div style={estilos.sala}>
        {/* Cone de luz do abajur */}
        <div style={estilos.luz} aria-hidden="true" />

        {/* Lado esquerdo: monitor + mesa */}
        <div className="dg-login-arte" style={estilos.arte}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <MonitorMascote escala={0.95} />
          </div>
          <div style={estilos.tampo} aria-hidden="true" />
          <div style={estilos.planta} aria-hidden="true">
            <PixelIcone nome="plant" tamanho={7} />
          </div>
        </div>

        {/* Lado direito: título e formulário */}
        <div style={estilos.painel}>
          <h1 style={estilos.titulo}>Diagrameria</h1>
          <p style={estilos.tagline}>uma vida tranquila entre as 9 e as 5</p>

          <div style={estilos.card}>
            <p style={estilos.subtitulo}>
              {ehCadastro ? 'Crie sua conta para jogar' : 'Entre no balcão de pedidos'}
            </p>

            {erro && (
              <div role="alert" style={estilos.alertaErro}>
                {erro}
              </div>
            )}

            <form onSubmit={submeter} style={estilos.form}>
              {ehCadastro && (
                <div style={estilos.campo}>
                  <label htmlFor="login-nome" style={estilos.label}>Nome</label>
                  <input
                    id="login-nome"
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
                <label htmlFor="login-email" style={estilos.label}>E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={estilos.input}
                />
              </div>

              <div style={estilos.campo}>
                <label htmlFor="login-senha" style={estilos.label}>Senha</label>
                <input
                  id="login-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={ehCadastro ? 8 : undefined}
                  style={estilos.input}
                />
              </div>

              <button type="submit" disabled={enviando} style={{ ...tema.botao.primario, fontSize: 20, padding: '10px 0', marginTop: 6 }}>
                {enviando ? 'Processando...' : ehCadastro ? 'Cadastrar' : 'Entrar'}
              </button>
            </form>

            <button
              onClick={() => {
                setEhCadastro(!ehCadastro);
                setErro('');
              }}
              style={{ ...tema.botao.secundario, width: '100%', marginTop: 18, fontSize: 13 }}
            >
              {ehCadastro ? 'Já possui conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 24,
    backgroundColor: cores.roxo,
    color: cores.creme,
    fontFamily: fontes.texto,
  },
  canto: { position: 'absolute', top: 16, right: 16, zIndex: 30 },
  sala: {
    position: 'relative',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    width: '100%',
    maxWidth: 1040,
    padding: '48px 40px',
    background: cores.painel,
    border: `4px solid ${cores.contorno}`,
    boxShadow: '0 0 0 4px #2e1a33, 12px 12px 0 4px rgba(0,0,0,0.45)',
    overflow: 'hidden',
  },
  luz: {
    position: 'absolute',
    left: '14%',
    top: 0,
    width: 330,
    height: '100%',
    clipPath: 'polygon(40% 0, 62% 0, 100% 100%, 0 100%)',
    background:
      'linear-gradient(180deg, rgba(247,207,90,0.4), rgba(247,207,90,0.04)), repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 6px, transparent 6px 16px)',
    opacity: 0.7,
    pointerEvents: 'none',
  },
  arte: {
    position: 'relative',
    flex: '1 1 340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 340,
    justifyContent: 'flex-end',
  },
  tampo: {
    width: '100%',
    maxWidth: 420,
    height: 46,
    marginTop: -2,
    background: cores.mesa,
    border: `5px solid ${cores.contorno}`,
    clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0 100%)',
  },
  planta: { position: 'absolute', left: 0, bottom: 44 },
  painel: {
    position: 'relative',
    flex: '1 1 340px',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  titulo: { ...tema.tituloPixel(56), textTransform: 'uppercase' },
  tagline: { margin: '14px 0 22px', fontSize: 22, color: cores.lavanda },
  card: {
    width: '100%',
    background: cores.barraEscura,
    border: `4px solid ${cores.vermelho}`,
    boxShadow: `0 0 0 3px ${cores.contorno}`,
    padding: 22,
    textAlign: 'left',
  },
  subtitulo: { margin: '0 0 16px', ...tema.rotulo, fontSize: 15, textAlign: 'center' },
  alertaErro: {
    backgroundColor: cores.vermelho,
    color: cores.creme,
    border: `3px solid ${cores.contorno}`,
    padding: '8px 10px',
    fontSize: 20,
    marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  campo: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontFamily: fontes.titulo, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: cores.laranja },
  input: {
    padding: '8px 10px',
    border: `4px solid ${cores.contorno}`,
    borderRadius: 0,
    backgroundColor: cores.contorno,
    boxShadow: 'inset 0 0 0 2px #6e2a6b',
    color: cores.creme,
    fontSize: 24,
  },
};
