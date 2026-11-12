import { useState } from 'react';
import { Botao, Modal, formatarReais } from '../components/ui.jsx';
import Resultado from '../apps/Resultado.jsx';
import { avaliar } from '../lib/avaliacao.js';
import { modeloPorId } from '../data/pedidos.js';
import { desempenhoDoPedido } from '../state/reducer.js';

// Linha do resumo: o que aconteceu com o pedido
const SITUACAO = {
  entregue: (p) => `Entregue · ${p.nota}% · +${formatarReais(p.valor)}`,
  recusado: (p) => `Recusado${p.multa ? ` · −R$ ${p.multa}` : ''}`,
  expirado: (p) => `Cliente foi embora${p.multa ? ` · −R$ ${p.multa}` : ''}`,
};
// quanto o pedido pesa no desempenho do dia (urgentes ficam de fora)
const naMedia = (p) => (p.urgente ? 'fora da média' : `conta ${desempenhoDoPedido(p)}%`);

// Monta o mesmo objeto que a tela de resultado recebe logo após a entrega
export function resultadoDoPedido(pedido) {
  const esperado = modeloPorId(pedido.modelo).esperado;
  return { ...avaliar(pedido.diagrama, esperado), nota: pedido.nota, valor: pedido.valor, atrasado: pedido.atrasado, pedido, diagrama: pedido.diagrama, esperado };
}

// Resumo do dia (fim do dia da campanha): todos os pedidos; os entregues abrem de novo o resultado
// (seu diagrama × esperado, com o botão de feedback). Recusados e perdidos ficam em cinza, sem clique.
export default function ResumoDia({ pedidos, dia, onFechar }) {
  const [vendo, setVendo] = useState(null);
  return (
    <>
      <Modal titulo={`RESUMO_DIA_${dia}.TXT`} w={760} h={540} onFechar={onFechar}>
        <div className="resumo-dia">
          <ul className="resumo-lista rolagem">
            {pedidos.map((p) => {
              const revisavel = p.status === 'entregue' && Boolean(p.diagrama);
              return (
                <li key={p.id}>
                  <button
                    className={`resumo-item ${revisavel ? '' : 'perdido'} ${p.urgente ? 'urgente' : ''}`}
                    disabled={!revisavel}
                    onClick={() => setVendo(p)}
                    title={revisavel ? 'Ver o diagrama entregue, o esperado e o feedback' : 'Pedido não entregue'}
                  >
                    <span className="cliente">
                      {p.urgente && <b className="tag-urgente">URGENTE</b>}
                      {p.cliente}
                    </span>
                    <span className="assunto">{p.urgente ? p.assunto.replace(/^URGENTE: /, '') : p.assunto}</span>
                    <span className="situacao">{(SITUACAO[p.status] ?? (() => p.status))(p)} · {naMedia(p)}</span>
                    {revisavel && <span className="ver">ver ›</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="resumo-rodape">
            <Botao variante="claro" som="voltar" onClick={onFechar}>Voltar</Botao>
          </div>
        </div>
      </Modal>
      {vendo && <Resultado resultado={resultadoDoPedido(vendo)} onOk={() => setVendo(null)} />}
    </>
  );
}
