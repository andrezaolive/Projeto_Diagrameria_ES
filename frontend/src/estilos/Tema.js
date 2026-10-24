// Identidade visual do Diagrameria: escritório antigo, pixel art, luz de abajur.
const ink = '#1a1020';

const fontes = {
  titulo: "'Pixelify Sans', 'Courier New', monospace",
  texto: "'VT323', 'Courier New', monospace",
};

const cores = {
  contorno: ink,
  fundoProfundo: '#140c18',
  fundoQuarto: '#2e1a33',
  roxo: '#3a1f3d',
  painel: '#43244a',
  painelEscuro: '#341c3a',
  barraEscura: '#2b1a30',
  laranja: '#f5a25a',
  vermelho: '#c8323c',
  rosa: '#e56a9a',
  rosaForte: '#d6407a',
  amarelo: '#f7cf5a',
  creme: '#f4f0ea',
  lavanda: '#d8c6e0',
  lavandaApagada: '#b8a3c4',
  cinzaClaro: '#c3bfcc',
  cinza: '#7c7888',
  mesa: '#6b6573',
  azulCrt: '#4a52b8',
  azulEscuro: '#1d1f72',
  azulTexto: '#3b2fa0',
  ciano: '#5fe0e0',
  verde: '#8fd0c4',
  verdeEscuro: '#2d6b66',

  // Nomes antigos (compatibilidade)
  primaria: '#c8323c',
  primariaEscura: ink,
  sucesso: '#8fd0c4',
  alerta: '#f5a25a',
  perigo: '#c8323c',
  textoEscuro: ink,
};

const baseBotao = {
  fontFamily: fontes.titulo,
  fontWeight: 700,
  fontSize: '14px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  padding: '8px 14px',
  border: `4px solid ${ink}`,
  borderRadius: 0,
  lineHeight: 1.1,
};

const botao = {
  neutro: { ...baseBotao, background: cores.painel, color: cores.creme, boxShadow: 'inset 0 0 0 2px #6e2a6b' },
  primario: {
    ...baseBotao,
    background: cores.vermelho,
    color: cores.laranja,
    border: `4px solid ${cores.rosa}`,
    boxShadow: `0 0 0 3px ${ink}`,
  },
  secundario: {
    ...baseBotao,
    background: cores.rosaForte,
    color: cores.azulTexto,
    border: `4px solid ${cores.vermelho}`,
    boxShadow: `0 0 0 3px ${ink}`,
  },
  sucesso: { ...baseBotao, background: cores.verde, color: ink, boxShadow: `inset 0 0 0 2px ${cores.verdeEscuro}` },
  perigo: { ...baseBotao, background: cores.painelEscuro, color: cores.rosa, boxShadow: `inset 0 0 0 2px ${cores.vermelho}` },
  amarelo: { ...baseBotao, background: cores.amarelo, color: ink, boxShadow: 'inset 0 0 0 2px #c9a227' },
};

// Título grande no estilo "logo de jogo"
function tituloPixel(tamanho = 28, cor = cores.laranja, sombra = cores.vermelho) {
  return {
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: `${tamanho}px`,
    color: cor,
    textShadow: `${Math.max(2, Math.round(tamanho / 14))}px ${Math.max(2, Math.round(tamanho / 14))}px 0 ${sombra}`,
    letterSpacing: '1px',
    margin: 0,
    lineHeight: 1,
  };
}

// Rótulo de seção (ex.: "SOM", "TELA")
const rotulo = {
  fontFamily: fontes.titulo,
  fontWeight: 700,
  fontSize: '16px',
  color: cores.rosa,
  letterSpacing: '1px',
  textTransform: 'uppercase',
};

export const tema = {
  fontes,
  cores,
  botao,
  tituloPixel,
  rotulo,
  estilosBotao: botao.neutro,
  estilosJanela: {
    border: `4px solid ${cores.vermelho}`,
    boxShadow: `0 0 0 3px ${ink}, 8px 8px 0 3px rgba(0,0,0,0.5)`,
    borderRadius: 0,
    backgroundColor: cores.roxo,
  },
};
