import React, { useState, useEffect } from 'react';
import { useConfig } from '../contextos/ConfigContexto';

// Texto que "aparece digitado". A velocidade vem das Configurações.
// O texto completo ocupa o espaço desde o início (sem o layout pular).
export default function TextoDigitado({ texto = '', style }) {
  const { msPorLetra } = useConfig();
  const [qtd, setQtd] = useState(0);

  useEffect(() => {
    setQtd(0);
    if (!texto) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setQtd(i);
      if (i >= texto.length) clearInterval(id);
    }, msPorLetra);
    return () => clearInterval(id);
  }, [texto, msPorLetra]);

  return (
    <p style={style}>
      <span>{texto.slice(0, qtd)}</span>
      <span style={{ visibility: 'hidden' }}>{texto.slice(qtd)}</span>
    </p>
  );
}
