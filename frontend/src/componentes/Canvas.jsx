import React, { useState } from 'react';
import { tema } from '../estilos/Tema';
import { tocarEfeito } from '../servicos/audio';

const { cores, fontes } = tema;

const TAMANHO_GRADE = 20;

function alinharNaGrade(valor) {
  return Math.round(valor / TAMANHO_GRADE) * TAMANHO_GRADE;
}

// Cor do cabeçalho de cada tipo de bloco UML
const COR_ESTEREOTIPO = {
  classe: cores.amarelo,
  abstrata: cores.lavanda,
  interface: cores.verde,
  enum: cores.rosa,
};

export default function Canvas({
  classes,
  relacionamentos,
  onAtualizarClasses,
  onAtualizarRelacionamentos,
}) {
  const [classeArrastando, setClasseArrastando] = useState(null);
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 });
  const [origemLigacao, setOrigemLigacao] = useState(null);

  // Início do arrasto de um bloco já existente
  function iniciarArrasto(e, classe) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setClasseArrastando(classe.id);
    setDeslocamento({
      x: e.clientX - classe.posicao.x,
      y: e.clientY - classe.posicao.y,
    });
  }

  // Movimentação do bloco na área
  function aoMover(e) {
    if (!classeArrastando) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const novoX = alinharNaGrade(Math.max(10, e.clientX - rect.left - deslocamento.x));
    const novoY = alinharNaGrade(Math.max(10, e.clientY - rect.top - deslocamento.y));

    onAtualizarClasses(
      classes.map((c) => (c.id === classeArrastando ? { ...c, posicao: { x: novoX, y: novoY } } : c))
    );
  }

  function finalizarArrasto() {
    setClasseArrastando(null);
  }

  // Criação de ligação entre blocos (clique na origem, depois no destino)
  function lidarCliqueConexao(classeId) {
    if (!origemLigacao) {
      setOrigemLigacao(classeId);
    } else if (origemLigacao === classeId) {
      setOrigemLigacao(null); // Cancela seleção
    } else {
      const novaConexao = {
        id: `r_${Date.now()}`,
        tipo: 'associacao',
        origem: origemLigacao,
        destino: classeId,
        multiplicidadeOrigem: '1',
        multiplicidadeDestino: '1..*',
      };
      onAtualizarRelacionamentos([...relacionamentos, novaConexao]);
      setOrigemLigacao(null);
      tocarEfeito('ligar');
    }
  }

  function removerClasse(id) {
    onAtualizarClasses(classes.filter((c) => c.id !== id));
    onAtualizarRelacionamentos(
      relacionamentos.filter((r) => r.origem !== id && r.destino !== id)
    );
  }

  function alterarTipoRelacionamento(id, novoTipo) {
    onAtualizarRelacionamentos(
      relacionamentos.map((r) => {
        if (r.id !== id) return r;
        // Herança e dependência não podem ter multiplicidade no schema
        if (novoTipo === 'heranca' || novoTipo === 'dependencia') {
          const { multiplicidadeOrigem, multiplicidadeDestino, ...resto } = r;
          return { ...resto, tipo: novoTipo };
        }
        return {
          ...r,
          tipo: novoTipo,
          multiplicidadeOrigem: r.multiplicidadeOrigem || '1',
          multiplicidadeDestino: r.multiplicidadeDestino || '1..*',
        };
      })
    );
  }

  function removerRelacionamento(id) {
    onAtualizarRelacionamentos(relacionamentos.filter((r) => r.id !== id));
  }

  // Adicionar atributo na classe
  function adicionarAtributo(classeId) {
    const nome = prompt('Nome do atributo:');
    if (!nome) return;
    const tipo = prompt('Tipo do atributo (ex: String, int, double):', 'String') || 'String';
    onAtualizarClasses(
      classes.map((c) => {
        if (c.id !== classeId) return c;
        return {
          ...c,
          atributos: [...c.atributos, { nome: nome.trim(), tipo: tipo.trim(), visibilidade: 'privado' }],
        };
      })
    );
  }

  // Adicionar método na classe
  function adicionarMetodo(classeId) {
    const nome = prompt('Nome do método:');
    if (!nome) return;
    const retorno = prompt('Retorno do método (ex: void, boolean, int):', 'void') || 'void';
    onAtualizarClasses(
      classes.map((c) => {
        if (c.id !== classeId) return c;
        return {
          ...c,
          metodos: [...c.metodos, { nome: nome.trim(), retorno: retorno.trim(), visibilidade: 'publico' }],
        };
      })
    );
  }

  return (
    <div
      style={estilos.areaCanvas}
      onMouseMove={aoMover}
      onMouseUp={finalizarArrasto}
      onMouseLeave={finalizarArrasto}
    >
      {/* SVG para desenhar as linhas de relacionamento */}
      <svg style={estilos.svgOverlay}>
        {relacionamentos.map((r) => {
          const cOrigem = classes.find((c) => c.id === r.origem);
          const cDestino = classes.find((c) => c.id === r.destino);
          if (!cOrigem || !cDestino) return null;

          const x1 = cOrigem.posicao.x + 90;
          const y1 = cOrigem.posicao.y + 50;
          const x2 = cDestino.posicao.x + 90;
          const y2 = cDestino.posicao.y + 50;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={r.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={cores.contorno}
                strokeWidth="3"
                strokeDasharray={r.tipo === 'dependencia' ? '8 5' : undefined}
              />
              {/* Controles da linha */}
              <foreignObject x={midX - 75} y={midY - 17} width="150" height="34">
                <div style={estilos.badgeLinha}>
                  <select
                    value={r.tipo}
                    onChange={(e) => alterarTipoRelacionamento(r.id, e.target.value)}
                    style={estilos.selectTipo}
                  >
                    <option value="associacao">associação</option>
                    <option value="agregacao">agregação</option>
                    <option value="composicao">composição</option>
                    <option value="heranca">herança</option>
                    <option value="dependencia">dependência</option>
                  </select>
                  <button onClick={() => removerRelacionamento(r.id)} style={estilos.btnApagarLinha} aria-label="Remover ligação">
                    ×
                  </button>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Blocos de Classes */}
      {classes.map((classe) => {
        const selecionada = origemLigacao === classe.id;
        return (
          <div
            key={classe.id}
            onMouseDown={(e) => iniciarArrasto(e, classe)}
            style={{
              ...estilos.blocoClasse,
              left: `${classe.posicao.x}px`,
              top: `${classe.posicao.y}px`,
              borderColor: selecionada ? cores.rosaForte : cores.contorno,
              boxShadow: selecionada
                ? `4px 4px 0 ${cores.rosaForte}, 0 0 0 3px ${cores.rosa}`
                : `4px 4px 0 ${cores.contorno}`,
            }}
          >
            {/* Cabeçalho da Classe */}
            <div style={{ ...estilos.topoBloco, backgroundColor: COR_ESTEREOTIPO[classe.estereotipo] || cores.creme }}>
              {classe.estereotipo !== 'classe' && (
                <span style={estilos.estereotipoTexto}>&lt;&lt;{classe.estereotipo}&gt;&gt;</span>
              )}
              <input
                type="text"
                value={classe.nome}
                onChange={(e) => {
                  const novoNome = e.target.value;
                  onAtualizarClasses(
                    classes.map((c) => (c.id === classe.id ? { ...c, nome: novoNome } : c))
                  );
                }}
                style={estilos.inputNome}
              />
              <button onClick={() => removerClasse(classe.id)} style={estilos.btnRemover} aria-label="Remover bloco">
                ×
              </button>
            </div>

            {/* Compartimento de Atributos */}
            <div style={estilos.compartimento}>
              <div style={estilos.subtituloSecao}>
                <span>Atributos</span>
                <button onClick={() => adicionarAtributo(classe.id)} style={estilos.btnAdd} aria-label="Adicionar atributo">
                  +
                </button>
              </div>
              {classe.atributos.map((at, idx) => (
                <div key={idx} style={estilos.itemMembro}>
                  - {at.nome}: {at.tipo}
                </div>
              ))}
            </div>

            {/* Compartimento de Métodos */}
            <div style={estilos.compartimento}>
              <div style={estilos.subtituloSecao}>
                <span>Métodos</span>
                <button onClick={() => adicionarMetodo(classe.id)} style={estilos.btnAdd} aria-label="Adicionar método">
                  +
                </button>
              </div>
              {classe.metodos.map((mt, idx) => (
                <div key={idx} style={estilos.itemMembro}>
                  + {mt.nome}(): {mt.retorno}
                </div>
              ))}
            </div>

            {/* Botão de conexão */}
            <button
              onClick={() => lidarCliqueConexao(classe.id)}
              style={{
                ...estilos.btnLigar,
                backgroundColor: selecionada ? cores.verde : cores.rosa,
              }}
            >
              {selecionada ? 'Escolha o destino...' : 'Ligar ➔'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const estilos = {
  areaCanvas: {
    position: 'relative',
    width: '100%',
    height: '600px',
    backgroundColor: '#fffdf8',
    backgroundImage: `radial-gradient(${cores.cinzaClaro} 1.5px, transparent 1.5px)`,
    backgroundSize: '20px 20px',
    border: `3px solid ${cores.contorno}`,
    overflow: 'hidden',
    userSelect: 'none',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  blocoClasse: {
    position: 'absolute',
    width: '180px',
    backgroundColor: '#fff',
    border: `3px solid ${cores.contorno}`,
    borderRadius: 0,
    cursor: 'move',
    zIndex: 2,
    fontFamily: fontes.texto,
    color: cores.contorno,
  },
  topoBloco: {
    padding: '6px 6px 6px',
    borderBottom: `3px solid ${cores.contorno}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  estereotipoTexto: {
    fontSize: '15px',
    textAlign: 'center',
    color: '#5b5866',
    fontStyle: 'italic',
    lineHeight: 1,
  },
  inputNome: {
    border: 'none',
    backgroundColor: 'transparent',
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: '15px',
    textAlign: 'center',
    color: cores.contorno,
    width: '136px',
    margin: '0 auto',
    padding: '2px 0',
  },
  btnRemover: {
    position: 'absolute',
    right: '3px',
    top: '1px',
    background: 'none',
    border: 'none',
    color: cores.vermelho,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: '18px',
    padding: '0 3px',
    lineHeight: 1,
  },
  compartimento: {
    padding: '6px',
    borderBottom: `2px solid ${cores.cinzaClaro}`,
    fontSize: '18px',
    minHeight: '40px',
  },
  subtituloSecao: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: cores.cinza,
    fontFamily: fontes.titulo,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  btnAdd: {
    background: cores.rosa,
    border: `2px solid ${cores.contorno}`,
    borderRadius: 0,
    width: '20px',
    height: '20px',
    padding: 0,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: 1,
    color: cores.contorno,
  },
  itemMembro: {
    color: '#33293d',
    marginTop: '2px',
    lineHeight: 1,
  },
  btnLigar: {
    width: '100%',
    border: 'none',
    borderRadius: 0,
    padding: '6px',
    fontFamily: fontes.titulo,
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: cores.contorno,
  },
  badgeLinha: {
    pointerEvents: 'auto',
    backgroundColor: '#fff',
    border: `3px solid ${cores.contorno}`,
    boxShadow: `2px 2px 0 ${cores.contorno}`,
    display: 'flex',
    alignItems: 'center',
    padding: '1px 2px',
    height: '100%',
  },
  selectTipo: {
    border: 'none',
    flex: 1,
    minWidth: 0,
    fontSize: '18px',
    backgroundColor: 'transparent',
    color: cores.azulTexto,
  },
  btnApagarLinha: {
    border: 'none',
    background: 'none',
    color: cores.vermelho,
    fontFamily: fontes.titulo,
    fontWeight: 700,
    fontSize: '18px',
    padding: '0 4px',
  },
};
