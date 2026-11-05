import cadeado from '../assets/ui/icon-cadeado-16.png';
import { Botao, Dinheiro, formatarReais } from '../components/ui.jsx';
import { FundoMenu } from './Menu.jsx';
import { useGame } from '../state/GameContext.jsx';
import { DIAS_CAMPANHA } from '../state/reducer.js';
import { pedidosDoDia } from '../data/pedidos.js';
import { sfx } from '../lib/sfx.js';

const SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

// Mês de 31 dias começando numa segunda; dias úteis viram dias de campanha (1..22)
export function montarMes() {
  const celulas = [];
  let diaCampanha = 0;
  for (let d = 1; d <= 31; d++) {
    const semana = (d - 1) % 7;
    const util = semana < 5 && diaCampanha < DIAS_CAMPANHA;
    celulas.push({ data: d, util, campanha: util ? ++diaCampanha : null });
  }
  return celulas;
}

export default function Calendario({ onEscolher, onVoltar }) {
  const { state } = useGame();
  const { desbloqueado, concluidos } = state.campanha;
  const mes = montarMes();

  return (
    <div className="tela">
      <FundoMenu />
      <div className="calendario">
        <h2 className="titulo-px" style={{ fontSize: 30 }}>CAMPANHA</h2>
        <div className="calendario-folha">
          <div className="calendario-topo">
            <div className="argolas">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
            <span>MÊS 1 · AGÊNCIA</span>
            <span>{Object.keys(concluidos).length}/{DIAS_CAMPANHA} DIAS</span>
          </div>
          <div className="calendario-grade">
            {SEMANA.map((s) => <div key={s} className="semana">{s}</div>)}
            {mes.map((c) => {
              if (!c.util)
                return (
                  <div key={c.data} className="dia folga">
                    {c.data}
                    <span className="folga-txt">folga</span>
                  </div>
                );
              const feito = concluidos[c.campanha];
              const liberado = c.campanha <= desbloqueado;
              const hoje = c.campanha === desbloqueado && !feito;
              const qtd = pedidosDoDia(c.campanha).length;
              return (
                <button
                  key={c.data}
                  className={`dia ${liberado ? '' : 'bloqueado'} ${hoje ? 'hoje' : ''}`}
                  disabled={!liberado}
                  onClick={() => { sfx.clique(); onEscolher(c.campanha); }}
                  title={liberado ? `Dia ${c.campanha}: ${qtd} pedido(s)` : 'Conclua o dia anterior'}
                >
                  {c.data}
                  {!liberado && <img src={cadeado} alt="bloqueado" className="pixel" />}
                  {feito && <span className="carimbo">OK {feito.media}%</span>}
                  {liberado && <span className="info">{feito ? formatarReais(feito.ganho) : `${qtd} pedido${qtd > 1 ? 's' : ''}`}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rodape">
          <Botao variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>
          <Dinheiro valor={state.dinheiro} />
        </div>
      </div>
    </div>
  );
}
