import { useEffect, useRef, useState } from 'react';
import { Botao, Modal } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { PALETTE as PALETA, TINTAS } from '../art/palette.js';
import { urlDoCursor } from '../data/spritesRascunho.js';
import { useSpritesAtualizados } from '../data/spritesVivos.js';

// Folha de rascunho (clique no papel da mesa): o jogador rabisca com o lápis (botão esquerdo) e apaga
// com a borracha (botão direito). O desenho tem a mesma resolução da arte do jogo: cada ponto do
// lápis é um pixel de arte (4px no palco). Fica salvo em state.escritorio.rabisco.
export const FOLHA = { w: 176, h: 112, escala: 4, borracha: 3 };
// Lápis (grafite) sempre; com o pote de canetas comprado, mais as 10 tintas
export const LAPIS = { id: 'lapis', nome: 'Lápis', cor: PALETA.plum };
const NOMES_TINTA = { branco: 'Branco', preto: 'Preto', azul: 'Azul', roxo: 'Roxo', vermelho: 'Vermelho', rosa: 'Rosa', laranja: 'Laranja', amarelo: 'Amarelo', verde: 'Verde', ciano: 'Ciano' };
export const CANETAS = Object.entries(TINTAS).map(([id, cor]) => ({ id, nome: NOMES_TINTA[id], cor }));
export const coresDisponiveis = (possui = []) => (possui.includes('obj-canetas') ? [LAPIS, ...CANETAS] : [LAPIS]);

// pontos entre (x0,y0) e (x1,y1) (Bresenham), para o traço não falhar com o mouse rápido
export function linhaDePixels(x0, y0, x1, y1) {
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return pts;
}

export default function Rascunho({ onFechar }) {
  const { state, dispatch } = useGame();
  const canvas = useRef(null);
  const traco = useRef(null); // { modo: 'lapis' | 'borracha', x, y }
  const [ponteiro, setPonteiro] = useState(null); // posição do lápis na folha (px do palco)
  const [apagando, setApagando] = useState(false);
  const cores = coresDisponiveis(state.loja.possui);
  const [corId, setCorId] = useState(LAPIS.id);
  const cor = (cores.find((c) => c.id === corId) ?? LAPIS).cor;

  // desenho salvo
  useEffect(() => {
    const dados = state.escritorio.rabisco;
    if (!dados) return;
    const img = new Image();
    img.onload = () => canvas.current?.getContext('2d').drawImage(img, 0, 0);
    img.src = dados;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc fecha a folha (e não abre a pausa)
  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onFechar();
    };
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  }, [onFechar]);

  // posição em pixels de arte (desfaz a escala do palco e a da folha)
  const pixel = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - r.left) / r.width) * FOLHA.w),
      y: Math.floor(((e.clientY - r.top) / r.height) * FOLHA.h),
      px: ((e.clientX - r.left) / r.width) * FOLHA.w * FOLHA.escala,
      py: ((e.clientY - r.top) / r.height) * FOLHA.h * FOLHA.escala,
    };
  };
  const pintar = (modo, x0, y0, x1, y1) => {
    const ctx = canvas.current.getContext('2d');
    ctx.fillStyle = cor;
    const b = FOLHA.borracha;
    for (const [x, y] of linhaDePixels(x0, y0, x1, y1)) {
      if (modo === 'lapis') ctx.fillRect(x, y, 1, 1);
      else ctx.clearRect(x - 1, y - 1, b, b);
    }
  };
  const salvar = () => dispatch({ type: 'SALVAR_RABISCO', dados: canvas.current.toDataURL('image/png') });

  const down = (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pixel(e);
    const modo = e.button === 2 ? 'borracha' : 'lapis';
    traco.current = { modo, x: p.x, y: p.y };
    setApagando(modo === 'borracha');
    pintar(modo, p.x, p.y, p.x, p.y);
  };
  const move = (e) => {
    const p = pixel(e);
    setPonteiro({ x: p.x, y: p.y }); // o pixel de arte sob o mouse (o mesmo que o traço pinta)
    const t = traco.current;
    if (!t) return;
    pintar(t.modo, t.x, t.y, p.x, p.y);
    traco.current = { ...t, x: p.x, y: p.y };
  };
  const up = () => {
    if (!traco.current) return;
    traco.current = null;
    setApagando(false);
    salvar();
  };
  const limpar = () => {
    canvas.current.getContext('2d').clearRect(0, 0, FOLHA.w, FOLHA.h);
    dispatch({ type: 'SALVAR_RABISCO', dados: null });
  };

  return (
    <Modal titulo="RASCUNHO.TXT" w={FOLHA.w * FOLHA.escala + 56} h={FOLHA.h * FOLHA.escala + (cores.length > 1 ? 196 : 150)} onFechar={onFechar}>
      <div className="rascunho">
        <div className="folha" style={{ width: FOLHA.w * FOLHA.escala, height: FOLHA.h * FOLHA.escala }} onPointerLeave={() => setPonteiro(null)}>
          <canvas
            ref={canvas}
            width={FOLHA.w}
            height={FOLHA.h}
            className="pixel"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onContextMenu={(e) => e.preventDefault()}
          />
          {ponteiro && <Lapis x={ponteiro.x} y={ponteiro.y} apagando={apagando} corId={corId} />}
        </div>
        {cores.length > 1 && (
          <div className="rascunho-cores" role="radiogroup" aria-label="Cor">
            {cores.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={corId === c.id}
                className={`rascunho-cor ${corId === c.id ? 'ativa' : ''}`}
                style={{ '--tinta': c.cor }}
                onClick={() => setCorId(c.id)}
                title={c.nome}
              >
                <span />
              </button>
            ))}
          </div>
        )}
        <div className="rascunho-rodape">
          <span>botão esquerdo: rabiscar · botão direito: apagar</span>
          <span className="espaco" />
          <Botao tamanho="pequeno" variante="claro" onClick={limpar}>Limpar folha</Botao>
          <Botao tamanho="pequeno" variante="menta" onClick={onFechar}>Fechar</Botao>
        </div>
      </div>
    </Modal>
  );
}

// Lápis em pixel art que segue o mouse (a ponta fica no ponteiro); apagando, vira a borracha;
// com uma caneta escolhida, o sprite é o da caneta daquela cor.
// `x`/`y`: pixel de arte sob o mouse. O desenho é encaixado nesse pixel: a ponta do lápis (pixel 0,11
// do sprite) fica exatamente sobre o pixel pintado, e a borracha (quadrado 3×3, linhas 9–11) fica
// centrada no que ela apaga (x−1..x+1, y−1..y+1).
export const posicaoDoCursor = (x, y, apagando, s = FOLHA.escala) =>
  apagando ? { left: (x - 1) * s, top: (y - 1 - 9) * s } : { left: x * s, top: (y - 11) * s };

// Sprite do cursor: PNG 12×12 editável (data/spritesRascunho.js): lápis, borracha ou a caneta da cor
// escolhida (`corId`: 'lapis' ou o id da tinta)
function Lapis({ x, y, apagando, corId }) {
  useSpritesAtualizados(); // PNG do cursor editado (npm run dev): desenha de novo
  const s = FOLHA.escala;
  const nome = apagando ? 'borracha' : corId === LAPIS.id ? 'lapis' : `caneta-${corId}`;
  return <img className="lapis-cursor pixel" src={urlDoCursor(nome)} width={12 * s} height={12 * s} style={posicaoDoCursor(x, y, apagando)} alt="" draggable={false} aria-hidden="true" />;
}
