import { useState } from 'react';
import './grafico.css';

// Gráficos pequenos da aba de estatísticas (ver lib/estatisticas.js).
// Estilo pixel: marcas retas, uma série por gráfico, cores só da paleta.
const W = 440;
const H = 230;
const M = { esq: 44, dir: 16, topo: 26, base: 34 };
const LARG = W - M.esq - M.dir;
const ALT = H - M.topo - M.base;

const fmt = (v, unidade) => (unidade === 'R$' ? `R$ ${v}` : unidade === '%' ? `${v}%` : `${v}`);

// arredonda o topo da escala para um número "redondo"
function topoEscala(max) {
  if (max <= 0) return 1;
  const passo = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * passo >= max) return m * passo;
  return max;
}

function Eixos({ max, unidade }) {
  // marca do meio só quando cai num número inteiro (contagens pequenas, ex.: 0–5)
  const marcas = Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max];
  return (
    <g className="eixos">
      {marcas.map((v) => {
        const y = M.topo + ALT - (v / max) * ALT;
        return (
          <g key={v}>
            <line x1={M.esq} x2={W - M.dir} y1={y} y2={y} className={v === 0 ? 'base' : 'grade'} />
            <text x={M.esq - 8} y={y + 5} textAnchor="end">{fmt(Math.round(v), unidade === 'R$' ? '' : unidade)}</text>
          </g>
        );
      })}
    </g>
  );
}

function Dica({ x, y, texto }) {
  const w = texto.length * 9 + 16;
  const cx = Math.min(Math.max(x - w / 2, 2), W - w - 2);
  const cy = Math.max(y - 34, 0);
  return (
    <g className="dica" pointerEvents="none">
      <rect x={cx} y={cy} width={w} height={26} />
      <text x={cx + w / 2} y={cy + 18} textAnchor="middle">{texto}</text>
    </g>
  );
}

function Barras({ barras, unidade, destaque }) {
  const [foco, setFoco] = useState(null);
  const max = topoEscala(Math.max(...barras.map((b) => b.valor)));
  const fatia = LARG / barras.length;
  const largura = Math.min(56, fatia * 0.6);
  return (
    <>
      <Eixos max={max} unidade={unidade} />
      {barras.map((b, i) => {
        const h = (b.valor / max) * ALT;
        const x = M.esq + fatia * i + (fatia - largura) / 2;
        const y = M.topo + ALT - h;
        return (
          <g key={b.rotulo} onPointerEnter={() => setFoco(i)} onPointerLeave={() => setFoco(null)}>
            {/* alvo de hover maior que a barra */}
            <rect x={M.esq + fatia * i} y={M.topo} width={fatia} height={ALT} className="alvo" />
            <rect x={x} y={y} width={largura} height={Math.max(h, b.valor ? 2 : 0)} className={`barra ${i === destaque ? 'destaque' : ''} ${foco === i ? 'foco' : ''}`} />
            <text x={x + largura / 2} y={y - 6} textAnchor="middle" className="valor">{fmt(b.valor, unidade)}</text>
            <text x={x + largura / 2} y={H - 10} textAnchor="middle" className="rotulo">{b.rotulo}</text>
          </g>
        );
      })}
    </>
  );
}

function Linha({ pontos, unidade, referencia, destaque, min = 0, max: maxFixo }) {
  const [foco, setFoco] = useState(null);
  const max = maxFixo ?? topoEscala(Math.max(...pontos));
  const passo = pontos.length > 1 ? LARG / (pontos.length - 1) : 0;
  const px = (i) => (pontos.length > 1 ? M.esq + passo * i : M.esq + LARG / 2);
  const py = (v) => M.topo + ALT - ((v - min) / (max - min || 1)) * ALT;
  const d = pontos.map((v, i) => `${i ? 'L' : 'M'}${px(i)} ${py(v)}`).join('');

  return (
    <>
      <Eixos max={max} unidade={unidade} />
      {referencia && (
        <g className="referencia">
          <line x1={M.esq} x2={W - M.dir} y1={py(referencia.valor)} y2={py(referencia.valor)} />
          <text x={W - M.dir} y={py(referencia.valor) - 6} textAnchor="end">{referencia.rotulo}</text>
        </g>
      )}
      <path d={d} className="linha" />
      {pontos.map((v, i) => (
        <rect
          key={i}
          x={px(i) - 4}
          y={py(v) - 4}
          width={8}
          height={8}
          className={`ponto ${i === destaque ? 'destaque' : ''} ${foco === i ? 'foco' : ''}`}
        />
      ))}
      {/* faixas verticais invisíveis para o hover (crosshair simples) */}
      {pontos.map((v, i) => (
        <rect
          key={`alvo${i}`}
          x={px(i) - Math.max(passo, 16) / 2}
          y={M.topo}
          width={Math.max(passo, 16)}
          height={ALT}
          className="alvo"
          onPointerEnter={() => setFoco(i)}
          onPointerLeave={() => setFoco(null)}
        />
      ))}
      {destaque != null && foco == null && <Dica x={px(destaque)} y={py(pontos[destaque])} texto={`melhor: ${fmt(pontos[destaque], unidade)}`} />}
      {foco != null && (
        <>
          <line x1={px(foco)} x2={px(foco)} y1={M.topo} y2={M.topo + ALT} className="mira" />
          <Dica x={px(foco)} y={py(pontos[foco])} texto={`#${foco + 1}: ${fmt(pontos[foco], unidade)}`} />
        </>
      )}
      <text x={M.esq} y={H - 10} className="rotulo">mais antiga</text>
      <text x={W - M.dir} y={H - 10} textAnchor="end" className="rotulo">mais recente</text>
    </>
  );
}

// faixas de nota (mesmas da reação do mascote), do claro ao escuro
const FAIXAS_DIA = [
  { ate: 30, classe: 'f1', rotulo: '<30%' },
  { ate: 60, classe: 'f2', rotulo: '30–59%' },
  { ate: 85, classe: 'f3', rotulo: '60–84%' },
  { ate: 101, classe: 'f4', rotulo: '85%+' },
];
const faixaDia = (media) => FAIXAS_DIA.find((f) => media < f.ate);

function Dias({ dias }) {
  const COLS = 8;
  const lado = 44;
  const gap = 6;
  const x0 = (W - (COLS * lado + (COLS - 1) * gap)) / 2;
  return (
    <>
      {dias.map(({ dia, media }, i) => {
        const x = x0 + (i % COLS) * (lado + gap);
        const y = 4 + Math.floor(i / COLS) * (lado + gap);
        const f = media == null ? null : faixaDia(media);
        return (
          <g key={dia} className={`cel ${f ? f.classe : 'pendente'}`}>
            <title>{media == null ? `Dia ${dia}: não jogado` : `Dia ${dia}: média ${media}%`}</title>
            <rect x={x} y={y} width={lado} height={lado} />
            <text x={x + 6} y={y + 18}>{dia}</text>
            {media != null && <text x={x + lado - 5} y={y + lado - 7} textAnchor="end" className="media">{media}</text>}
          </g>
        );
      })}
      <g className="legenda-dias">
        {[{ classe: 'pendente', rotulo: 'não jogado' }, ...FAIXAS_DIA].map((f, i) => (
          <g key={f.classe} transform={`translate(${12 + i * 86}, ${H - 20})`} className={`cel ${f.classe}`}>
            <rect width={14} height={14} />
            <text x={20} y={13}>{f.rotulo}</text>
          </g>
        ))}
      </g>
    </>
  );
}

export default function Grafico({ grafico, titulo, vazio }) {
  return (
    <figure className="grafico">
      <figcaption>{titulo}</figcaption>
      {vazio ? (
        <p className="grafico-vazio">{vazio}</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={titulo} shapeRendering="crispEdges">
          {grafico.tipo === 'barras' && <Barras {...grafico} />}
          {grafico.tipo === 'linha' && <Linha {...grafico} />}
          {grafico.tipo === 'dias' && <Dias {...grafico} />}
        </svg>
      )}
    </figure>
  );
}
