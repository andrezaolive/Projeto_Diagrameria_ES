import { useState } from 'react';
import { Botao, Modal } from '../components/ui.jsx';
import { DiagramaEstatico } from '../editor/Formas.jsx';
import { REACOES, reacaoMascote } from '../lib/mascote.js';
import { diagramaVazio } from '../lib/feedback.js';
import Feedback from './Feedback.jsx';
import './apps.css';

// sprites das reações do mascote (40x40), indexados pelo nome da reação
const SPRITES = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/sprites/mascote-*-40x40.png', { eager: true, import: 'default' })).map(([caminho, url]) => [
    caminho.match(/mascote-(\w+)-40x40/)[1],
    url,
  ]),
);

function Barra({ rotulo, valor }) {
  return (
    <div className="linha-barra">
      <span>{rotulo}: {Math.round(valor * 100)}%</span>
      <div className="barra"><i style={{ width: `${valor * 100}%` }} /></div>
    </div>
  );
}

export default function Resultado({ resultado, onOk }) {
  const reacao = reacaoMascote(resultado.nota);
  const { nota, estrutura, rotulos, relacoes, multiplicidades, fronteira, valor, atrasado, pedido, diagrama, esperado } = resultado;
  const [vendoFeedback, setVendoFeedback] = useState(false);
  // entrega vazia: não há o que comentar, então não há botão de feedback
  const temFeedback = !diagramaVazio(diagrama);
  return (
    <>
    <Modal titulo={`RESULTADO · ${pedido.cliente}`} w={1180} h={660}>
      <div className="resultado">
        <div className="lado">
          <h4>SEU DIAGRAMA</h4>
          <DiagramaEstatico diagrama={diagrama} prefixo="rj" />
        </div>
        <div className="meio">
          <div className={`reacao reacao-${reacao}`}>
            <img src={SPRITES[reacao]} alt={`Mascote: ${REACOES[reacao].rotulo}`} className="pixel" width={136} height={136} />
            <span className="fala">{REACOES[reacao].fala}</span>
          </div>
          <span className="nota">{nota}%</span>
          <Barra rotulo="Estrutura" valor={estrutura} />
          <Barra rotulo="Nomes" valor={rotulos} />
          <Barra rotulo="Relações" valor={relacoes} />
          {multiplicidades != null && <Barra rotulo="Multiplicidade" valor={multiplicidades} />}
          {fronteira != null && <Barra rotulo="Sistema" valor={fronteira} />}
          {atrasado && <span className="atraso">Entregue fora do prazo (−50%)</span>}
          <span className="pago">+ R$ {valor}</span>
          <div className="acoes-resultado">
            {temFeedback && (
              <Botao variante="rosa" tamanho="pequeno" onClick={() => setVendoFeedback(true)}>
                {nota === 100 ? 'Feedback' : 'Ver erros e dicas'}
              </Botao>
            )}
            <Botao variante="menta" onClick={onOk} autoFocus>OK</Botao>
          </div>
        </div>
        <div className="lado">
          <h4>ESPERADO</h4>
          <DiagramaEstatico diagrama={esperado} prefixo="re" />
        </div>
      </div>
    </Modal>
    {vendoFeedback && <Feedback diagrama={diagrama} esperado={esperado} onFechar={() => setVendoFeedback(false)} />}
    </>
  );
}
