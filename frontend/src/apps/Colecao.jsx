import { useState } from 'react';
import cadeado from '../assets/ui/icon-cadeado-16.png';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import Medalha from '../components/Medalha.jsx';
import { Botao } from '../components/ui.jsx';
import { TODOS_MODELOS, ehJumbo } from '../data/pedidos.js';
import { TIPOS_DIAGRAMA, tipoDoModelo } from '../lib/categorias.js';
import { MEDALHAS, medalhaDaNota, naColecao } from '../lib/colecao.js';
import { nivelDoModelo, pontuacao } from '../lib/dificuldade.js';
import { useGame } from '../state/GameContext.jsx';
import './apps.css';

const FILTROS = [{ id: 'todos', nome: 'Todos' }, ...TIPOS_DIAGRAMA, { id: 'jumbo', nome: 'Jumbo' }];
const ORDEM_TIPO = ['casos', 'classes', 'estados', 'jumbo'];
// Sempre na mesma ordem (tipo, depois complexidade), para os bloqueados ficarem no lugar deles
const LISTA = [...TODOS_MODELOS].sort(
  (a, b) => ORDEM_TIPO.indexOf(tipoDoModelo(a)) - ORDEM_TIPO.indexOf(tipoDoModelo(b)) || pontuacao(a) - pontuacao(b) || a.id.localeCompare(b.id),
);

// Coleção de pedidos: cada pedido já entregue mostra o logo da empresa, o resumo (o e-mail) e o
// broche da melhor nota (lib/colecao.js). O gabarito nunca aparece aqui. Os ainda não entregues
// ficam trancados.
export default function Colecao() {
  const { state } = useGame();
  const colecao = state.colecao ?? {};
  const [filtro, setFiltro] = useState('todos');
  const [selId, setSelId] = useState(null);
  const lista = LISTA.filter((m) => filtro === 'todos' || tipoDoModelo(m) === filtro);
  const total = (id) => LISTA.filter((m) => id === 'todos' || tipoDoModelo(m) === id);
  const tem = (m) => naColecao(colecao, m.id);
  const sel = LISTA.find((m) => m.id === selId && tem(m));
  const contagem = Object.fromEntries(MEDALHAS.map((md) => [md.id, LISTA.filter((m) => tem(m) && medalhaDaNota(colecao[m.id].melhorNota) === md).length]));

  return (
    <div className="colecao">
      <div className="colecao-topo">
        {FILTROS.map((f) => (
          <Botao key={f.id} tamanho="pequeno" variante={filtro === f.id ? 'ativo' : 'claro'} onClick={() => setFiltro(f.id)}>
            {f.nome} ({total(f.id).filter(tem).length}/{total(f.id).length})
          </Botao>
        ))}
        <span className="espaco" />
        {MEDALHAS.map((md) => (
          <span key={md.id} className="colecao-placar" title={`Medalhas de ${md.nome.toLowerCase()}`}>
            <Medalha medalha={md} tamanho={18} /> {contagem[md.id]}
          </span>
        ))}
      </div>

      <div className="colecao-corpo">
        <ul className="colecao-lista rolagem">
          {lista.map((m) => {
            const dados = colecao[m.id];
            if (!tem(m))
              return (
                <li key={m.id}>
                  <div className="colecao-item trancado" title="Entregue este pedido para desbloquear">
                    <span className="colecao-logo trancado"><img src={cadeado} alt="" className="pixel" /></span>
                    <span className="colecao-texto">
                      <b>???</b>
                      <span className="assunto">{ehJumbo(m) ? 'Pedido JUMBO' : 'Pedido'} ainda não entregue</span>
                    </span>
                  </div>
                </li>
              );
            return (
              <li key={m.id}>
                <button className={`colecao-item ${m.id === selId ? 'sel' : ''}`} onClick={() => setSelId(m.id)}>
                  <span className="colecao-logo">
                    <LogoEmpresa nome={m.cliente} tamanho={64} />
                    <Medalha medalha={medalhaDaNota(dados.melhorNota)} tamanho={30} className="broche" />
                  </span>
                  <span className="colecao-texto">
                    <b>{m.cliente}</b>
                    <span className="assunto">
                      {ehJumbo(m) && <b className="tag-jumbo">JUMBO</b>}
                      {m.assunto}
                    </span>
                    <span className="nota">Melhor nota: {dados.melhorNota}%</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="colecao-detalhe">
          {sel ? (
            <>
              <div className="colecao-detalhe-topo">
                <span className="colecao-logo">
                  <LogoEmpresa nome={sel.cliente} tamanho={80} />
                  <Medalha medalha={medalhaDaNota(colecao[sel.id].melhorNota)} tamanho={36} className="broche" />
                </span>
                <div>
                  <h4>{sel.cliente}</h4>
                  <div className="assunto">{sel.assunto}</div>
                  <div className="tags">
                    {ehJumbo(sel) && <span className="tag-jumbo">JUMBO</span>}
                    <span className={`tag-nivel ${nivelDoModelo(sel).id}`}>{nivelDoModelo(sel).nome}</span>
                  </div>
                </div>
              </div>
              <p className="colecao-stats">
                Melhor nota: <b>{colecao[sel.id].melhorNota}%</b> · {medalhaDaNota(colecao[sel.id].melhorNota).nome} · entregue {colecao[sel.id].entregas}×
              </p>
              <div className="colecao-resumo rolagem">
                {sel.corpo.map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </>
          ) : (
            <p className="colecao-vazio">
              Escolha um pedido desbloqueado para ver o resumo.
              <br />
              Ouro: {MEDALHAS[0].min}% ou mais · Prata: {MEDALHAS[1].min}% a {MEDALHAS[0].min - 1}% · Bronze: abaixo de {MEDALHAS[1].min}%
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
