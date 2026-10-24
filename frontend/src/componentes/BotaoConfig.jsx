import React from 'react';
import { tema } from '../estilos/Tema';
import { useConfig } from '../contextos/ConfigContexto';
import PixelIcone from './PixelIcone';

export default function BotaoConfig({ style }) {
  const { abrirConfig } = useConfig();

  return (
    <button
      onClick={abrirConfig}
      title="Configurações (som e tela)"
      style={{ ...tema.botao.neutro, display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}
    >
      <PixelIcone nome="gear" tamanho={2} />
      Config.
    </button>
  );
}
