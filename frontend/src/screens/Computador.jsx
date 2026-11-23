import { useSpritesAtualizados } from '../data/spritesVivos.js';
import { useEffect, useRef, useState } from 'react';
import EfeitoCafe from '../components/EfeitoCafe.jsx';
import iEditor from '../assets/ui/icon-editor-16.png';
import iEmail from '../assets/ui/icon-email-16.png';
import iDicas from '../assets/ui/icon-dicas-16.png';
import iLoja from '../assets/ui/icon-loja-16.png';
import iEscritorio from '../assets/ui/icon-escritorio-16.png';
import iGuia from '../assets/ui/icon-guia-16.png';
import iColecao from '../assets/ui/icon-colecao-16.png';
import iMusicas from '../assets/ui/icon-musicas-16.png';
import iRelogio from '../assets/ui/icon-relogio-16.png';
import { Dinheiro, Janela } from '../components/ui.jsx';
import Editor from '../apps/Editor.jsx';
import Email from '../apps/Email.jsx';
import Dicas from '../apps/Dicas.jsx';
import Loja from '../apps/Loja.jsx';
import Guia from '../apps/Guia.jsx';
import Colecao from '../apps/Colecao.jsx';
import Tutorial from './Tutorial.jsx';
import { ListaMusicas } from './TocaFitas.jsx';
import { temTocaFitas } from '../data/musicas.js';
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
  colecao: { nome: 'Coleção', titulo: 'COLECAO-PEDIDOS.EXE', icone: iColecao, x: 110, y: 26, w: 1060, h: 630, Comp: Colecao },
  // só com o toca-fitas comprado (`SO_COM`): troca a música do jogo, como o toca-fitas do escritório
  musicas: { nome: 'Músicas', titulo: 'TOCA-FITAS.EXE', icone: iMusicas, x: 260, y: 60, w: 760, h: 500, Comp: AppMusicas },
};
// Apps que só aparecem quando o jogador tem algo
const SO_COM = { musicas: (state) => temTocaFitas(state.loja.possui) };

// App Músicas: a mesma lista do toca-fitas; `musica` vem do Jogo (faixa tocando e como trocar)
function AppMusicas({ musica }) {
  const { state } = useGame();
  return <ListaMusicas possui={state.loja.possui} escolhida={state.loja.musica} tocando={musica?.tocando} onEscolher={musica?.onEscolher} />;
}

export const formatarTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// `pedidoFoco` ({ id, n }): veio do clique num pop-up; abre o e-mail com esse pedido e avisa
// `onFocoUsado` (assim reabrir o computador depois não abre o e-mail de novo)
// `revendoTutorial`/`onRevendoTutorial`: tutorial aberto de novo pelo botão do Guia (o Jogo para o relógio)
export default function Computador({ desligando, onDesligar, onEntregue, pedidoFoco, onFocoUsado, musica, revendoTutorial, onRevendoTutorial }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const raiz = useRef(null);

  // ---------------------------------------------------------------- ícones arrastáveis no grid invisível
  // Ícones da área de trabalho: os apps (os de SO_COM só quando liberados) e o "Voltar ao escritório"
  const ICONES = [...Object.keys(APPS).filter((id) => !SO_COM[id] || SO_COM[id](state)), 'escritorio'];
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
  const zTopo = useRef(10);

  const focar = (id) => setJanelas((j) => ({ ...j, [id]: { ...j[id], z: ++zTopo.current, min: false } }));
  // `foco`: pedido a mostrar (o e-mail seleciona ele)
  const abrir = (id, foco) => {
    sfx.clique();
    setJanelas((j) => {
      const a = APPS[id];
      // `aberturas` conta quantas vezes o app foi aberto (ícone ou outro app): o editor volta para a
      // seção de casos de uso a cada abertura
      return { ...j, [id]: { x: j[id]?.x ?? a.x, y: j[id]?.y ?? a.y, z: ++zTopo.current, min: false, aberturas: (j[id]?.aberturas ?? 0) + 1, ...(foco ? { foco } : {}) } };
    });
  };
  useEffect(() => {
    if (!pedidoFoco) return;
    abrir('email', pedidoFoco);
    onFocoUsado?.();
  }, [pedidoFoco?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  const fechar = (id) => setJanelas(({ [id]: _, ...resto }) => resto);
  const minimizar = (id) => setJanelas((j) => ({ ...j, [id]: { ...j[id], min: true } }));
  const mover = (id) => (x, y) => setJanelas((j) => ({ ...j, [id]: { ...j[id], x, y } }));

  const focoId = Object.entries(janelas)
    .filter(([, j]) => !j.min)
    .sort((a, b) => b[1].z - a[1].z)[0]?.[0];

  // (Pedido novo chegando: pop-up no canto, em screens/Alertas.jsx, no escritório e no computador)

  const novos = sessao?.pedidos.filter((p) => p.status === 'novo').length ?? 0;
  const ativo = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  useSpritesAtualizados(); // fundo de tela editado (npm run dev): desenha de novo
  const fundo = itemPorId(state.loja.fundo)?.img;

  // primeira vez no computador: tutorial antes do primeiro pedido (que chega com o pop-up no canto);
  // também volta pelo botão "Tutorial" do Guia
  const tutorialAberto = (!state.tutorial?.visto || revendoTutorial) && !desligando;
  // primeira vez: "Vamos nessa!" segue para o pedido de treino no editor; "Pular" pula ele também
  const concluirTutorial = ({ pular = false } = {}) => {
    if (!state.tutorial?.visto) {
      dispatch({ type: 'CONCLUIR_TUTORIAL', treino: !pular, sorteio: Math.random() });
      if (!pular) abrir('editor');
    }
    onRevendoTutorial?.(false);
  };

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
            // com o tutorial aberto as janelas somem (sem fechar) para os ícones destacados aparecerem
            style={j.min || tutorialAberto ? { display: 'none' } : undefined}
            onFoco={() => focoId !== id && focar(id)}
            onMover={mover(id)}
            onMinimizar={() => minimizar(id)}
            onFechar={() => fechar(id)}
          >
            <Comp abrirApp={abrir} focado={focoId === id} onEntregue={onEntregue} abertura={j.aberturas} foco={j.foco} musica={musica} onTutorial={() => onRevendoTutorial?.(true)} />
          </Janela>
        );
      })}

      {tutorialAberto && <Tutorial revendo={state.tutorial?.visto} nome={state.perfil.nome} modo={sessao?.modo} posicoes={posicoes} onConcluir={concluirTutorial} />}

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
