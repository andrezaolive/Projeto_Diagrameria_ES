import { useState } from 'react';
import { Botao } from '../components/ui.jsx';
import { CONQUISTAS, RARIDADES, nomeDoPremio, objetoDaConquista } from '../art/conquistas.js';
import OBJETOS from '../art/objetos.json';
import { metaDe, progressoDe } from '../lib/conquistas.js';
import { salaDe } from '../lib/decoracao.js';
import { spriteObjeto } from '../data/loja.js';
import { usePremiosAtualizados } from '../data/premios.js';
import { useGame } from '../state/GameContext.jsx';
import '../apps/apps.css';
import './conquistas.css';

const FILTROS = [
  { id: 'todas', nome: 'Todas', ok: () => true },
  { id: 'broche', nome: 'Broches', ok: (c) => c.forma === 'broche' },
  { id: 'medalha', nome: 'Medalhas', ok: (c) => c.forma === 'medalha' },
  { id: 'trofeu', nome: 'Troféus', ok: (c) => c.forma === 'trofeu' },
];

// Prêmio desenhado em pixel art, se desbloqueada; senão, só um "?" (o prêmio fica em segredo)
export function Premio({ cq, tem, escala = 3 }) {
  usePremiosAtualizados();
  const meta = OBJETOS[objetoDaConquista(cq.id)];
  if (!tem) {
    const lado = Math.min(meta.w, meta.h) * escala;
    return <span className="premio-misterio" style={{ fontSize: Math.max(18, Math.min(lado, 120)) }} aria-label="Prêmio bloqueado">?</span>;
  }
  return (
    <img
      src={spriteObjeto(objetoDaConquista(cq.id))}
      alt=""
      className="pixel premio"
      style={{ width: meta.w * escala, height: meta.h * escala }}
      draggable={false}
    />
  );
}

function Barra({ progresso }) {
  if (!progresso) return null;
  const { atual, meta } = progresso;
  return (
    <span className="conquista-barra" title={`${atual} de ${meta}`}>
      <span className="preenchido" style={{ width: `${(atual / meta) * 100}%` }} />
      <b>{meta >= 1000 ? `R$ ${atual} / ${meta}` : `${atual}/${meta}`}</b>
    </span>
  );
}

// Onde está o prêmio agora
function onde(state, cq) {
  const nome = objetoDaConquista(cq.id);
  if (state.escritorio.guardados.includes(nome)) return 'Guardado no baú';
  return salaDe(nome, state.escritorio.posicoes) === 'sala' ? 'Na sala de exposição' : 'No escritório';
}

// Lista de conquistas (tela principal → Conquistas, e o livro de conquistas da sala de exposição):
// as desbloqueadas mostram o prêmio; as outras, um "?" no lugar do prêmio, e a barra
// de progresso quando a conquista tem uma. As secretas só mostram a descrição depois.
export default function Conquistas({ onVoltar }) {
  const { state } = useGame();
  const ganhas = state.conquistas ?? {};
  const [filtro, setFiltro] = useState('todas');
  const [selId, setSelId] = useState(null);
  const f = FILTROS.find((x) => x.id === filtro);
  const lista = CONQUISTAS.filter(f.ok);
  const tem = (cq) => Boolean(ganhas[cq.id]);
  const sel = CONQUISTAS.find((c) => c.id === selId);
  const total = (x) => CONQUISTAS.filter(x.ok);

  return (
    <div className="colecao conquistas">
      <div className="colecao-topo">
        {FILTROS.map((x) => (
          <Botao key={x.id} tamanho="pequeno" variante={filtro === x.id ? 'ativo' : 'claro'} onClick={() => setFiltro(x.id)}>
            {x.nome} ({total(x).filter(tem).length}/{total(x).length})
          </Botao>
        ))}
        <span className="espaco" />
        {onVoltar && <Botao tamanho="pequeno" variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>}
      </div>

      <div className="colecao-corpo">
        <ul className="colecao-lista conquistas-lista rolagem">
          {lista.map((cq) => {
            const ok = tem(cq);
            const escondida = cq.secreta && !ok;
            return (
              <li key={cq.id}>
                <button className={`colecao-item conquista-item ${ok ? '' : 'trancado'} ${cq.id === selId ? 'sel' : ''}`} onClick={() => setSelId(cq.id)}>
                  <span className="conquista-premio">
                    <Premio cq={cq} tem={ok} escala={cq.forma === 'trofeu' ? 2 : 3} />
                  </span>
                  <span className="colecao-texto">
                    <b>{escondida ? '???' : cq.nome}</b>
                    <span className="assunto">{escondida ? 'Conquista secreta' : cq.descricao}</span>
                    {!ok && !escondida && <Barra progresso={progressoDe(state, cq)} />}
                    {ok && <span className="nota">Desbloqueada</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="colecao-detalhe conquista-detalhe">
          {sel ? (
            <Detalhe state={state} cq={sel} ok={tem(sel)} />
          ) : (
            <p className="colecao-vazio">
              {Object.keys(ganhas).length} de {CONQUISTAS.length} conquistas.
              <br />
              Escolha uma para ver os detalhes. Broches e medalhas vão para o quadro da sala de exposição; troféus, para as prateleiras.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detalhe({ state, cq, ok }) {
  const escondida = cq.secreta && !ok;
  const premio = nomeDoPremio(cq);
  const progresso = !ok && !escondida && metaDe(cq) ? progressoDe(state, cq) : null;
  return (
    <>
      <div className="conquista-vitrine">
        <Premio cq={cq} tem={ok} escala={cq.forma === 'trofeu' ? 4 : 6} />
      </div>
      <h4>{escondida ? '???' : cq.nome}</h4>
      <div className="tags">
        <span className={`tag-raridade ${cq.raridade}`}>{RARIDADES[cq.raridade].dificuldade}</span>
        <span className="tag-premio">{premio}</span>
      </div>
      <p className="conquista-descricao">{escondida ? 'Conquista secreta: jogue para descobrir.' : cq.descricao}</p>
      {progresso && <Barra progresso={progresso} />}
      {progresso && cq.interrompivel && <p className="conquista-obs">A sequência recomeça do zero se for interrompida.</p>}
      <p className={`conquista-status ${ok ? 'ok' : ''}`}>
        {ok ? `Desbloqueada · ${onde(state, cq)}` : `Desbloqueie para ver ${premio.startsWith('Troféu') ? 'o troféu' : premio.startsWith('Medalha') ? 'a medalha' : 'o broche'}.`}
      </p>
    </>
  );
}
