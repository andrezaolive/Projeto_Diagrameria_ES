import { useState } from 'react';
import { DiagramaEstatico, IconePaleta } from '../editor/Formas.jsx';
import { SECOES_GUIA } from '../data/guia.js';
import './apps.css';

// App "Guia" da área de trabalho: como funciona cada diagrama, com as peças, um pedido de exemplo,
// o porquê de cada escolha e o diagrama pronto (desenhado igual aos gabaritos do resultado).
export default function Guia() {
  const [aba, setAba] = useState(SECOES_GUIA[0].id);
  const s = SECOES_GUIA.find((x) => x.id === aba);
  return (
    <div className="guia">
      <div className="guia-abas" role="tablist">
        {SECOES_GUIA.map((x) => (
          <button key={x.id} role="tab" aria-selected={aba === x.id} className={`guia-aba ${aba === x.id ? 'ativa' : ''}`} onClick={() => setAba(x.id)}>
            <IconePaleta tipo={x.icone} />
            {x.nome}
          </button>
        ))}
      </div>

      <div className="guia-corpo rolagem" key={s.id}>
        <p className="guia-resumo">{s.resumo}</p>

        <h3 className="guia-titulo">AS PECAS</h3>
        <ul className="guia-pecas">
          {s.pecas.map((p) => (
            <li key={p.nome} className="guia-peca">
              <span className="guia-icone">{p.tipo ? <IconePaleta tipo={p.tipo} /> : <code>{p.texto}</code>}</span>
              <div>
                <b>{p.nome}</b>
                <p>{p.funcao}</p>
                <p className="guia-uso">{p.uso}</p>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="guia-titulo">EXEMPLO DE PEDIDO</h3>
        <div className="guia-exemplo">
          <blockquote className="guia-email">
            <span className="guia-de">De: {s.pedido.cliente}</span>
            {s.pedido.corpo.map((l) => <p key={l}>{l}</p>)}
          </blockquote>
          <figure className="guia-diagrama">
            <DiagramaEstatico diagrama={s.diagrama} prefixo={`guia-${s.id}`} />
            <figcaption>como fica montado</figcaption>
          </figure>
        </div>

        <h3 className="guia-titulo">POR QUE MONTAR ASSIM</h3>
        <ol className="guia-passos">
          {s.passos.map((p) => (
            <li key={p.frase}>
              <b className="guia-frase">{p.frase}</b> → {p.porque}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
