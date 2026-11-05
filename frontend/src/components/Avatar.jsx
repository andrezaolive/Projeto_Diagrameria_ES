import { useMemo } from 'react';
import { Botao } from './ui.jsx';
import { OPCOES_AVATAR, TAM_AVATAR, alternar, montarAvatar, nomeOpcao } from '../lib/avatar.js';
import './avatar.css';

// Retrato 32x32 desenhado em SVG (um <path> por cor), escalado sem suavização
export function Avatar({ avatar, tamanho = 128, className = '' }) {
  const caminhos = useMemo(() => {
    const porCor = {};
    montarAvatar(avatar).forEach((linha, y) =>
      linha.forEach((cor, x) => {
        if (cor) (porCor[cor] ??= []).push(`M${x} ${y}h1v1h-1z`);
      }),
    );
    return Object.entries(porCor);
  }, [avatar]);

  return (
    <svg
      className={`avatar ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${TAM_AVATAR} ${TAM_AVATAR}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Avatar do jogador"
    >
      {caminhos.map(([cor, d]) => (
        <path key={cor} d={d.join('')} fill={cor} />
      ))}
    </svg>
  );
}

const CAMPOS = [
  ['cabelo', 'Cabelo'],
  ['corCabelo', 'Cor do cabelo'],
  ['pele', 'Pele'],
  ['olhos', 'Olhos'],
  ['nariz', 'Nariz'],
  ['boca', 'Boca'],
  ['roupa', 'Roupa'],
];

// Seletores ‹ › para cada parte do avatar
export function EditorAvatar({ avatar, onChange }) {
  const aleatorio = () => {
    const novo = {};
    for (const [campo, lista] of Object.entries(OPCOES_AVATAR)) novo[campo] = lista[Math.floor(Math.random() * lista.length)];
    onChange(novo);
  };
  return (
    <div className="editor-avatar">
      <div className="retrato">
        <Avatar avatar={avatar} tamanho={192} />
      </div>
      <div className="seletores">
        {CAMPOS.map(([campo, rotulo]) => (
          <div className="seletor" key={campo}>
            <span className="rotulo">{rotulo}</span>
            <button type="button" className="seta" aria-label={`${rotulo} anterior`} onClick={() => onChange(alternar(avatar, campo, -1))}>‹</button>
            <span className="valor">{nomeOpcao(campo, avatar[campo])}</span>
            <button type="button" className="seta" aria-label={`${rotulo} seguinte`} onClick={() => onChange(alternar(avatar, campo, 1))}>›</button>
          </div>
        ))}
        <Botao type="button" tamanho="pequeno" variante="claro" onClick={aleatorio}>Sortear</Botao>
      </div>
    </div>
  );
}
