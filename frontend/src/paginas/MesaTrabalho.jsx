import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../servicos/api';
import { validarDiagramaLocal } from '../servicos/validadorLocal';
import { tocarEfeito } from '../servicos/audio';
import { tema } from '../estilos/Tema';
import Canvas from '../componentes/Canvas';
import Cronometro from '../componentes/Cronometro';
import JanelaRetro from '../componentes/JanelaRetro';
import TextoDigitado from '../componentes/TextoDigitado';
import BotaoConfig from '../componentes/BotaoConfig';

const { cores, fontes } = tema;

export default function MesaTrabalho() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [classes, setClasses] = useState([]);
  const [relacionamentos, setRelacionamentos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [errosValidacao, setErrosValidacao] = useState([]);
  const [resultadoEntrega, setResultadoEntrega] = useState(null);

  // Busca dados do dia e do pedido ativo
  async function carregarPedido() {
    try {
      const { data: dia } = await api.get('/dias/atual');
      const item = dia.pedidos.find((p) => p.id === pedidoId);
      if (!item) {
        alert('Pedido não encontrado no dia aberto.');
        navigate('/balcao');
        return;
      }
      setPedido(item);
    } catch {
      navigate('/balcao');
    }
  }

  useEffect(() => {
    carregarPedido();

    const timer = setInterval(() => {
      setPedido((atual) => {
        if (!atual || atual.pacienciaRestanteMs <= 0) return atual;
        return {
          ...atual,
          pacienciaRestanteMs: Math.max(0, atual.pacienciaRestanteMs - 1000),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pedidoId]);

  // Som de resultado quando a entrega é avaliada
  useEffect(() => {
    if (resultadoEntrega) tocarEfeito(resultadoEntrega.resultado.aceita ? 'sucesso' : 'erro');
  }, [resultadoEntrega]);

  // Adicionar novo bloco UML a partir do menu lateral
  function adicionarBloco(estereotipo = 'classe') {
    const novoId = `c_${Date.now()}`;
    const novaClasse = {
      id: novoId,
      nome: estereotipo === 'classe' ? 'NovaClasse' : estereotipo.toUpperCase(),
      estereotipo,
      atributos: [],
      metodos: [],
      posicao: { x: 40 + classes.length * 20, y: 40 + classes.length * 20 },
    };
    setClasses([...classes, novaClasse]);
  }

  // Limpar tela com confirmação (RF28)
  function limparTela() {
    if (classes.length === 0 && relacionamentos.length === 0) return;
    if (window.confirm('Tem certeza de que deseja apagar todo o diagrama montado?')) {
      setClasses([]);
      setRelacionamentos([]);
      setErrosValidacao([]);
    }
  }

  // Submissão do diagrama (RF12)
  async function entregarDiagrama() {
    setErrosValidacao([]);
    const documentoDiagrama = {
      versao: '1.0',
      tipo: 'classes',
      classes,
      relacionamentos,
    };

    // Validação estrita local contra o diagrama.schema.json
    const problemas = validarDiagramaLocal(documentoDiagrama);
    if (problemas.length > 0) {
      setErrosValidacao(problemas.map((p) => `${p.campo}: ${p.mensagem}`));
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post(`/pedidos/${pedidoId}/entrega`, {
        diagrama: documentoDiagrama,
      });
      setResultadoEntrega(data);
    } catch (err) {
      alert(err.mensagem || 'Falha ao entregar diagrama.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={estilos.container} className="dg-papel-parede">
      {/* Topo / Barra de Ferramentas */}
      <div style={estilos.barraSuperior}>
        <button onClick={() => navigate('/balcao')} style={tema.botao.neutro}>
          ⬅ Voltar ao balcão
        </button>
        <span style={estilos.tituloPrograma}>
          Diagrameria Studio - {pedido ? pedido.titulo : 'Carregando...'}
        </span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BotaoConfig />
          <button onClick={limparTela} disabled={classes.length === 0} style={tema.botao.perigo}>
            Limpar tela
          </button>
          <button onClick={entregarDiagrama} disabled={enviando || classes.length === 0} style={tema.botao.sucesso}>
            {enviando ? 'Validando...' : 'Entregar pedido'}
          </button>
        </div>
      </div>

      <div style={estilos.corpo}>
        {/* Painel Esquerdo: Ticket do Pedido + Menu de Peças */}
        <aside style={estilos.lateral}>
          {/* Post-it do ticket (RF04) */}
          <div style={estilos.secaoTicket}>
            <div style={estilos.ticketHeader}>
              <strong style={estilos.ticketTitulo}>Ticket de requisitos</strong>
              <span style={estilos.badge}>Nível {pedido?.dificuldade}</span>
            </div>
            <TextoDigitado texto={pedido?.enunciado || ''} style={estilos.enunciadoTexto} />
            {pedido && (
              <Cronometro
                restanteMs={pedido.pacienciaRestanteMs}
                totalMs={pedido.pacienciaMs}
              />
            )}
          </div>

          {/* Menu Lateral de Peças (RF06) */}
          <div style={estilos.secaoPecas}>
            <span style={tema.rotulo}>Peças UML</span>
            <button onClick={() => adicionarBloco('classe')} style={estilos.botaoPeca}>
              <i style={{ ...estilos.amostra, background: cores.amarelo }} /> + Classe
            </button>
            <button onClick={() => adicionarBloco('abstrata')} style={estilos.botaoPeca}>
              <i style={{ ...estilos.amostra, background: cores.lavanda }} /> + Classe abstrata
            </button>
            <button onClick={() => adicionarBloco('interface')} style={estilos.botaoPeca}>
              <i style={{ ...estilos.amostra, background: cores.verde }} /> + Interface
            </button>
            <button onClick={() => adicionarBloco('enum')} style={estilos.botaoPeca}>
              <i style={{ ...estilos.amostra, background: cores.rosa }} /> + Enum
            </button>
          </div>

          {/* Erros locais do Schema */}
          {errosValidacao.length > 0 && (
            <div role="alert" style={estilos.caixaErros}>
              <strong style={{ fontFamily: fontes.titulo, fontSize: 13, textTransform: 'uppercase' }}>
                Problemas no diagrama
              </strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 19, lineHeight: 1.1 }}>
                {errosValidacao.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Área Central: Canvas de Modelagem dentro de uma janela */}
        <main style={estilos.centro}>
          <JanelaRetro
            titulo={`${pedido ? pedido.titulo : 'Diagrama'}.dgm`}
            direita={
              <span style={estilos.statusDiagrama}>
                {classes.length} {classes.length === 1 ? 'bloco' : 'blocos'} · {relacionamentos.length}{' '}
                {relacionamentos.length === 1 ? 'ligação' : 'ligações'}
              </span>
            }
            estilo={{ flex: 1 }}
            estiloCorpo={{ padding: 6, background: cores.cinzaClaro }}
          >
            <Canvas
              classes={classes}
              relacionamentos={relacionamentos}
              onAtualizarClasses={setClasses}
              onAtualizarRelacionamentos={setRelacionamentos}
            />
          </JanelaRetro>
        </main>
      </div>

      {/* Modal de Avaliação / Feedback (RF15 e RF22) */}
      {resultadoEntrega && (
        <div style={estilos.modalOverlay}>
          <div style={estilos.modalCaixa}>
            <JanelaRetro
              variante="jogo"
              corTitulo={resultadoEntrega.resultado.aceita ? cores.verdeEscuro : cores.vermelho}
              titulo={resultadoEntrega.resultado.aceita ? 'Entrega aprovada!' : 'Entrega recusada'}
            >
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={estilos.gridResultados}>
                  <div style={estilos.tile}>
                    <span style={estilos.tileLabel}>Nota</span>
                    <strong style={estilos.tileValor}>{(resultadoEntrega.resultado.nota * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={estilos.tile}>
                    <span style={estilos.tileLabel}>Moedas</span>
                    <strong style={{ ...estilos.tileValor, color: cores.amarelo }}>+{resultadoEntrega.resultado.moedas}</strong>
                  </div>
                  <div style={estilos.tile}>
                    <span style={estilos.tileLabel}>Gorjeta</span>
                    <strong style={{ ...estilos.tileValor, color: cores.amarelo }}>+{resultadoEntrega.resultado.gorjeta}</strong>
                  </div>
                  <div style={estilos.tile}>
                    <span style={estilos.tileLabel}>Pontuação</span>
                    <strong style={estilos.tileValor}>{resultadoEntrega.resultado.pontos}</strong>
                  </div>
                </div>

                <div style={estilos.diffResumo}>
                  <span style={tema.rotulo}>Análise do ValidadorUML</span>
                  <div style={{ fontSize: 22, marginTop: 6 }}>
                    Classes corretas: {resultadoEntrega.diff.classes.corretas.join(', ') || 'Nenhuma'}
                  </div>
                  {resultadoEntrega.diff.classes.faltando.length > 0 && (
                    <div style={{ fontSize: 22, color: cores.rosa }}>
                      Classes faltando: {resultadoEntrega.diff.classes.faltando.join(', ')}
                    </div>
                  )}
                  {resultadoEntrega.diff.classes.extras.length > 0 && (
                    <div style={{ fontSize: 22, color: cores.laranja }}>
                      Classes extras (descontam pontos): {resultadoEntrega.diff.classes.extras.join(', ')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/balcao')}
                  style={{ ...tema.botao.primario, width: '100%', fontSize: 18, padding: '12px 0' }}
                >
                  Concluir e voltar ao balcão
                </button>
              </div>
            </JanelaRetro>
          </div>
        </div>
      )}
    </div>
  );
}

const estilos = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: fontes.texto,
    color: cores.creme,
  },
  barraSuperior: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 18px',
    backgroundColor: cores.contorno,
    borderBottom: `4px solid ${cores.vermelho}`,
    position: 'relative',
    zIndex: 20,
  },
  tituloPrograma: { ...tema.tituloPixel(20), textTransform: 'uppercase' },
  corpo: { display: 'flex', flex: 1, overflow: 'hidden' },
  lateral: {
    width: 330,
    flexShrink: 0,
    backgroundColor: cores.barraEscura,
    borderRight: `4px solid ${cores.contorno}`,
    boxShadow: `inset -3px 0 0 ${cores.vermelho}`,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    overflowY: 'auto',
  },
  secaoTicket: {
    backgroundColor: '#fff6c8',
    border: `3px solid ${cores.contorno}`,
    boxShadow: '4px 4px 0 rgba(0,0,0,0.45)',
    transform: 'rotate(-1deg)',
    padding: 12,
    color: cores.contorno,
  },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ticketTitulo: { fontFamily: fontes.titulo, fontSize: 14, textTransform: 'uppercase' },
  badge: {
    backgroundColor: cores.rosa,
    border: `2px solid ${cores.contorno}`,
    padding: '1px 7px',
    fontFamily: fontes.titulo,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: cores.contorno,
  },
  enunciadoTexto: { fontSize: 22, color: '#4a3410', margin: '8px 0', lineHeight: 1.05 },
  secaoPecas: { display: 'flex', flexDirection: 'column', gap: 10 },
  botaoPeca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    backgroundColor: cores.painel,
    border: `4px solid ${cores.contorno}`,
    boxShadow: 'inset 0 0 0 2px #6e2a6b',
    borderRadius: 0,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: 14,
    textAlign: 'left',
    textTransform: 'uppercase',
    color: cores.creme,
  },
  amostra: { display: 'block', width: 14, height: 14, border: `2px solid ${cores.contorno}`, flexShrink: 0 },
  caixaErros: {
    backgroundColor: cores.vermelho,
    border: `3px solid ${cores.contorno}`,
    color: cores.creme,
    padding: 10,
  },
  centro: { flex: 1, padding: 14, display: 'flex', minWidth: 0, overflow: 'auto' },
  statusDiagrama: { fontFamily: fontes.texto, fontSize: 20, color: cores.rosa },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(20, 12, 24, 0.82)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 60,
  },
  modalCaixa: { width: '100%', maxWidth: 480 },
  gridResultados: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  tile: {
    backgroundColor: cores.painel,
    border: `3px solid ${cores.contorno}`,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
  },
  tileLabel: { fontSize: 20, color: cores.lavanda },
  tileValor: { fontFamily: fontes.titulo, fontSize: 24, marginTop: 2, color: cores.creme },
  diffResumo: { padding: 12, backgroundColor: cores.painelEscuro, border: `3px solid ${cores.contorno}` },
};
