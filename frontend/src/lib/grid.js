// Grid invisível da área de montagem e geometria dos elementos.
export const GRID = 20;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 3;

export const snap = (v, grid = GRID) => Math.round(v / grid) * grid || 0; // evita -0

export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

// Tamanho de cada tipo de elemento (múltiplos do grid)
export const TAMANHOS = {
  ator: { w: 60, h: 100 },
  casoDeUso: { w: 160, h: 60 },
  classe: { w: 160, h: 100 },
  nota: { w: 140, h: 80 },
  sistema: { w: 360, h: 400 },
};

// Posição (canto superior esquerdo, já no grid) para soltar um elemento centrado no ponto do mundo
export function posicaoAoSoltar(tipo, wx, wy) {
  const { w, h } = TAMANHOS[tipo];
  return { x: snap(wx - w / 2), y: snap(wy - h / 2) };
}

// Zoom mantendo fixo o ponto (sx, sy) da tela
export function zoomEm(view, fator, sx, sy) {
  const zoom = clampZoom(view.zoom * fator);
  const k = zoom / view.zoom;
  return { zoom, x: sx - (sx - view.x) * k, y: sy - (sy - view.y) * k };
}

export const telaParaMundo = (view, sx, sy) => ({ x: (sx - view.x) / view.zoom, y: (sy - view.y) / view.zoom });

export const centro = (node) => {
  const { w, h } = TAMANHOS[node.tipo];
  return { x: node.x + w / 2, y: node.y + h / 2 };
};

// Ponto na borda do elemento na direção de (tx, ty), para as setas não entrarem nas formas
export function pontoNaBorda(node, tx, ty) {
  const { w, h } = TAMANHOS[node.tipo];
  const c = centro(node);
  const dx = tx - c.x, dy = ty - c.y;
  if (dx === 0 && dy === 0) return c;
  if (node.tipo === 'casoDeUso') {
    const t = 1 / Math.sqrt((dx / (w / 2)) ** 2 + (dy / (h / 2)) ** 2);
    return { x: c.x + dx * t, y: c.y + dy * t };
  }
  const t = Math.min(w / 2 / Math.abs(dx || 1e-9), h / 2 / Math.abs(dy || 1e-9));
  return { x: c.x + dx * t, y: c.y + dy * t };
}
