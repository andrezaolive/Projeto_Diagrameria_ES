import React from 'react';
import { useConfig } from '../contextos/ConfigContexto';

// Camadas visuais globais: raios de luz e efeito de monitor CRT.
// Ficam por cima de tudo, mas não bloqueiam cliques.
function Raios({ x, y, tamanho, cor, duracao }) {
  const mascara = 'radial-gradient(circle, #000 0%, rgba(0,0,0,.55) 28%, transparent 66%)';
  return (
    <div
      className="dg-raios"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: tamanho,
        height: tamanho,
        marginLeft: -tamanho / 2,
        marginTop: -tamanho / 2,
        pointerEvents: 'none',
        zIndex: 5,
        mixBlendMode: 'screen',
        background: `repeating-conic-gradient(from 0deg, ${cor} 0deg 5deg, transparent 5deg 15deg)`,
        WebkitMaskImage: mascara,
        maskImage: mascara,
        animation: `dgspin ${duracao}s linear infinite`,
      }}
    />
  );
}

export default function Ambiente() {
  const { telas } = useConfig();

  return (
    <>
      {telas.raios && (
        <>
          <Raios x="35vw" y="42vh" tamanho={1300} cor="rgba(95,224,224,0.13)" duracao={90} />
          <Raios x="88vw" y="22vh" tamanho={560} cor="rgba(247,207,90,0.2)" duracao={60} />
        </>
      )}
      {telas.crt && <div className="dg-crt" aria-hidden="true" />}
    </>
  );
}
