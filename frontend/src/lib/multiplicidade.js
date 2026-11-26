// Multiplicidade (cardinalidade) das pontas de uma relação de diagrama de classes.
// Na aresta: `multDe` fica na ponta `de`, `multPara` na ponta `para`.
// Lê-se do outro lado: Cliente [1] — [1..*] Conta = cada Cliente tem 1..* Contas; cada Conta tem 1 Cliente.
// Mesmo enum do schema do backend (docs/schemas/diagrama.schema.json); '*' equivale a '0..*'.

export const MULTIPLICIDADES = ['1', '0..1', '1..*', '0..*'];

// Só estas relações têm multiplicidade (herança e dependência não têm, como no backend)
export const TEM_MULTIPLICIDADE = ['associacao', 'agregacao', 'composicao'];

export const normalizarMult = (v) => {
  const t = (v ?? '').toString().replace(/\s+/g, '');
  if (!t) return null;
  if (t === '*' || t === 'n' || t === '0..n') return '0..*';
  if (t === '1..n') return '1..*';
  return t;
};

export const multIgual = (a, b) => normalizarMult(a) === normalizarMult(b);

// "cada X tem ___ Y"
export const LEITURA = {
  1: 'exatamente um(a)',
  '0..1': 'no máximo um(a) (ou nenhum)',
  '1..*': 'um(a) ou mais',
  '0..*': 'zero ou mais',
};
export const lerMult = (v) => LEITURA[normalizarMult(v)] ?? v;

// 1:1, 1:*, *:* a partir das duas pontas (o lado "muitos" é qualquer coisa com *)
export function padraoRelacao(multDe, multPara) {
  const lado = (v) => (normalizarMult(v)?.includes('*') ? '*' : '1');
  if (!multDe || !multPara) return null;
  return `${lado(multDe)}:${lado(multPara)}`;
}
