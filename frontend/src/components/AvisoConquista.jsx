import { useEffect } from 'react';
import { conquistaPorId, nomeDoPremio } from '../art/conquistas.js';
import { Premio } from '../screens/Conquistas.jsx';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';
import '../screens/conquistas.css';

// Aviso de conquista desbloqueada, um de cada vez (fila em state.avisosConquista). Diz onde o prêmio
// foi parar: na sala de exposição ou, se não coube no quadro/prateleiras, no baú.
export default function AvisoConquista() {
  const { state, dispatch } = useGame();
  const aviso = state.avisosConquista?.[0];
  const cq = aviso && conquistaPorId(aviso.id);

  useEffect(() => {
    if (!aviso) return;
    if (cq) sfx.moeda?.();
    else dispatch({ type: 'CONQUISTA_VISTA' }); // conquista que não existe mais (save antigo)
  }, [aviso, cq, dispatch]);

  if (!aviso || !cq) return null;
  const premio = nomeDoPremio(cq);
  const tipo = cq.forma === 'trofeu' ? 'o troféu' : cq.forma === 'medalha' ? 'a medalha' : 'o broche';
  const fechar = () => dispatch({ type: 'CONQUISTA_VISTA' });
  return (
    // a chave refaz a animação para cada aviso da fila
    <div key={`${aviso.id}-${state.avisosConquista.length}`} className="aviso-conquista" role="status" onAnimationEnd={fechar} onClick={fechar} title="Fechar">
      <span className="conquista-premio">
        <Premio cq={cq} tem escala={cq.forma === 'trofeu' ? 1.5 : 3} />
      </span>
      <span>
        <small>CONQUISTA DESBLOQUEADA!</small>
        <strong>{cq.nome}</strong>
        <span className={`onde ${aviso.noBau ? 'bau' : ''}`}>
          {aviso.noBau
            ? `Sem espaço na sala: veja ${tipo} no baú.`
            : `${premio} · ${cq.forma === 'trofeu' ? 'nas prateleiras' : 'no quadro'} da sala de exposição`}
        </span>
      </span>
    </div>
  );
}
