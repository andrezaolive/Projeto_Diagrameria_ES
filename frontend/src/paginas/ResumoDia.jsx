import React, { useEffect } from 'react';
import { tema } from '../estilos/Tema';
import { tocarEfeito } from '../servicos/audio';
import JanelaRetro from '../componentes/JanelaRetro';
import PixelIcone from '../componentes/PixelIcone';

const { cores, fontes } = tema;
const SEGMENTOS = 20;

export default function ResumoDia({ resumo, onContinuar }) {
  // Som de fim de expediente (hooks sempre antes do return antecipado)
  useEffect(() => {
    if (resumo) tocarEfeito(resumo.gameOver ? 'erro' : 'sucesso');
  }, [resumo]);

  if (!resumo) return null;

  const ehGameOver = resumo.gameOver;
  const porcentagemDesempenho = Math.round(resumo.desempenho * 100);
  const limiarPorcentagem = Math.round(resumo.limiar * 100);
  const cheios = Math.round((Math.min(100, porcentagemDesempenho) / 100) * SEGMENTOS);
  const marcaMeta = Math.min(100, limiarPorcentagem);
  const corBarra = ehGameOver ? cores.vermelho : cores.verde;

  return (
    <div style={estilos.modalOverlay}>
      <div style={estilos.caixa}>
        <JanelaRetro
          variante="jogo"
          corTitulo={ehGameOver ? cores.vermelho : cores.barraEscura}
          titulo={ehGameOver ? 'Fim de expediente: Game Over' : 'Relatório do dia de trabalho'}
        >
          <div style={estilos.conteudo}>
            <div style={estilos.painelDestaque}>
              <h3 style={{ ...tema.tituloPixel(24, ehGameOver ? cores.rosa : cores.amarelo, cores.contorno), marginBottom: 8 }}>
                {ehGameOver ? 'Empresa falhou na meta!' : 'Expediente concluído com sucesso!'}
              </h3>
              <p style={{ margin: 0, fontSize: 22, color: cores.lavanda }}>
                {ehGameOver
                  ? `Desempenho abaixo do mínimo exigido (${limiarPorcentagem}%). A fase ${resumo.fase} será repetida.`
                  : `Parabéns! Você alcançou a meta e avançou para a fase ${resumo.proximaFase}.`}
              </p>
            </div>

            {/* Métricas do Dia (RF23) */}
            <div style={estilos.gradeMetricas}>
              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Total de clientes</span>
                <strong style={estilos.valor}>{resumo.clientes}</strong>
              </div>

              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Entregas aceitas</span>
                <strong style={{ ...estilos.valor, color: cores.verde }}>{resumo.aceitas}</strong>
              </div>

              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Entregas recusadas (&lt;50%)</span>
                <strong style={{ ...estilos.valor, color: cores.laranja }}>{resumo.recusadas}</strong>
              </div>

              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Clientes expirados (fila)</span>
                <strong style={{ ...estilos.valor, color: cores.rosa }}>{resumo.expirados}</strong>
              </div>

              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Gorjetas recebidas</span>
                <strong style={estilos.valor}>
                  +{resumo.gorjetas} <PixelIcone nome="coin" tamanho={3} />
                </strong>
              </div>

              <div style={estilos.itemMetrica}>
                <span style={estilos.label}>Total arrecadado</span>
                <strong style={{ ...estilos.valor, color: cores.amarelo }}>
                  +{resumo.moedas} <PixelIcone nome="coin" tamanho={3} />
                </strong>
              </div>
            </div>

            {/* Barra de Aproveitamento Geral */}
            <div style={estilos.secaoDesempenho}>
              <div style={estilos.headerDesempenho}>
                <span>Aproveitamento da rodada</span>
                <strong style={{ color: cores.amarelo }}>
                  {porcentagemDesempenho}% (meta: {limiarPorcentagem}%)
                </strong>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: SEGMENTOS }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 22,
                        border: `3px solid ${cores.contorno}`,
                        backgroundColor: i < cheios ? corBarra : cores.painel,
                      }}
                    />
                  ))}
                </div>
                {/* Marcador da meta */}
                <div
                  title={`Meta: ${limiarPorcentagem}%`}
                  style={{
                    position: 'absolute',
                    top: -6,
                    bottom: -6,
                    left: `${marcaMeta}%`,
                    width: 4,
                    marginLeft: -2,
                    background: cores.amarelo,
                    border: `1px solid ${cores.contorno}`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={onContinuar}
              style={{
                ...(ehGameOver ? tema.botao.secundario : tema.botao.primario),
                width: '100%',
                padding: '12px 0',
                fontSize: 18,
              }}
            >
              {ehGameOver ? 'Tentar novamente esta fase' : 'Abrir próximo dia de trabalho ➔'}
            </button>
          </div>
        </JanelaRetro>
      </div>
    </div>
  );
}

const estilos = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(20, 12, 24, 0.88)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    overflowY: 'auto',
    zIndex: 99,
    fontFamily: fontes.texto,
  },
  caixa: { width: '100%', maxWidth: 560 },
  conteudo: { padding: 20, display: 'flex', flexDirection: 'column', gap: 18 },
  painelDestaque: { textAlign: 'center', paddingBottom: 14, borderBottom: `3px solid ${cores.contorno}` },
  gradeMetricas: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 },
  itemMetrica: {
    backgroundColor: cores.painel,
    border: `3px solid ${cores.contorno}`,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: { fontSize: 20, color: cores.lavandaApagada },
  valor: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: fontes.titulo,
    fontSize: 24,
    marginTop: 2,
    color: cores.creme,
  },
  secaoDesempenho: { display: 'flex', flexDirection: 'column', gap: 8 },
  headerDesempenho: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontSize: 22, color: cores.lavanda },
};
