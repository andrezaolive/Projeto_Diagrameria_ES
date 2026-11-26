// Efeitos sonoros: bips 8-bit sintetizados (onda quadrada) + amostras da equipe (assets/sfx/,
// copiadas da pasta sfx/ da raiz). Hover e click mudam de pitch a cada toque para não cansar.
import urlExcellent from '../assets/sfx/nota-excellent.mp3';
import urlGreat from '../assets/sfx/nota-great.mp3';
import urlOk from '../assets/sfx/nota-ok.mp3';
import urlBad from '../assets/sfx/nota-bad.mp3';
import urlWorst from '../assets/sfx/nota-worst.mp3';
import urlHover from '../assets/sfx/hover.mp3';
import urlClick from '../assets/sfx/click.mp3';
let ctx = null;
let volume = 0.7;

export const setVolumeEfeitos = (v) => {
  volume = v;
};

function contexto() {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tom(freq, dur = 0.06, quando = 0, tipo = 'square') {
  if (volume <= 0) return;
  try {
    contexto();
    const t = ctx.currentTime + quando;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.06 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {
    /* áudio indisponível */
  }
}

export const sfx = {
  clique: () => tom(660, 0.05),
  voltar: () => tom(440, 0.05),
  soltar: () => tom(520, 0.04, 0, 'triangle'),
  ligar: () => { tom(330, 0.08); tom(495, 0.08, 0.08); tom(660, 0.12, 0.16); },
  moeda: () => { tom(988, 0.07); tom(1319, 0.14, 0.07); },
  erro: () => tom(160, 0.15),
  email: () => { tom(784, 0.06); tom(1047, 0.1, 0.07); },
  // amostras
  click: () => tocarAmostra('click'),
  clickSoltar: () => tocarAmostra('click', { ganho: GANHO_SOLTAR }), // mesmo click, bem mais baixo
  hover: () => tocarHover(),
  nota: (n) => tocarAmostra(somDaNota(n)),
};

// ------------------------------------------------------------------ amostras
// `ganho`: volume relativo (o hover fica bem baixo); `semitons`: sorteio de pitch em ± semitons
export const GANHO_SOLTAR = 0.07; // soltar um item no escritório

export const AMOSTRAS = {
  excellent: { url: urlExcellent, ganho: 0.8 },
  great: { url: urlGreat, ganho: 0.8 },
  ok: { url: urlOk, ganho: 0.8 },
  bad: { url: urlBad, ganho: 0.8 },
  worst: { url: urlWorst, ganho: 0.8 },
  hover: { url: urlHover, ganho: 0.12, semitons: 2 },
  click: { url: urlClick, ganho: 0.15, semitons: 1.5 },
};

const buffers = {};
function carregar(nome) {
  if (!buffers[nome]) {
    buffers[nome] = fetch(AMOSTRAS[nome].url)
      .then((r) => r.arrayBuffer())
      .then((d) => new Promise((ok, falha) => contexto().decodeAudioData(d, ok, falha)))
      .catch(() => null);
  }
  return buffers[nome];
}

// pitch aleatório em ± `semitons` (playbackRate = 2^(st/12))
export const taxaDePitch = (semitons = 0, aleatorio = Math.random) => 2 ** (((aleatorio() * 2 - 1) * semitons) / 12);

// `opcoes.ganho` substitui o volume padrão da amostra (ex.: click mais baixo ao soltar)
export async function tocarAmostra(nome, opcoes = {}) {
  const a = AMOSTRAS[nome];
  if (!a || volume <= 0) return;
  try {
    contexto();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const buf = await carregar(nome);
    if (!buf) return;
    const fonte = ctx.createBufferSource();
    const ganho = ctx.createGain();
    fonte.buffer = buf;
    fonte.playbackRate.value = taxaDePitch(a.semitons);
    ganho.gain.value = (opcoes.ganho ?? a.ganho) * volume;
    fonte.connect(ganho).connect(ctx.destination);
    fonte.start();
  } catch {
    /* áudio indisponível */
  }
}

// carrega tudo no primeiro gesto (o navegador só libera áudio depois dele), sem atraso no 1º toque
if (typeof window !== 'undefined') {
  const preparar = () => {
    try {
      contexto();
      for (const n of Object.keys(AMOSTRAS)) carregar(n);
    } catch {
      /* ignora */
    }
  };
  window.addEventListener('pointerdown', preparar, { once: true, capture: true });
}

// Som da entrega, pela nota (mesmas faixas do mascote; Excellent só com 100%)
export function somDaNota(nota) {
  if (nota <= 0) return 'worst';
  if (nota < 30) return 'bad';
  if (nota < 60) return 'ok';
  if (nota < 100) return 'great';
  return 'excellent';
}

let ultimoHover = 0;
export function tocarHover() {
  const agora = performance.now();
  if (agora - ultimoHover < 45) return; // passar rápido por várias opções não vira metralhadora
  ultimoHover = agora;
  tocarAmostra('hover');
}
