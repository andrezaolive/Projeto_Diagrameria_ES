import { useCallback, useEffect, useRef, useState } from 'react';
import Escritorio from './Escritorio.jsx';
import Computador from './Computador.jsx';
import Configuracoes from './Configuracoes.jsx';
import Resultado from '../apps/Resultado.jsx';
import Alertas from './Alertas.jsx';
import ResumoDia from './ResumoDia.jsx';
import { Botao, Dinheiro, Modal, formatarReais } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { DIAS_CAMPANHA, MEDIA_MINIMA, VIDAS_INFINITO, nomeDoDia, partidaEncerrada, temRelogio } from '../state/reducer.js';
import { dataDoDia } from '../lib/dificuldade.js';
import { sfx } from '../lib/sfx.js';
import { FADE_IN_JOGO, pararCafe, tocarCafe, tocarMusica } from '../lib/musica.js';
import { ALEATORIA, MUSICAS_CAFE, faixaInicial, faixaPorId, sortearFaixa } from '../data/musicas.js';
import TocaFitas from './TocaFitas.jsx';
import Rascunho from './Rascunho.jsx';
import Cafeteira from './Cafeteira.jsx';
import Conquistas from './Conquistas.jsx';
import { FolhaCalendario } from './Calendario.jsx';
import EfeitoCafe from '../components/EfeitoCafe.jsx';
import VelocidadeCafe from '../components/VelocidadeCafe.jsx';
import Coracoes from '../components/Coracoes.jsx';
import EventoAleatorio, { BloqueioEvento, Cansaco, QuedaDeEnergia, Sono } from './EventoAleatorio.jsx';
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
  const [cafeteira, setCafeteira] = useState(false); // botões das cápsulas
  const [livro, setLivro] = useState(false); // livro de conquistas da sala de exposição
  const [calendario, setCalendario] = useState(false); // calendário de mesa do escritório (só para ver)
  // tutorial aberto de novo pelo Guia: o relógio para (prazos, paciência e chegada de pedidos)
  const [revendoTutorial, setRevendoTutorial] = useState(false);
  useEffect(() => {
    const f = faixaPorId(faixa);
    if (f) tocarMusica(f.url, { loop: f.loop, excessoDb: f.excessoDb, fadeIn: FADE_IN_JOGO });
  }, [faixa]);
  // Café fazendo efeito: toca uma das 3 músicas de café, sorteada a cada vez que o efeito começa,
  // qualquer que seja o tipo bebido (a de fundo fica muda até o efeito acabar). Beber outro café
  // com o efeito ainda valendo não troca a música.
  const comCafe = Boolean(state.cafe.efeito);
  useEffect(() => {
    if (!comCafe) return void pararCafe();
    const opcoes = Object.values(MUSICAS_CAFE);
    const m = opcoes[Math.floor(Math.random() * opcoes.length)];
    tocarCafe(m.url, { loop: m.loop });
  }, [comCafe]);
  useEffect(() => () => pararCafe(), []); // saiu do jogo (menu): devolve a música de fundo
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
  // escritório parado: já em "escritorio" e passado o zoom de saída (transição de 0,75 s da .camada-escritorio)
  const [escritorioParado, setEscritorioParado] = useState(true);
  useEffect(() => {
    if (fase !== 'escritorio') return void setEscritorioParado(false);
    const t = setTimeout(() => setEscritorioParado(true), 780);
    return () => clearTimeout(t);
  }, [fase]);
  // fim do dia da campanha ou fim de jogo do modo infinito (sem corações); espera fechar o resultado
  const fimDoDia = partidaEncerrada(sessao) && !resultado;

  // pane que falhou ou queda de energia (modo infinito): o computador fica inacessível e o jogador
  // volta ao escritório; café derramado: até limpar a poça. `reiniciando`: o motivo, para a dica do
  // monitor ('pane' | 'energia' | 'cafe' | null)
  const reiniciando = ['pane', 'energia'].includes(sessao.bloqueio?.tipo) ? sessao.bloqueio.tipo : sessao.cafeDerramado ? 'cafe' : null;
  const reiniciandoRef = useRef(reiniciando);
  reiniciandoRef.current = reiniciando;
  const entrar = () => {
    if (reiniciandoRef.current) return;
    sfx.ligar();
    setFase('entrando');
    setTimeout(() => setFase('computador'), 750);
  };
  // Clique num pop-up de pedido (Alertas): vai ao e-mail com esse pedido; do escritório, primeiro o
  // zoom no monitor (`entrar`). `n` muda a cada clique, para o mesmo pedido poder ser aberto de novo.
  const [pedidoFoco, setPedidoFoco] = useState(null);
  // sala do escritório: 'escritorio' (mesa e computador) ou 'sala' (sala de exposição, pela seta da lateral)
  const [sala, setSala] = useState('escritorio');
  const [vindoDe, setVindoDe] = useState(null);
  // Fade a partir do preto (~1 s): ao começar o dia (inclusive "Tentar de novo") e quando o dia acaba
  // com o jogador na sala de exposição (volta ao escritório). Cada valor novo de `fade` refaz a animação.
  const [fade, setFade] = useState(1);
  // dia recomeçado: volta ao escritório (fora do computador) e os pop-ups começam do zero
  const [partida, setPartida] = useState(0);
  const recomecarDia = () => {
    setRevendoTutorial(false);
    setFase('escritorio');
    setPartida((n) => n + 1);
    setSala('escritorio');
    setVindoDe(null);
    setFade((n) => n + 1);
    // campanha: o mesmo dia de novo; infinito: partida nova, com os corações cheios
    if (sessao.modo === 'infinito') dispatch({ type: 'INICIAR_SESSAO', modo: 'infinito', tutorial: !state.tutorial?.visto, sorteio: Math.random(), semente: Math.random() });
    else dispatch({ type: 'INICIAR_SESSAO', modo: 'campanha', dia: sessao.dia, fimDeSemana: sessao.fimDeSemana, tutorial: !state.tutorial?.visto, sorteio: Math.random(), semente: Math.random() });
  };
  useEffect(() => {
    if (!fimDoDia || sala === 'escritorio') return;
    setSala('escritorio');
    setVindoDe(null);
    setFade((n) => n + 1);
  }, [fimDoDia, sala]);
  const trocarSala = (nova) => {
    if (nova === 'sala') dispatch({ type: 'VISITAR_SALA' });
    setVindoDe(nova === 'sala' ? 'direita' : 'esquerda');
    setSala(nova);
  };
  const faseRef = useRef(fase);
  faseRef.current = fase;
  const abrirPedido = (id) => {
    setPedidoFoco({ id, n: Date.now() });
    // na sala de exposição: volta ao escritório (onde está o computador) antes do zoom
    if (sala !== 'escritorio') setSala('escritorio'), setVindoDe(null);
    if (faseRef.current === 'escritorio') entrar();
    // saindo do computador: espera voltar ao escritório e entra de novo
    else if (faseRef.current === 'saindo' || faseRef.current === 'voltando') setTimeout(() => faseRef.current === 'escritorio' && entrar(), 420);
  };
  const sair = useCallback(() => {
    sfx.voltar();
    setRevendoTutorial(false);
    setFase('saindo');
    // monta o escritório já ampliado e, no quadro seguinte, tira o zoom para animar a saída
    setTimeout(() => setFase('voltando'), 300);
    setTimeout(() => setFase('escritorio'), 360);
  }, []);
  // a pane falhou (ou a energia caiu) com o jogador no computador ou entrando nele: o computador
  // desliga e ele volta ao escritório. Na queda de energia, 1 s depois (a tela pisca antes)
  useEffect(() => {
    if (!reiniciando) return;
    if (reiniciando === 'cafe') setCafeteira(false); // derramou: fecha os botões das cápsulas e mostra a poça
    const espera = reiniciando === 'energia' ? 1000 : 0;
    if (fase === 'computador') {
      const t = setTimeout(() => faseRef.current === 'computador' && sair(), espera);
      return () => clearTimeout(t);
    }
    if (fase === 'entrando') setTimeout(() => faseRef.current === 'computador' && sair(), 800);
  }, [reiniciando, fase, sair]);

  // Relógio do jogo: prazo do pedido ativo e paciência dos clientes esperando.
  // Para quando pausado, com resultado aberto ou no fim do dia.
  // (DEBUG: o painel Dev pode parar o relógio, `sessao.relogioParado`)
  const relogio = temRelogio(sessao) && !sessao?.relogioParado;
  useEffect(() => {
    if (pausado || resultado || fimDoDia || !relogio || revendoTutorial || sessao?.evento) return;
    // `sorteio`: chance de chegar um pedido urgente a cada minuto (ver sortearUrgente no reducer)
    // `sorteioEvento`: eventos aleatórios (pane, queda de energia: lib/eventos.js)
    const t = setInterval(() => dispatch({ type: 'TICK', sorteio: Math.random(), sorteioChegada: Math.random(), sorteioEvento: Math.random(), sorteioRetorno: Math.random(), sorteioCansaco: Math.random() }), 1000);
    return () => clearInterval(t);
  }, [pausado, resultado, fimDoDia, relogio, revendoTutorial, sessao?.evento, dispatch]);

  // Café (data/cafe.js): o preparo e o efeito contam segundos reais, parando junto com o jogo.
  // O efeito em si fica no TICK (relógio mais lento).
  const cafeAtivo = Boolean(state.cafe.preparando || state.cafe.efeito);
  useEffect(() => {
    if (pausado || resultado || fimDoDia || !cafeAtivo || revendoTutorial || sessao?.evento) return;
    const t = setInterval(() => dispatch({ type: 'CAFE_TICK' }), 1000);
    return () => clearInterval(t);
  }, [pausado, resultado, fimDoDia, cafeAtivo, revendoTutorial, sessao?.evento, dispatch]);

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
          {/* o deslize só vale para a troca de sala: terminado, sai a classe (senão ele se repete
              quando o escritório volta a ser montado, ao sair do computador) */}
          <div key={sala} className={`troca-sala ${vindoDe ? `vindo-da-${vindoDe}` : ''}`} onAnimationEnd={(e) => e.target === e.currentTarget && setVindoDe(null)}>
            <Escritorio
              sala={sala}
              onTrocarSala={trocarSala}
              onComputador={entrar}
              onTocaFitas={() => setTocaFitas(true)}
              onPapel={() => setRascunho(true)}
              onCafeteira={() => setCafeteira(true)}
              onConquistas={() => setLivro(true)}
              onCalendario={() => setCalendario(true)}
              desativado={fase !== 'escritorio'}
              chamarComputador={!state.tutorial?.visto && sala === 'escritorio' && !reiniciando}
              reiniciando={reiniciando}
            />
          </div>
        </div>
      )}

      {fase === 'escritorio' && (
        <>
          <div className="hud">
            <span className="etiqueta">{sessao.modo === 'campanha' ? nomeDoDia(sessao).toUpperCase().replace('Á', 'A') : 'MODO INFINITO'}</span>
            <Dinheiro valor={state.dinheiro} />
            <EfeitoCafe />
            <span className="espaco" />
            <Botao tamanho="pequeno" variante="claro" onClick={() => setPausado(true)}>Pausa (Esc)</Botao>
          </div>
        </>
      )}

      {noComputador && (
        <Computador desligando={fase === 'saindo'} onDesligar={sair} onPausa={() => setPausado(true)} onEntregue={setResultado} pedidoFoco={pedidoFoco} onFocoUsado={() => setPedidoFoco(null)} musica={{ tocando: faixa, onEscolher: escolherMusica }} revendoTutorial={revendoTutorial} onRevendoTutorial={setRevendoTutorial} />
      )}

      {/* música trocada (toca-fitas do escritório ou app Músicas do computador) */}
      {aviso && <div key={aviso.id} className="aviso-musica" role="status">{aviso.texto}</div>}

      {/* linhas de velocidade enquanto o café faz efeito (por cima da tela, abaixo das janelas) */}
      <VelocidadeCafe />

      {/* dia começando (ou voltando ao escritório no fim do dia): a tela sai do preto */}
      {fade > 0 && <div key={fade} className="fade-preto" aria-hidden="true" onAnimationEnd={() => setFade(0)} />}

      {/* eventos aleatórios do modo infinito: contratempo (tela bloqueada) e a janela da escolha */}
      <BloqueioEvento noComputador={noComputador} />
      {/* os raios só aparecem com o escritório parado (fim do zoom de saída e do deslize entre salas) */}
      <QuedaDeEnergia noComputador={noComputador} sala={sala} mostrarRaios={escritorioParado && !vindoDe} />
      <Cansaco />
      <Sono />
      {!resultado && !fimDoDia && !pausado && <EventoAleatorio />}

      {/* modo infinito: corações no topo da tela, no escritório e no computador
          (o modificador do expediente fica em segredo: o jogador só sente o efeito) */}
      {sessao.vidas != null && (
        <div className="painel-infinito">
          <Coracoes vidas={sessao.vidas} total={VIDAS_INFINITO} />
        </div>
      )}

      {/* fim de jogo (infinito): os pedidos que ainda chegariam não avisam mais */}
      {!sessao.fimDeJogo && <Alertas key={partida} pedidos={sessao.pedidos} onAbrir={abrirPedido} />}

      {saiu && (
        <div key={saiu.id} className="toast toast-saiu" role="status" onAnimationEnd={() => setSaiu(null)}>
          {saiu.texto}
        </div>
      )}

      {rascunho && <Rascunho onFechar={() => setRascunho(false)} />}
      {cafeteira && <Cafeteira onFechar={() => setCafeteira(false)} />}
      {calendario && (
        <Modal titulo="CALENDARIO.EXE" w={980} h={640} onFechar={() => setCalendario(false)}>
          <div className="calendario-mesa">
            <FolhaCalendario />
          </div>
        </Modal>
      )}
      {livro && (
        <Modal titulo="LIVRO_DE_CONQUISTAS.EXE" w={1040} h={600} onFechar={() => setLivro(false)}>
          <Conquistas onVoltar={() => setLivro(false)} />
        </Modal>
      )}

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

      {fimDoDia && !pausado && sessao.fimDeJogo && (
        <Modal titulo="FIM_DE_JOGO.TXT" w={620} h={480}>
          <div className="fim-dia fim-de-jogo">
            <h3>FIM DE JOGO!</h3>
            <Coracoes vidas={0} total={VIDAS_INFINITO} />
            <p className="motivo">Acabaram os corações: clientes foram embora ou receberam o pedido atrasado.</p>
            <div className="fim-dia-linha">
              <span>
                Entregues: <span className="valor">{sessao.fimDeJogo.entregues}</span>
              </span>
              <span>
                Ganho: <span className={`valor ${sessao.ganho < 0 ? 'reprovado' : ''}`}>{formatarReais(sessao.ganho)}</span>
              </span>
            </div>
            {sessao.fimDeJogo.recorde ? (
              <p className="veredito aprovado">Novo recorde: {sessao.fimDeJogo.entregues} {sessao.fimDeJogo.entregues === 1 ? 'pedido entregue' : 'pedidos entregues'}!</p>
            ) : sessao.fimDeJogo.recordeAnterior > 0 ? (
              <p className="veredito">Recorde: {sessao.fimDeJogo.recordeAnterior} {sessao.fimDeJogo.recordeAnterior === 1 ? 'pedido entregue' : 'pedidos entregues'}</p>
            ) : null}
            <div className="botoes-fim">
              <Botao variante="claro" onClick={recomecarDia}>Jogar de novo</Botao>
              <Botao variante="rosa" onClick={() => sairPara(onMenu)}>Menu</Botao>
            </div>
          </div>
        </Modal>
      )}

      {fimDoDia && !pausado && vendoResumo && <ResumoDia pedidos={sessao.pedidos} dia={sessao.fimDeSemana ?? sessao.dia} onFechar={() => setVendoResumo(false)} />}

      {fimDoDia && !pausado && !vendoResumo && !sessao.fimDeJogo && (
        <Modal titulo="RELATORIO_DO_DIA.TXT" w={620} h={560}>
          <div className="fim-dia">
            <h3>{`FIM DO ${nomeDoDia(sessao).toUpperCase().replace('Á', 'A')}!`}</h3>
            <div className="fim-dia-linha">
              <span>
                Entregues: {sessao.pedidos.filter((p) => p.status === 'entregue').length}/{sessao.pedidos.length}
                {sessao.pedidos.some((p) => p.status === 'expirado') && ` · foram embora: ${sessao.pedidos.filter((p) => p.status === 'expirado').length}`}
              </span>
              <span>
                Desempenho: <span className={`valor ${sessao.relatorio?.aprovado ? '' : 'reprovado'}`}>{sessao.relatorio?.media ?? 0}%</span>
              </span>
            </div>
            {/* conta do dia: pagamentos − multas − aluguel = saldo (`sessao.ganho` já vem sem as multas) */}
            {(() => {
              const multas = sessao.pedidos.reduce((t, p) => t + (p.multa ?? 0), 0);
              const despesa = sessao.relatorio?.despesa ?? 0;
              const saldo = sessao.ganho - despesa;
              return (
                <dl className="conta-dia">
                  <dt>Pagamentos</dt>
                  <dd>{formatarReais(sessao.ganho + multas)}</dd>
                  {multas > 0 && (
                    <>
                      <dt>Multas</dt>
                      <dd className="reprovado">−R$ {multas}</dd>
                    </>
                  )}
                  {despesa > 0 && (
                    <>
                      <dt>Aluguel e luz</dt>
                      <dd className="reprovado">−R$ {despesa}</dd>
                    </>
                  )}
                  <dt className="total">Saldo do dia</dt>
                  <dd className={`total ${saldo < 0 ? 'reprovado' : ''}`}>{formatarReais(saldo)}</dd>
                </dl>
              );
            })()}
            {sessao.fimDeSemana ? (
              <p className={`veredito ${sessao.relatorio?.aprovado ? 'aprovado' : 'reprovado'}`}>
                {sessao.relatorio?.aprovado ? 'Fim de semana concluído: medalha no calendário!' : `Abaixo de ${MEDIA_MINIMA}%: sem medalha desta vez. O fim de semana não trava a campanha.`}
              </p>
            ) : sessao.relatorio?.aprovado ? (
              <p className="veredito aprovado">{sessao.dia < DIAS_CAMPANHA ? `Dia ${dataDoDia(sessao.dia + 1)} liberado!` : 'Campanha concluída!'}</p>
            ) : (
              <p className="veredito reprovado">Abaixo de {MEDIA_MINIMA}%: o dia {sessao.dia + 1} continua bloqueado. Tente de novo!</p>
            )}
            <Botao variante="claro" tamanho="pequeno" onClick={() => setVendoResumo(true)}>Ver resumo do dia</Botao>
            <div className="botoes-fim">
              {!sessao.relatorio?.aprovado && (
                <Botao variante="claro" onClick={recomecarDia}>Tentar de novo</Botao>
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
                      if (partidaEncerrada(sessao)) sairPara(onMenu);
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
                ? `${sessao.fimDeSemana ? `O ${nomeDoDia(sessao).toLowerCase()}` : `O dia ${dataDoDia(sessao.dia)}`} recomeça do zero na próxima vez: os pedidos e os diagramas deste dia são descartados.`
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
