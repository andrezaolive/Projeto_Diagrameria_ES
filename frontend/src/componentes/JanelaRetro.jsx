import React from 'react';
import { tema } from '../estilos/Tema';

const { cores, fontes } = tema;

// variante "os"  -> janela cinza de sistema antigo (barra azul)
// variante "jogo" -> painel do jogo (moldura vermelha, usado em modais)
export default function JanelaRetro({
  titulo,
  subtitulo,
  direita,
  variante = 'os',
  corTitulo,
  aoFechar,
  children,
  estilo,
  estiloCorpo,
}) {
  const jogo = variante === 'jogo';

  return (
    <section style={{ ...(jogo ? estilos.jogo : estilos.os), ...estilo }}>
      <header style={{ ...(jogo ? estilos.barraJogo : estilos.barraOs), background: corTitulo || (jogo ? cores.barraEscura : cores.azulEscuro) }}>
        <h2 style={jogo ? estilos.tituloJogo : estilos.tituloOs}>{titulo}</h2>
        {subtitulo && <span style={estilos.subtitulo}>{subtitulo}</span>}
        <div style={estilos.direita}>
          {direita}
          {!jogo && !aoFechar && (
            <span aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
              <i style={estilos.quadradinho} />
              <i style={estilos.quadradinho} />
              <i style={estilos.quadradinho} />
            </span>
          )}
          {aoFechar && (
            <button onClick={aoFechar} aria-label="Fechar" style={estilos.fechar}>
              ×
            </button>
          )}
        </div>
      </header>
      <div style={{ ...(jogo ? estilos.corpoJogo : estilos.corpoOs), ...estiloCorpo }}>{children}</div>
    </section>
  );
}

const estilos = {
  os: {
    display: 'flex',
    flexDirection: 'column',
    background: cores.cinzaClaro,
    border: `3px solid ${cores.contorno}`,
    boxShadow: `inset -2px -2px 0 ${cores.cinza}, inset 2px 2px 0 #fff, 4px 4px 0 rgba(0,0,0,0.45)`,
    color: cores.contorno,
    minHeight: 0,
  },
  barraOs: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: 3,
    padding: '4px 10px',
    color: '#fff',
  },
  tituloOs: { margin: 0, fontFamily: fontes.titulo, fontWeight: 700, fontSize: 14, letterSpacing: 0.5 },
  corpoOs: {
    flex: 1,
    margin: '0 4px 4px',
    background: cores.creme,
    border: `3px solid ${cores.contorno}`,
    padding: 14,
    minHeight: 0,
  },
  quadradinho: { width: 12, height: 12, background: cores.cinzaClaro, border: `2px solid ${cores.contorno}`, display: 'block' },

  jogo: {
    display: 'flex',
    flexDirection: 'column',
    background: cores.roxo,
    border: `4px solid ${cores.vermelho}`,
    boxShadow: `0 0 0 4px ${cores.contorno}, 10px 10px 0 4px rgba(0,0,0,0.5)`,
    color: cores.creme,
  },
  barraJogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 18px',
    borderBottom: `4px solid ${cores.contorno}`,
  },
  tituloJogo: { ...tema.tituloPixel(26), textTransform: 'uppercase' },
  corpoJogo: { padding: 0 },

  subtitulo: { fontFamily: fontes.texto, fontSize: 20, color: cores.lavandaApagada },
  direita: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 },
  fechar: {
    width: 38,
    height: 38,
    padding: 0,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 22,
    lineHeight: 1,
    background: cores.rosaForte,
    color: cores.azulTexto,
    border: `4px solid ${cores.vermelho}`,
    boxShadow: `0 0 0 3px ${cores.contorno}`,
  },
};
