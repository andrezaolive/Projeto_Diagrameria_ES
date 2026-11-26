import { useEffect, useRef, useState } from 'react';

// Corações do modo infinito (sessao.vidas), em pixel art 9x8 desenhada em SVG com cores da paleta.
// i = contorno, r = coração, c = brilho. O coração perdido fica vazio (plum) e pisca ao sumir.
const CORACAO = [
  '.iii.iii.',
  'ircriirri',
  'icrrrrrri',
  'irrrrrrri',
  '.irrrrri.',
  '..irrri..',
  '...iri...',
  '....i....',
];
const CHEIO = { i: 'var(--c-ink)', r: 'var(--c-rose)', c: 'var(--c-cream)' };
const VAZIO = { i: 'var(--c-ink)', r: 'var(--c-plum)', c: 'var(--c-plum)' };

function Coracao({ cheio, perdendo }) {
  const cores = cheio ? CHEIO : VAZIO;
  return (
    <svg className={`coracao ${perdendo ? 'perdendo' : ''}`} viewBox="0 0 9 8" width={36} height={32} shapeRendering="crispEdges" aria-hidden="true">
      {CORACAO.flatMap((linha, y) =>
        [...linha].map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={cores[ch]} />)),
      )}
    </svg>
  );
}

export default function Coracoes({ vidas, total }) {
  // o coração que acabou de sumir pisca uma vez
  const antes = useRef(vidas);
  const [perdido, setPerdido] = useState(null);
  useEffect(() => {
    if (vidas < antes.current) setPerdido({ indice: vidas, n: Date.now() });
    antes.current = vidas;
  }, [vidas]);
  return (
    <div className="coracoes" role="status" aria-label={`${vidas} de ${total} corações`} title="Perde um coração quando um cliente vai embora ou quando entrega atrasado">
      {Array.from({ length: total }, (_, i) => (
        <Coracao key={i === perdido?.indice ? perdido.n : i} cheio={i < vidas} perdendo={i === perdido?.indice} />
      ))}
    </div>
  );
}
