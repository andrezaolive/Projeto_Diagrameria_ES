import { useMemo } from 'react';
import { Botao } from './ui.jsx';
import { TAM_AVATAR, alternar, montarAvatar, nomeOpcao, opcoesDoJogador } from '../lib/avatar.js';
import { gradesDoAvatar, useSpritesAvatar } from '../data/spritesAvatar.js';
import './avatar.css';

// Retrato 32x32 desenhado em SVG (um <path> por cor), escalado sem suavização
// (cabelos, roupas e acessórios vêm dos PNGs editáveis de assets/avatar/, ver data/spritesAvatar.js)
export function Avatar({ avatar, tamanho = 128, className = '' }) {
  const versao = useSpritesAvatar();
  const caminhos = useMemo(() => {
    const porCor = {};
    montarAvatar(avatar, gradesDoAvatar()).forEach((linha, y) =>
      linha.forEach((cor, x) => {
        if (cor) (porCor[cor] ??= []).push(`M${x} ${y}h1v1h-1z`);
      }),
    );
    return Object.entries(porCor);
  }, [avatar, versao]);

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
  ['modeloRoupa', 'Roupa'],
  ['roupa', 'Cor da roupa'],
  ['acessorio', 'Acessório'],
];

// Seletores ‹ › para cada parte do avatar; só aparecem as partes que o jogador tem (as da aba
// Avatar da lojinha precisam ser compradas antes)
export function EditorAvatar({ avatar, onChange, possui }) {
  const opcoes = opcoesDoJogador(possui);
  const aleatorio = () => {
    const novo = {};
    for (const [campo, lista] of Object.entries(opcoes)) novo[campo] = lista[Math.floor(Math.random() * lista.length)];
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
            <button type="button" className="seta" aria-label={`${rotulo} anterior`} onClick={() => onChange(alternar(avatar, campo, -1, opcoes))}>‹</button>
            <span className="valor">{nomeOpcao(campo, avatar[campo] ?? opcoes[campo][0])}</span>
            <button type="button" className="seta" aria-label={`${rotulo} seguinte`} onClick={() => onChange(alternar(avatar, campo, 1, opcoes))}>›</button>
          </div>
        ))}
        <Botao type="button" tamanho="pequeno" variante="claro" onClick={aleatorio}>Sortear</Botao>
      </div>
    </div>
  );
}
