import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import iRelogio from '../assets/ui/icon-relogio-16.png';
import { Botao, formatarReais } from '../components/ui.jsx';
import roboClode from '../assets/ui/clode-robo-16.png';
import { acaoDoClode } from '../lib/clode.js';
import { Alcas, Aresta, Defs, ELEMENTOS, Forma, IconePaleta, RELACOES, ROTULO_FIXO, SECOES } from '../editor/Formas.jsx';
import { MULTIPLICIDADES, TEM_MULTIPLICIDADE } from '../lib/multiplicidade.js';
import { REDIMENSIONAVEIS, TAMANHOS, TAMANHO_MINIMO, centro, contido, foraDoLugar, posicaoAoSoltar, redimensionar, retangulo, snap, telaParaMundo, zoomEm } from '../lib/grid.js';
import { avaliar, avaliarPartes, pagamentoDaEntrega } from '../lib/avaliacao.js';
import { diagramaVazio, gerarFeedback } from '../lib/feedback.js';
import { ehComplexo, ehJumbo, modeloPorId } from '../data/pedidos.js';
import { useGame } from '../state/GameContext.jsx';
import { chaveDaParte, chaveDiagrama, diagramaDe, pedidosAceitos, precoDoClode } from '../state/reducer.js';
import { formatarTempo } from '../screens/Computador.jsx';
import { sfx } from '../lib/sfx.js';
import { LINHA_MEMBRO, SIMBOLO, TOPO_CLASSE, VIS_PADRAO, VISIBILIDADES, alinharVisibilidades, medidasClasse, proximaVisibilidade, separarMembro } from '../lib/membros.js';
import './editor.css';

const novoId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function Editor({ focado, abrirApp, onEntregue, abertura }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const pedido = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  const modelo = pedido && modeloPorId(pedido.modelo);
  const jumbo = ehJumbo(modelo); // dois diagramas, cada um montado (e salvo) na sua aba
  const aceitos = pedidosAceitos(sessao);

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
  const eventoRef = useRef(null); // campo "Evento" da transição selecionada
  // edição direto na caixa da classe: { id, campo: 'rotulo' | 'atributos' | 'metodos' }
  const [escrevendo, setEscrevendo] = useState(null);
  // Seção da paleta (casos de uso / classes / estados): sempre começa em casos de uso, ao abrir o
  // editor e ao aceitar/trocar de pedido (descobrir o tipo de diagrama faz parte do desafio)
  const [secao, setSecao] = useState('casos');
  const secaoAtual = SECOES.find((s) => s.id === secao);
  // pedido JUMBO: cada aba (seção) tem o seu próprio diagrama, salvo em pedido:<id>:<secao>
  const chave = jumbo ? chaveDaParte(pedido.id, secao) : chaveDiagrama(sessao);
  const diagrama = diagramaDe(state, chave);
  const trocarSecao = (id) => {
    setSecao(id);
    setFerramenta(null);
    setOrigem(null);
    setFantasma(null);
    if (jumbo) {
      // a seleção era de outro diagrama
      setSel(null);
      setEscrevendo(null);
    }
  };
  useEffect(() => {
    trocarSecao('casos');
    setSel(null);
    setEscrevendo(null);
  }, [abertura, pedido?.id]);

  // refs com o valor mais recente, para os listeners de janela
  const viewRef = useRef(view);
  const diagRef = useRef(diagrama);
  viewRef.current = view;
  diagRef.current = diagrama;

  const salvar = (d) => dispatch({ type: 'SET_DIAGRAMA', chave, diagrama: d });

  // Clode (lib/clode.js): põe um elemento que falta ou corrige uma coisa, comparando com o gabarito do
  // diagrama desta aba; sem nada a fazer, só avisa (e não cobra). A fala fica um tempo embaixo do botão.
  const [falaClode, setFalaClode] = useState(null);
  useEffect(() => {
    if (!falaClode) return;
    const t = setTimeout(() => setFalaClode(null), 4500);
    return () => clearTimeout(t);
  }, [falaClode]);
  useEffect(() => setFalaClode(null), [pedido?.id, secao]);
  const precoClode = pedido ? precoDoClode(pedido, sessao) : 0;
  const usarClode = () => {
    const esperado = jumbo ? modelo.partes.find((p) => p.secao === secao)?.esperado : modelo.esperado;
    const a = acaoDoClode(diagRef.current, esperado);
    if (a.tipo === 'nada') {
      sfx.erro();
      return setFalaClode({ n: Date.now(), texto: 'Nada a ser feito.', nada: true });
    }
    if (state.dinheiro < precoClode) return sfx.erro();
    sfx.moeda();
    dispatch({ type: 'USAR_CLODE', id: pedido.id, chave, diagrama: a.diagrama });
    setSel(null);
    setFalaClode({ n: Date.now(), texto: a.texto });
  };

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
    // alça do sistema selecionado: redimensiona (vem antes de tudo, as alças ficam por cima)
    const alca = e.target.closest('[data-alca]')?.dataset.alca;
    if (alca && e.button === 0) {
      const n = diagrama.nodes.find((x) => x.id === sel?.id);
      if (n && REDIMENSIONAVEIS.includes(n.tipo)) {
        areaRef.current.setPointerCapture(e.pointerId);
        arraste.current = { modo: 'redimensionar', id: n.id, lado: alca, wx: w.x, wy: w.y, base: retangulo(n) };
        return;
      }
    }
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
      } else if (alvoEdge) {
        // clicou numa relação (ex.: a transição que acabou de criar): larga a ferramenta e seleciona
        // a linha, para escrever o evento / a multiplicidade na hora
        setFerramenta(null);
        setOrigem(null);
        setCursor(null);
        setSel({ tipo: 'edge', id: alvoEdge });
        setTimeout(() => eventoRef.current?.focus(), 0); // já pode digitar o evento
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
      // mover o sistema leva junto o que está dentro dele
      const filhos =
        n.tipo === 'sistema' ? diagrama.nodes.filter((x) => x.tipo !== 'sistema' && contido(x, n)).map((x) => ({ id: x.id, x: x.x, y: x.y })) : [];
      // jaSelecionado: um clique (sem arrastar) numa classe já selecionada abre a escrita na caixa
      arraste.current = { modo: 'mover', id: alvoNode, wx: w.x, wy: w.y, ox: n.x, oy: n.y, filhos, jaSelecionado: sel?.id === alvoNode };
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
      if (atual && (atual.x !== nx || atual.y !== ny)) {
        const dx = nx - a.ox, dy = ny - a.oy;
        const filho = Object.fromEntries(a.filhos.map((f) => [f.id, f]));
        salvar({
          ...diagRef.current,
          nodes: diagRef.current.nodes.map((n) =>
            n.id === a.id ? { ...n, x: nx, y: ny } : filho[n.id] ? { ...n, x: filho[n.id].x + dx, y: filho[n.id].y + dy } : n,
          ),
        });
      }
    } else if (a.modo === 'redimensionar') {
      const atual = diagRef.current.nodes.find((n) => n.id === a.id);
      if (!atual) return;
      const r = redimensionar(a.base, a.lado, w.x - a.wx, w.y - a.wy, TAMANHO_MINIMO[atual.tipo]);
      if (r.x !== atual.x || r.y !== atual.y || r.w !== retangulo(atual).w || r.h !== retangulo(atual).h)
        salvar({ ...diagRef.current, nodes: diagRef.current.nodes.map((n) => (n.id === a.id ? { ...n, ...r } : n)) });
    }
  };

  // Parte da classe sob um ponto do mundo: nome (topo), atributos (meio) ou métodos (embaixo)
  const parteDaClasse = (n, wy) => {
    const rel = wy - n.y;
    if (rel < TOPO_CLASSE) return 'rotulo';
    return rel < medidasClasse(n).divisoria ? 'atributos' : 'metodos';
  };
  const escreverNaClasse = (id, wy) => {
    const n = diagRef.current.nodes.find((x) => x.id === id);
    if (n?.tipo !== 'classe') return false;
    setSel({ tipo: 'node', id });
    setEscrevendo({ id, campo: parteDaClasse(n, wy) });
    return true;
  };

  const onUp = () => {
    const a = arraste.current;
    if (a?.modo === 'mover') {
      const n = diagRef.current.nodes.find((x) => x.id === a.id);
      const parado = n && n.x === a.ox && n.y === a.oy;
      if (parado && a.jaSelecionado && escreverNaClasse(a.id, a.wy)) {
        arraste.current = null;
        return;
      }
    }
    if (a?.modo === 'mover' || a?.modo === 'redimensionar') sfx.soltar();
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
    const rs = nodes.map(retangulo);
    const xs = rs.flatMap((r) => [r.x, r.x + r.w]);
    const ys = rs.flatMap((r) => [r.y, r.y + r.h]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
    const zoom = Math.min(2, Math.max(0.25, Math.min((el.clientWidth - 80) / w, (el.clientHeight - 80) / h)));
    setView({ zoom, x: (el.clientWidth - w * zoom) / 2 - minX * zoom, y: (el.clientHeight - h * zoom) / 2 - minY * zoom });
  };

  // ------------------------------------------------------------ teclado
  useEffect(() => {
    if (!focado) return;
    const tecla = (e) => {
      // escrevendo na caixa da classe: Esc termina (e não abre a pausa); o resto do teclado é do campo
      if (escrevendo) {
        if (e.key === 'Escape') {
          e.preventDefault();
          document.activeElement?.blur(); // termina pelo onBlur do campo (que limpa as linhas vazias)
        }
        return;
      }
      const digitando = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
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
  // área de montagem vazia: não dá para entregar (nada para avaliar nem aprender com o feedback)
  // JUMBO: o diagrama de cada parte vem da aba dela; só não entrega se todas estiverem vazias
  const partesJumbo = jumbo ? modelo.partes.map((p) => ({ ...p, diagrama: diagramaDe(state, chaveDaParte(pedido.id, p.secao)) })) : null;
  const vazio = jumbo ? partesJumbo.every((p) => diagramaVazio(p.diagrama)) : diagramaVazio(diagrama);
  const entregar = () => {
    if (vazio) return;
    // tipos de erro do feedback, para as estatísticas ("erro mais comum")
    const contarErros = (pares) => {
      const out = {};
      for (const [d, esp] of pares) for (const p of gerarFeedback(d, esp).problemas) out[p.tipo] = (out[p.tipo] ?? 0) + 1;
      return out;
    };
    if (jumbo) {
      const r = avaliarPartes(partesJumbo);
      const pago = pagamentoDaEntrega(pedido, r.nota);
      sfx.nota(r.nota);
      onEntregue({ ...r, ...pago, pedido });
      const erros = contarErros(partesJumbo.map((p) => [p.diagrama, p.esperado]));
      dispatch({ type: 'ENTREGAR', id: pedido.id, nota: r.nota, ...pago, erros, notasPartes: r.partes.map((p) => p.nota), partes: partesJumbo.map(({ secao: s, diagrama: d }) => ({ secao: s, diagrama: d })), sorteio: Math.random() });
      setSel(null);
      return;
    }
    const r = avaliar(diagrama, modelo.esperado);
    const pago = pagamentoDaEntrega(pedido, r.nota);
    sfx.nota(r.nota); // Excellent / Great / Ok / Bad / Worst
    onEntregue({ ...r, ...pago, pedido, diagrama, esperado: modelo.esperado });
    dispatch({ type: 'ENTREGAR', id: pedido.id, nota: r.nota, ...pago, erros: contarErros([[diagrama, modelo.esperado]]), diagrama, sorteio: Math.random() });
    setSel(null);
  };

  const selNode = sel?.tipo === 'node' ? diagrama.nodes.find((n) => n.id === sel.id) : null;
  const renomear = (rotulo) => salvar({ ...diagrama, nodes: diagrama.nodes.map((n) => (n.id === selNode.id ? { ...n, rotulo } : n)) });
  const nomeFixo = selNode && ROTULO_FIXO[selNode.tipo]; // início/fim do diagrama de estados
  // relação selecionada que aceita multiplicidade (associação, agregação, composição)
  const selEdge = sel?.tipo === 'edge' ? diagrama.edges.find((x) => x.id === sel.id) : null;
  const comMult = selEdge && TEM_MULTIPLICIDADE.includes(selEdge.tipo) ? selEdge : null;
  const transicao = selEdge?.tipo === 'transicao' ? selEdge : null;
  const mudarEvento = (rotulo) => salvar({ ...diagrama, edges: diagrama.edges.map((x) => (x.id === transicao.id ? { ...x, rotulo } : x)) });
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
  // caso de uso fora do sistema / ator dentro dele (só confere quando há um sistema desenhado)
  const alertas = Object.fromEntries(foraDoLugar(diagrama.nodes).map((x) => [x.id, x.problema]));

  const nomeFerramenta = ferramenta && [...ELEMENTOS, ...RELACOES].find((x) => x.tipo === ferramenta.tipo).nome;
  const ajuda = escrevendo
    ? 'Escrevendo na classe: escolha - privado, + público ou # protegido nos botões ao lado · Enter cria nova linha · Esc termina'
    : !ferramenta && selNode?.tipo === 'classe'
    ? 'Classe: clique no nome, no meio (atributos: saldo: float) ou embaixo (métodos: sacar(valor: float): bool) para escrever'
    : !ferramenta && selNode?.tipo === 'sistema'
    ? 'Sistema: puxe as setinhas no meio dos lados para redimensionar · casos de uso ficam dentro, atores fora · arrastar move tudo junto'
    : !ferramenta
    ? 'Arraste um item da paleta para a área · arraste o fundo para mover · roda do mouse = zoom · Del apaga'
    : ferramenta.categoria === 'elemento'
      ? `Clique numa área vazia para colocar: ${nomeFerramenta} (Shift mantém a ferramenta · Esc cancela)`
      : origem
        ? `${nomeFerramenta}: agora clique no elemento de destino`
        : `${nomeFerramenta}: clique no elemento de origem`;

  return (
    <div className="editor">
      {/* ---------- requisitos */}
      <aside className={`editor-requisitos ${pedido?.urgente ? 'pedido-urgente' : ''}`}>
        {/* mais de um pedido aceito: abas para trocar qual está no editor (cada um guarda o seu diagrama) */}
        {aceitos.length > 1 && (
          <div className="abas-pedidos" role="tablist" aria-label="Pedidos aceitos">
            {aceitos.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === pedido?.id}
                className={`aba-pedido ${p.id === pedido?.id ? 'ativa' : ''} ${p.urgente ? 'urgente' : ''} ${p.tempoRestante <= 30 ? 'acabando' : ''}`}
                onClick={() => p.id !== pedido?.id && dispatch({ type: 'ATIVAR', id: p.id })}
                title={`${p.cliente}: ${p.assunto}`}
              >
                <span className="nome"><LogoEmpresa nome={p.cliente} tamanho={16} />{p.cliente.split(' ')[0]}</span>
                <span className="tempo">{formatarTempo(p.tempoRestante)}</span>
              </button>
            ))}
          </div>
        )}
        {pedido ? (
          <>
            <div className={`etiqueta relogio-pedido ${pedido.tempoRestante <= 30 || pedido.urgente ? 'urgente' : ''}`}>
              <img src={iRelogio} alt="" className="pixel" /> {formatarTempo(pedido.tempoRestante)}
              {pedido.urgente && <b className="tag-urgente">URGENTE</b>}
              {jumbo && <b className="tag-jumbo">JUMBO</b>}
              {ehComplexo(modelo) && <b className="tag-jumbo tag-complexo">COMPLEXO</b>}
            </div>
            <h4 className="cliente-pedido"><LogoEmpresa nome={pedido.cliente} tamanho={32} />{pedido.cliente}</h4>
            <div className="assunto">{pedido.assunto}</div>
            <div className="lista rolagem">
              {modelo.corpo.map((l, i) => <p key={i}>{l}</p>)}
            </div>
            {pedido.tempoRestante === 0 && <p className="atraso">Prazo esgotado: pagamento pela metade.</p>}
            <Botao tamanho="pequeno" variante="claro" onClick={() => abrirApp('dicas')}>Ver dicas</Botao>
            <Botao variante="rosa" som="" onClick={entregar} disabled={vazio} title={vazio ? 'Monte o diagrama antes de entregar' : ''}>
              Entregar
            </Botao>
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
          {transicao ? (
            <label className="rotulo">
              Evento
              <input
                ref={eventoRef}
                value={transicao.rotulo ?? ''}
                placeholder="ex.: pagar, sim (vazio no início/fim)"
                maxLength={28}
                onChange={(e) => mudarEvento(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              />
            </label>
          ) : comMult ? (
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
              value={nomeFixo ? '' : selNode?.rotulo ?? ''}
              disabled={!selNode || Boolean(nomeFixo)}
              placeholder={nomeFixo ? `${nomeFixo}: sem nome` : 'selecione um elemento'}
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
          onDoubleClick={(e) => {
            const id = e.target.closest('[data-node]')?.dataset.node;
            if (id && escreverNaClasse(id, mundo(e).y)) return;
            if (sel?.tipo === 'node') rotuloRef.current?.select();
          }}
        >
          <svg width="100%" height="100%">
            <Defs prefixo="ed" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
              {sistemas.map((n) => <Forma key={n.id} node={n} selecionado={sel?.id === n.id} destaque={origem === n.id} />)}
              {diagrama.edges.map((ed) => <Aresta key={ed.id} edge={ed} nodes={diagrama.nodes} edges={diagrama.edges} selecionada={sel?.id === ed.id} prefixo="ed" />)}
              {outros.map((n) => <Forma key={n.id} node={n} selecionado={sel?.id === n.id} destaque={origem === n.id} alerta={alertas[n.id]} />)}
              {selNode && REDIMENSIONAVEIS.includes(selNode.tipo) && !ferramenta && <Alcas node={selNode} zoom={view.zoom} />}
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
          {escrevendo && diagrama.nodes.some((n) => n.id === escrevendo.id) && (
            <EscritaNaClasse
              key={`${escrevendo.id}-${escrevendo.campo}`}
              classe={diagrama.nodes.find((n) => n.id === escrevendo.id)}
              campo={escrevendo.campo}
              view={view}
              onMudar={(dados) => salvar({ ...diagRef.current, nodes: diagRef.current.nodes.map((n) => (n.id === escrevendo.id ? { ...n, ...dados } : n)) })}
              onFim={() => setEscrevendo(null)}
            />
          )}
        </div>
        {/* fala do Clode: no canto da área de montagem, apontando para o botão dele */}
        {falaClode && (
          <p key={falaClode.n} className={`clode-fala ${falaClode.nada ? 'nada' : ''}`} role="status">
            <b>Clode:</b> {falaClode.texto}
          </p>
        )}
        <div className="editor-ajuda">{ajuda}</div>
      </div>

      {/* ---------- paleta */}
      <aside className="editor-paleta">
        {/* tipo de diagrama: cada um mostra só os seus elementos e relações */}
        <div className="secoes-paleta" role="tablist" aria-label="Tipo de diagrama">
          {SECOES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={secao === s.id}
              className={`secao-paleta ${secao === s.id ? 'ativa' : ''}`}
              onClick={() => trocarSecao(s.id)}
              title={`Diagrama de ${s.nome.toLowerCase()}`}
            >
              <IconePaleta tipo={s.icone} />
              <span>{s.curto}</span>
              {jumbo && !diagramaVazio(diagramaDe(state, chaveDaParte(pedido.id, s.id))) && <i className="secao-montada" title="Esta aba já tem um diagrama montado" />}
            </button>
          ))}
        </div>
        {/* só a lista rola; o Clode fica sempre no pé da paleta */}
        <div className="paleta-itens">
        <h5>Elementos</h5>
        {secaoAtual.elementos.map((t) => ELEMENTOS.find((el) => el.tipo === t)).map((el) => (
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
        {secaoAtual.relacoes.map((t) => RELACOES.find((r) => r.tipo === t)).map((r) => (
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
        </div>
        {/* Clode: o robozinho que compra um elemento pronto ou corrige uma coisa (pago) */}
        {pedido && (
          <div className="clode">
            <div className="clode-linha">
              <button
                className="clode-botao"
                onClick={usarClode}
                disabled={state.dinheiro < precoClode}
                aria-label={`Clode: usar por ${formatarReais(precoClode)}`}
                title={state.dinheiro < precoClode ? 'Dinheiro insuficiente para o Clode' : 'Clode: põe um elemento pronto ou corrige uma coisa'}
              >
                <img src={roboClode} alt="" className="pixel" width={48} height={48} draggable={false} />
              </button>
              <span className="clode-texto">
                <strong>Clode</strong>
                <small>Compra um elemento pronto ou corrige uma coisa no diagrama.</small>
              </span>
            </div>
            <span className="clode-preco">preço: {formatarReais(precoClode)}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

// Campo de texto por cima de uma parte da classe, no mesmo lugar e tamanho do texto desenhado:
// o nome (uma linha) ou os atributos/métodos (uma linha por membro; Enter cria outra). A caixa cresce
// enquanto o jogador escreve; ao terminar, linhas vazias são descartadas.
function EscritaNaClasse({ classe, campo, view, onMudar, onFim }) {
  const multilinha = campo !== 'rotulo';
  const padrao = VIS_PADRAO[campo] ?? '-';
  // membros: o texto fica sem o símbolo; a visibilidade de cada linha é escolhida nos botões
  const inicio = (classe[campo] ?? []).map(separarMembro);
  const [texto, setTexto] = useState(multilinha ? inicio.map((m) => m.corpo).join('\n') : classe.rotulo ?? '');
  const [vis, setVis] = useState(inicio.map((m) => m.vis || padrao));
  const campoRef = useRef(null);
  // posição do cursor a restaurar depois que um símbolo digitado sai do texto (antes da próxima tecla)
  const cursorPendente = useRef(null);
  useLayoutEffect(() => {
    if (cursorPendente.current == null || !campoRef.current) return;
    campoRef.current.setSelectionRange(cursorPendente.current, cursorPendente.current);
    cursorPendente.current = null;
  });
  const { w, divisoria } = medidasClasse(classe);
  const z = view.zoom;
  const topo = campo === 'rotulo' ? 0 : campo === 'atributos' ? TOPO_CLASSE : divisoria;
  const corpos = texto.split('\n');
  const linhas = multilinha ? Math.max(1, corpos.length) : 1;
  const estilo = {
    left: view.x + classe.x * z,
    top: view.y + (classe.y + topo) * z,
    width: w * z,
    height: (multilinha ? linhas * LINHA_MEMBRO + 8 : TOPO_CLASSE) * z,
    fontSize: (multilinha ? 18 : 22) * z,
    lineHeight: `${LINHA_MEMBRO * z}px`,
    padding: multilinha ? `${4 * z}px ${8 * z}px` : `0 ${8 * z}px`,
  };
  const juntar = (cs, vs, limpar = false) => {
    const out = cs.map((c, i) => (c.trim() ? `${vs[i] || padrao} ${limpar ? c.trim() : c.trimEnd()}` : limpar ? '' : c.trimEnd()));
    return limpar ? out.filter(Boolean) : out;
  };
  const mudar = (v) => {
    if (!multilinha) {
      setTexto(v);
      onMudar({ rotulo: v });
      return;
    }
    // quem digitar o símbolo no começo da linha também escolhe a visibilidade (ele sai do texto)
    let novos = v.split('\n');
    let novasVis = alinharVisibilidades(corpos, vis, novos, padrao);
    let removidos = 0;
    const el = campoRef.current;
    const cursor = el?.selectionStart ?? v.length;
    let pos = 0;
    novos = novos.map((linha, i) => {
      const m = linha.match(SIMBOLO);
      if (m && linha.slice(m[0].length).length) {
        novasVis[i] = m[1];
        if (pos + m[0].length <= cursor) removidos += m[0].length;
        linha = linha.slice(m[0].length);
      }
      pos += linha.length + 1 + (m ? m[0].length : 0);
      return linha;
    });
    const valor = novos.join('\n');
    setTexto(valor);
    setVis(novasVis);
    // enquanto escreve, as linhas vazias ficam (a caixa já cresce com o Enter)
    onMudar({ [campo]: juntar(novos, novasVis) });
    if (removidos) cursorPendente.current = cursor - removidos;
  };
  const escolher = (i, simbolo) => {
    const novasVis = corpos.map((_, k) => (k === i ? simbolo : vis[k] || padrao));
    setVis(novasVis);
    onMudar({ [campo]: juntar(corpos, novasVis) });
  };
  const terminar = () => {
    if (multilinha) onMudar({ [campo]: juntar(corpos, vis, true) });
    else onMudar({ rotulo: texto.trim() || classe.rotulo });
    onFim();
  };
  const props = {
    ref: campoRef,
    className: `escrita-classe ${multilinha ? '' : 'nome'}`,
    style: estilo,
    value: texto,
    autoFocus: true,
    spellCheck: false,
    onChange: (e) => mudar(e.target.value),
    onBlur: terminar,
    onPointerDown: (e) => e.stopPropagation(), // clicar no campo não arrasta nem tira a seleção
    onDoubleClick: (e) => e.stopPropagation(),
    onKeyDown: (e) => {
      if (e.key === 'Escape' || (!multilinha && e.key === 'Enter')) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    placeholder: campo === 'atributos' ? 'nome: tipo' : campo === 'metodos' ? 'nome(param: tipo): retorno' : 'Nome da classe',
  };
  if (!multilinha) return <input {...props} maxLength={28} />;

  // botão de visibilidade: um quadradinho no começo de cada linha, dentro da caixa (como em
  // referencia_botao_classe.png); cada clique passa para a próxima (- → + → #)
  const quadrado = Math.max(12, (LINHA_MEMBRO - 4) * z);
  return (
    <>
      <textarea {...props} style={{ ...estilo, paddingLeft: 8 * z + quadrado + 6 * z }} />
      {Array.from({ length: linhas }, (_, i) => {
        const atual = vis[i] || padrao;
        const info = VISIBILIDADES.find((v) => v.simbolo === atual) ?? VISIBILIDADES[0];
        return (
          <button
            key={i}
            type="button"
            className="vis-botao"
            style={{
              left: estilo.left + 8 * z,
              top: estilo.top + 4 * z + i * LINHA_MEMBRO * z + (LINHA_MEMBRO * z - quadrado) / 2,
              width: quadrado,
              height: quadrado,
              fontSize: Math.max(12, 18 * z),
            }}
            title={`${info.simbolo} ${info.nome} (clique para trocar)`}
            aria-label={`Visibilidade: ${info.nome}. Clique para trocar`}
            // não tira o foco da escrita (senão ela termina) nem arrasta a área
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => escolher(i, proximaVisibilidade(atual))}
          >
            {atual}
          </button>
        );
      })}
    </>
  );
}
