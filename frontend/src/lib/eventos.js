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
// Funções puras: os números aleatórios vêm nas ações.

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

// Partida em que os eventos acontecem: infinito ou campanha, fora do tutorial (o reducer ainda
// confere se a partida não acabou: partidaEncerrada)
const comEventos = (sessao) =>
  (sessao?.modo === 'infinito' || sessao?.modo === 'campanha') && !sessao.fimDeJogo && !sessao.esperaTutorial;

export function sortearEvento(sessao, sorteio) {
  if (!comEventos(sessao) || sorteio == null || sessao.evento || sessao.bloqueio) return null;
  const s = sessao.segundos ?? 0;
  const { intervalo, deslocamento, comecaEm } = SORTEIO_EVENTO;
  const chance = sessao.modo === 'campanha' ? SORTEIO_EVENTO.chanceCampanha : SORTEIO_EVENTO.chance;
  if (s < comecaEm || s % intervalo !== deslocamento || sorteio >= chance) return null;
  return { tipo: sorteio < chance / 2 ? 'pane' : 'energia' };
}

// Contratempo da queda de energia: `sorteio` em [0, 1) escolhe o preço do gerador
export function quedaDeEnergia(sorteio = 0) {
  const { precos, bloqueio } = EVENTOS.energia;
  const preco = precos[Math.min(precos.length - 1, Math.floor(sorteio * precos.length))];
  return { tipo: 'energia', falta: bloqueio, total: bloqueio, preco };
}

// Quantas janelas de erro no minijogo da pane: `sorteio` em [0, 1) → de 6 a 8
export const janelasDaPane = (sorteio = 0) => {
  const { min, max } = EVENTOS.pane.janelas;
  return Math.min(max, min + Math.floor(sorteio * (max - min + 1)));
};

export const derramouCafe = (sessao, sorteio) =>
  comEventos(sessao) && !sessao.cafeDerramado && sorteio != null && sorteio < (sessao.modo === 'campanha' ? CHANCE_DERRAMAR_CAMPANHA : CHANCE_DERRAMAR);

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
