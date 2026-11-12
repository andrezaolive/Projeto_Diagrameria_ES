import { Botao, Modal } from '../components/ui.jsx';
import { CAPSULAS, EFEITO_SEGUNDOS, capsulaPorId, iconeCapsula, motivoSemCafe } from '../data/cafe.js';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';

// Janela da cafeteira (abre com um clique nela no escritório): um botão por tipo de cápsula, com
// quantas ainda tem no centro. Só faz café com a caneca vazia encaixada na cafeteira.
export default function Cafeteira({ onFechar }) {
  const { state, dispatch } = useGame();
  const { capsulas, preparando, xicara, efeito } = state.cafe;
  const geral = motivoSemCafe(state, null);

  const status = preparando
    ? `Preparando ${capsulaPorId(preparando.tipo).curto.toLowerCase()}... ${preparando.falta} s`
    : xicara
      ? 'Café pronto! Clique na caneca para beber.'
      : geral ?? 'Escolha a cápsula.';

  return (
    <Modal titulo="CAFETEIRA.EXE" w={640} h={400} onFechar={onFechar}>
      <div className="cafeteira">
        <div className="cafeteira-botoes">
          {CAPSULAS.map((c) => {
            const qtd = capsulas[c.id] ?? 0;
            const motivo = motivoSemCafe(state, c.id);
            return (
              <button
                key={c.id}
                className={`capsula-btn ${c.id}`}
                disabled={Boolean(motivo)}
                title={motivo ?? `${c.nome}: relógio ${Math.round(c.lentidao * 100)}% mais lento por ${EFEITO_SEGUNDOS} s`}
                onClick={() => {
                  sfx.click();
                  dispatch({ type: 'FAZER_CAFE', tipo: c.id, sorteio: Math.random() });
                }}
              >
                <span className="capsula-icone">
                  <img src={iconeCapsula(c.id)} alt="" className="pixel" draggable={false} />
                  <b className="capsula-qtd" aria-label={`${qtd} cápsulas`}>{qtd}</b>
                </span>
                <span className="capsula-nome">{c.curto}</span>
                <span className="capsula-efeito">−{Math.round(c.lentidao * 100)}% · {EFEITO_SEGUNDOS} s</span>
              </button>
            );
          })}
        </div>
        <p className={`cafeteira-status ${preparando ? 'preparando' : xicara ? 'pronto' : ''}`} role="status">
          {status}
        </p>
        {efeito && (
          <p className="cafeteira-efeito">
            Efeito: {capsulaPorId(efeito.tipo).curto} · relógio {Math.round(capsulaPorId(efeito.tipo).lentidao * 100)}% mais lento · {efeito.falta} s
          </p>
        )}
        <p className="aviso-loja">Compre cápsulas na lojinha do computador (aba Cafeteira).</p>
        <Botao tamanho="pequeno" variante="claro" onClick={onFechar}>
          Fechar
        </Botao>
      </div>
    </Modal>
  );
}
