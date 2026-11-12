import { capsulaPorId, iconeCapsula } from '../data/cafe.js';
import { useGame } from '../state/GameContext.jsx';

// Etiqueta do efeito do café (HUD do escritório e barra de tarefas): quanto o relógio está mais
// lento e por mais quantos segundos. Some quando não há café fazendo efeito.
export default function EfeitoCafe() {
  const { efeito } = useGame().state.cafe;
  if (!efeito) return null;
  const c = capsulaPorId(efeito.tipo);
  return (
    <span className="etiqueta efeito-cafe" title={`${c.nome}: o relógio do jogo está ${Math.round(c.lentidao * 100)}% mais lento`} role="status">
      <img src={iconeCapsula(c.id)} alt="" className="pixel" />
      −{Math.round(c.lentidao * 100)}% · {efeito.falta}s
    </span>
  );
}
