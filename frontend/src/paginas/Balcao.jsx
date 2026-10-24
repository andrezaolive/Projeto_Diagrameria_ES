import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../servicos/api';
import { tema } from '../estilos/Tema';
import Cabecalho from '../componentes/Cabecalho';
import Cronometro from '../componentes/Cronometro';
import JanelaRetro from '../componentes/JanelaRetro';
import TextoDigitado from '../componentes/TextoDigitado';
import ResumoDia from './ResumoDia';
import { useJogo } from '../contextos/JogoContexto';

const { cores, fontes } = tema;

export default function Balcao() {
  const { resumoFinal, iniciarProximoDia } = useJogo();

  const [dia, setDia] = useState(null);
  const [moedas, setMoedas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function carregarDados() {
    try {
      const respProgresso = await api.get('/progresso');
      setMoedas(respProgresso.data.moedas);

      try {
        const respDia = await api.get('/dias/atual');
        setDia(respDia.data);
      } catch (err) {
        if (err.codigo === 'NAO_ENCONTRADO' || err.response?.status === 404) {
          // Cria o primeiro dia de trabalho se nenhum estiver aberto
          const novoDia = await api.post('/dias');
          setDia(novoDia.data);
        }
      }
    } catch (err) {
      setErro(err.mensagem || 'Falha ao sincronizar dia');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 4000);
    return () => clearInterval(intervalo);
  }, []);

  async function aceitarPedido(pedidoId) {
    try {
      await api.post(`/pedidos/${pedidoId}/aceitar`);
      navigate(`/mesa/${pedidoId}`);
    } catch (err) {
      alert(err.mensagem || 'Erro ao aceitar pedido');
    }
  }

  async function alternarPausa() {
    if (!dia) return;
    try {
      if (dia.status === 'em_andamento') {
        const resp = await api.post(`/dias/${dia.id}/pausar`);
        setDia(resp.data);
      } else if (dia.status === 'pausado') {
        const resp = await api.post(`/dias/${dia.id}/retomar`);
        setDia(resp.data);
      }
    } catch (err) {
      alert(err.mensagem || 'Não foi possível alterar o estado da pausa');
    }
  }

  if (carregando) {
    return (
      <div style={estilos.telaCarregando}>
        <span>Conectando ao terminal de atendimento</span>
        <span style={{ animation: 'dgpiscar 0.8s steps(1) infinite' }}>_</span>
      </div>
    );
  }

  return (
    <div style={estilos.ambiente} className="dg-papel-parede">
      <ResumoDia resumo={resumoFinal} onContinuar={iniciarProximoDia} />

      <Cabecalho
        fase={dia?.fase}
        moedas={moedas}
        pausasRestantes={dia?.pausasRestantes}
        onPausar={alternarPausa}
      />

      <main style={estilos.mesa}>
        {/* Monitor antigo */}
        <div style={estilos.monitor}>
          <div style={estilos.telaCrt}>
            <JanelaRetro
              titulo="Diagrameria OS - Caixa de entrada de pedidos"
              direita={<span style={estilos.estado}>Estado: {dia?.status}</span>}
              estilo={{ flex: 1 }}
              estiloCorpo={{ overflowY: 'auto', maxHeight: 560 }}
            >
              {erro && (
                <p role="alert" style={estilos.erro}>
                  {erro}
                </p>
              )}

              {dia?.status === 'pausado' ? (
                <div style={estilos.pausadoAviso}>
                  <h2 style={{ ...tema.tituloPixel(34, cores.vermelho, cores.contorno), textTransform: 'uppercase' }}>
                    Expediente pausado
                  </h2>
                  <p style={{ fontSize: 24, margin: 0, textAlign: 'center' }}>
                    O tempo do escritório e a paciência dos clientes estão congelados.
                  </p>
                  <button onClick={alternarPausa} style={{ ...tema.botao.primario, fontSize: 18, padding: '10px 18px' }}>
                    Retomar expediente
                  </button>
                </div>
              ) : (
                <div style={estilos.gradePedidos}>
                  <h3 style={estilos.tituloLista}>Clientes aguardando no balcão</h3>

                  {dia?.pedidos?.length === 0 && (
                    <p style={{ color: cores.cinza, fontSize: 24, margin: 0 }}>Aguardando o próximo cliente chegar...</p>
                  )}

                  {dia?.pedidos?.map((pedido) => (
                    <article key={pedido.id} style={estilos.cardTicket}>
                      <div style={estilos.cabecalhoTicket}>
                        <strong style={estilos.tituloTicket}>
                          #{pedido.ordem} - {pedido.titulo}
                        </strong>
                        <span style={estilos.badgeDificuldade}>Dificuldade {pedido.dificuldade}</span>
                      </div>

                      <TextoDigitado texto={pedido.enunciado} style={estilos.enunciado} />

                      <Cronometro
                        restanteMs={pedido.pacienciaRestanteMs}
                        totalMs={pedido.pacienciaMs}
                      />

                      <div style={estilos.acoesTicket}>
                        {pedido.status === 'aguardando' && (
                          <button onClick={() => aceitarPedido(pedido.id)} style={tema.botao.sucesso}>
                            Aceitar pedido
                          </button>
                        )}
                        {pedido.status === 'aceito' && (
                          <button onClick={() => navigate(`/mesa/${pedido.id}`)} style={tema.botao.primario}>
                            Abrir montagem
                          </button>
                        )}
                        {pedido.status === 'expirado' && (
                          <span style={{ color: cores.vermelho, fontFamily: fontes.titulo, fontWeight: 700, fontSize: 14 }}>
                            Cliente perdeu a paciência e foi embora!
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </JanelaRetro>
          </div>

          {/* Detalhes do painel do monitor */}
          <div style={estilos.ventilacao} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ width: 3, height: 16, background: cores.contorno }} />
            ))}
          </div>
          <div style={estilos.led} aria-hidden="true" />
          <div style={estilos.botaoPower} aria-hidden="true" />
        </div>

        <div style={estilos.pescoco} aria-hidden="true" />
      </main>

      {/* Tampo da mesa */}
      <div style={estilos.tampo} aria-hidden="true" />
      <div style={estilos.sombraMesa} aria-hidden="true" />
    </div>
  );
}

const estilos = {
  ambiente: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fontes.texto,
    color: cores.creme,
  },
  mesa: {
    padding: '28px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  monitor: {
    position: 'relative',
    width: '100%',
    maxWidth: 960,
    background: cores.azulCrt,
    border: `6px solid ${cores.contorno}`,
    borderRadius: 28,
    padding: '22px 26px 50px',
    boxShadow: 'inset 8px 8px 0 #6a72d8, inset -10px -12px 0 #3b2fa0, 0 0 50px rgba(95,224,224,0.18)',
  },
  telaCrt: {
    display: 'flex',
    background: cores.azulEscuro,
    border: `5px solid ${cores.contorno}`,
    borderRadius: 16,
    padding: 10,
    minHeight: 480,
  },
  ventilacao: { position: 'absolute', left: 36, bottom: 16, display: 'flex', gap: 4 },
  led: {
    position: 'absolute',
    left: '50%',
    bottom: 22,
    width: 56,
    height: 7,
    transform: 'translateX(-50%)',
    background: cores.ciano,
    boxShadow: `0 0 10px ${cores.ciano}`,
  },
  botaoPower: {
    position: 'absolute',
    right: 34,
    bottom: 16,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: cores.vermelho,
    border: `3px solid ${cores.contorno}`,
  },
  pescoco: {
    width: 170,
    height: 24,
    background: cores.azulEscuro,
    border: `4px solid ${cores.contorno}`,
    borderTop: 'none',
  },
  tampo: {
    width: 'calc(100% - 32px)',
    maxWidth: 1100,
    height: 46,
    margin: '0 auto',
    background: cores.mesa,
    border: `5px solid ${cores.contorno}`,
    clipPath: 'polygon(2% 0, 98% 0, 100% 100%, 0 100%)',
  },
  sombraMesa: { flex: 1, background: cores.contorno, minHeight: 60 },
  estado: { fontFamily: fontes.texto, fontSize: 18, color: cores.cinzaClaro },
  erro: { margin: '0 0 12px', color: cores.vermelho, fontSize: 22 },
  gradePedidos: { display: 'flex', flexDirection: 'column', gap: 14 },
  tituloLista: { ...tema.rotulo, color: cores.azulTexto, margin: 0, fontSize: 15 },
  cardTicket: {
    backgroundColor: '#fff',
    border: `3px solid ${cores.contorno}`,
    padding: 12,
    boxShadow: `4px 4px 0 ${cores.cinza}`,
    color: cores.contorno,
  },
  cabecalhoTicket: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' },
  tituloTicket: { fontFamily: fontes.titulo, fontWeight: 700, fontSize: 16 },
  badgeDificuldade: {
    backgroundColor: cores.amarelo,
    color: cores.contorno,
    border: `2px solid ${cores.contorno}`,
    padding: '1px 8px',
    fontFamily: fontes.titulo,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  enunciado: { fontSize: 22, color: '#33293d', margin: '8px 0', lineHeight: 1.1 },
  acoesTicket: { display: 'flex', justifyContent: 'flex-end', marginTop: 8 },
  pausadoAviso: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    gap: 18,
    color: cores.contorno,
  },
  telaCarregando: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: cores.fundoProfundo,
    color: cores.laranja,
    fontFamily: fontes.titulo,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};
