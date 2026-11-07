// Desenho SVG dos elementos UML, no estilo pixel (traço grosso, sem suavização nas retas).
import { centro, pontoNaBorda, retangulo, tamanho } from '../lib/grid.js';

export const ELEMENTOS = [
  { tipo: 'ator', nome: 'Ator', rotulo: 'Ator' },
  { tipo: 'casoDeUso', nome: 'Caso de uso', rotulo: 'Caso de uso' },
  { tipo: 'classe', nome: 'Classe', rotulo: 'Classe' },
  { tipo: 'nota', nome: 'Nota', rotulo: 'Nota' },
  { tipo: 'sistema', nome: 'Sistema', rotulo: 'Sistema' },
  // diagrama de estados: início e fim têm nome fixo (não se renomeia)
  { tipo: 'estadoInicial', nome: 'Início', rotulo: 'Início', fixo: true },
  { tipo: 'estado', nome: 'Estado', rotulo: 'Estado' },
  { tipo: 'estadoFinal', nome: 'Fim', rotulo: 'Fim', fixo: true },
];
export const ROTULO_FIXO = Object.fromEntries(ELEMENTOS.filter((e) => e.fixo).map((e) => [e.tipo, e.rotulo]));

export const RELACOES = [
  { tipo: 'associacao', nome: 'Associação' },
  { tipo: 'include', nome: 'Include' },
  { tipo: 'extend', nome: 'Extend' },
  { tipo: 'heranca', nome: 'Herança' },
  { tipo: 'dependencia', nome: 'Dependência' },
  { tipo: 'agregacao', nome: 'Agregação' },
  { tipo: 'composicao', nome: 'Composição' },
  { tipo: 'transicao', nome: 'Transição' },
];

// O editor separa a paleta em três tipos de diagrama, cada um com seus elementos e relações
export const SECOES = [
  {
    id: 'casos',
    nome: 'Casos de uso',
    curto: 'Casos',
    icone: 'ator',
    elementos: ['ator', 'casoDeUso', 'sistema', 'nota'],
    relacoes: ['associacao', 'include', 'extend', 'dependencia', 'heranca'],
  },
  {
    id: 'classes',
    nome: 'Classes',
    curto: 'Classes',
    icone: 'classe',
    elementos: ['classe', 'nota'],
    relacoes: ['associacao', 'heranca', 'dependencia', 'agregacao', 'composicao'],
  },
  {
    id: 'estados',
    nome: 'Estados',
    curto: 'Estados',
    icone: 'estado',
    elementos: ['estadoInicial', 'estado', 'estadoFinal', 'nota'],
    relacoes: ['transicao'],
  },
];

// Seção que combina com um diagrama (pelo tipo dos elementos); null se não der para saber
export function secaoDoDiagrama(diagrama) {
  const tipos = new Set((diagrama?.nodes ?? []).map((n) => n.tipo));
  if (['estado', 'estadoInicial', 'estadoFinal'].some((t) => tipos.has(t))) return 'estados';
  if (['ator', 'casoDeUso', 'sistema'].some((t) => tipos.has(t))) return 'casos';
  if (tipos.has('classe')) return 'classes';
  return null;
}

const TRACEJADO = { include: '10 8', extend: '10 8', dependencia: '6 6' };
const SETA = { include: 'seta', extend: 'seta', dependencia: 'seta', heranca: 'triangulo', transicao: 'seta' };
const ROTULO_ARESTA = { include: '«include»', extend: '«extend»' };
// Agregação/composição: losango na origem da ligação (o "todo"); a outra ponta é a parte
const LOSANGO = { agregacao: 'losango', composicao: 'losango-cheio' };

const INK = 'var(--c-ink)';
const T = 3; // espessura do traço

// Marcadores das setas; precisam estar no <svg> que usa as arestas
export function Defs({ prefixo = 'm' }) {
  return (
    <defs>
      <marker id={`${prefixo}-seta`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 1 L11 6 L1 11" fill="none" stroke={INK} strokeWidth="2" />
      </marker>
      <marker id={`${prefixo}-triangulo`} viewBox="0 0 14 14" refX="13" refY="7" markerWidth="20" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 1 L13 7 L1 13 Z" fill="var(--c-cream)" stroke={INK} strokeWidth="2" />
      </marker>
      <marker id={`${prefixo}-losango`} viewBox="0 0 24 14" refX="1" refY="7" markerWidth="26" markerHeight="15" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 7 L12 1 L23 7 L12 13 Z" fill="var(--c-cream)" stroke={INK} strokeWidth="2" />
      </marker>
      <marker id={`${prefixo}-losango-cheio`} viewBox="0 0 24 14" refX="1" refY="7" markerWidth="26" markerHeight="15" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 7 L12 1 L23 7 L12 13 Z" fill={INK} stroke={INK} strokeWidth="2" />
      </marker>
    </defs>
  );
}

function Texto({ x, y, children, tamanho = 22, peso }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontFamily="VT323, monospace" fontSize={tamanho} fontWeight={peso} fill={INK} stroke="none" style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  );
}

// `alerta`: fora do lugar em relação ao sistema (caso de uso fora / ator dentro), contorno vermelho tracejado
export function Forma({ node, selecionado, destaque, alerta }) {
  const { w, h } = tamanho(node);
  const contorno = selecionado ? 'var(--c-rose)' : destaque ? 'var(--c-sky)' : INK;
  const sel = selecionado || destaque;
  const corpo = (() => {
    switch (node.tipo) {
      case 'ator':
        return (
          <g stroke={contorno} strokeWidth={T} fill="none" shapeRendering="crispEdges">
            <rect x={0} y={0} width={w} height={h} fill="transparent" stroke="none" />
            <circle cx={30} cy={14} r={11} fill="var(--c-cream)" shapeRendering="auto" />
            <line x1={30} y1={25} x2={30} y2={56} />
            <line x1={10} y1={36} x2={50} y2={36} />
            <line x1={30} y1={56} x2={14} y2={78} />
            <line x1={30} y1={56} x2={46} y2={78} />
            <Texto x={30} y={92}>{node.rotulo}</Texto>
          </g>
        );
      case 'casoDeUso':
        return (
          <>
            <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill="var(--c-cream)" stroke={contorno} strokeWidth={T} />
            <ellipse cx={w / 2} cy={h / 2 + 3} rx={w / 2 - 6} ry={h / 2 - 8} fill="none" stroke="var(--c-mist)" strokeWidth={2} />
            <Texto x={w / 2} y={h / 2}>{node.rotulo}</Texto>
          </>
        );
      case 'classe':
        return (
          <g shapeRendering="crispEdges">
            <rect x={0} y={0} width={w} height={h} fill="var(--c-cream)" stroke={contorno} strokeWidth={T} />
            <rect x={1.5} y={1.5} width={w - 3} height={30} fill="var(--c-lilac)" />
            <line x1={0} y1={32} x2={w} y2={32} stroke={contorno} strokeWidth={T} />
            <line x1={0} y1={66} x2={w} y2={66} stroke={contorno} strokeWidth={T} />
            <Texto x={w / 2} y={17} peso="bold">{node.rotulo}</Texto>
            <Texto x={w / 2} y={49} tamanho={18}>- atributos</Texto>
            <Texto x={w / 2} y={83} tamanho={18}>+ métodos()</Texto>
          </g>
        );
      case 'nota':
        return (
          <g shapeRendering="crispEdges">
            <path d={`M0 0 H${w - 18} L${w} 18 V${h} H0 Z`} fill="var(--c-butter)" stroke={contorno} strokeWidth={T} />
            <path d={`M${w - 18} 0 V18 H${w}`} fill="var(--c-peach)" stroke={contorno} strokeWidth={T} />
            <Texto x={w / 2 - 6} y={h / 2}>{node.rotulo}</Texto>
          </g>
        );
      case 'estadoInicial':
        return (
          <>
            <rect x={0} y={0} width={w} height={h} fill="transparent" />
            <circle cx={w / 2} cy={h / 2} r={14} fill={contorno} />
          </>
        );
      case 'estadoFinal':
        return (
          <>
            <rect x={0} y={0} width={w} height={h} fill="transparent" />
            <circle cx={w / 2} cy={h / 2} r={16} fill="var(--c-cream)" stroke={contorno} strokeWidth={T} />
            <circle cx={w / 2} cy={h / 2} r={9} fill={contorno} />
          </>
        );
      case 'estado':
        return (
          <>
            <rect x={0} y={0} width={w} height={h} rx={18} fill="var(--c-cream)" stroke={contorno} strokeWidth={T} />
            <Texto x={w / 2} y={h / 2}>{node.rotulo}</Texto>
          </>
        );
      case 'sistema':
        return (
          <g shapeRendering="crispEdges">
            <rect x={0} y={0} width={w} height={h} fill="rgba(212,196,236,0.35)" stroke={contorno} strokeWidth={T} />
            <Texto x={w / 2} y={18} peso="bold">{node.rotulo}</Texto>
          </g>
        );
      default:
        return null;
    }
  })();

  return (
    <g transform={`translate(${node.x} ${node.y})`} data-node={node.id} style={{ cursor: 'move' }}>
      {sel && <rect x={-6} y={-6} width={w + 12} height={h + 12} fill="none" stroke={contorno} strokeWidth={2} strokeDasharray="6 4" shapeRendering="crispEdges" />}
      {alerta && !sel && (
        <rect x={-6} y={-6} width={w + 12} height={h + 12} fill="rgba(232,138,158,0.12)" stroke="var(--c-rose)" strokeWidth={3} strokeDasharray="8 5" shapeRendering="crispEdges">
          <title>{alerta === 'foraDoSistema' ? 'Caso de uso fora do sistema' : 'Ator dentro do sistema'}</title>
        </rect>
      )}
      {corpo}
    </g>
  );
}

export function Aresta({ edge, nodes, selecionada, prefixo = 'm' }) {
  const a = nodes.find((n) => n.id === edge.de);
  const b = nodes.find((n) => n.id === edge.para);
  if (!a || !b) return null;
  const ca = centro(a), cb = centro(b);
  let p = pontoNaBorda(a, cb.x, cb.y);
  let q = pontoNaBorda(b, ca.x, ca.y);
  // transição: desloca a seta para a direita do seu sentido, para que A→B e B→A fiquem lado a lado
  let normal = { x: 0, y: 0 };
  if (edge.tipo === 'transicao') {
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    normal = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
    const d = 9;
    p = { x: p.x + normal.x * d, y: p.y + normal.y * d };
    q = { x: q.x + normal.x * d, y: q.y + normal.y * d };
  }
  const cor = selecionada ? 'var(--c-rose)' : INK;
  // o evento da transição fica um pouco afastado da linha, do mesmo lado do deslocamento
  const meio = { x: (p.x + q.x) / 2 + normal.x * 14, y: (p.y + q.y) / 2 + normal.y * 14 };
  const marcador = SETA[edge.tipo];
  return (
    <g data-edge={edge.id} style={{ cursor: 'pointer' }}>
      {/* área de clique mais larga */}
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="transparent" strokeWidth={16} />
      <line
        x1={p.x} y1={p.y} x2={q.x} y2={q.y}
        stroke={cor}
        strokeWidth={T}
        strokeDasharray={TRACEJADO[edge.tipo]}
        markerEnd={marcador ? `url(#${prefixo}-${marcador})` : undefined}
        markerStart={LOSANGO[edge.tipo] ? `url(#${prefixo}-${LOSANGO[edge.tipo]})` : undefined}
      />
      {/* transição: o evento escrito no meio da seta */}
      {edge.tipo === 'transicao' && edge.rotulo && (
        <>
          <rect x={meio.x - (edge.rotulo.length * 5 + 10)} y={meio.y - 12} width={edge.rotulo.length * 10 + 20} height={22} fill="var(--c-mist)" shapeRendering="crispEdges" />
          <Texto x={meio.x} y={meio.y} tamanho={20}>{edge.rotulo}</Texto>
        </>
      )}
      {ROTULO_ARESTA[edge.tipo] && (
        <>
          <rect x={meio.x - 42} y={meio.y - 12} width={84} height={22} fill="var(--c-mist)" shapeRendering="crispEdges" />
          <Texto x={meio.x} y={meio.y} tamanho={20}>{ROTULO_ARESTA[edge.tipo]}</Texto>
        </>
      )}
      <Multiplicidade valor={edge.multDe} ponta={p} outra={q} cor={cor} />
      <Multiplicidade valor={edge.multPara} ponta={q} outra={p} cor={cor} inverter />
    </g>
  );
}

// Número de multiplicidade perto de uma ponta da relação, deslocado para o lado da linha.
// `inverter` na ponta "para" mantém os dois números do mesmo lado da linha.
function Multiplicidade({ valor, ponta, outra, cor, inverter = false }) {
  if (!valor) return null;
  const dx = outra.x - ponta.x, dy = outra.y - ponta.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const k = inverter ? 1 : -1; // lado "de cima" (para linhas da esquerda para a direita)
  const x = ponta.x + ux * 26 - uy * 16 * k;
  const y = ponta.y + uy * 26 + ux * 16 * k;
  const w = valor.length * 9 + 10;
  return (
    <g data-mult>
      <rect x={x - w / 2} y={y - 11} width={w} height={20} fill="var(--c-cream)" stroke={cor} strokeWidth={1.5} shapeRendering="crispEdges" />
      <Texto x={x} y={y} tamanho={19}>{valor}</Texto>
    </g>
  );
}

// Alças de redimensionar no meio de cada lado do sistema selecionado (setinhas ⇕ / ⇔)
export const LADOS = ['n', 's', 'l', 'o'];
export function Alcas({ node, zoom = 1 }) {
  const { x, y, w, h } = retangulo(node);
  const k = 1 / zoom; // mesmo tamanho na tela, com qualquer zoom
  const pos = { n: [x + w / 2, y], s: [x + w / 2, y + h], l: [x + w, y + h / 2], o: [x, y + h / 2] };
  return (
    <g>
      {LADOS.map((lado) => {
        const [cx, cy] = pos[lado];
        const vertical = lado === 'n' || lado === 's';
        return (
          <g key={lado} data-alca={lado} transform={`translate(${cx} ${cy}) scale(${k})`} style={{ cursor: vertical ? 'ns-resize' : 'ew-resize' }}>
            <rect x={-13} y={-13} width={26} height={26} fill="var(--c-butter)" stroke={INK} strokeWidth={2.5} shapeRendering="crispEdges" />
            <path
              d={vertical ? 'M0 -9 L-5 -3 H5 Z M0 9 L-5 3 H5 Z' : 'M-9 0 L-3 -5 V5 Z M9 0 L3 -5 V5 Z'}
              fill={INK}
              shapeRendering="crispEdges"
            />
          </g>
        );
      })}
    </g>
  );
}

// Ícones da paleta (24x24)
export function IconePaleta({ tipo }) {
  const s = { stroke: INK, strokeWidth: 2.5, fill: 'none', shapeRendering: 'crispEdges' };
  const icones = {
    ator: (<g {...s}><circle cx="12" cy="5" r="3.5" shapeRendering="auto" /><path d="M12 9v7M5 12h14M12 16l-5 6M12 16l5 6" /></g>),
    casoDeUso: <ellipse cx="12" cy="12" rx="10.5" ry="6.5" {...s} fill="var(--c-cream)" shapeRendering="auto" />,
    classe: (<g {...s}><rect x="2" y="3" width="20" height="18" fill="var(--c-cream)" /><path d="M2 9h20M2 15h20" /></g>),
    nota: (<g {...s}><path d="M3 3h13l5 5v13H3z" fill="var(--c-butter)" /><path d="M16 3v5h5" /></g>),
    sistema: <rect x="2" y="2" width="20" height="20" {...s} strokeDasharray="0" fill="rgba(212,196,236,0.6)" />,
    associacao: <path d="M2 12h20" {...s} />,
    include: (<g {...s}><path d="M2 12h18" strokeDasharray="4 3" /><path d="M15 7l6 5-6 5" /></g>),
    extend: (<g {...s}><path d="M22 12H4" strokeDasharray="4 3" /><path d="M9 7l-6 5 6 5" /></g>),
    heranca: (<g {...s}><path d="M2 12h12" /><path d="M14 6l8 6-8 6z" fill="var(--c-cream)" /></g>),
    dependencia: (<g {...s}><path d="M2 12h18" strokeDasharray="2 3" /><path d="M15 7l6 5-6 5" /></g>),
    agregacao: (<g {...s}><path d="M2 12l5-4 5 4-5 4z" fill="var(--c-cream)" /><path d="M12 12h10" /></g>),
    composicao: (<g {...s}><path d="M2 12l5-4 5 4-5 4z" fill={INK} /><path d="M12 12h10" /></g>),
    estadoInicial: <circle cx="12" cy="12" r="7" fill={INK} shapeRendering="auto" />,
    estado: <rect x="2" y="6" width="20" height="12" rx="5" {...s} fill="var(--c-cream)" shapeRendering="auto" />,
    estadoFinal: (<g shapeRendering="auto"><circle cx="12" cy="12" r="8" fill="var(--c-cream)" stroke={INK} strokeWidth="2.5" /><circle cx="12" cy="12" r="4.5" fill={INK} /></g>),
    transicao: (<g {...s}><path d="M2 12h18" /><path d="M15 7l6 5-6 5" /></g>),
  };
  return <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">{icones[tipo]}</svg>;
}

// Diagrama estático ajustado ao espaço (tela de resultado)
export function DiagramaEstatico({ diagrama, prefixo }) {
  const { nodes, edges } = diagrama;
  if (!nodes.length) {
    return (
      <svg viewBox="0 0 400 300"><Texto x={200} y={150}>(vazio)</Texto></svg>
    );
  }
  const rs = nodes.map(retangulo);
  const xs = rs.flatMap((r) => [r.x, r.x + r.w]);
  const ys = rs.flatMap((r) => [r.y, r.y + r.h]);
  const pad = 30;
  const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
  const ordenados = [...nodes].sort((a, b) => (a.tipo === 'sistema' ? -1 : 0) - (b.tipo === 'sistema' ? -1 : 0));
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <Defs prefixo={prefixo} />
      {ordenados.map((n) => <Forma key={n.id} node={n} />)}
      {edges.map((e) => <Aresta key={e.id} edge={e} nodes={nodes} prefixo={prefixo} />)}
    </svg>
  );
}
