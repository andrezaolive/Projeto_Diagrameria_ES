// Efeitos sonoros 8-bit sintetizados (onda quadrada), sem arquivos de áudio.
let ctx = null;
let volume = 0.7;

export const setVolumeEfeitos = (v) => {
  volume = v;
};

function tom(freq, dur = 0.06, quando = 0, tipo = 'square') {
  if (volume <= 0) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
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
};
