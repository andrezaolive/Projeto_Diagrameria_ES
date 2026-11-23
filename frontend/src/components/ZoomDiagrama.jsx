import { useEffect, useRef, useState } from 'react';

// Zoom num diagrama pronto (dicas compradas, seu diagrama e o esperado no resultado): a rodinha
// amplia no ponto do cursor, arrastar move (com zoom), duplo clique ou ⟲ volta ao normal, e os botões
// + / − ficam no canto. Tudo o que está dentro (o SVG e, nas dicas, as tampas) amplia junto. Arrastar
// não conta como clique (não compra pedaço de dica sem querer).
const MIN = 1;
const MAX = 4;
const PASSO = 1.25;

const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

export default function ZoomDiagrama({ children, className = '' }) {
  const ref = useRef(null);
  const [vista, setVista] = useState({ z: 1, x: 0, y: 0 });
  const arraste = useRef(null);
  const arrastou = useRef(false);

  // posição/tamanho no palco (o palco é escalado para caber na janela)
  const medidas = () => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const escala = r.width / el.offsetWidth || 1;
    return { r, escala, w: el.offsetWidth, h: el.offsetHeight };
  };
  // o conteúdo ampliado sempre cobre a área (não deixa sobrar borda vazia)
  const presa = (v, w, h) => ({ z: v.z, x: limitar(v.x, w - w * v.z, 0), y: limitar(v.y, h - h * v.z, 0) });

  const zoomEm = (fator, px, py) => {
    const { w, h } = medidas();
    setVista((v) => {
      const z = limitar(v.z * fator, MIN, MAX);
      const k = z / v.z;
      return presa({ z, x: px - (px - v.x) * k, y: py - (py - v.y) * k }, w, h);
    });
  };
  const zoomNoMeio = (fator) => {
    const { w, h } = medidas();
    zoomEm(fator, w / 2, h / 2);
  };

  // rodinha: listener nativo para poder impedir a rolagem da página (React registra como passivo)
  useEffect(() => {
    const el = ref.current;
    const roda = (e) => {
      e.preventDefault();
      const { r, escala } = medidas();
      zoomEm(e.deltaY < 0 ? PASSO : 1 / PASSO, (e.clientX - r.left) / escala, (e.clientY - r.top) / escala);
    };
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e) => {
    if (e.button !== 0 || vista.z === 1 || e.target.closest('.zoom-controles')) return;
    arraste.current = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y, id: e.pointerId };
    arrastou.current = false;
  };
  const move = (e) => {
    const a = arraste.current;
    if (!a) return;
    const { escala, w, h } = medidas();
    const dx = (e.clientX - a.x) / escala, dy = (e.clientY - a.y) / escala;
    if (!arrastou.current && Math.hypot(dx, dy) < 4) return;
    if (!arrastou.current) ref.current.setPointerCapture?.(a.id);
    arrastou.current = true;
    setVista((v) => presa({ z: v.z, x: a.vx + dx, y: a.vy + dy }, w, h));
  };
  const up = () => {
    arraste.current = null;
  };
  // depois de arrastar, o clique que vem junto não vale
  const clique = (e) => {
    if (!arrastou.current) return;
    arrastou.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const z = vista.z;
  return (
    <div
      ref={ref}
      className={`zoom-area ${z > 1 ? 'ampliado' : ''} ${arraste.current && arrastou.current ? 'arrastando' : ''} ${className}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={clique}
      onDoubleClick={(e) => !e.target.closest('.zoom-controles, button') && setVista({ z: 1, x: 0, y: 0 })}
    >
      <div className="zoom-conteudo" style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${z})` }}>
        {children}
      </div>
      <div className="zoom-controles">
        <button type="button" onClick={() => zoomNoMeio(PASSO)} disabled={z >= MAX} title="Aproximar (ou use a rodinha do mouse)" aria-label="Aproximar">+</button>
        <button type="button" onClick={() => zoomNoMeio(1 / PASSO)} disabled={z <= MIN} title="Afastar" aria-label="Afastar">−</button>
        <button type="button" onClick={() => setVista({ z: 1, x: 0, y: 0 })} disabled={z === 1} title="Voltar ao tamanho normal (ou duplo clique)" aria-label="Tamanho normal">⟲</button>
      </div>
    </div>
  );
}
