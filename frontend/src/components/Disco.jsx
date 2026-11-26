// Ícone de disco em pixel art (SVG em grade de 16x16, só cores da paleta).
// `cor`: rótulo do centro; `girando`: anima enquanto toca.
export default function Disco({ cor = 'var(--c-blush)', tamanho = 64, girando = false }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={tamanho}
      height={tamanho}
      className={`disco ${girando ? 'girando' : ''}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* vinil: círculo em blocos */}
      <path d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2z" fill="var(--c-ink)" />
      {/* sulcos */}
      <path d="M5 3h6v1h1v1h1v6h-1v1h-1v1H5v-1H4v-1H3V5h1V4h1z" fill="var(--c-night)" />
      <path d="M6 4h4v1h1v1h1v4h-1v1h-1v1H6v-1H5v-1H4V6h1V5h1z" fill="var(--c-plum)" />
      {/* brilho */}
      <path d="M4 4h1v1H4zM3 6h1v2H3z" fill="var(--c-grape)" />
      {/* rótulo e furo */}
      <path d="M6 6h4v4H6z" fill={cor} />
      <path d="M7 7h2v2H7z" fill="var(--c-ink)" />
      <path d="M7 7h1v1H7z" fill="var(--c-cream)" />
    </svg>
  );
}
