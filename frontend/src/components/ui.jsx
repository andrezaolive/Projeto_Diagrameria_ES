import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { sfx } from '../lib/sfx.js';
import moeda from '../assets/ui/icon-moeda-16.png';

// Tamanho da interface (Configurações → Interface): reduzido | auto | grande.
// Botões usam --ui-btn (CSS); janelas modais são ampliadas por ESCALA_JANELA, sem passar do palco.
export const ESCALA_JANELA = { reduzido: 1, auto: 1, grande: 1.12 };
const NivelUi = createContext('auto');

// Prévia do filtro VHS enquanto o jogador mexe nas Configurações (antes de Aplicar)
const PreviaVhs = createContext(() => {});
export const usePreviaVhs = () => useContext(PreviaVhs);

// Filtro VHS por cima de tudo: scanlines, ruído e vinheta.
// A intensidade (0–100) vira --vhs (0–1) e controla a opacidade de cada camada.
export function FiltroVhs({ intensidade }) {
  return (
    <div className="vhs" style={{ '--vhs': intensidade / 100 }} aria-hidden="true">
      <i className="vhs-ruido" />
      <i className="vhs-linhas" />
      <i className="vhs-vinheta" />
    </div>
  );
}

// Palco fixo de 1280x720 escalado para caber na janela do navegador
export function Palco({ nivel = 'auto', vhs = { ativo: false, intensidade: 50 }, children }) {
  const [previa, setPrevia] = useState(null);
  const filtro = previa ?? vhs;
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const ajustar = () => setEscala(Math.min(window.innerWidth / 1280, window.innerHeight / 720));
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);
  return (
    <div className="palco-externo">
      <div
        className="palco"
        data-ui={nivel}
        data-vhs={filtro.ativo && filtro.intensidade > 0 ? '' : undefined}
        style={{ transform: `scale(${escala}) translate(-50%, -50%)`, '--vhs': filtro.intensidade / 100 }}
      >
        <PreviaVhs.Provider value={setPrevia}>
          <NivelUi.Provider value={nivel}>{children}</NivelUi.Provider>
        </PreviaVhs.Provider>
        {filtro.ativo && filtro.intensidade > 0 && <FiltroVhs intensidade={filtro.intensidade} />}
      </div>
    </div>
  );
}

export function Botao({ variante = '', tamanho = '', som = 'clique', onClick, className = '', ...rest }) {
  return (
    <button
      className={`px-btn ${variante} ${tamanho} ${className}`}
      onClick={(e) => {
        sfx[som]?.();
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

// `marcas`: rótulos de cada posição, para sliders com poucos níveis (ex.: Reduzido / Auto / Grande)
export function Slider({ rotulo, valor, onChange, min = 0, max = 100, passo = 5, texto, marcas, desativado = false }) {
  const id = `sl-${rotulo}`;
  return (
    <div className={`px-slider ${marcas ? 'com-marcas' : ''} ${desativado ? 'desativado' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <div className="trilho">
        <input id={id} type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => onChange(+e.target.value)} aria-valuetext={texto} disabled={desativado} />
        {marcas && (
          <div className="marcas" aria-hidden="true">
            {marcas.map((m, i) => (
              <span key={m} className={i + min === valor ? 'ativa' : ''}>{m}</span>
            ))}
          </div>
        )}
      </div>
      <output htmlFor={id}>{marcas ? '' : texto ?? valor}</output>
    </div>
  );
}

// "R$ 40" / "−R$ 20" (valores negativos aparecem com sinal de menos, ex.: dia só com multas)
export const formatarReais = (v) => `${v < 0 ? '−' : ''}R$ ${Math.abs(v)}`;

// Saldo do jogador; negativo = em dívida (aparece em vermelho, com sinal de menos)
export function Dinheiro({ valor }) {
  const divida = valor < 0;
  return (
    <span className={`etiqueta ${divida ? 'divida' : ''}`} title={divida ? 'Você está devendo: entregue pedidos para sair do vermelho' : undefined}>
      <img src={moeda} alt="" className="pixel" />
      {formatarReais(valor)}
    </span>
  );
}

// Janela estilo desktop retrô; arrastável pela barra de título
export function Janela({ titulo, icone, x, y, w, h, z = 1, foco, onFoco, onFechar, onMinimizar, onMover, children, style }) {
  const arraste = useRef(null);

  const down = (e) => {
    if (e.button !== 0 || e.target.closest('.ctl')) return;
    onFoco?.();
    if (!onMover) return;
    const palco = e.currentTarget.closest('.palco');
    const escala = palco.getBoundingClientRect().width / 1280;
    arraste.current = { sx: e.clientX, sy: e.clientY, x, y, escala };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const a = arraste.current;
    if (!a) return;
    const nx = a.x + (e.clientX - a.sx) / a.escala;
    const ny = a.y + (e.clientY - a.sy) / a.escala;
    onMover(Math.round(Math.min(1280 - 120, Math.max(-w + 120, nx)) / 4) * 4, Math.round(Math.min(720 - 100, Math.max(0, ny)) / 4) * 4);
  };
  const up = () => (arraste.current = null);

  return (
    <section
      className={`janela ${foco ? 'foco' : ''}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: z, ...style }}
      onPointerDown={() => onFoco?.()}
      role="dialog"
      aria-label={titulo}
    >
      <header className="janela-titulo" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        {icone && <img src={icone} alt="" className="pixel" />}
        <span className="nome">{titulo}</span>
        {onMinimizar && (
          <button className="ctl" onClick={() => { sfx.voltar(); onMinimizar(); }} aria-label="Minimizar">_</button>
        )}
        {onFechar && (
          <button className="ctl fechar" onClick={() => { sfx.voltar(); onFechar(); }} aria-label="Fechar">X</button>
        )}
      </header>
      <div className="janela-corpo">{children}</div>
    </section>
  );
}

// Janela centralizada sobre fundo escurecido
export function Modal({ titulo, w = 640, h = 420, onFechar, children }) {
  const nivel = useContext(NivelUi);
  const k = Math.min(ESCALA_JANELA[nivel] ?? 1, 1264 / w, 704 / h);
  // a janela inteira já é ampliada: os botões dentro dela não crescem de novo
  const estilo = k !== 1 ? { transform: `scale(${k})`, transformOrigin: 'center', '--ui-btn': 1 } : undefined;
  return (
    <div className="modal-fundo">
      <Janela titulo={titulo} x={(1280 - w) / 2} y={(720 - h) / 2} w={w} h={h} foco onFechar={onFechar} style={estilo}>
        {children}
      </Janela>
    </div>
  );
}
