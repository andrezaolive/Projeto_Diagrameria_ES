import { useCallback, useEffect, useRef, useState } from 'react';
import Escritorio from './Escritorio.jsx';
import Computador from './Computador.jsx';
import Configuracoes from './Configuracoes.jsx';
import Resultado from '../apps/Resultado.jsx';
import Alertas from './Alertas.jsx';
import ResumoDia from './ResumoDia.jsx';
import { Botao, Dinheiro, Modal, formatarReais } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { DIAS_CAMPANHA, MEDIA_MINIMA, diaEncerrado, temRelogio } from '../state/reducer.js';
import { sfx } from '../lib/sfx.js';
import { FADE_IN_JOGO, tocarMusica } from '../lib/musica.js';
import { ALEATORIA, faixaInicial, faixaPorId, sortearFaixa } from '../data/musicas.js';
import TocaFitas from './TocaFitas.jsx';
import Rascunho from './Rascunho.jsx';
import './jogo.css';

// Fases: escritorio -> entrando (zoom no monitor) -> computador -> saindo -> escritorio
export default function Jogo({ onMenu, onCalendario }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const [fase, setFase] = useState('escritorio');
  const [pausado, setPausado] = useState(false);
  // aviso antes de ir ao menu principal no meio do dia (o progresso da partida se perde)
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const confirmandoRef = useRef(false);
  confirmandoRef.current = confirmarSaida;
  const [resultado, setResultado] = useState(null);
  const [vendoResumo, setVendoResumo] = useState(false);

  // Trilha de gameplay: sorteada ao começar; o toca-fitas (se estiver na mesa) passa para a próxima
  // Música do jogo: a escolhida no toca-fitas (se tiver toca-fitas) ou uma sorteada entre as do jogador
  const [faixa, setFaixa] = useState(() => faixaInicial(state.loja));
  const [aviso, setAviso] = useState(null);
  const [tocaFitas, setTocaFitas] = useState(false);
  const [rascunho, setRascunho] = useState(false); // folha do papel da mesa
  useEffect(() => {
    const f = faixaPorId(faixa);
    if (f) tocarMusica(f.url, { loop: f.loop, excessoDb: f.excessoDb, fadeIn: FADE_IN_JOGO });
  }, [faixa]);
  const escolherMusica = (id) => {
    dispatch({ type: 'ESCOLHER_MUSICA', id });
    const nova = id === ALEATORIA ? sortearFaixa(state.loja.possui, Math.random, faixa) : id;
    setFaixa(nova);
    setAviso({ id: Date.now(), texto: `♪ ${faixaPorId(nova).nome}${id === ALEATORIA ? ' (aleatória)' : ''}` });
    setTocaFitas(false);
  };
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  const noComputador = fase === 'computador' || fase === 'saindo';
  const fimDoDia = diaEncerrado(sessao) && !resultado;

  const entrar = () => {
    sfx.ligar();
    setFase('entrando');
    setTimeout(() => setFase('computador'), 750);
  };
  const sair = useCallback(() => {
    sfx.voltar();
    setFase('saindo');
    // monta o escritório já ampliado e, no quadro seguinte, tira o zoom para animar a saída
    setTimeout(() => setFase('voltando'), 300);
    setTimeout(() => setFase('escritorio'), 360);
  }, []);

  // Relógio do jogo: prazo do pedido ativo e paciência dos clientes esperando.
  // Para quando pausado, com resultado aberto ou no fim do dia.
  const relogio = temRelogio(sessao);
  useEffect(() => {
    if (pausado || resultado || fimDoDia || !relogio) return;
    // `sorteio`: chance de chegar um pedido urgente a cada minuto (ver sortearUrgente no reducer)
    const t = setInterval(() => dispatch({ type: 'TICK', sorteio: Math.random(), sorteioChegada: Math.random() }), 1000);
    return () => clearInterval(t);
  }, [pausado, resultado, fimDoDia, relogio, dispatch]);

  // Aviso no topo quando o jogador recusa um pedido, com a multa.
  // (Cliente impaciente e cliente que foi embora viram pop-ups no canto: ver Alertas.jsx)
  const [saiu, setSaiu] = useState(null);
  const recusadosVistos = useRef(null);
  useEffect(() => {
    const recusados = sessao?.pedidos.filter((p) => p.status === 'recusado' && p.multa != null) ?? [];
    if (recusadosVistos.current !== null && recusados.length > recusadosVistos.current) {
      const ult = recusados.at(-1);
      sfx.voltar?.();
      setSaiu({ id: Date.now(), texto: `Pedido de ${ult.cliente} recusado · −R$ ${ult.multa}` });
    }
    recusadosVistos.current = recusados.length;
  }, [sessao?.pedidos]);

  // ESC abre/fecha a pausa (o editor consome o ESC antes quando há ferramenta ativa)
  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // com o aviso de saída aberto, o Esc só fecha o aviso (e a pausa continua)
      if (confirmandoRef.current) return setConfirmarSaida(false);
      setPausado((p) => !p);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  if (!sessao) return null;

  const sairPara = (f) => {
    dispatch({ type: 'ENCERRAR_SESSAO' });
    f();
  };

  return (
    <div className="tela">
      {!noComputador && (
        <div className={`camada-escritorio ${fase === 'entrando' || fase === 'voltando' ? 'zoom' : ''}`}>
          <Escritorio onComputador={entrar} onTocaFitas={() => setTocaFitas(true)} onPapel={() => setRascunho(true)} desativado={fase !== 'escritorio'} />
          {aviso && <div key={aviso.id} className="aviso-musica" role="status">{aviso.texto}</div>}
        </div>
      )}

      {fase === 'escritorio' && (
        <>
          <div className="hud">
            <span className="etiqueta">{sessao.modo === 'campanha' ? `DIA ${sessao.dia}` : 'MODO INFINITO'}</span>
            <Dinheiro valor={state.dinheiro} />
            <span className="espaco" />
            <Botao tamanho="pequeno" variante="claro" onClick={() => setPausado(true)}>Pausa (Esc)</Botao>
          </div>
          <p className="hud-aviso"><span className="piscar">clique no computador</span> · arraste os objetos · role o mouse para virar livros</p>
        </>
      )}

      {noComputador && (
        <Computador desligando={fase === 'saindo'} onDesligar={sair} onPausa={() => setPausado(true)} onEntregue={setResultado} />
      )}

      <Alertas pedidos={sessao.pedidos} />

      {saiu && (
        <div key={saiu.id} className="toast toast-saiu" role="status" onAnimationEnd={() => setSaiu(null)}>
          {saiu.texto}
        </div>
      )}

      {rascunho && <Rascunho onFechar={() => setRascunho(false)} />}

      {tocaFitas && (
        <TocaFitas
          possui={state.loja.possui}
          escolhida={state.loja.musica}
          tocando={faixa}
          onEscolher={escolherMusica}
          onFechar={() => setTocaFitas(false)}
        />
      )}

      {resultado && <Resultado resultado={resultado} onOk={() => setResultado(null)} />}

      {fimDoDia && !pausado && vendoResumo && <ResumoDia pedidos={sessao.pedidos} dia={sessao.dia} onFechar={() => setVendoResumo(false)} />}

      {fimDoDia && !pausado && !vendoResumo && (
        <Modal titulo="RELATORIO_DO_DIA.TXT" w={600} h={520}>
          <div className="fim-dia">
            <h3>FIM DO DIA {sessao.dia}!</h3>
            <div>Pedidos entregues: {sessao.pedidos.filter((p) => p.status === 'entregue').length}/{sessao.pedidos.length}</div>
            {sessao.pedidos.some((p) => p.status === 'expirado') && (
              <div>Clientes que foram embora: {sessao.pedidos.filter((p) => p.status === 'expirado').length}</div>
            )}
            <div>Desempenho do dia: <span className={`valor ${sessao.relatorio?.aprovado ? '' : 'reprovado'}`}>{sessao.relatorio?.media ?? 0}%</span></div>
            <div>Ganho do dia: <span className="valor">{formatarReais(sessao.ganho)}</span></div>
            {sessao.pedidos.some((p) => p.multa) && (
              <div>Multas: <span className="valor">−R$ {sessao.pedidos.reduce((t, p) => t + (p.multa ?? 0), 0)}</span></div>
            )}
            {sessao.relatorio?.aprovado ? (
              <p className="veredito aprovado">{sessao.dia < DIAS_CAMPANHA ? `Dia ${sessao.dia + 1} liberado!` : 'Campanha concluída!'}</p>
            ) : (
              <p className="veredito reprovado">Abaixo de {MEDIA_MINIMA}%: o dia {sessao.dia + 1} continua bloqueado. Tente de novo!</p>
            )}
            <Botao variante="claro" tamanho="pequeno" onClick={() => setVendoResumo(true)}>Ver resumo do dia</Botao>
            <div className="botoes-fim">
              {!sessao.relatorio?.aprovado && (
                <Botao variante="claro" onClick={() => dispatch({ type: 'INICIAR_SESSAO', modo: 'campanha', dia: sessao.dia, sorteio: Math.random() })}>Tentar de novo</Botao>
              )}
              <Botao variante="rosa" onClick={() => sairPara(onCalendario)}>Ir ao calendário</Botao>
            </div>
          </div>
        </Modal>
      )}

      {pausado && (
        <Modal titulo="PAUSA.EXE" w={680} h={560} onFechar={() => setPausado(false)}>
          {/* coluna: título em cima e as configurações ocupando só o espaço que sobra */}
          <div className="pausa">
            <div className="pausa-titulo">PAUSA <span className="piscar">II</span></div>
            <Configuracoes
              rodape={(aplicar) => (
                <>
                  <Botao
                    variante="claro"
                    som="voltar"
                    onClick={() => {
                      aplicar();
                      // dia em andamento: pergunta antes; dia já encerrado: nada a perder
                      if (diaEncerrado(sessao)) sairPara(onMenu);
                      else setConfirmarSaida(true);
                    }}
                  >
                    Menu
                  </Botao>
                  <Botao variante="menta" onClick={() => { aplicar(); setPausado(false); }}>Continuar</Botao>
                </>
              )}
            />
          </div>
        </Modal>
      )}

      {confirmarSaida && (
        <Modal titulo="SAIR.EXE" w={620} h={360} onFechar={() => setConfirmarSaida(false)}>
          <div className="confirmar-saida" role="alertdialog" aria-labelledby="aviso-saida">
            <h3 id="aviso-saida">Você vai perder o progresso atual</h3>
            <p>
              {sessao.modo === 'campanha'
                ? `O dia ${sessao.dia} recomeça do zero na próxima vez: os pedidos e os diagramas deste dia são descartados.`
                : 'Os pedidos e os diagramas desta partida são descartados.'}
            </p>
            <p className="nota-saida">O dinheiro que você já ganhou (e as multas que pagou) continua.</p>
            <div className="botoes-fim">
              <Botao
                variante="claro"
                som="voltar"
                onClick={() => {
                  setConfirmarSaida(false);
                  setPausado(false);
                }}
                autoFocus
              >
                Voltar ao jogo
              </Botao>
              <Botao variante="rosa" onClick={() => sairPara(onMenu)}>Sair mesmo assim</Botao>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
