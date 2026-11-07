import { useState } from 'react';
import { Botao } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { MODELOS, modeloPorId, multaPedido } from '../data/pedidos.js';
import { formatarTempo } from '../screens/Computador.jsx';
import './apps.css';

const SELO = {
  novo: { txt: 'NOVO', cor: 'var(--c-rose)' },
  aceito: { txt: 'EM ANDAMENTO', cor: 'var(--c-butter)' },
  entregue: { txt: 'ENTREGUE', cor: 'var(--c-mint)' },
  recusado: { txt: 'RECUSADO', cor: 'var(--c-lavender)' },
  expirado: { txt: 'FOI EMBORA', cor: 'var(--c-violet)' },
};

// Barra de paciência do cliente (só para pedidos novos). Fica vermelha e pisca no último quarto.
function Paciencia({ pedido, saldo, comTexto = false }) {
  if (pedido.status !== 'novo' || pedido.paciencia == null) return null;
  const fracao = pedido.paciencia / pedido.pacienciaTotal;
  const nivel = fracao <= 0.25 ? 'urgente' : fracao <= 0.5 ? 'atencao' : '';
  return (
    <span className={`paciencia ${nivel}`} title={`O cliente espera mais ${formatarTempo(pedido.paciencia)}`}>
      {comTexto && (
        <span className="rotulo">
          Cliente espera: {formatarTempo(pedido.paciencia)} · se ele for embora: −R$ {multaPedido(pedido, saldo)}
        </span>
      )}
      <span className="barra" role="progressbar" aria-label="Paciência do cliente" aria-valuemin={0} aria-valuemax={pedido.pacienciaTotal} aria-valuenow={pedido.paciencia}>
        <i style={{ width: `${fracao * 100}%` }} />
      </span>
    </span>
  );
}

const EM_ABERTO = ['novo', 'aceito'];
export const ordenarCaixa = (lista) => {
  const recentes = [...lista].reverse();
  return [...recentes.filter((p) => EM_ABERTO.includes(p.status)), ...recentes.filter((p) => !EM_ABERTO.includes(p.status))];
};

export default function Email({ abrirApp }) {
  const { state, dispatch } = useGame();
  // Em aberto (novo / em andamento) em cima, do mais novo para o mais antigo; os terminados descem
  // para o fim da lista (entregues em verde; recusados e perdidos em cinza)
  const pedidos = ordenarCaixa(state.sessao?.pedidos ?? []);
  const [selId, setSelId] = useState(pedidos[0]?.id);
  const sel = pedidos.find((p) => p.id === selId) ?? pedidos[0];
  const modelo = sel && modeloPorId(sel.modelo);
  const ocupado = Boolean(state.sessao?.ativo);

  return (
    <div className="email">
      <ul className="email-lista rolagem">
        {/* DEBUG (só em npm run dev): passa pelos modelos de pedido em sequência */}
        {import.meta.env.DEV && state.sessao && (
          <li className="debug-refresh">
            <button
              onClick={() => {
                dispatch({ type: 'DEBUG_REFRESH_PEDIDOS' });
                setSelId(undefined);
              }}
              title="Debug: troca os pedidos não aceitos pelos próximos modelos da lista"
            >
              ↻ Refresh pedidos
            </button>
            <button onClick={() => dispatch({ type: 'DEBUG_URGENTE' })} title="Debug: chega um pedido urgente agora">
              + Urgente
            </button>
            <span>
              debug · próximo: {MODELOS[state.sessao.debugIndice ?? 0].id} ({(state.sessao.debugIndice ?? 0) + 1}/{MODELOS.length})
            </span>
          </li>
        )}
        {pedidos.map((p) => (
          <li key={p.id}>
            <button className={`email-item ${p.id === sel?.id ? 'sel' : ''} ${p.status === 'novo' ? 'nao-lido' : ''} ${p.urgente ? 'urgente' : ''} ${p.status === 'recusado' || p.status === 'expirado' ? 'perdido' : ''} ${p.status === 'entregue' ? 'concluido' : ''}`} onClick={() => setSelId(p.id)}>
              <span className="bolinha" style={{ background: SELO[p.status].cor }} />
              <span className="de">{p.cliente}</span>
              <span className="assunto">
                {import.meta.env.DEV && <code className="debug-id">[{p.modelo}]</code>}
                {p.urgente && <b className="tag-urgente">URGENTE</b>}
                {p.status === 'novo' && !p.urgente ? 'PEDIDO NOVO · ' : p.status === 'expirado' ? 'FOI EMBORA · ' : ''}{p.urgente ? p.assunto.replace(/^URGENTE: /, '') : p.assunto}
              </span>
              <Paciencia pedido={p} />
            </button>
          </li>
        ))}
        {pedidos.length === 0 && <li className="vazio">Caixa vazia.</li>}
      </ul>

      {sel && (
        <article className={`email-leitura ${sel.urgente ? 'urgente' : ''}`}>
          <header>
            <div className="linha"><b>De:</b> {sel.cliente}</div>
            <div className="linha"><b>Assunto:</b> {sel.assunto}</div>
            <div className="linha meta">
              {sel.urgente && <span className="selo selo-urgente">URGENTE</span>}
              <span className="selo" style={{ background: SELO[sel.status].cor }}>{SELO[sel.status].txt}</span>
              <span>Pagamento: R$ {sel.recompensa}</span>
              <span>Prazo: {formatarTempo(sel.tempo)}</span>
              {sel.nota != null && <span>Nota: {sel.nota}%</span>}
              {sel.multa != null && <span className="multa">Multa: −R$ {sel.multa}</span>}
            </div>
            <Paciencia pedido={sel} saldo={state.dinheiro} comTexto />
          </header>
          <div className="corpo rolagem">
            {sel.urgente && <p className="aviso-urgente">É URGENTE! Pago a mais, mas preciso do diagrama em {formatarTempo(sel.tempo)}.</p>}
            {modelo.corpo.map((l, i) => <p key={i}>{l}</p>)}
            <p className="assinatura">Atenciosamente,<br />{sel.cliente}</p>
          </div>
          <footer>
            {sel.status === 'novo' && (
              <>
                <Botao
                  variante="claro"
                  som="voltar"
                  onClick={() => dispatch({ type: 'RECUSAR', id: sel.id, sorteio: Math.random() })}
                  title={sel.urgente ? 'Urgente: recusar custa só 20% do pagamento' : state.dinheiro < 0 ? 'Em dívida, recusar custa só 1/4 do pagamento do pedido' : 'Recusar custa metade do pagamento do pedido'}
                >
                  Recusar (−R$ {multaPedido(sel, state.dinheiro)})
                </Botao>
                <Botao
                  variante="menta"
                  disabled={ocupado}
                  title={ocupado ? 'Termine o pedido em andamento primeiro' : ''}
                  onClick={() => { dispatch({ type: 'ACEITAR', id: sel.id }); abrirApp('editor'); }}
                >
                  Aceitar
                </Botao>
              </>
            )}
            {sel.status === 'aceito' && <Botao variante="rosa" onClick={() => abrirApp('editor')}>Abrir no editor</Botao>}
            {sel.status === 'expirado' && <span className="aviso">{sel.cliente} cansou de esperar uma resposta e procurou outra agência.</span>}
            {ocupado && sel.status === 'novo' && <span className="aviso">Termine o pedido em andamento antes de aceitar outro.</span>}
          </footer>
        </article>
      )}
    </div>
  );
}
