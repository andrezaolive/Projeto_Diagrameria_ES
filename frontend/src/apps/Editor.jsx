import { useEffect, useRef, useState } from 'react';
import iRelogio from '../assets/ui/icon-relogio-16.png';
import { Botao } from '../components/ui.jsx';
import { Aresta, Defs, ELEMENTOS, Forma, IconePaleta, RELACOES } from '../editor/Formas.jsx';
import { MULTIPLICIDADES, TEM_MULTIPLICIDADE } from '../lib/multiplicidade.js';
import { TAMANHOS, centro, posicaoAoSoltar, snap, telaParaMundo, zoomEm } from '../lib/grid.js';
import { avaliar, pagamento } from '../lib/avaliacao.js';
import { modeloPorId } from '../data/pedidos.js';
import { useGame } from '../state/GameContext.jsx';
import { chaveDiagrama, diagramaDe } from '../state/reducer.js';
import { formatarTempo } from '../screens/Computador.jsx';
import { sfx } from '../lib/sfx.js';
import './editor.css';

const novoId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function Editor({ focado, abrirApp, onEntregue }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const chave = chaveDiagrama(sessao);
  const diagrama = diagramaDe(state, chave);
  const pedido = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  const modelo = pedido && modeloPorId(pedido.modelo);

  const areaRef = useRef(null);
  const [view, setView] = useState({ x: 40, y: 40, zoom: 1 });
  const [ferramenta, setFerramenta] = useState(null); // { categoria: 'elemento' | 'relacao', tipo }
  const [origem, setOrigem] = useState(null); // id do elemento de origem ao ligar
  const [sel, setSel] = useState(null); // { tipo: 'node' | 'edge', id }
  const [fantasma, setFantasma] = useState(null); // prévia já encaixada no grid
  const [cursor, setCursor] = useState(null); // posição no mundo (linha-guia das relações)
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const arraste = useRef(null);
  const rotuloRef = useRef(null);

  // refs com o valor mais recente, para os listeners de janela
  const viewRef = useRef(view);
  const diagRef = useRef(diagrama);
  viewRef.current = view;
  diagRef.current = diagrama;

  const salvar = (d) => dispatch({ type: 'SET_DIAGRAMA', chave, diagrama: d });

  // Coordenadas do ponteiro dentro da área (desfaz a escala do palco)
  const local = (e) => {
    const el = areaRef.current;
    const r = el.getBoundingClientRect();
    const k = el.clientWidth / r.width;
    return {
      x: (e.clientX - r.left) * k,
      y: (e.clientY - r.top) * k,
      dentro: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
    };
  };
  const mundo = (e) => {
    const p = local(e);
    return { ...telaParaMundo(viewRef.current, p.x, p.y), dentro: p.dentro, sx: p.x, sy: p.y };
  };

  const adicionar = (tipo, wx, wy) => {
    const el = ELEMENTOS.find((x) => x.tipo === tipo);
    const node = { id: novoId(), tipo, rotulo: el.rotulo, ...posicaoAoSoltar(tipo, wx, wy) };
    const d = diagRef.current;
    salvar({ ...d, nodes: [...d.nodes, node] });
    setSel({ tipo: 'node', id: node.id });
    sfx.soltar();
    setTimeout(() => rotuloRef.current?.select(), 0);
  };

  const ligar = (de, para) => {
    const d = diagRef.current;
    const tipo = ferramenta.tipo;
    if (de === para || d.edges.some((x) => x.tipo === tipo && x.de === de && x.para === para)) return sfx.erro();
    salvar({ ...d, edges: [...d.edges, { id: novoId(), tipo, de, para }] });
    sfx.soltar();
  };

  const apagarSelecao = () => {
    if (!sel) return;
    const d = diagRef.current;
    if (sel.tipo === 'node')
      salvar({ nodes: d.nodes.filter((n) => n.id !== sel.id), edges: d.edges.filter((x) => x.de !== sel.id && x.para !== sel.id) });
    else salvar({ ...d, edges: d.edges.filter((x) => x.id !== sel.id) });
    setSel(null);
    sfx.voltar();
  };

  // ------------------------------------------------------------ ponteiro na área
  const onDown = (e) => {
    const w = mundo(e);
    const alvoNode = e.target.closest('[data-node]')?.dataset.node;
    const alvoEdge = e.target.closest('[data-edge]')?.dataset.edge;
    const noSistema = diagrama.nodes.find((n) => n.id === alvoNode)?.tipo === 'sistema';
    const vazio = (!alvoNode || noSistema) && !alvoEdge;
    areaRef.current.setPointerCapture(e.pointerId);

    const iniciarPan = () => (arraste.current = { modo: 'pan', sx: w.sx, sy: w.sy, vx: view.x, vy: view.y });

    if (e.button === 1) return iniciarPan();
    if (e.button !== 0) return;

    if (ferramenta?.categoria === 'relacao') {
      if (alvoNode) {
        if (!origem) setOrigem(alvoNode);
        else if (alvoNode !== origem) { ligar(origem, alvoNode); setOrigem(null); }
      } else {
        setOrigem(null);
        iniciarPan();
      }
      return;
    }

    if (ferramenta?.categoria === 'elemento' && vazio) {
      adicionar(ferramenta.tipo, w.x, w.y);
      if (!e.shiftKey) { setFerramenta(null); setFantasma(null); }
      return;
    }

    if (alvoNode) {
      const n = diagrama.nodes.find((x) => x.id === alvoNode);
      setSel({ tipo: 'node', id: alvoNode });
      arraste.current = { modo: 'mover', id: alvoNode, wx: w.x, wy: w.y, ox: n.x, oy: n.y, base: diagrama };
      return;
    }
    if (alvoEdge) return setSel({ tipo: 'edge', id: alvoEdge });

    setSel(null);
    iniciarPan();
  };

  const onMove = (e) => {
    const w = mundo(e);
    const a = arraste.current;
    if (ferramenta?.categoria === 'relacao') setCursor(w);
    if (!a && ferramenta?.categoria === 'elemento') setFantasma({ tipo: ferramenta.tipo, ...posicaoAoSoltar(ferramenta.tipo, w.x, w.y) });
    if (!a) return;
    if (a.modo === 'pan') {
      setView((v) => ({ ...v, x: a.vx + (w.sx - a.sx), y: a.vy + (w.sy - a.sy) }));
    } else if (a.modo === 'mover') {
      // posição sempre encaixada no grid invisível
      const nx = snap(a.ox + (w.x - a.wx));
      const ny = snap(a.oy + (w.y - a.wy));
      const atual = diagRef.current.nodes.find((n) => n.id === a.id);
      if (atual && (atual.x !== nx || atual.y !== ny))
        salvar({ ...diagRef.current, nodes: diagRef.current.nodes.map((n) => (n.id === a.id ? { ...n, x: nx, y: ny } : n)) });
    }
  };

  const onUp = () => {
    if (arraste.current?.modo === 'mover') sfx.soltar();
    arraste.current = null;
  };

  // ------------------------------------------------------------ paleta: clicar ou arrastar
  const pegarDaPaleta = (e, categoria, tipo) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const inicio = { x: e.clientX, y: e.clientY };
    let moveu = false;
    const move = (ev) => {
      if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 6) moveu = true;
      if (!moveu || categoria !== 'elemento') return;
      const w = mundo(ev);
      setFantasma(w.dentro ? { tipo, ...posicaoAoSoltar(tipo, w.x, w.y) } : null);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setFantasma(null);
      if (moveu && categoria === 'elemento') {
        const w = mundo(ev);
        if (w.dentro) adicionar(tipo, w.x, w.y);
        setFerramenta(null);
        return;
      }
      if (!moveu) {
        sfx.clique();
        setOrigem(null);
        setFerramenta((f) => (f?.tipo === tipo ? null : { categoria, tipo }));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ------------------------------------------------------------ zoom
  useEffect(() => {
    const el = areaRef.current;
    const roda = (e) => {
      e.preventDefault();
      const p = local(e);
      setView((v) => zoomEm(v, e.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y));
    };
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, []);

  const zoomCentro = (fator) => {
    const el = areaRef.current;
    setView((v) => zoomEm(v, fator, el.clientWidth / 2, el.clientHeight / 2));
  };

  const enquadrar = () => {
    const el = areaRef.current;
    const { nodes } = diagRef.current;
    if (!nodes.length) return setView({ x: 40, y: 40, zoom: 1 });
    const xs = nodes.flatMap((n) => [n.x, n.x + TAMANHOS[n.tipo].w]);
    const ys = nodes.flatMap((n) => [n.y, n.y + TAMANHOS[n.tipo].h]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
    const zoom = Math.min(2, Math.max(0.25, Math.min((el.clientWidth - 80) / w, (el.clientHeight - 80) / h)));
    setView({ zoom, x: (el.clientWidth - w * zoom) / 2 - minX * zoom, y: (el.clientHeight - h * zoom) / 2 - minY * zoom });
  };

  // ------------------------------------------------------------ teclado
  useEffect(() => {
    if (!focado) return;
    const tecla = (e) => {
      const digitando = e.target.tagName === 'INPUT';
      if (e.key === 'Escape' && (ferramenta || origem || sel)) {
        e.preventDefault(); // impede que o ESC abra a pausa
        setFerramenta(null);
        setOrigem(null);
        setFantasma(null);
        setSel(null);
        if (digitando) e.target.blur();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !digitando && sel) {
        e.preventDefault();
        apagarSelecao();
      }
    };
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  });

  // ------------------------------------------------------------ entrega
  const entregar = () => {
    const r = avaliar(diagrama, modelo.esperado);
    const atrasado = pedido.tempoRestante === 0;
    const valor = pagamento(pedido.recompensa, r.nota, atrasado);
    sfx.moeda();
    onEntregue({ ...r, valor, atrasado, pedido, diagrama, esperado: modelo.esperado });
    dispatch({ type: 'ENTREGAR', id: pedido.id, nota: r.nota, valor });
    setSel(null);
  };

  const selNode = sel?.tipo === 'node' ? diagrama.nodes.find((n) => n.id === sel.id) : null;
  const renomear = (rotulo) => salvar({ ...diagrama, nodes: diagrama.nodes.map((n) => (n.id === selNode.id ? { ...n, rotulo } : n)) });
  // relação selecionada que aceita multiplicidade (associação, agregação, composição)
  const selEdge = sel?.tipo === 'edge' ? diagrama.edges.find((x) => x.id === sel.id) : null;
  const comMult = selEdge && TEM_MULTIPLICIDADE.includes(selEdge.tipo) ? selEdge : null;
  const nomeNo = (id) => diagrama.nodes.find((n) => n.id === id)?.rotulo ?? '?';
  const mudarMult = (campo, valor) =>
    salvar({
      ...diagrama,
      edges: diagrama.edges.map((x) => {
        if (x.id !== comMult.id) return x;
        const { [campo]: _, ...resto } = x;
        return valor ? { ...resto, [campo]: valor } : resto;
      }),
    });
  const sistemas = diagrama.nodes.filter((n) => n.tipo === 'sistema');
  const outros = diagrama.nodes.filter((n) => n.tipo !== 'sistema');
  const noOrigem = origem && diagrama.nodes.find((n) => n.id === origem);

  const nomeFerramenta = ferramenta && [...ELEMENTOS, ...RELACOES].find((x) => x.tipo === ferramenta.tipo).nome;
  const ajuda = !ferramenta
    ? 'Arraste um item da paleta para a área · arraste o fundo para mover · roda do mouse = zoom · Del apaga'
    : ferramenta.categoria === 'elemento'
      ? `Clique numa área vazia para colocar: ${nomeFerramenta} (Shift mantém a ferramenta · Esc cancela)`
      : origem
        ? `${nomeFerramenta}: agora clique no elemento de destino`
        : `${nomeFerramenta}: clique no elemento de origem`;

  return (
    <div className="editor">
      {/* ---------- requisitos */}
      <aside className="editor-requisitos">
        {pedido ? (
          <>
            <div className={`etiqueta relogio-pedido ${pedido.tempoRestante <= 30 ? 'urgente' : ''}`}>
              <img src={iRelogio} alt="" className="pixel" /> {formatarTempo(pedido.tempoRestante)}
            </div>
            <h4>{pedido.cliente}</h4>
            <div className="assunto">{pedido.assunto}</div>
            <div className="lista rolagem">
              {modelo.corpo.map((l, i) => <p key={i}>{l}</p>)}
            </div>
            {pedido.tempoRestante === 0 && <p className="atraso">Prazo esgotado: pagamento pela metade.</p>}
            <Botao tamanho="pequeno" variante="claro" onClick={() => abrirApp('dicas')}>Ver dicas</Botao>
            <Botao variante="rosa" onClick={entregar}>Entregar</Botao>
          </>
        ) : (
          <>
            <h4>Modo livre</h4>
            <p className="lista">Nenhum pedido em andamento. Aceite um pedido no e-mail para começar a trabalhar, ou pratique aqui à vontade.</p>
            <Botao tamanho="pequeno" variante="claro" onClick={() => abrirApp('email')}>Abrir e-mail</Botao>
          </>
        )}
      </aside>

      {/* ---------- área de montagem */}
      <div className="editor-centro">
        <div className="editor-barra">
          {comMult ? (
            <div className="mult-editor" aria-label="Multiplicidade da relação">
              {[['multDe', comMult.de], ['multPara', comMult.para]].map(([campo, id]) => (
                <label key={campo} title={`Multiplicidade do lado de ${nomeNo(id)}`}>
                  <span className="lado">{nomeNo(id)}</span>
                  <select value={comMult[campo] ?? ''} onChange={(e) => mudarMult(campo, e.target.value)}>
                    <option value="">—</option>
                    {MULTIPLICIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : (
          <label className="rotulo">
            Rótulo
            <input
              ref={rotuloRef}
              value={selNode?.rotulo ?? ''}
              disabled={!selNode}
              placeholder="selecione um elemento"
              maxLength={28}
              onChange={(e) => renomear(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            />
          </label>
          )}
          <Botao tamanho="pequeno" variante="claro" disabled={!sel} onClick={apagarSelecao} title="Apagar (Del)">Apagar</Botao>
          <span className="espaco" />
          <Botao tamanho="pequeno" variante="claro" onClick={() => zoomCentro(1 / 1.25)} aria-label="Diminuir zoom">−</Botao>
          <button className="zoom-valor" onClick={() => setView((v) => zoomEm(v, 1 / v.zoom, areaRef.current.clientWidth / 2, areaRef.current.clientHeight / 2))} title="Voltar para 100%">
            {Math.round(view.zoom * 100)}%
          </button>
          <Botao tamanho="pequeno" variante="claro" onClick={() => zoomCentro(1.25)} aria-label="Aumentar zoom">+</Botao>
          <Botao tamanho="pequeno" variante="claro" onClick={enquadrar} title="Enquadrar o diagrama">Ajustar</Botao>
          <Botao
            tamanho="pequeno"
            variante={confirmarLimpar ? 'rosa' : 'claro'}
            onClick={() => {
              if (!confirmarLimpar) return setConfirmarLimpar(true);
              salvar({ nodes: [], edges: [] });
              setConfirmarLimpar(false);
              setSel(null);
            }}
            onBlur={() => setConfirmarLimpar(false)}
          >
            {confirmarLimpar ? 'Confirmar?' : 'Limpar'}
          </Botao>
        </div>

        <div
          ref={areaRef}
          className={`editor-area ${ferramenta ? 'com-ferramenta' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={() => !arraste.current && setFantasma(null)}
          onDoubleClick={() => sel?.tipo === 'node' && rotuloRef.current?.select()}
        >
          <svg width="100%" height="100%">
            <Defs prefixo="ed" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
              {sistemas.map((n) => <Forma key={n.id} node={n} selecionado={sel?.id === n.id} destaque={origem === n.id} />)}
              {diagrama.edges.map((ed) => <Aresta key={ed.id} edge={ed} nodes={diagrama.nodes} selecionada={sel?.id === ed.id} prefixo="ed" />)}
              {outros.map((n) => <Forma key={n.id} node={n} selecionado={sel?.id === n.id} destaque={origem === n.id} />)}
              {noOrigem && cursor && (
                <line x1={centro(noOrigem).x} y1={centro(noOrigem).y} x2={cursor.x} y2={cursor.y} stroke="var(--c-sky)" strokeWidth={3} strokeDasharray="6 6" pointerEvents="none" />
              )}
              {fantasma && (
                <rect
                  x={fantasma.x}
                  y={fantasma.y}
                  width={TAMANHOS[fantasma.tipo].w}
                  height={TAMANHOS[fantasma.tipo].h}
                  fill="rgba(169,196,236,0.25)"
                  stroke="var(--c-sky)"
                  strokeWidth={3}
                  strokeDasharray="8 6"
                  shapeRendering="crispEdges"
                  pointerEvents="none"
                />
              )}
            </g>
          </svg>
          {diagrama.nodes.length === 0 && <div className="area-vazia">Arraste elementos da paleta para cá</div>}
        </div>
        <div className="editor-ajuda">{ajuda}</div>
      </div>

      {/* ---------- paleta */}
      <aside className="editor-paleta">
        <h5>Elementos</h5>
        {ELEMENTOS.map((el) => (
          <button
            key={el.tipo}
            className={`item-paleta ${ferramenta?.tipo === el.tipo ? 'ativo' : ''}`}
            onPointerDown={(e) => pegarDaPaleta(e, 'elemento', el.tipo)}
            title={`Arraste ou clique: ${el.nome}`}
          >
            <IconePaleta tipo={el.tipo} />
            {el.nome}
          </button>
        ))}
        <h5>Relações</h5>
        {RELACOES.map((r) => (
          <button
            key={r.tipo}
            className={`item-paleta ${ferramenta?.tipo === r.tipo ? 'ativo' : ''}`}
            onPointerDown={(e) => pegarDaPaleta(e, 'relacao', r.tipo)}
            title={`Clique e depois ligue dois elementos: ${r.nome}`}
          >
            <IconePaleta tipo={r.tipo} />
            {r.nome}
          </button>
        ))}
      </aside>
    </div>
  );
}
