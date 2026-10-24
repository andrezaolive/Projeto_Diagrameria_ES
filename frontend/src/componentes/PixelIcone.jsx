import React, { useMemo } from 'react';

// Ícones desenhados "pixel a pixel" (cada letra é uma cor da paleta)
const PAL = {
  W: '#f4f0ea', C: '#5a2e1c', P: '#e56a9a', Y: '#f7cf5a', O: '#f5a25a', R: '#c8323c',
  G: '#3f8f86', T: '#2d6b66', V: '#4a52b8', K: '#1a1020', B: '#a8553a', L: '#cfc8d6',
};

const MAPAS = {
  coffee: ['...W.W....', '....W.W...', '.RRRRRR...', '.RCCCCRRR.', '.RRRRRR.R.', '.RRRRRRRR.', '.RRRRRR...', '..RRRR....'],
  heart: ['.PP.PP.', 'PPPPPPP', 'PPPPPPP', '.PPPPP.', '..PPP..', '...P...'],
  coin: ['.YYYY.', 'YYOYYY', 'YYOYYY', 'YYOYYY', 'YYOYYY', '.YYYY.'],
  plant: ['..G..T..', '.GG.TT.G', 'GTG.TGGT', '.TGGTGT.', '..TGGT..', '...GT...', '.BBBBBB.', '.BBBBBB.', '..BBBB..'],
  star: ['...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '..YYY..', '.YY.YY.', 'YY...YY'],
  gear: [
    '....KKK....', '.KK.KOK.KK.', '.KOKKOKKOK.', '..KOOOOOK..', 'KKKOOKOOKKK', 'KOOOK.KOOOK',
    'KKKOOKOOKKK', '..KOOOOOK..', '.KOKKOKKOK.', '.KK.KOK.KK.', '....KKK....',
  ],
};

export default function PixelIcone({ nome, tamanho = 4, style }) {
  const linhas = MAPAS[nome];
  const sombras = useMemo(() => {
    if (!linhas) return '';
    const lista = [];
    linhas.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        const c = linha[x];
        if (c !== '.') lista.push(`${(x + 1) * tamanho}px ${(y + 1) * tamanho}px 0 ${PAL[c]}`);
      }
    });
    return lista.join(',');
  }, [linhas, tamanho]);

  if (!linhas) return null;

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: linhas[0].length * tamanho,
        height: linhas.length * tamanho,
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: -tamanho,
          top: -tamanho,
          width: tamanho,
          height: tamanho,
          boxShadow: sombras,
        }}
      />
    </span>
  );
}
