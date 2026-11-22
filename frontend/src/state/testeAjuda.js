// Ajuda para os testes (não entra no jogo)
import { chegarPedidosInfinito } from './reducer.js';

// Modo infinito: faz chegar agora os pedidos agendados em `sessao.chegadas` (no jogo eles chegam
// 10 a 20 s de jogo depois), sem passar o tempo
export const chegarAgora = (s) =>
  s.sessao?.chegadas?.length ? { ...s, sessao: chegarPedidosInfinito({ ...s.sessao, chegadas: s.sessao.chegadas.map(() => -Infinity) }) } : s;
