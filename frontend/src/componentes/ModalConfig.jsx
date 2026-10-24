import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tema } from '../estilos/Tema';
import { useConfig } from '../contextos/ConfigContexto';
import { useAutenticacao } from '../contextos/Autenticacao';
import JanelaRetro from './JanelaRetro';
import PixelIcone from './PixelIcone';

const { cores, fontes } = tema;

const SLIDERS = [
  ['Música', 'musica'],
  ['Chuva', 'chuva'],
  ['Efeitos', 'efeitos'],
];

const TOGGLES = [
  ['Brilho CRT', 'crt'],
  ['Raios de luz', 'raios'],
  ['Suavizar pixels', 'suavizar'],
  ['Mostrar relógio', 'relogio'],
];

const VELOCIDADES = ['Lenta', 'Calma', 'Rápida'];

export default function ModalConfig() {
  const { aberta, fecharConfig, volumes, definirVolume, telas, alternarTela, velocidade, definirVelocidade } = useConfig();
  const { logado, sair } = useAutenticacao();
  const navigate = useNavigate();

  useEffect(() => {
    if (!aberta) return undefined;
    function aoTeclar(e) {
      if (e.key === 'Escape') fecharConfig();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberta, fecharConfig]);

  if (!aberta) return null;

  function sairParaTitulo() {
    fecharConfig();
    sair();
    navigate('/login');
  }

  // Clicar no primeiro bloco quando o volume já é 1 silencia (volume 0)
  function escolherVolume(chave, indice) {
    const atual = volumes[chave];
    definirVolume(chave, indice + 1 === atual && atual === 1 ? 0 : indice + 1);
  }

  return (
    <div style={estilos.overlay} onMouseDown={(e) => e.target === e.currentTarget && fecharConfig()}>
      <div role="dialog" aria-modal="true" aria-label="Configurações" style={estilos.caixa}>
        <JanelaRetro
          variante="jogo"
          titulo={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
              <PixelIcone nome="gear" tamanho={3} />
              Configurações
            </span>
          }
          subtitulo="som e tela"
          aoFechar={fecharConfig}
        >
          <div style={estilos.grade}>
            {/* Coluna esquerda: som */}
            <div style={estilos.coluna}>
              <span style={tema.rotulo}>Som</span>

              {SLIDERS.map(([rotulo, chave]) => (
                <div key={chave} style={estilos.slider}>
                  <div style={estilos.linhaSlider}>
                    <span>{rotulo}</span>
                    <span style={{ color: cores.amarelo }}>{volumes[chave]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`${rotulo}: ${i + 1} de 10`}
                        onClick={() => escolherVolume(chave, i)}
                        style={{
                          ...estilos.bloco,
                          background: i < volumes[chave] ? cores.laranja : cores.painel,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <span style={{ ...tema.rotulo, marginTop: 6 }}>Velocidade do texto</span>
              <div style={estilos.trio}>
                {VELOCIDADES.map((nome, i) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => definirVelocidade(i)}
                    style={{
                      ...estilos.opcao,
                      background: i === velocidade ? cores.rosaForte : cores.painel,
                      color: i === velocidade ? cores.azulTexto : cores.creme,
                    }}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Coluna direita: tela */}
            <div style={{ ...estilos.coluna, gap: 14 }}>
              <span style={tema.rotulo}>Tela</span>

              {TOGGLES.map(([rotulo, chave]) => (
                <div key={chave} style={estilos.linhaToggle}>
                  <span style={{ fontSize: 24 }}>{rotulo}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={telas[chave]}
                    aria-label={rotulo}
                    onClick={() => alternarTela(chave)}
                    style={{
                      ...estilos.toggle,
                      background: telas[chave] ? cores.vermelho : cores.painel,
                      color: telas[chave] ? cores.laranja : cores.lavanda,
                    }}
                  >
                    {telas[chave] ? 'Sim' : 'Não'}
                  </button>
                </div>
              ))}

              <div style={estilos.rodape}>
                <button type="button" onClick={fecharConfig} style={{ ...tema.botao.primario, padding: '10px 0', fontSize: 20 }}>
                  Continuar
                </button>
                {logado && (
                  <button type="button" onClick={sairParaTitulo} style={{ ...tema.botao.secundario, padding: '10px 0', fontSize: 20 }}>
                    Sair para o título
                  </button>
                )}
              </div>
            </div>
          </div>
        </JanelaRetro>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 120,
    background: 'rgba(20, 12, 24, 0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflowY: 'auto',
  },
  caixa: { width: '100%', maxWidth: 720, fontFamily: fontes.texto },
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 28,
    padding: '22px 28px',
  },
  coluna: { display: 'flex', flexDirection: 'column', gap: 16 },
  slider: { display: 'flex', flexDirection: 'column', gap: 6 },
  linhaSlider: { display: 'flex', justifyContent: 'space-between', fontSize: 24, lineHeight: 1 },
  bloco: { flex: 1, height: 22, padding: 0, border: `3px solid ${cores.contorno}`, borderRadius: 0 },
  trio: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  opcao: {
    padding: '8px 0',
    border: `4px solid ${cores.contorno}`,
    borderRadius: 0,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  linhaToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggle: {
    width: 84,
    padding: '6px 0',
    border: `4px solid ${cores.contorno}`,
    borderRadius: 0,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  rodape: { marginTop: 'auto', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 14 },
};
