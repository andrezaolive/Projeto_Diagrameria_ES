import { useState } from 'react';
import { Botao } from '../components/ui.jsx';
import Grafico from '../components/Grafico.jsx';
import { useGame } from '../state/GameContext.jsx';
import { resumoEstatisticas } from '../lib/estatisticas.js';
import { sfx } from '../lib/sfx.js';
import './perfil.css';

// Lista de estatísticas; clicar numa linha mostra o gráfico dela ao lado
export default function Estatisticas({ onVoltar }) {
  const { state } = useGame();
  const itens = resumoEstatisticas(state);
  const [selecionado, setSelecionado] = useState('media');
  const atual = itens.find((i) => i.id === selecionado) ?? itens[0];

  return (
    <div className="estatisticas">
      <h3 className="titulo-px">ESTATISTICAS</h3>
      <div className="estatisticas-corpo">
        <ul className="estatisticas-lista">
          {itens.map((it) => (
            <li key={it.id}>
              <button
                className={it.id === atual.id ? 'ativo' : ''}
                aria-pressed={it.id === atual.id}
                onClick={() => {
                  sfx.clique?.();
                  setSelecionado(it.id);
                }}
              >
                <span>{it.rotulo}</span>
                <strong>{it.valor}</strong>
              </button>
            </li>
          ))}
        </ul>
        <Grafico grafico={atual.grafico} titulo={atual.titulo} vazio={atual.vazio} />
      </div>
      <div className="estatisticas-rodape">
        <span className="dica-clique">clique numa estatística para ver o gráfico</span>
        <Botao variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>
      </div>
    </div>
  );
}
