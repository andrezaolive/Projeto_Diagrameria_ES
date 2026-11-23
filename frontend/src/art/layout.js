// Coordenadas compartilhadas entre o gerador de assets e o jogo (em pixels de arte, cena 320x180).
export const SCENE_W = 320;
export const SCENE_H = 180;

// Borda de cima da mesa: objetos de mesa ficam abaixo dela, os de parede acima
export const DESK_Y = 118;

// Monitor CRT do escritório (área clicável)
export const MONITOR = { x: 116, y: 40, w: 88, h: 72 };
// Tela do monitor (origem do zoom ao entrar no computador)
export const MONITOR_SCREEN = { x: 128, y: 50, w: 64, h: 48 };

// Estante da parede (prateleira): o tampo é uma superfície para apoiar objetos
export const ESTANTE = { x: 232, y: 34, w: 76 };

// Sala de exposição (ao lado do escritório): quadro de broches, armário de portas de vidro e
// prateleiras. Na sala não há mesa: objetos "de mesa" ficam nas prateleiras (`top` = onde a base
// apoia), os de parede vão em qualquer lugar acima do chão.
export const SALA = {
  quadro: { x: 14, y: 12, w: 134, h: 120 },
  armario: { x: 182, y: 8, w: 128, h: 62 },
  chao: 174,
  prateleiras: {
    'armario-cima': { x: 186, y: 37, w: 120 },
    'armario-baixo': { x: 186, y: 66, w: 120 },
    p1: { x: 182, y: 102, w: 128 },
    p2: { x: 182, y: 138, w: 128 },
    'p-baixo': { x: 6, y: 170, w: 308 },
  },
  // Até onde um objeto pode subir em cada prateleira (o que está logo acima dela). A do chão depende
  // do trecho: embaixo do quadro ou da prateleira p2 (ver vagaNaPrateleira em lib/conquistas.js).
  tetos: { 'armario-cima': 11, 'armario-baixo': 40, p1: 70, p2: 110 },
};
