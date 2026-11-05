import { useEffect, useRef, useState } from 'react';
import iEditor from '../assets/ui/icon-editor-16.png';
import iEmail from '../assets/ui/icon-email-16.png';
import iDicas from '../assets/ui/icon-dicas-16.png';
import iLoja from '../assets/ui/icon-loja-16.png';
import iEscritorio from '../assets/ui/icon-escritorio-16.png';
import iRelogio from '../assets/ui/icon-relogio-16.png';
import { Dinheiro, Janela } from '../components/ui.jsx';
import Editor from '../apps/Editor.jsx';
import Email from '../apps/Email.jsx';
import Dicas from '../apps/Dicas.jsx';
import Loja from '../apps/Loja.jsx';
import { itemPorId } from '../data/loja.js';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';

export const APPS = {
  editor: { nome: 'Diagramas', titulo: 'DIAGRAMERIA-EDITOR.EXE', icone: iEditor, x: 24, y: 16, w: 1232, h: 640, Comp: Editor },
  email: { nome: 'E-mail', titulo: 'EMAIL-PEDIDOS.EXE', icone: iEmail, x: 190, y: 50, w: 860, h: 540, Comp: Email },
  dicas: { nome: 'Dicas', titulo: 'DICAS.EXE', icone: iDicas, x: 240, y: 70, w: 800, h: 520, Comp: Dicas },
  loja: { nome: 'Lojinha', titulo: 'MEBOL-LOJA VIRTUAL.EXE', icone: iLoja, x: 170, y: 40, w: 940, h: 590, Comp: Loja },
};

export const formatarTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Computador({ desligando, onDesligar, onEntregue }) {
  const { state } = useGame();
  const sessao = state.sessao;
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
      return { ...j, [id]: { x: j[id]?.x ?? a.x, y: j[id]?.y ?? a.y, z: ++zTopo.current, min: false } };
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
    <div className={`computador crt ${desligando ? 'desligando' : ''}`}>
      <img src={fundo} alt="" className="wallpaper pixel" draggable={false} />

      <nav className="icones" aria-label="Área de trabalho">
        {Object.entries(APPS).map(([id, a]) => (
          <button key={id} className="icone" onClick={() => abrir(id)} onDoubleClick={() => abrir(id)}>
            <img src={a.icone} alt="" className="pixel" />
            <span>{a.nome}</span>
            {id === 'email' && novos > 0 && <span className="badge-email">{novos}</span>}
          </button>
        ))}
        <button className="icone" onClick={onDesligar}>
          <img src={iEscritorio} alt="" className="pixel" />
          <span>Voltar ao escritório</span>
        </button>
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
            <Comp abrirApp={abrir} focado={focoId === id} onEntregue={onEntregue} />
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
        <Dinheiro valor={state.dinheiro} />
      </footer>
    </div>
  );
}
