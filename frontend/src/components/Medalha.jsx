import { PALETTE, METAIS, TINTAS } from '../art/palette.js';

// Broche da coleção: moeda 12x12 com o número (1 ouro, 2 prata, 3 bronze) pendurada numa fita
// vermelha, em pixel art (12x17 pixels de arte), como em Coleção_pedido_referencia.png.
const DIGITOS = {
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
};
const FITA = ['krrddk', 'krrddk', 'krrddk', 'krrddk', 'krrddk', 'krrddk', 'kr..dk', 'kk..kk'];
const COR_FITA = { k: PALETTE.ink, r: PALETTE.rose, d: TINTAS.vermelho };

function pixels(medalha) {
  const metal = METAIS[medalha.id];
  const px = [];
  // fita atrás da moeda (linhas 9 a 16)
  FITA.forEach((linha, j) => [...linha].forEach((ch, i) => ch !== '.' && px.push([3 + i, 9 + j, COR_FITA[ch]])));
  // moeda: contorno, brilho em cima à esquerda, sombra embaixo à direita
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - 6, dy = y + 0.5 - 6, d = Math.hypot(dx, dy);
      if (d > 6) continue;
      const cor = d > 4.9 ? PALETTE.ink : dx + dy < -3.5 ? metal.brilho : dx + dy > 3.5 ? metal.sombra : metal.base;
      px.push([x, y, cor]);
    }
  DIGITOS[medalha.numero].forEach((linha, j) => [...linha].forEach((ch, i) => ch === '#' && px.push([5 + i, 4 + j, metal.numero])));
  return px;
}

export default function Medalha({ medalha, tamanho = 48, className = '' }) {
  if (!medalha) return null;
  return (
    <svg
      className={`medalha medalha-${medalha.id} ${className}`}
      width={tamanho}
      height={(tamanho * 17) / 12}
      viewBox="0 0 12 17"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Medalha de ${medalha.nome.toLowerCase()}`}
    >
      {pixels(medalha).map(([x, y, cor], k) => <rect key={k} x={x} y={y} width="1" height="1" fill={cor} />)}
    </svg>
  );
}
