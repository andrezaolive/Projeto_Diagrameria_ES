import cadeado from '../assets/ui/icon-cadeado-16.png';
import lampada from '../assets/ui/icon-dicas-16.png';
import { Botao, Dinheiro } from '../components/ui.jsx';
import { DiagramaEstatico } from '../editor/Formas.jsx';
import { GRADE_PEDACOS, TOTAL_PEDACOS, modeloPorId, precoPedaco } from '../data/pedidos.js';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';
import './apps.css';

// A imagem-resposta do pedido fica coberta por pedaços trancados; cada compra revela um
export default function Dicas({ abrirApp }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const pedido = sessao?.pedidos.find((p) => p.id === sessao.ativo);

  if (!pedido) {
    return (
      <div className="dicas-vazio">
        <img src={lampada} alt="" className="pixel" />
        <p>Nenhum pedido em andamento.</p>
        <p>Aceite um pedido no e-mail para comprar pedaços da resposta.</p>
        <Botao variante="claro" onClick={() => abrirApp('email')}>Abrir e-mail</Botao>
      </div>
    );
  }

  const modelo = modeloPorId(pedido.modelo);
  const revelados = pedido.pedacos ?? [];
  const preco = precoPedaco(pedido);

  const comprar = (indice) => {
    if (state.dinheiro < preco) return sfx.erro();
    sfx.moeda();
    dispatch({ type: 'COMPRAR_PEDACO', indice });
  };

  return (
    <div className="dicas">
      <div className="dicas-topo">
        <span><b>{pedido.cliente}</b> · {pedido.assunto}</span>
        <span className="espaco" />
        <span className="etiqueta">{revelados.length}/{TOTAL_PEDACOS} revelados</span>
        <Dinheiro valor={state.dinheiro} />
      </div>

      <div className="dica-imagem">
        <DiagramaEstatico diagrama={modelo.esperado} prefixo="dc" />
        <div
          className="dica-tampas"
          style={{ gridTemplateColumns: `repeat(${GRADE_PEDACOS.colunas}, 1fr)`, gridTemplateRows: `repeat(${GRADE_PEDACOS.linhas}, 1fr)` }}
        >
          {Array.from({ length: TOTAL_PEDACOS }, (_, i) =>
            revelados.includes(i) ? (
              <div key={i} className="tampa aberta" />
            ) : (
              <button key={i} className="tampa" onClick={() => comprar(i)} disabled={state.dinheiro < preco} title={`Revelar este pedaço por R$ ${preco}`}>
                <img src={cadeado} alt="" className="pixel" />
                <span className="preco-tampa">R$ {preco}</span>
              </button>
            ),
          )}
        </div>
      </div>

      <p className="dica-rodape">
        {revelados.length === TOTAL_PEDACOS
          ? 'Resposta completa! Agora é só montar igual no editor.'
          : `Cada pedaço revela parte do diagrama esperado e custa R$ ${preco}.`}
      </p>
    </div>
  );
}
