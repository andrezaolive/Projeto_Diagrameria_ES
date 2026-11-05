// Música de fundo com Web Audio (loop sem emenda).
// A faixa do menu (audio/Menu.wav → assets/audio/musica-menu.mp3) tem 82 BPM e,
// a partir do compasso 19 (~0:52), entra num fade-out composto para emendar com o início.
// Por isso o loop não volta ao fim do arquivo: cada repetição começa em LOOP segundos
// e a cauda da anterior continua tocando por cima até acabar.

export const BPM_MENU = 82;
export const LOOP_MENU = (18 * 4 * 60) / BPM_MENU; // 18 compassos 4/4 = 52,683 s

// Na emenda, cauda + início somam e ficam mais altos. Medido no Menu.wav em janelas de 0,25 s:
// quanto a mistura passa da mais alta das duas partes, em dB. Abaixamos a mistura nessa medida.
// (o início da faixa entra com fade-in, então no 1º segundo quem soa é a cauda e quase não há excesso)
// Se a música mudar, remeça: excesso = 10·log10(energia(mix) / max(energia(início), energia(cauda))).
export const EXCESSO_MENU_DB = [
  0.24, 1.52, 2.3, 3.27, 4.48, 5.74, 5.53, 5.25, 5.08, 4.82, 4.57, 4.49,
  4.41, 3.56, 3.52, 3.28, 2.91, 2.42, 2.11, 1.61, 1.1, 0.77, 0.33, 0.01, 0,
];
const PASSO_EXCESSO = 0.25;

// curva de ganho (0..1) que desfaz o excesso, interpolada a cada 50 ms
export function curvaCompensacao(excessoDb, passo = PASSO_EXCESSO, res = 0.05) {
  const dur = passo * (excessoDb.length - 1);
  const n = Math.round(dur / res) + 1;
  const curva = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const pos = (i * res) / passo;
    const j = Math.min(Math.floor(pos), excessoDb.length - 2);
    const db = excessoDb[j] + (excessoDb[j + 1] - excessoDb[j]) * (pos - j);
    curva[i] = 10 ** (-db / 20);
  }
  return { curva, dur };
}

const ADIANTE = 2; // quantas repetições ficam agendadas à frente (aba em segundo plano quase não roda timers)
const FADE = 0.8; // fade de saída
export const FADE_IN = { de: 0.3, dur: 2 };

let ctx = null;
let mestre = null; // volume da configuração
let volume = 0.6;
const buffers = new Map(); // url -> Promise<AudioBuffer>
let atual = null; // { url, ganho, emenda, fontes, proximo, loop, compensar, timer }

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    mestre = ctx.createGain();
    mestre.gain.value = volume;
    mestre.connect(ctx.destination);
    // navegadores só liberam áudio depois de um gesto do jogador
    const destravar = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, destravar, { capture: true });
  }
  return ctx;
}

function carregar(url) {
  if (!buffers.has(url)) {
    buffers.set(
      url,
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((dados) => new Promise((ok, falha) => ctx.decodeAudioData(dados, ok, falha))),
    );
  }
  return buffers.get(url);
}

// Mantém as próximas repetições agendadas no relógio do áudio (preciso, independe de setInterval)
function agendar(faixa) {
  const agora = ctx.currentTime;
  while (faixa.proximo < agora + faixa.loop * ADIANTE) {
    const fonte = ctx.createBufferSource();
    fonte.buffer = faixa.buffer;
    fonte.connect(faixa.emenda);
    const quando = Math.max(faixa.proximo, agora);
    fonte.start(quando);
    // a partir da 2ª repetição, a cauda da anterior soma com o início: abaixa a mistura
    if (faixa.compensar && faixa.repeticoes > 0) {
      try {
        faixa.emenda.gain.setValueCurveAtTime(faixa.compensar.curva, quando, faixa.compensar.dur);
      } catch {
        /* sobreposição de automação: ignora */
      }
    }
    faixa.repeticoes++;
    fonte.onended = () => {
      faixa.fontes.delete(fonte);
      if (atual === faixa) agendar(faixa);
    };
    faixa.fontes.add(fonte);
    faixa.proximo += faixa.loop;
  }
}

function encerrar(faixa, fade = FADE) {
  clearInterval(faixa.timer);
  const t = ctx.currentTime;
  faixa.ganho.gain.cancelScheduledValues(t);
  faixa.ganho.gain.setValueAtTime(faixa.ganho.gain.value, t);
  faixa.ganho.gain.linearRampToValueAtTime(0, t + fade);
  for (const f of faixa.fontes) {
    f.onended = null;
    try {
      f.stop(t + fade + 0.05);
    } catch {
      /* já parou */
    }
  }
}

/** Toca `url` em loop a cada `loop` segundos (padrão: duração do arquivo). Não reinicia se já estiver tocando. */
export async function tocarMusica(url, { loop, excessoDb } = {}) {
  if (!contexto()) return;
  if (atual?.url === url) return;
  if (atual) encerrar(atual);
  const faixa = {
    url,
    fontes: new Set(),
    ganho: ctx.createGain(), // fade de entrada/saída
    emenda: ctx.createGain(), // compensação do volume na emenda do loop
    buffer: null,
    proximo: 0,
    loop: 0,
    repeticoes: 0,
    compensar: excessoDb ? curvaCompensacao(excessoDb) : null,
    timer: 0,
  };
  atual = faixa;
  try {
    faixa.buffer = await carregar(url);
  } catch {
    if (atual === faixa) atual = null;
    return;
  }
  if (atual !== faixa) return; // trocou de tela enquanto carregava
  faixa.loop = loop ?? faixa.buffer.duration;
  faixa.emenda.connect(faixa.ganho).connect(mestre);
  const t = ctx.currentTime;
  // fade in leve ao abrir o jogo ou voltar ao menu: 30% → 100% em 2 s
  faixa.ganho.gain.setValueAtTime(FADE_IN.de, t);
  faixa.ganho.gain.linearRampToValueAtTime(1, t + FADE_IN.dur);
  faixa.proximo = t;
  agendar(faixa);
  faixa.timer = setInterval(() => agendar(faixa), 5000);
}

export function pararMusica(fade = FADE) {
  if (!atual) return;
  if (ctx && atual.buffer) encerrar(atual, fade);
  atual = null;
}

export function setVolumeMusica(v) {
  volume = v;
  if (mestre) mestre.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}
