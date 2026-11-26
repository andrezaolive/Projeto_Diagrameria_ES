import { useState } from 'react';
import cadeado from '../assets/ui/icon-cadeado-16.png';
import lampada from '../assets/ui/icon-dicas-16.png';
import { Botao, Dinheiro } from '../components/ui.jsx';
import { DiagramaEstatico } from '../editor/Formas.jsx';
import ZoomDiagrama from '../components/ZoomDiagrama.jsx';
import { precoNoExpediente } from '../lib/modificadores.js';
import { gradeDePedacos, modeloPorId, partesDoModelo, pedacosDoModelo, precoPedaco } from '../data/pedidos.js';
import { nomeDaParte } from './Resultado.jsx';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';
import './apps.css';

// A imagem-resposta do pedido fica coberta por pedaços trancados; cada compra revela um.
// Grade 2x2 nos pedidos normais e 4x4 nos complexos (gradeDePedacos).
export default function Dicas({ abrirApp }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const pedido = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  // pedido JUMBO: uma imagem-resposta por diagrama; a parte k usa os pedaços k*total...
  const [indiceParte, setIndiceParte] = useState(0);

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
  const partes = partesDoModelo(modelo);
  const k = Math.min(indiceParte, partes.length - 1);
  const grade = gradeDePedacos(modelo);
  const total = pedacosDoModelo(modelo);
  const base = k * total;
  const revelados = (pedido.pedacos ?? []).filter((i) => i >= base && i < base + total).map((i) => i - base);
  const preco = precoNoExpediente(precoPedaco(pedido, k), state.sessao); // o próximo pedaço deste diagrama (cada um encarece o seguinte)

  const comprar = (indice) => {
    if (state.dinheiro < preco) return sfx.erro();
    sfx.moeda();
    dispatch({ type: 'COMPRAR_PEDACO', indice: base + indice });
  };

  return (
    <div className="dicas">
      <div className="dicas-topo">
        <span><b>{pedido.cliente}</b> · {pedido.assunto}</span>
        <span className="espaco" />
        <span className="etiqueta">{revelados.length}/{total} revelados</span>
        <Dinheiro valor={state.dinheiro} />
      </div>

      {partes.length > 1 && (
        <div className="dicas-partes" role="tablist" aria-label="Diagramas do pedido JUMBO">
          {partes.map((p, i) => (
            <Botao key={p.secao} role="tab" aria-selected={i === k} tamanho="pequeno" variante={i === k ? 'ativo' : 'claro'} onClick={() => setIndiceParte(i)}>
              {nomeDaParte(p.secao)}
            </Botao>
          ))}
        </div>
      )}
      <div className="dica-imagem">
        {/* zoom: o diagrama e as tampas ampliam juntos (key: volta ao normal ao trocar de parte) */}
        <ZoomDiagrama key={k}>
        <DiagramaEstatico diagrama={partes[k].esperado} prefixo={`dc${k}`} />
        <div
          className={`dica-tampas ${total > 4 ? 'miuda' : ''}`}
          style={{ gridTemplateColumns: `repeat(${grade.colunas}, 1fr)`, gridTemplateRows: `repeat(${grade.linhas}, 1fr)` }}
        >
          {Array.from({ length: total }, (_, i) =>
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
        </ZoomDiagrama>
      </div>

      <p className="dica-rodape">
        {revelados.length === total
          ? 'Resposta completa! Agora é só montar igual no editor.'
          : `Cada pedaço revela parte do diagrama esperado. O próximo custa R$ ${preco}, e cada pedaço comprado deixa o seguinte mais caro.`}
      </p>
    </div>
  );
}
