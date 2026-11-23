// Ajuda para os testes (não entra no jogo)
import { NA_FILA, chegarPedidosInfinito, liberarFila } from './reducer.js';

// Modo infinito: faz chegar agora os pedidos agendados em `sessao.chegadas` (no jogo eles chegam
// 10 a 20 s de jogo depois), sem passar o tempo
export const chegarAgora = (s) =>
  s.sessao?.chegadas?.length ? { ...s, sessao: chegarPedidosInfinito({ ...s.sessao, chegadas: s.sessao.chegadas.map(() => -Infinity) }) } : s;

// Campanha: sem nenhum pedido normal em aberto, o próximo da fila chega 10 a 20 s depois; isto faz
// ele chegar agora, sem passar o tempo (como era antes, para os testes que não olham o relógio)
export function chegarFilaAgora(s) {
  const sessao = s.sessao;
  if (sessao?.modo !== 'campanha' || !sessao.fila?.length || sessao.esperaTutorial) return s;
  if (sessao.pedidos.some((p) => !p.urgente && NA_FILA.includes(p.status))) return s;
  return { ...s, sessao: liberarFila({ ...sessao, proximoEm: -Infinity }, 0.5) };
}
