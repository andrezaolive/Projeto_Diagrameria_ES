import { useEffect, useRef, useState } from 'react';
import EfeitoCafe from '../components/EfeitoCafe.jsx';
import iEditor from '../assets/ui/icon-editor-16.png';
import iEmail from '../assets/ui/icon-email-16.png';
import iDicas from '../assets/ui/icon-dicas-16.png';
import iLoja from '../assets/ui/icon-loja-16.png';
import iEscritorio from '../assets/ui/icon-escritorio-16.png';
import iGuia from '../assets/ui/icon-guia-16.png';
import iRelogio from '../assets/ui/icon-relogio-16.png';
import { Dinheiro, Janela } from '../components/ui.jsx';
import Editor from '../apps/Editor.jsx';
import Email from '../apps/Email.jsx';
import Dicas from '../apps/Dicas.jsx';
import Loja from '../apps/Loja.jsx';
import Guia from '../apps/Guia.jsx';
import { itemPorId } from '../data/loja.js';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';
import { GRADE, celulaDoPonto, pixelDaCelula, resolverPosicoes, soltarEm } from '../lib/areaTrabalho.js';

export const APPS = {
  editor: { nome: 'Diagramas', titulo: 'DIAGRAMERIA-EDITOR.EXE', icone: iEditor, x: 24, y: 16, w: 1232, h: 640, Comp: Editor },
  email: { nome: 'E-mail', titulo: 'EMAIL-PEDIDOS.EXE', icone: iEmail, x: 190, y: 50, w: 860, h: 540, Comp: Email },
  dicas: { nome: 'Dicas', titulo: 'DICAS.EXE', icone: iDicas, x: 240, y: 70, w: 800, h: 520, Comp: Dicas },
  loja: { nome: 'Lojinha', titulo: 'MEBOL-LOJA VIRTUAL.EXE', icone: iLoja, x: 170, y: 40, w: 940, h: 590, Comp: Loja },
  guia: { nome: 'Guia', titulo: 'GUIA-DIAGRAMAS.EXE', icone: iGuia, x: 140, y: 30, w: 1000, h: 620, Comp: Guia },
};

// Ícones da área de trabalho: os apps e o "Voltar ao escritório"
const ICONES = [...Object.keys(APPS), 'escritorio'];

export const formatarTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Computador({ desligando, onDesligar, onEntregue }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const raiz = useRef(null);

  // ---------------------------------------------------------------- ícones arrastáveis no grid invisível
  const posicoes = resolverPosicoes(ICONES, state.computador?.icones);
  const [arraste, setArraste] = useState(null); // { id, ox, oy, x, y, sx, sy, moveu }
  const soltouArrastando = useRef(false); // o click que vem depois de arrastar não abre o app
  const noPalco = (e) => {
    const r = raiz.current.getBoundingClientRect();
    const k = raiz.current.clientWidth / r.width; // desfaz a escala do palco
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  };
  const pegarIcone = (id) => (e) => {
    if (e.button !== 0) return;
    const p = noPalco(e);
    const c = pixelDaCelula(posicoes[id]);
    e.currentTarget.setPointerCapture(e.pointerId);
    setArraste({ id, ox: p.x - c.x, oy: p.y - c.y, x: p.x, y: p.y, sx: p.x, sy: p.y, moveu: false });
  };
  const moverIcone = (e) => {
    if (!arraste) return;
    const p = noPalco(e);
    setArraste((a) => a && { ...a, x: p.x, y: p.y, moveu: a.moveu || Math.hypot(p.x - a.sx, p.y - a.sy) > 6 });
  };
  // célula onde o ícone vai parar (a do centro dele; ocupada → vaga próxima → lateral)
  const destinoDoArraste = (a) => {
    const alvo = celulaDoPonto(a.x - a.ox + GRADE.w / 2, a.y - a.oy + GRADE.h / 2);
    return soltarEm(posicoes, a.id, alvo);
  };
  const soltarIcone = () => {
    if (!arraste) return;
    if (arraste.moveu) {
      dispatch({ type: 'MOVER_ICONE', id: arraste.id, posicao: destinoDoArraste(arraste) });
      soltouArrastando.current = true;
      sfx.clickSoltar?.();
    }
    setArraste(null);
  };
  const clicarIcone = (acao) => () => {
    if (soltouArrastando.current) {
      soltouArrastando.current = false;
      return;
    }
    acao();
  };
  // posição do ícone na tela: o arrastado segue o ponteiro (sem sair do palco)
  const estiloIcone = (id) => {
    if (arraste?.id === id && arraste.moveu) {
      const x = Math.min(1280 - GRADE.w, Math.max(0, arraste.x - arraste.ox));
      const y = Math.min(720 - 52 - GRADE.h, Math.max(0, arraste.y - arraste.oy));
      return { left: x, top: y };
    }
    const c = pixelDaCelula(posicoes[id]);
    return { left: c.x, top: c.y };
  };
  // janelas[id] = { x, y, z, min }
  const [janelas, setJanelas] = useState({});
  const [toast, setToast] = useState(null);
  const zTopo = useRef(10);
  const qtdPedidos = useRef(sessao?.pedidos.length ?? 0);

  const focar = (id) => setJanelas((j) => ({ ...j, [id]: { ...j[id], z: ++zTopo.current, min: false } }));
  const abrir = (id) => {
    sfx.clique();
    setJanelas((j) => {
      const a = APPS[id];
      // `aberturas` conta quantas vezes o app foi aberto (ícone ou outro app): o editor volta para a
      // seção de casos de uso a cada abertura
      return { ...j, [id]: { x: j[id]?.x ?? a.x, y: j[id]?.y ?? a.y, z: ++zTopo.current, min: false, aberturas: (j[id]?.aberturas ?? 0) + 1 } };
    });
  };
  const fechar = (id) => setJanelas(({ [id]: _, ...resto }) => resto);
  const minimizar = (id) => setJanelas((j) => ({ ...j, [id]: { ...j[id], min: true } }));
  const mover = (id) => (x, y) => setJanelas((j) => ({ ...j, [id]: { ...j[id], x, y } }));

  const focoId = Object.entries(janelas)
    .filter(([, j]) => !j.min)
    .sort((a, b) => b[1].z - a[1].z)[0]?.[0];

  // Aviso de e-mail novo (modo infinito)
  useEffect(() => {
    const n = sessao?.pedidos.length ?? 0;
    if (n > qtdPedidos.current) {
      sfx.email();
      setToast({ id: Date.now(), texto: `Novo pedido: ${sessao.pedidos.at(-1).cliente}` });
    }
    qtdPedidos.current = n;
  }, [sessao?.pedidos]);

  const novos = sessao?.pedidos.filter((p) => p.status === 'novo').length ?? 0;
  const ativo = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  const fundo = itemPorId(state.loja.fundo)?.img;

  return (
    <div ref={raiz} className={`computador crt ${desligando ? 'desligando' : ''}`}>
      <img src={fundo} alt="" className="wallpaper pixel" draggable={false} />

      <nav className="icones" aria-label="Área de trabalho" onPointerMove={moverIcone} onPointerUp={soltarIcone} onPointerCancel={() => setArraste(null)}>
        {/* onde o ícone arrastado vai parar */}
        {arraste?.moveu && <span className="icone-destino" style={{ left: pixelDaCelula(destinoDoArraste(arraste)).x, top: pixelDaCelula(destinoDoArraste(arraste)).y }} />}
        {ICONES.map((id) => {
          const app = APPS[id];
          const arrastando = arraste?.id === id && arraste.moveu;
          return (
            <button
              key={id}
              className={`icone ${arrastando ? 'arrastando' : ''}`}
              style={estiloIcone(id)}
              onPointerDown={pegarIcone(id)}
              onClick={clicarIcone(app ? () => abrir(id) : onDesligar)}
              title="Clique para abrir · arraste para mudar de lugar"
            >
              <img src={app ? app.icone : iEscritorio} alt="" className="pixel" draggable={false} />
              <span>{app ? app.nome : 'Voltar ao escritório'}</span>
              {id === 'email' && novos > 0 && <span className="badge-email">{novos}</span>}
            </button>
          );
        })}
      </nav>

      {Object.entries(janelas).map(([id, j]) => {
        const a = APPS[id];
        const Comp = a.Comp;
        return (
          <Janela
            key={id}
            titulo={a.titulo}
            icone={a.icone}
            x={j.x}
            y={j.y}
            w={a.w}
            h={a.h}
            z={j.z}
            foco={focoId === id}
            style={j.min ? { display: 'none' } : undefined}
            onFoco={() => focoId !== id && focar(id)}
            onMover={mover(id)}
            onMinimizar={() => minimizar(id)}
            onFechar={() => fechar(id)}
          >
            <Comp abrirApp={abrir} focado={focoId === id} onEntregue={onEntregue} abertura={j.aberturas} />
          </Janela>
        );
      })}

      {toast && (
        <div key={toast.id} className="toast" onAnimationEnd={() => setToast(null)}>
          <img src={iEmail} alt="" className="pixel" />
          {toast.texto}
        </div>
      )}

      <footer className="barra-tarefas">
        <button className="tarefa" onClick={onDesligar} title="Voltar ao escritório">
          <img src={iEscritorio} alt="" className="pixel" /> Sair
        </button>
        {Object.entries(janelas).map(([id]) => (
          <button
            key={id}
            className={`tarefa ${focoId === id ? 'foco' : ''}`}
            onClick={() => (focoId === id ? minimizar(id) : focar(id))}
          >
            <img src={APPS[id].icone} alt="" className="pixel" />
            {APPS[id].nome}
          </button>
        ))}
        <span className="espaco" />
        {ativo && (
          <span className={`etiqueta relogio-pedido ${ativo.tempoRestante <= 30 ? 'urgente' : ''}`} title="Prazo do pedido ativo">
            <img src={iRelogio} alt="" className="pixel" />
            {formatarTempo(ativo.tempoRestante)}
          </span>
        )}
        <EfeitoCafe />
        <Dinheiro valor={state.dinheiro} />
      </footer>
    </div>
  );
}
