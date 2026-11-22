import cadeado from '../assets/ui/icon-cadeado-16.png';
import { Botao, Dinheiro, formatarReais } from '../components/ui.jsx';
import { FundoMenu } from './Menu.jsx';
import { useGame } from '../state/GameContext.jsx';
import { DIAS_CAMPANHA, MEDIA_MINIMA } from '../state/reducer.js';
import Medalha from '../components/Medalha.jsx';
import { TINTAS } from '../art/palette.js';
import { corDoDesempenho, medalhaDaNota } from '../lib/colecao.js';
import { sextaAntes } from '../lib/dificuldade.js';
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
  return (
    <div className="tela">
      <FundoMenu />
      <div className="calendario">
        <h2 className="titulo-px" style={{ fontSize: 30 }}>CAMPANHA</h2>
        <FolhaCalendario onEscolher={onEscolher} />
        <div className="rodape">
          <Botao variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>
          <Dinheiro valor={state.dinheiro} />
        </div>
      </div>
    </div>
  );
}

// Dia só para ver (calendário de mesa): um quadro parado, sem clique
function DiaParado({ children, className, title }) {
  return <div className={className} title={title}>{children}</div>;
}

// Folha do mês. Sem `onEscolher` (calendário de mesa do escritório) é só para ver: os dias não
// são botões e não dá para começar outro dia dali.
export function FolhaCalendario({ onEscolher }) {
  const { state } = useGame();
  const { desbloqueado, concluidos, fimDeSemana = {} } = state.campanha;
  const mes = montarMes();
  const soVer = !onEscolher;
  const Dia = soVer ? DiaParado : 'button';

  return (
        <div className={`calendario-folha ${soVer ? 'so-ver' : ''}`}>
          <div className="calendario-topo">
            <div className="argolas">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
            <span>MÊS 1 · AGÊNCIA</span>
            <span>{Object.keys(concluidos).length}/{DIAS_CAMPANHA} DIAS</span>
          </div>
          <div className="calendario-grade">
            {SEMANA.map((s) => <div key={s} className="semana">{s}</div>)}
            {mes.map((c) => {
              // fim de semana: abre quando a sexta anterior é concluída; tem pedidos complexos e não
              // é obrigatório (não trava a semana seguinte)
              if (!c.util) {
                const feito = fimDeSemana[c.data];
                const liberado = Boolean(concluidos[sextaAntes(c.data)]);
                if (!liberado)
                  return (
                    <div key={c.data} className="dia folga" title="Conclua a sexta-feira para abrir o fim de semana">
                      {c.data}
                      <span className="folga-txt">folga</span>
                    </div>
                  );
                return (
                  <Dia
                    key={c.data}
                    className="dia fim-de-semana"
                    onClick={() => { sfx.clique(); onEscolher({ fimDeSemana: c.data }); }}
                    title={feito ? 'Fim de semana já concluído: jogar de novo paga metade' : 'Fim de semana: escritório aberto e pedidos complexos (opcional)'}
                  >
                    {c.data}
                    {feito && <span className="carimbo" style={{ background: TINTAS[corDoDesempenho(feito.media)] }}>OK {feito.media}%</span>}
                    <Medalha medalha={feito && medalhaDaNota(feito.media)} vazia={!feito} tamanho={26} className="medalha-dia" />
                    <span className="info">{feito ? formatarReais(feito.ganho) : 'extra'}</span>
                  </Dia>
                );
              }
              const feito = concluidos[c.campanha];
              const liberado = c.campanha <= desbloqueado;
              const hoje = c.campanha === desbloqueado && !feito;
              return (
                <Dia
                  key={c.data}
                  className={`dia ${liberado ? '' : 'bloqueado'} ${hoje ? 'hoje' : ''}`}
                  disabled={!liberado}
                  onClick={() => { sfx.clique(); onEscolher({ dia: c.campanha }); }}
                  title={!liberado ? `Conclua o dia anterior com ${MEDIA_MINIMA}% ou mais` : feito ? `Dia ${c.campanha} já concluído: jogar de novo paga metade e só traz pedidos que você já desbloqueou` : `Dia ${c.campanha}`}
                >
                  {c.data}
                  {!liberado && <img src={cadeado} alt="bloqueado" className="pixel" />}
                  {feito && <span className="carimbo" style={{ background: TINTAS[corDoDesempenho(feito.media)] }}>OK {feito.media}%</span>}
                  {feito && <Medalha medalha={medalhaDaNota(feito.media)} tamanho={26} className="medalha-dia" />}
                  {liberado && !feito && <Medalha vazia tamanho={26} className="medalha-dia" />}
                  {feito && <span className="info">{formatarReais(feito.ganho)}</span>}
                </Dia>
              );
            })}
          </div>
        </div>
  );
}
