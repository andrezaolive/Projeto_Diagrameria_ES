// Grid invisível da área de montagem e geometria dos elementos.
import { medidasClasse } from './membros.js';
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
  // diagrama de estados
  estadoInicial: { w: 40, h: 40 },
  estado: { w: 160, h: 60 },
  estadoFinal: { w: 40, h: 40 },
  decisao: { w: 120, h: 100 },
};

// Formas arredondadas: a seta para na borda da elipse/círculo, não no retângulo em volta
const ELIPTICOS = ['casoDeUso', 'estadoInicial', 'estadoFinal'];

// Só o sistema (fronteira do caso de uso) pode ser redimensionado: guarda `w`/`h` no próprio nó.
export const REDIMENSIONAVEIS = ['sistema'];
export const TAMANHO_MINIMO = { sistema: { w: 200, h: 160 } };

// Tamanho de um nó: o próprio (se redimensionado) ou o padrão do tipo
export const tamanho = (node) => {
  // a classe cresce com os atributos e métodos
  if (node.tipo === 'classe') {
    const { w, h } = medidasClasse(node);
    return { w, h };
  }
  // o estado alarga para caber o nome (mínimo 160, sempre no grid)
  if (node.tipo === 'estado') {
    const p = TAMANHOS.estado;
    return { w: Math.max(p.w, Math.ceil(((node.rotulo ?? '').length * 11 + 28) / GRID) * GRID), h: p.h };
  }
  // a decisão (losango) alarga para a pergunta caber na faixa do meio (com 100 de altura, ~75% da largura é útil)
  if (node.tipo === 'decisao') {
    const p = TAMANHOS.decisao;
    return { w: Math.max(p.w, Math.ceil(((node.rotulo ?? '').length * 10 + 20) / 0.75 / GRID) * GRID), h: p.h };
  }
  const p = TAMANHOS[node.tipo];
  return { w: node.w ?? p.w, h: node.h ?? p.h };
};
export const retangulo = (node) => ({ x: node.x, y: node.y, ...tamanho(node) });

// `a` inteiro dentro de `b`
export const contido = (a, b) => {
  const r = retangulo(a), s = retangulo(b);
  return r.x >= s.x && r.y >= s.y && r.x + r.w <= s.x + s.w && r.y + r.h <= s.y + s.h;
};
// `a` e `b` se encostam (área em comum)
export const sobrepoe = (a, b) => {
  const r = retangulo(a), s = retangulo(b);
  return r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
};

// Regras da fronteira do sistema: caso de uso dentro de um sistema; ator fora de todos.
// Devolve os nós fora do lugar ({ id, tipo, rotulo, problema: 'foraDoSistema' | 'atorNoSistema' }).
// Sem nenhum sistema no diagrama não há o que conferir.
export function foraDoLugar(nodes) {
  const sistemas = nodes.filter((n) => n.tipo === 'sistema');
  if (!sistemas.length) return [];
  const out = [];
  for (const n of nodes) {
    if (n.tipo === 'casoDeUso' && !sistemas.some((s) => contido(n, s))) out.push({ ...n, problema: 'foraDoSistema' });
    if (n.tipo === 'ator' && sistemas.some((s) => sobrepoe(n, s))) out.push({ ...n, problema: 'atorNoSistema' });
  }
  return out;
}

// Redimensiona um retângulo puxando o meio de um lado ('n' | 's' | 'l' | 'o'), no grid e com tamanho mínimo
export function redimensionar(base, lado, dx, dy, minimo) {
  let { x, y, w, h } = base;
  if (lado === 'l') w = Math.max(minimo.w, snap(base.w + dx));
  if (lado === 's') h = Math.max(minimo.h, snap(base.h + dy));
  if (lado === 'o') {
    const nx = Math.min(snap(base.x + dx), base.x + base.w - minimo.w);
    w = base.x + base.w - nx;
    x = nx;
  }
  if (lado === 'n') {
    const ny = Math.min(snap(base.y + dy), base.y + base.h - minimo.h);
    h = base.y + base.h - ny;
    y = ny;
  }
  return { x, y, w, h };
}

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
  const { w, h } = tamanho(node);
  return { x: node.x + w / 2, y: node.y + h / 2 };
};

// Ponto na borda do elemento na direção de (tx, ty), para as setas não entrarem nas formas
export function pontoNaBorda(node, tx, ty) {
  return pontoNaBordaDe(node, centro(node), { x: tx, y: ty });
}

// Contorno visível de cada forma: as bolinhas do diagrama de estados são menores que a caixa delas
// (início: círculo de raio 14; fim: anel de raio 16 + traço), então a seta tem que parar nelas.
const RAIO_VISIVEL = { estadoInicial: 14, estadoFinal: 17.5 };

// Onde o raio que sai de `origem` (dentro do nó) em direção a `alvo` cruza o contorno do nó.
// Com a origem no centro é a ponta normal de uma seta; com a origem deslocada, a ponta de uma seta
// paralela (A→B e B→A lado a lado) continua encostada na forma.
export function pontoNaBordaDe(node, origem, alvo) {
  const { w, h } = tamanho(node);
  const c = centro(node);
  const dx = alvo.x - origem.x, dy = alvo.y - origem.y;
  if (dx === 0 && dy === 0) return origem;
  if (ELIPTICOS.includes(node.tipo)) {
    const rx = RAIO_VISIVEL[node.tipo] ?? w / 2;
    const ry = RAIO_VISIVEL[node.tipo] ?? h / 2;
    // |(origem + t·d − c) / r|² = 1, maior raiz (saindo de dentro)
    const ox = (origem.x - c.x) / rx, oy = (origem.y - c.y) / ry;
    const ux = dx / rx, uy = dy / ry;
    const a = ux * ux + uy * uy, b = 2 * (ox * ux + oy * uy), k = ox * ox + oy * oy - 1;
    const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * k))) / (2 * a);
    return { x: origem.x + dx * t, y: origem.y + dy * t };
  }
  // losango: |x − cx|/(w/2) + |y − cy|/(h/2) = 1; essa soma cresce ao longo do raio, então bisseção
  if (node.tipo === 'decisao') {
    const f = (t) => Math.abs(origem.x + dx * t - c.x) / (w / 2) + Math.abs(origem.y + dy * t - c.y) / (h / 2);
    let lo = 0, hi = 1;
    while (f(hi) < 1 && hi < 1e6) hi *= 2;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (f(m) < 1) lo = m;
      else hi = m;
    }
    return { x: origem.x + dx * lo, y: origem.y + dy * lo };
  }
  // retângulo: o primeiro lado que o raio atinge
  const tx = dx > 0 ? (c.x + w / 2 - origem.x) / dx : dx < 0 ? (c.x - w / 2 - origem.x) / dx : Infinity;
  const ty = dy > 0 ? (c.y + h / 2 - origem.y) / dy : dy < 0 ? (c.y - h / 2 - origem.y) / dy : Infinity;
  const t = Math.max(0, Math.min(tx, ty));
  return { x: origem.x + dx * t, y: origem.y + dy * t };
}
