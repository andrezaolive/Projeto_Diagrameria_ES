import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext.jsx';

// Linhas de velocidade (estilo anime) por cima da tela enquanto o café faz efeito.
// Desenhadas num canvas pequeno (1 px = 1 pixel de arte de 4 px) e ampliadas sem suavização,
// com o alfa "limiarizado" para ficar pixelado de verdade. Transparência de 50% pelo CSS.
const W = 320, H = 180; // palco 1280×720 / 4
const COR = [251, 247, 255]; // cream da paleta
const QUADRO_MS = 1000 / 12; // 12 quadros por segundo, como animação desenhada
// onde a ponta de cada linha para: fração da distância do centro até a borda (1 = na borda)
export const BORDA = { min: 0.72, max: 0.88 };
export const LINHAS_POR_TIPO = { descafeinado: 26, normal: 38, forte: 56 }; // café mais forte, mais linhas

// Uma linha: cunha que nasce fora da tela e afina até a ponta, apontando para o centro
function desenhar(ctx, n, aleatorio) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  const cx = W / 2, cy = H / 2;
  const fora = Math.hypot(cx, cy) + 4; // raio que já está fora da tela
  for (let i = 0; i < n; i++) {
    const ang = aleatorio() * Math.PI * 2;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    // distância do centro até a borda da tela nessa direção; a ponta fica perto da borda
    // (entra só 12–28% do caminho até o centro), então as linhas ficam nas bordas
    const borda = Math.min(cos ? cx / Math.abs(cos) : Infinity, sin ? cy / Math.abs(sin) : Infinity);
    const dentro = BORDA.min + aleatorio() * (BORDA.max - BORDA.min);
    const tx = cx + cos * borda * dentro, ty = cy + sin * borda * dentro;
    const ox = cx + Math.cos(ang) * fora, oy = cy + Math.sin(ang) * fora;
    const largura = 0.6 + aleatorio() * 2.4; // meia-largura na base
    const px = -Math.sin(ang) * largura, py = Math.cos(ang) * largura;
    ctx.beginPath();
    ctx.moveTo(ox + px, oy + py);
    ctx.lineTo(tx, ty);
    ctx.lineTo(ox - px, oy - py);
    ctx.closePath();
    ctx.fill();
  }
  // sem meio-tom: cada pixel é cheio ou vazio
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const cheio = d[i + 3] >= 110;
    d[i] = COR[0]; d[i + 1] = COR[1]; d[i + 2] = COR[2];
    d[i + 3] = cheio ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
}

export default function VelocidadeCafe() {
  const tipo = useGame().state.cafe.efeito?.tipo ?? null;
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!tipo || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const n = LINHAS_POR_TIPO[tipo] ?? LINHAS_POR_TIPO.normal;
    desenhar(ctx, n, Math.random);
    // movimento reduzido: fica um quadro parado
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, ultimo = 0;
    const passo = (t) => {
      if (t - ultimo >= QUADRO_MS) {
        ultimo = t;
        desenhar(ctx, n, Math.random);
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [tipo]);
  if (!tipo) return null;
  return <canvas ref={ref} className="velocidade-cafe" width={W} height={H} aria-hidden="true" />;
}
