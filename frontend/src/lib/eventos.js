// Eventos aleatórios do expediente (modo infinito e campanha; na campanha com chance menor). A pane interrompe o jogo com o minijogo
// (`sessao.evento = { tipo }`; enquanto ele está aberto o relógio para) e pode deixar um
// contratempo (`sessao.bloqueio = { tipo, falta, total }`): segundos de jogo em que o jogador não
// consegue trabalhar, com o relógio correndo (prazos e paciência continuam).
//  - pane: o computador trava. Não há escolha: a tela pisca com um glitch e o jogador cai direto no
//    minijogo (fechar as janelas de erro a tempo). Falhar deixa o computador reiniciando um tempo.
//  - energia: a luz acaba. Não abre janela: vira direto um contratempo (`quedaDeEnergia`), a tela
//    escurece e o computador fica inacessível até a energia voltar; dá para ligar o gerador
//    (LIGAR_GERADOR) a qualquer momento, por um preço sorteado entre 150 e 200.
//  - cafe: só ao fazer café, com uma chance pequena de derramar (perde a cápsula). Fica uma poça
//    debaixo da cafeteira (`sessao.cafeDerramado`) e o computador fica inacessível até o jogador
//    clicar na poça e limpar (5 a 7 s, LIMPAR_CAFE). Sem janela.
//  - cansaco: depois de CANSACO.aPartirDe s de jogo no dia, a cada minuto há 1/3 de chance; a tela
//    escurece em vinheta até ficar preta em CANSACO.escurecer s. Beber café tira o cansaço e deixa o
//    jogador livre dele por 1, 2 ou 3 minutos (descafeinado, normal, forte). Só com a cafeteira.
//    Sem café a tempo, o jogador dorme (5 s) e acorda com os pedidos atrasados (`adormecer` no reducer).
//    Quanto mais cansado, maior a chance de derramar o café.
// Na campanha os eventos ficam mais prováveis ao longo da semana (`fatorDaSemana`).
// Funções puras: os números aleatórios vêm nas ações.
import { dataDoDia } from './dificuldade.js';

export const EVENTOS = {
  pane: {
    titulo: 'PANE NO COMPUTADOR', // (títulos sem acento: a fonte de títulos não tem maiúsculas acentuadas)
    janela: 'PANE.EXE',
    falhou: 30, // conserto que não deu certo: segundos de jogo com o computador reiniciando
    janelas: { min: 6, max: 8 }, // minijogo: janelas de erro para fechar (sorteado)
    tempoMinijogo: 5, // segundos reais
  },
  energia: {
    titulo: 'QUEDA DE ENERGIA',
    precos: [150, 160, 170, 180, 190, 200], // do gerador, sorteado a cada queda
    bloqueio: 25, // segundos de jogo até a energia voltar sozinha
  },
  cafe: {
    titulo: 'CAFE DERRAMADO',
    limpeza: { min: 5, max: 7 }, // segundos reais limpando a poça
  },
};

// Sorteio dos eventos no TICK: a cada INTERVALO segundos de jogo (fora do minuto dos urgentes),
// depois de COMECA_EM, com CHANCE de chegar pane ou queda de energia (meio a meio); na campanha,
// CHANCE_CAMPANHA
export const SORTEIO_EVENTO = { intervalo: 60, deslocamento: 30, comecaEm: 90, chance: 1 / 4, chanceCampanha: 1 / 6 };
export const CHANCE_DERRAMAR = 0.1; // ao fazer café (modo infinito)
export const CHANCE_DERRAMAR_CAMPANHA = 0.06;

// Campanha: segunda ×1, e +15% a cada dia da semana até a sexta (×1,6); sábado e domingo ficam no
// nível da sexta. O modo infinito não tem semana (×1).
export const AUMENTO_SEMANA = 0.15;
export function fatorDaSemana(sessao) {
  if (sessao?.modo !== 'campanha') return 1;
  const data = sessao.fimDeSemana ?? dataDoDia(sessao.dia ?? 1);
  return 1 + AUMENTO_SEMANA * Math.min(4, (data - 1) % 7);
}

// Cansaço (segundos de jogo)
export const CANSACO = {
  aPartirDe: 300, // 5 minutos no mesmo dia
  intervalo: 60, // um sorteio por minuto (no segundo 0 do minuto)
  chance: 1 / 3,
  escurecer: 30, // segundos até a tela ficar preta; aí o jogador dorme
  sono: 5, // segundos (reais) dormindo
  descanso: 60, // depois de acordar, sem cansaço por esse tempo
  urgentesAoDormir: [1, 2], // campanha: urgentes que chegam enquanto dorme
  novosAoDormir: 2, // infinito: pedidos que chegam já aceitos, com metade do prazo
  livre: { descafeinado: 60, normal: 120, forte: 180 }, // depois de beber, sem cansaço por esse tempo
  derramarExtra: 2, // cansaço total triplica a chance de derramar o café (1 + 2 × nível)
};

// Partida em que os eventos acontecem: infinito ou campanha, fora do tutorial (o reducer ainda
// confere se a partida não acabou: partidaEncerrada)
const comEventos = (sessao) =>
  (sessao?.modo === 'infinito' || sessao?.modo === 'campanha') && !sessao.fimDeJogo && !sessao.esperaTutorial;

export function sortearEvento(sessao, sorteio) {
  if (!comEventos(sessao) || sorteio == null || sessao.evento || sessao.bloqueio) return null;
  const s = sessao.segundos ?? 0;
  const { intervalo, deslocamento, comecaEm } = SORTEIO_EVENTO;
  const chance = (sessao.modo === 'campanha' ? SORTEIO_EVENTO.chanceCampanha : SORTEIO_EVENTO.chance) * fatorDaSemana(sessao);
  if (s < comecaEm || s % intervalo !== deslocamento || sorteio >= chance) return null;
  return { tipo: sorteio < chance / 2 ? 'pane' : 'energia' };
}

// Contratempo da queda de energia: `sorteio` em [0, 1) escolhe o preço do gerador
// Também espalha RAIOS raios pelo escritório e pela sala de exposição (`raios`: { id, sala, x, y,
// falta }); coletar todos (COLETAR_RAIO, cada um com 1 a 3 cliques) devolve a energia de graça.
export const RAIOS = {
  quantos: { min: 3, max: 7 },
  cliques: { min: 1, max: 3 },
  area: { x: 90, y: 120, w: 1060, h: 420 }, // no palco 1280×720: longe do HUD, do aviso e das setas
};
// gerador de números do sorteio (o reducer continua puro: tudo sai do mesmo `sorteio`)
function geradorDe(sorteio) {
  let x = Math.floor(sorteio * 2147483645) + 1;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}
export function raiosDaQueda(sorteio = 0) {
  const r = geradorDe(sorteio);
  const entre = ({ min, max }) => min + Math.floor(r() * (max - min + 1));
  const n = entre(RAIOS.quantos);
  const { x, y, w, h } = RAIOS.area;
  const raios = Array.from({ length: n }, (_, i) => ({
    id: i,
    sala: i === 0 ? 'escritorio' : i === 1 ? 'sala' : r() < 0.5 ? 'escritorio' : 'sala', // pelo menos um em cada
    x: Math.round(x + r() * w),
    y: Math.round(y + r() * h),
    falta: entre(RAIOS.cliques),
  }));
  return raios;
}
export function quedaDeEnergia(sorteio = 0) {
  const { precos, bloqueio } = EVENTOS.energia;
  const preco = precos[Math.min(precos.length - 1, Math.floor(sorteio * precos.length))];
  return { tipo: 'energia', falta: bloqueio, total: bloqueio, preco, raios: raiosDaQueda(sorteio) };
}

// Quantas janelas de erro no minijogo da pane: `sorteio` em [0, 1) → de 6 a 8
export const janelasDaPane = (sorteio = 0) => {
  const { min, max } = EVENTOS.pane.janelas;
  return Math.min(max, min + Math.floor(sorteio * (max - min + 1)));
};

// Chance de derramar ao fazer café: a do modo × semana × cansaço
export const chanceDeDerramar = (sessao) =>
  (sessao?.modo === 'campanha' ? CHANCE_DERRAMAR_CAMPANHA : CHANCE_DERRAMAR) * fatorDaSemana(sessao) * (1 + CANSACO.derramarExtra * nivelDoCansaco(sessao));
export const derramouCafe = (sessao, sorteio) => comEventos(sessao) && !sessao.cafeDerramado && sorteio != null && sorteio < chanceDeDerramar(sessao);

// Cansaço: de 0 (acabou de chegar) a 1 (tela preta)
export const nivelDoCansaco = (sessao) =>
  sessao?.cansaco ? Math.min(1, Math.max(0, ((sessao.segundos ?? 0) - sessao.cansaco.inicio) / CANSACO.escurecer)) : 0;
// O cansaço chega agora? (no minuto cheio, depois dos 5 min, fora do tempo livre que o café deu)
export function sortearCansaco(sessao, sorteio, temCafeteira) {
  if (!temCafeteira || !comEventos(sessao) || sorteio == null || sessao.cansaco) return false;
  const s = sessao.segundos ?? 0;
  if (s < CANSACO.aPartirDe || s % CANSACO.intervalo !== 0 || s < (sessao.semCansacoAte ?? 0)) return false;
  return sorteio < CANSACO.chance;
}
// Beber café: tira o cansaço e deixa livre dele por um tempo, pelo tipo
export const depoisDoCafe = (sessao, tipo) =>
  sessao ? { ...sessao, cansaco: null, semCansacoAte: (sessao.segundos ?? 0) + (CANSACO.livre[tipo] ?? CANSACO.livre.normal) } : sessao;

// Segundos (reais) para limpar o café derramado: `sorteio` em [0, 1) → de 5 a 7
export const tempoDeLimpeza = (sorteio = 0) => EVENTOS.cafe.limpeza.min + sorteio * (EVENTOS.cafe.limpeza.max - EVENTOS.cafe.limpeza.min);

// Resultado do minijogo da pane: { custo, bloqueio } (bloqueio em segundos de jogo, 0 = nenhum).
// `escolha`: 'consertou' | 'falhou'
export function resolverEvento(tipo, escolha) {
  if (tipo !== 'pane') return null;
  if (escolha === 'consertou') return { custo: 0, bloqueio: 0 };
  if (escolha === 'falhou') return { custo: 0, bloqueio: EVENTOS.pane.falhou };
  return null;
}
