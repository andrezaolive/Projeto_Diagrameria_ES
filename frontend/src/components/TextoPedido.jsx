import { useGame } from '../state/GameContext.jsx';

// Linha do e-mail de um pedido. Os nomes que vão no diagrama vêm entre aspas ("Leitor"); com a
// opção "Nomes em negrito" das Configurações (`config.nomesNegrito`), eles aparecem em negrito, sem as aspas.
export const partesComAspas = (texto) => texto.split(/"([^"]+)"/);

export default function TextoPedido({ texto }) {
  const { state } = useGame();
  if (!state.config.nomesNegrito) return texto;
  // índices ímpares = o que estava entre aspas
  return partesComAspas(texto).map((p, i) => (i % 2 ? <b key={i} className="nome-pedido">{p}</b> : p));
}
