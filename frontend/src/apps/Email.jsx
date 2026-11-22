import { useEffect, useState } from 'react';
import { Botao } from '../components/ui.jsx';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import { useGame } from '../state/GameContext.jsx';
import { MODELOS, ehComplexo, ehJumbo, modeloPorId, multaPedido } from '../data/pedidos.js';
import { formatarTempo } from '../screens/Computador.jsx';
import TodosPedidos from './TodosPedidos.jsx';
import PainelDev from './PainelDev.jsx';
import { nivelDoModelo } from '../lib/dificuldade.js';
import { MAX_ACEITOS_INFINITO, podeAceitar } from '../state/reducer.js';
import { NOME_DO_TIPO, RETORNO, registroCerto } from '../lib/retorno.js';
import { sfx } from '../lib/sfx.js';
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

// Arquivo de pedidos entregues (modo infinito): lista com as entregas desta e das partidas anteriores
// (state.arquivo, mais recentes em cima). Com um pedido de retorno escolhido (`buscando`), o registro
// selecionado pode ser reenviado para o cliente.
function Arquivo({ buscando, onVoltar }) {
  const { state, dispatch } = useGame();
  const registros = [...(state.arquivo ?? [])].reverse();
  const [selId, setSelId] = useState(registros[0]?.id);
  const [aviso, setAviso] = useState(null);
  const sel = registros.find((r) => r.id === selId);
  const partida = state.estatisticas.jogos;
  const pedido = state.sessao?.pedidos.find((p) => p.id === buscando && p.status === 'novo');
  const reenviar = () => {
    const certo = registroCerto(pedido, sel);
    if (certo) sfx.moeda();
    else sfx.erro();
    dispatch({ type: 'ENVIAR_RETORNO', id: pedido.id, registro: sel.id, sorteio: Math.random() });
    if (certo) onVoltar(pedido.id);
    else setAviso({ n: Date.now(), texto: `Não era esse! O cliente perdeu a paciência (−${RETORNO.penalidade} s).` });
  };
  return (
    <>
      <ul className="email-lista rolagem arquivo-lista">
        {registros.map((r) => (
          <li key={r.id}>
            <button className={`email-item arquivo-item ${r.id === sel?.id ? 'sel' : ''}`} onClick={() => { setSelId(r.id); setAviso(null); }}>
              <LogoEmpresa nome={r.cliente} tamanho={56} className="logo-item" />
              <span className="email-texto">
                <span className="de"><span className="nome">{r.cliente}</span></span>
                <span className="assunto">{r.assunto}</span>
                <span className="quando">{r.partida === partida ? 'Nesta partida' : `Partida ${r.partida}`} · nota {r.nota}%</span>
              </span>
            </button>
          </li>
        ))}
        {registros.length === 0 && <li className="vazio">Nenhum pedido entregue ainda.</li>}
      </ul>
      <article className="email-leitura arquivo-leitura">
        {pedido && (
          <p className="arquivo-buscando">
            Procurando o diagrama para <b>{pedido.cliente}</b>. Escolha o registro e reenvie.
          </p>
        )}
        {sel ? (
          <div className="corpo rolagem">
            <div className="linha linha-de"><LogoEmpresa nome={sel.cliente} tamanho={32} /> <b>{sel.cliente}</b></div>
            <p><b>Pedido:</b> {sel.assunto}</p>
            <p><b>Diagrama:</b> {NOME_DO_TIPO[sel.tipo] ? `diagrama ${NOME_DO_TIPO[sel.tipo]}` : '—'}</p>
            <p><b>Entregue:</b> {sel.partida === partida ? 'nesta partida' : `na partida ${sel.partida}`}, com nota {sel.nota}%</p>
          </div>
        ) : (
          <div className="corpo"><p>Escolha um registro.</p></div>
        )}
        <footer>
          {aviso && <span key={aviso.n} className="aviso aviso-limite">{aviso.texto}</span>}
          <Botao variante="claro" som="voltar" onClick={() => onVoltar(buscando)}>Voltar à caixa</Botao>
          {pedido && (
            <Botao variante="menta" disabled={!sel} onClick={reenviar}>
              Reenviar este
            </Botao>
          )}
        </footer>
      </article>
    </>
  );
}

// `foco` ({ id, n }): pedido vindo do clique num pop-up; fica selecionado ao abrir
export default function Email({ abrirApp, foco }) {
  const { state, dispatch } = useGame();
  // Em aberto (novo / em andamento) em cima, do mais novo para o mais antigo; os terminados descem
  // para o fim da lista (entregues em verde; recusados e perdidos em cinza)
  const pedidos = ordenarCaixa(state.sessao?.pedidos ?? []);
  const [selId, setSelId] = useState(foco?.id ?? pedidos[0]?.id);
  useEffect(() => {
    if (foco?.id) setSelId(foco.id);
  }, [foco?.n]);
  const sel = pedidos.find((p) => p.id === selId) ?? pedidos[0];
  const modelo = sel && modeloPorId(sel.modelo);
  const [vendoTodos, setVendoTodos] = useState(false); // debug: lista de todos os pedidos
  const [painelDev, setPainelDev] = useState(false); // debug: dinheiro e relógio
  // aba Arquivo (modo infinito); `buscando` = pedido de retorno que mandou procurar
  const [arquivo, setArquivo] = useState(null);
  const infinito = state.sessao?.modo === 'infinito';
  const abas = infinito && (
    <li className="email-abas">
      <Botao tamanho="pequeno" variante={arquivo ? 'claro' : 'ativo'} onClick={() => setArquivo(null)}>Caixa</Botao>
      <Botao tamanho="pequeno" variante={arquivo ? 'ativo' : 'claro'} onClick={() => setArquivo({ buscando: null })}>Arquivo ({state.arquivo?.length ?? 0})</Botao>
    </li>
  );
  if (arquivo)
    return (
      <div className="email com-abas">
        <ul className="email-abas-topo">{abas}</ul>
        <Arquivo
          buscando={arquivo.buscando}
          onVoltar={(id) => {
            setArquivo(null);
            if (id) setSelId(id);
          }}
        />
      </div>
    );

  return (
    <div className={`email ${infinito ? 'com-abas' : ''}`}>
      {infinito && <ul className="email-abas-topo">{abas}</ul>}
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
            <button onClick={() => setVendoTodos(true)} title="Debug: escolhe qualquer pedido do jogo para o lugar do primeiro e-mail">
              ☰ Ver todos os pedidos
            </button>
            <button onClick={() => setPainelDev(true)} title="Debug: editar dinheiro e pausar o relógio do jogo">
              ⚙ Dev{state.sessao.relogioParado ? ' · ⏸ timer' : ''}
            </button>
            <span>
              debug · próximo: {MODELOS[state.sessao.debugIndice ?? 0].id} ({(state.sessao.debugIndice ?? 0) + 1}/{MODELOS.length})
            </span>
          </li>
        )}
        {pedidos.map((p) => (
          <li key={p.id}>
            <button className={`email-item ${p.id === sel?.id ? 'sel' : ''} ${p.status === 'novo' ? 'nao-lido' : ''} ${p.urgente ? 'urgente' : ''} ${p.status === 'recusado' || p.status === 'expirado' ? 'perdido' : ''} ${p.status === 'entregue' ? 'concluido' : ''}`} onClick={() => setSelId(p.id)}>
              <LogoEmpresa nome={p.cliente} tamanho={80} className="logo-item" />
              <span className="email-texto">
                <span className="de"><span className="nome">{p.cliente}</span><span className="bolinha" style={{ background: SELO[p.status].cor }} /></span>
                <span className="assunto">
                  {import.meta.env.DEV && !p.retorno && <code className="debug-id">[{p.modelo}]</code>}
                  {p.urgente && <b className="tag-urgente">URGENTE</b>}
                  {/* retorno: sem as etiquetas do modelo (elas entregariam qual é o pedido) */}
                  {p.retorno && <b className="tag-jumbo tag-retorno">RETORNO</b>}
                  {!p.retorno && ehJumbo(modeloPorId(p.modelo)) && <b className="tag-jumbo">JUMBO</b>}
                  {!p.retorno && ehComplexo(modeloPorId(p.modelo)) && <b className="tag-jumbo tag-complexo">COMPLEXO</b>}
                  {p.status === 'novo' && !p.urgente ? 'PEDIDO NOVO · ' : p.status === 'expirado' ? 'FOI EMBORA · ' : ''}{p.urgente ? p.assunto.replace(/^URGENTE: /, '') : p.assunto}
                </span>
                <Paciencia pedido={p} />
              </span>
            </button>
          </li>
        ))}
        {pedidos.length === 0 && <li className="vazio">Caixa vazia.</li>}
      </ul>

      {import.meta.env.DEV && vendoTodos && (
        <TodosPedidos
          onFechar={() => setVendoTodos(false)}
          onEscolher={(modelo) => {
            // o primeiro da caixa (como aparece na lista) é trocado pelo escolhido
            dispatch({ type: 'DEBUG_TROCAR_PEDIDO', alvo: pedidos[0]?.id, modelo });
            setSelId(`${modelo}-${state.sessao.seq}`);
            setVendoTodos(false);
          }}
        />
      )}

      {import.meta.env.DEV && painelDev && <PainelDev onFechar={() => setPainelDev(false)} />}

      {sel && (
        <article className={`email-leitura ${sel.urgente ? 'urgente' : ''}`}>
          <header>
            <div className="linha linha-de"><b>De:</b> <LogoEmpresa nome={sel.cliente} tamanho={32} /> {sel.cliente}</div>
            <div className="linha"><b>Assunto:</b> {sel.assunto}</div>
            <div className="linha meta">
              {sel.urgente && <span className="selo selo-urgente">URGENTE</span>}
              {sel.retorno && <span className="selo selo-jumbo selo-retorno" title="O cliente quer de novo um diagrama já entregue: procure no arquivo">RETORNO</span>}
              {!sel.retorno && ehJumbo(modelo) && <span className="selo selo-jumbo" title="Pedido com dois diagramas de uma vez">JUMBO · 2 diagramas</span>}
              {!sel.retorno && ehComplexo(modelo) && <span className="selo selo-jumbo selo-complexo" title="Diagrama grande, de um sistema inteiro; as dicas têm 16 pedaços">COMPLEXO</span>}
              <span className="selo" style={{ background: SELO[sel.status].cor }}>{SELO[sel.status].txt}</span>
              {!sel.retorno && <span className={`tag-nivel ${nivelDoModelo(modelo).id}`}>{nivelDoModelo(modelo).nome}</span>}
              <span title={sel.repeticao ? 'Dia já concluído: os pedidos pagam metade' : sel.infinito ? 'No modo infinito os pedidos pagam 60%' : undefined}>
                Pagamento: R$ {sel.recompensa}{sel.repeticao ? ' (½ · dia repetido)' : sel.infinito ? ' (60% · modo infinito)' : ''}
              </span>
              {!sel.retorno && <span>Prazo: {formatarTempo(sel.tempo)}</span>}
              {sel.nota != null && <span>Nota: {sel.nota}%</span>}
              {sel.multa != null && <span className="multa">Multa: −R$ {sel.multa}</span>}
            </div>
            <Paciencia pedido={sel} saldo={state.dinheiro} comTexto />
          </header>
          <div className="corpo rolagem">
            {sel.urgente && <p className="aviso-urgente">É URGENTE! Pago a mais, mas preciso do diagrama em {formatarTempo(sel.tempo)}.</p>}
            {(sel.retorno?.texto ?? modelo.corpo).map((l, i) => <p key={i}>{l}</p>)}
            {sel.retorno?.tipo !== 'ambiguo' && <p className="assinatura">Atenciosamente,<br />{sel.cliente}</p>}
          </div>
          <footer>
            {sel.status === 'novo' && sel.retorno && (
              <>
                <Botao variante="claro" som="voltar" onClick={() => dispatch({ type: 'RECUSAR', id: sel.id, sorteio: Math.random() })}>
                  Recusar (−R$ {multaPedido(sel, state.dinheiro)})
                </Botao>
                <Botao variante="menta" onClick={() => setArquivo({ buscando: sel.id })}>
                  Procurar no arquivo
                </Botao>
              </>
            )}
            {sel.status === 'entregue' && sel.retorno && <span className="aviso">Diagrama reenviado. O cliente agradece!</span>}
            {sel.status === 'novo' && !sel.retorno && (
              <>
                {/* modo infinito: com MAX_ACEITOS_INFINITO em andamento, precisa terminar um antes */}
                {!podeAceitar(state.sessao, sel) && (
                  <span className="aviso aviso-limite">Você já tem {MAX_ACEITOS_INFINITO} pedidos em andamento: entregue ou recuse um para aceitar este.</span>
                )}
                <Botao
                  variante="claro"
                  som="voltar"
                  onClick={() => dispatch({ type: 'RECUSAR', id: sel.id, sorteio: Math.random() })}
                  title={sel.urgente ? 'Urgente: recusar custa só 20% do pagamento' : state.dinheiro < 0 ? 'Em dívida, recusar custa só 1/4 do pagamento do pedido' : 'Recusar custa metade do pagamento do pedido'}
                >
                  Recusar (−R$ {multaPedido(sel, state.dinheiro)})
                </Botao>
                <Botao variante="menta" disabled={!podeAceitar(state.sessao, sel)} onClick={() => { dispatch({ type: 'ACEITAR', id: sel.id }); abrirApp('editor'); }}>
                  Aceitar
                </Botao>
              </>
            )}
            {sel.status === 'aceito' && <Botao variante="rosa" onClick={() => { dispatch({ type: 'ATIVAR', id: sel.id }); abrirApp('editor'); }}>Abrir no editor</Botao>}
            {sel.status === 'expirado' && <span className="aviso">{sel.cliente} cansou de esperar uma resposta e procurou outra agência.</span>}
          </footer>
        </article>
      )}
    </div>
  );
}
