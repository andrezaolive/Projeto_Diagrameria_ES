// Motor de áudio 100% sintetizado (Web Audio API): não precisa de nenhum arquivo .mp3.
// - Música: arpejo lo-fi em loop
// - Chuva: ruído filtrado
// - Efeitos: bips curtos estilo 8-bit

const ESCALA = { musica: 0.1, chuva: 0.22, efeitos: 0.25 };
const volumes = { musica: 6, chuva: 9, efeitos: 4 }; // 0 a 10

let ctx = null;
let saidaMusica = null;
let saidaChuva = null;
let saidaEfeitos = null;
let iniciado = false;
let proximoTempo = 0;
let passo = 0;

function ganhoDe(chave) {
  const v = volumes[chave] / 10;
  return v * v * ESCALA[chave]; // curva quadrática soa mais natural
}

function aplicarVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  saidaMusica.gain.setTargetAtTime(ganhoDe('musica'), t, 0.05);
  saidaChuva.gain.setTargetAtTime(ganhoDe('chuva'), t, 0.05);
  saidaEfeitos.gain.setTargetAtTime(ganhoDe('efeitos'), t, 0.05);
}

export function definirVolumes(novos) {
  Object.assign(volumes, novos);
  aplicarVolumes();
}

function criarContexto() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  saidaMusica = ctx.createGain();
  saidaChuva = ctx.createGain();
  saidaEfeitos = ctx.createGain();
  [saidaMusica, saidaChuva, saidaEfeitos].forEach((g) => g.connect(ctx.destination));
  aplicarVolumes();
  return ctx;
}

function tom(freq, t, dur, tipo, pico, destino) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(destino);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/* ---------- Chuva ---------- */
function iniciarChuva() {
  const duracao = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duracao, ctx.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

  const fonte = ctx.createBufferSource();
  fonte.buffer = buffer;
  fonte.loop = true;

  const passaAlta = ctx.createBiquadFilter();
  passaAlta.type = 'highpass';
  passaAlta.frequency.value = 500;
  const passaBaixa = ctx.createBiquadFilter();
  passaBaixa.type = 'lowpass';
  passaBaixa.frequency.value = 2400;

  fonte.connect(passaAlta);
  passaAlta.connect(passaBaixa);
  passaBaixa.connect(saidaChuva);
  fonte.start();
}

/* ---------- Música ---------- */
const ACORDES = [
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [261.63, 329.63, 392.0], // C
  [196.0, 246.94, 293.66], // G
];
const BAIXOS = [110.0, 87.31, 130.81, 98.0];
const PADRAO = [0, 1, 2, 1, 0, 2, 1, 2];
const DURACAO_PASSO = 60 / 78 / 2; // colcheias a 78 bpm

function agendarMusica() {
  if (!ctx) return;
  while (proximoTempo < ctx.currentTime + 1.2) {
    const acorde = Math.floor(passo / 8) % 4;
    const i = passo % 8;
    const nota = ACORDES[acorde][PADRAO[i]] * 2;
    tom(nota, proximoTempo, 0.32, 'triangle', 0.5, saidaMusica);
    if (i % 4 === 0) tom(BAIXOS[acorde], proximoTempo, 0.7, 'square', 0.3, saidaMusica);
    proximoTempo += DURACAO_PASSO;
    passo += 1;
  }
}

function iniciarMusica() {
  proximoTempo = ctx.currentTime + 0.1;
  agendarMusica();
  setInterval(agendarMusica, 150);
}

/* ---------- API pública ---------- */
// Precisa ser chamada após um gesto do usuário (clique/tecla), exigência dos navegadores.
export function iniciarAudio() {
  const c = criarContexto();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (!iniciado) {
    iniciado = true;
    iniciarChuva();
    iniciarMusica();
  }
}

// [frequência, atraso, duração]
const EFEITOS = {
  clique: [[660, 0, 0.05]],
  abrir: [[440, 0, 0.06], [660, 0.06, 0.08]],
  fechar: [[660, 0, 0.06], [440, 0.06, 0.08]],
  ligar: [[523, 0, 0.07], [784, 0.07, 0.09]],
  sucesso: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.2]],
  erro: [[220, 0, 0.12], [165, 0.12, 0.22]],
};

export function tocarEfeito(nome) {
  if (!ctx || !iniciado) return;
  const sequencia = EFEITOS[nome];
  if (!sequencia) return;
  const base = ctx.currentTime;
  sequencia.forEach(([freq, atraso, dur]) => tom(freq, base + atraso, dur, 'square', 0.6, saidaEfeitos));
}
