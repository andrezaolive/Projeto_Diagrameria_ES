import { useCallback, useEffect, useRef, useState } from 'react';
import { Botao, formatarReais } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { EVENTOS, janelasDaPane } from '../lib/eventos.js';
import { precoNoExpediente } from '../lib/modificadores.js';
import { sfx } from '../lib/sfx.js';

// Eventos aleatórios do modo infinito (lib/eventos.js). Só a pane passa por aqui: não pergunta nada,
// a tela pisca com um glitch de 3 a 5 vezes e as janelas de erro se espalham pela tela do jogo. (A
// queda de energia é a QuedaDeEnergia, abaixo; o café derramado é a poça no Escritorio.)

const ERROS = [
  'Erro 0x00DIAGRAMA: seta sem ponta.',
  'O ator saiu do sistema sem avisar.',
  'Memória cheia de casos de uso.',
  'Classe não encontrada: Cafe.',
  'Transição sem evento detectada.',
  'Herança circular: o filho é o pai.',
  'Falha ao carregar a multiplicidade.',
  'O include incluiu a si mesmo.',
];

const reduzMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Minijogo da pane: as janelas de erro se espalham pela tela do jogo (sem janela em volta) e o
// jogador fecha todas antes do tempo acabar (EVENTOS.pane.tempoMinijogo segundos reais, contados em
// décimos). O aviso com a contagem fica embaixo, no centro.
// Área das janelas no palco 1280×720: abaixo dos corações e acima do aviso
const AREA = { x: 40, y: 96, w: 1200, h: 440 };
const JANELA = { w: 220, h: 130 };
function Conserto({ onFim }) {
  const { tempoMinijogo } = EVENTOS.pane;
  // de 6 a 8 janelas, cada uma numa célula sorteada de uma grade 4×2 (com um desvio sorteado), para
  // não ficarem uma em cima da outra
  const [erros] = useState(() => {
    const inicio = Math.floor(Math.random() * ERROS.length);
    const cw = AREA.w / 4, ch = AREA.h / 2;
    const celulas = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    return Array.from({ length: janelasDaPane(Math.random()) }, (_, i) => ({
      id: i,
      x: Math.round(AREA.x + (celulas[i] % 4) * cw + Math.random() * (cw - JANELA.w)),
      y: Math.round(AREA.y + Math.floor(celulas[i] / 4) * ch + Math.random() * (ch - JANELA.h)),
      inclina: Math.round((Math.random() - 0.5) * 6),
      texto: ERROS[(inicio + i) % ERROS.length],
    }));
  });
  const [fechados, setFechados] = useState([]);
  const [resta, setResta] = useState(tempoMinijogo * 1000);
  const fim = useRef(performance.now() + tempoMinijogo * 1000);
  const abertos = erros.filter((e) => !fechados.includes(e.id));
  useEffect(() => {
    if (!abertos.length) return void onFim('consertou');
    if (resta <= 0) return void onFim('falhou');
    const t = setTimeout(() => setResta(Math.max(0, fim.current - performance.now())), 50);
    return () => clearTimeout(t);
  }, [resta, abertos.length, onFim]);
  return (
    <div className="conserto" role="alertdialog" aria-label="Pane no computador">
      {abertos.map((e) => (
        <div key={e.id} className="janela-erro" style={{ left: e.x, top: e.y, transform: `rotate(${e.inclina}deg)` }}>
          <div className="janela-erro-titulo">ERRO.EXE</div>
          <p>{e.texto}</p>
          <button className="px-btn pequeno claro" onClick={() => { sfx.clique(); setFechados((f) => [...f, e.id]); }}>
            OK
          </button>
        </div>
      ))}
      <div className="conserto-aviso" role="status">
        <strong>PANE! PANE! FECHE AS JANELAS ANTES QUE O COMPUTADOR DESLIGUE!</strong>
        <span className={`conserto-contagem ${resta <= 1000 ? 'pouco' : ''}`}>{(resta / 1000).toFixed(1)} s</span>
      </div>
    </div>
  );
}

// Glitch da pane: uma textura que pisca por cima da tela `vezes` vezes; no fim, chama `onFim`
function GlitchPane({ vezes, onFim }) {
  useEffect(() => {
    if (reduzMovimento()) onFim();
  }, [onFim]);
  return (
    <div
      className="glitch-pane"
      aria-hidden="true"
      style={{ animationIterationCount: vezes }}
      onAnimationIteration={(ev) => ev.target === ev.currentTarget && sfx.erro()}
      onAnimationEnd={(ev) => ev.target === ev.currentTarget && onFim()}
    >
      <i className="faixa f1" />
      <i className="faixa f2" />
      <i className="faixa f3" />
    </div>
  );
}

export default function EventoAleatorio() {
  const { state, dispatch } = useGame();
  const evento = state.sessao?.evento;
  // pane: 'glitch' (a tela pisca) → 'conserto' (minijogo)
  const [fase, setFase] = useState('glitch');
  const [vezes, setVezes] = useState(3);
  useEffect(() => {
    setFase('glitch');
    setVezes(3 + Math.floor(Math.random() * 3)); // pisca de 3 a 5 vezes
    if (evento) sfx.erro();
  }, [evento?.tipo]); // eslint-disable-line react-hooks/exhaustive-deps
  const escolher = useCallback((escolha) => dispatch({ type: 'RESOLVER_EVENTO', escolha }), [dispatch]);
  const consertar = useCallback(() => setFase('conserto'), []);
  if (!evento) return null;
  if (evento.tipo === 'pane') {
    if (fase === 'glitch') return <GlitchPane key={vezes} vezes={vezes} onFim={consertar} />;
    return <Conserto onFim={escolher} />;
  }
  return null;
}

// Contratempo de um conserto que falhou: o computador fica bloqueado pelos segundos de jogo que
// faltam (o jogador é levado ao escritório; isto cobre o instante da saída). A queda de energia tem
// a sua própria tela (QuedaDeEnergia).
const BLOQUEIO = {
  pane: { titulo: 'REINICIANDO...', texto: 'O computador volta em' },
};
export function BloqueioEvento({ noComputador }) {
  const { state } = useGame();
  const b = state.sessao?.bloqueio;
  if (b?.tipo !== 'pane' || !noComputador) return null;
  const info = BLOQUEIO[b.tipo];
  return (
    <div className={`bloqueio-evento bloqueio-${b.tipo}`} role="status">
      <div className="bloqueio-caixa">
        <strong>{info.titulo}</strong>
        <span>
          {info.texto} {b.falta} s
        </span>
        <span className="bloqueio-barra">
          <i style={{ width: `${(b.falta / b.total) * 100}%` }} />
        </span>
      </div>
    </div>
  );
}

// Raio em pixel art (botão do gerador)
function Raio() {
  return (
    <svg className="raio" viewBox="0 0 7 10" width="21" height="30" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M3 0h4v1h-1v1h-1v1h-1v1h3v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1h1v-1h1v-2h-3v-1h1v-1h1v-2h1z" fill="var(--c-butter)" stroke="none" />
    </svg>
  );
}

// Queda de energia (sessao.bloqueio.tipo === 'energia'): uma textura preta (60%) pisca duas vezes
// por cima da tela e fica; o Jogo tira o jogador do computador 1 s depois. No escritório, o aviso
// "a energia volta em N segundos" tem do lado direito o botão do raio, que abre (deslizando para a
// direita) a opção de ligar o gerador pelo preço sorteado na queda.
export function QuedaDeEnergia({ noComputador }) {
  const { state, dispatch } = useGame();
  const b = state.sessao?.bloqueio;
  const ativa = b?.tipo === 'energia';
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    setAberto(false);
    if (ativa) sfx.erro();
  }, [ativa]);
  if (!ativa) return null;
  const preco = precoNoExpediente(b.preco, state.sessao);
  const falta = preco > state.dinheiro;
  const ligar = () => {
    sfx.ligar();
    dispatch({ type: 'LIGAR_GERADOR' });
  };
  return (
    <>
      <div className={`apagao ${reduzMovimento() ? '' : 'piscando'}`} aria-hidden="true" />
      {!noComputador && (
        <div className="energia-aviso" role="status">
          <span className="energia-texto">
            A energia volta em <b>{b.falta}</b> {b.falta === 1 ? 'segundo' : 'segundos'}
          </span>
          <button className={`energia-raio ${aberto ? 'aberto' : ''}`} onClick={() => { sfx.clique(); setAberto((a) => !a); }} aria-expanded={aberto} aria-label="Gerador de energia">
            <Raio />
          </button>
          {aberto && (
            <div className="energia-gerador">
              <span>Ligar um gerador de energia</span>
              <Botao tamanho="pequeno" variante="menta" disabled={falta} onClick={ligar}>
                {formatarReais(preco)}
              </Botao>
              {falta && <small>dinheiro insuficiente</small>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
