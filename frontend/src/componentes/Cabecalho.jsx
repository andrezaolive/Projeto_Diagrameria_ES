import React, { useState, useEffect } from 'react';
import { tema } from '../estilos/Tema';
import { useAutenticacao } from '../contextos/Autenticacao';
import { useConfig } from '../contextos/ConfigContexto';
import BotaoConfig from './BotaoConfig';
import PixelIcone from './PixelIcone';

const { cores, fontes } = tema;

function useHora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

export default function Cabecalho({ fase, moedas, pausasRestantes, onPausar }) {
  const { usuario, sair } = useAutenticacao();
  const { telas } = useConfig();
  const agora = useHora();

  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = agora.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();

  return (
    <header style={estilos.barra}>
      <div style={estilos.grupo}>
        <span style={estilos.logo}>Diagrameria</span>
        <span style={estilos.tagFase}>Fase {fase || 1}</span>
        <span style={estilos.tagMoedas}>
          <PixelIcone nome="coin" tamanho={3} />
          {moedas || 0}
        </span>
      </div>

      <div style={estilos.grupo}>
        <span style={estilos.info}>Eng. {usuario?.nome}</span>
        <button onClick={onPausar} style={tema.botao.amarelo}>
          Pausar ({pausasRestantes ?? 3})
        </button>
        <BotaoConfig />
        <button onClick={sair} style={tema.botao.perigo}>
          Sair
        </button>
        {telas.relogio && (
          <div style={estilos.relogio} aria-label={`Agora são ${hora}`}>
            <span style={estilos.relogioHora}>{hora}</span>
            <span style={estilos.relogioDia}>{dia}</span>
          </div>
        )}
      </div>
    </header>
  );
}

const estilos = {
  barra: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 18px',
    backgroundColor: cores.contorno,
    borderBottom: `4px solid ${cores.vermelho}`,
    position: 'relative',
    zIndex: 20,
  },
  grupo: { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' },
  logo: { ...tema.tituloPixel(22), textTransform: 'uppercase', marginRight: 6 },
  tagFase: {
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'uppercase',
    background: cores.laranja,
    color: cores.contorno,
    padding: '6px 10px',
    border: `3px solid ${cores.contorno}`,
    boxShadow: `0 0 0 2px ${cores.laranja}`,
  },
  tagMoedas: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 16,
    background: cores.painel,
    color: cores.amarelo,
    padding: '5px 10px',
    border: `3px solid ${cores.contorno}`,
    boxShadow: `0 0 0 2px ${cores.amarelo}`,
  },
  info: { fontSize: 22, color: cores.lavanda },
  relogio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2px 12px',
    border: `3px solid ${cores.vermelho}`,
    background: cores.contorno,
    lineHeight: 1,
  },
  relogioHora: { fontSize: 30, color: cores.laranja, letterSpacing: 2 },
  relogioDia: { fontSize: 14, color: cores.lavandaApagada, letterSpacing: 1 },
};
