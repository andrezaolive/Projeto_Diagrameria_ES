import { useCallback, useEffect, useRef, useState } from 'react';
import Escritorio from './Escritorio.jsx';
import Computador from './Computador.jsx';
import Configuracoes from './Configuracoes.jsx';
import Resultado from '../apps/Resultado.jsx';
import Alertas from './Alertas.jsx';
import { Botao, Dinheiro, Modal, formatarReais } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { diaEncerrado, temRelogio } from '../state/reducer.js';
import { sfx } from '../lib/sfx.js';
import './jogo.css';

// Fases: escritorio -> entrando (zoom no monitor) -> computador -> saindo -> escritorio
export default function Jogo({ onMenu, onCalendario }) {
  const { state, dispatch } = useGame();
  const sessao = state.sessao;
  const [fase, setFase] = useState('escritorio');
  const [pausado, setPausado] = useState(false);
  const [resultado, setResultado] = useState(null);

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
    const t = setInterval(() => dispatch({ type: 'TICK' }), 1000);
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
          <Escritorio onComputador={entrar} desativado={fase !== 'escritorio'} />
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

      {resultado && <Resultado resultado={resultado} onOk={() => setResultado(null)} />}

      {fimDoDia && !pausado && (
        <Modal titulo="RELATORIO_DO_DIA.TXT" w={560} h={380}>
          <div className="fim-dia">
            <h3>FIM DO DIA {sessao.dia}!</h3>
            <div>Pedidos entregues: {sessao.pedidos.filter((p) => p.status === 'entregue').length}/{sessao.pedidos.length}</div>
            {sessao.pedidos.some((p) => p.status === 'expirado') && (
              <div>Clientes que foram embora: {sessao.pedidos.filter((p) => p.status === 'expirado').length}</div>
            )}
            <div>Nota média: <span className="valor">{state.campanha.concluidos[sessao.dia]?.media ?? 0}%</span></div>
            <div>Ganho do dia: <span className="valor">{formatarReais(sessao.ganho)}</span></div>
            {sessao.pedidos.some((p) => p.multa) && (
              <div>Multas: <span className="valor">−R$ {sessao.pedidos.reduce((t, p) => t + (p.multa ?? 0), 0)}</span></div>
            )}
            <Botao variante="rosa" onClick={() => sairPara(onCalendario)}>Ir ao calendário</Botao>
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
                  <Botao variante="claro" som="voltar" onClick={() => { aplicar(); sairPara(onMenu); }}>Menu</Botao>
                  <Botao variante="menta" onClick={() => { aplicar(); setPausado(false); }}>Continuar</Botao>
                </>
              )}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
