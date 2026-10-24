import React from 'react';
import { tema } from '../estilos/Tema';

const SEGMENTOS = 10;

export default function Cronometro({ restanteMs, totalMs }) {
  const porcentagem = Math.max(0, Math.min(100, (restanteMs / totalMs) * 100));
  const minutos = Math.floor(restanteMs / 60000);
  const segundos = Math.floor((restanteMs % 60000) / 1000);
  const tempoFormatado = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

  // Muda de cor quando o tempo está abaixo de 25% (Estado Impaciente)
  const corBarra = porcentagem > 50 ? tema.cores.sucesso : porcentagem > 25 ? tema.cores.alerta : tema.cores.perigo;
  const cheios = Math.ceil((porcentagem / 100) * SEGMENTOS);

  return (
    <div style={estilos.container}>
      <div style={estilos.label}>
        <span style={estilos.titulo}>Paciência</span>
        <span style={{ ...estilos.tempo, color: porcentagem <= 25 ? tema.cores.perigo : 'inherit' }}>{tempoFormatado}</span>
      </div>
      <div style={estilos.trilho} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(porcentagem)}>
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <div
            key={i}
            style={{
              ...estilos.segmento,
              backgroundColor: i < cheios ? corBarra : '#e5dfe9',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const estilos = {
  container: { width: '100%', margin: '8px 0' },
  label: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 },
  titulo: { fontFamily: tema.fontes.titulo, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  tempo: { fontFamily: tema.fontes.texto, fontSize: 22 },
  trilho: { display: 'flex', gap: 3 },
  segmento: {
    flex: 1,
    height: 14,
    border: `2px solid ${tema.cores.contorno}`,
    transition: 'background-color 0.4s',
  },
};
