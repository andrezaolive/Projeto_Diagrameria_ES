import { useMemo } from 'react';
import { PALETTE } from '../art/palette.js';
import { camadasDoIcone, logoDaEmpresa } from '../lib/logos.js';

// Logo da empresa do pedido: quadradinho 16x16 com contorno, cor de fundo e um icone ligado ao
// nome da empresa (ver lib/logos.js). Escalado sem suavizacao.
export default function LogoEmpresa({ nome, tamanho = 24, className = '' }) {
  const { icone, fundo } = logoDaEmpresa(nome);
  const camadas = useMemo(() => camadasDoIcone(icone), [icone]);
  return (
    <svg
      className={`logo-empresa ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Logo de ${nome}`}
    >
      <rect x="0" y="0" width="16" height="16" fill={PALETTE.ink} />
      <rect x="1" y="1" width="14" height="14" fill={fundo} />
      <path d="M1 1h14v1H1z" fill={PALETTE.cream} opacity="0.35" />
      {camadas.map(({ cor, d }) => (
        <path key={cor} d={d} fill={cor} />
      ))}
    </svg>
  );
}
