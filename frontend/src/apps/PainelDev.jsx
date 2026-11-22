import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Botao, Modal } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { CONQUISTAS, nomeDoPremio } from '../art/conquistas.js';
import { diaEncerrado } from '../state/reducer.js';

// DEBUG (só em npm run dev): editar o dinheiro, parar o relógio do jogo (prazos, paciência e
// chegada de pedidos), terminar o diagrama aberto ou o dia inteiro com uma nota escolhida e
// liberar conquistas. Aberto pelo botão "⚙ Dev" no app de e-mail.
const ATALHOS = [-100, 100, 1000];

// campo "terminar com que porcentagem?" (0 a 100)
function CampoNota({ valor, onChange, rotulo }) {
  return (
    <label className="linha campo-nota">
      <span>{rotulo}</span>
      <input className="px-campo" type="number" min={0} max={100} step={1} value={valor} onChange={(e) => onChange(e.target.value)} aria-label={rotulo} />
      <span>%</span>
    </label>
  );
}
const notaValida = (v) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100;

export default function PainelDev({ onFechar }) {
  const { state, dispatch } = useGame();
  const [valor, setValor] = useState(String(state.dinheiro));
  const parado = Boolean(state.sessao?.relogioParado);
  const numero = Number(valor);
  const valido = valor.trim() !== '' && Number.isInteger(numero);
  const [notaDiagrama, setNotaDiagrama] = useState('100');
  const [notaDia, setNotaDia] = useState('100');
  const [conquista, setConquista] = useState('');
  const sessao = state.sessao;
  const aberto = sessao?.pedidos.find((p) => p.id === sessao.ativo);
  const emAberto = sessao?.pedidos.filter((p) => p.status === 'novo' || p.status === 'aceito').length ?? 0;
  const faltam = CONQUISTAS.filter((c) => !state.conquistas?.[c.id]);
  const definir = (v) => {
    dispatch({ type: 'DEBUG_DINHEIRO', valor: v });
    setValor(String(v));
  };

  const janela = (
    <Modal titulo="DEV.EXE" w={560} h={640} onFechar={onFechar}>
      <div className="painel-dev">
        <section>
          <h4>Dinheiro</h4>
          <p className="atual">Agora: R$ {state.dinheiro}</p>
          <form
            className="linha"
            onSubmit={(e) => {
              e.preventDefault();
              if (valido) definir(numero);
            }}
          >
            <input className="px-campo" type="number" step={1} value={valor} onChange={(e) => setValor(e.target.value)} aria-label="Novo saldo" autoFocus />
            <Botao tamanho="pequeno" variante="menta" type="submit" disabled={!valido}>
              Definir
            </Botao>
          </form>
          <div className="linha">
            {ATALHOS.map((d) => (
              <Botao key={d} tamanho="pequeno" variante="claro" onClick={() => definir(state.dinheiro + d)}>
                {d > 0 ? '+' : '−'}R$ {Math.abs(d)}
              </Botao>
            ))}
          </div>
        </section>
        <section>
          <h4>Relógio do jogo</h4>
          {state.sessao ? (
            <>
              <p className="atual">{parado ? '⏸ Parado: prazos, paciência e chegada de pedidos congelados.' : '▶ Correndo.'}</p>
              <Botao tamanho="pequeno" variante={parado ? 'menta' : 'rosa'} onClick={() => dispatch({ type: 'DEBUG_PARAR_RELOGIO', parado: !parado })}>
                {/* sem Ó: a fonte dos botões não tem maiúsculas acentuadas */}
                {parado ? 'Continuar timer' : 'Pausar timer'}
              </Botao>
            </>
          ) : (
            <p className="atual">Sem partida em andamento.</p>
          )}
        </section>
        <section>
          <h4>Terminar diagrama</h4>
          {aberto ? (
            <>
              <p className="atual">Aberto no editor: {aberto.cliente} · {aberto.assunto}</p>
              <CampoNota rotulo="Terminar o diagrama com que porcentagem?" valor={notaDiagrama} onChange={setNotaDiagrama} />
              <Botao tamanho="pequeno" variante="menta" disabled={!notaValida(notaDiagrama)} onClick={() => dispatch({ type: 'DEBUG_ENTREGAR', nota: Number(notaDiagrama) })}>
                Terminar diagrama
              </Botao>
            </>
          ) : (
            <p className="atual">{sessao ? 'Nenhum pedido aberto no editor: aceite um pedido primeiro.' : 'Sem partida em andamento.'}</p>
          )}
        </section>
        <section>
          <h4>Terminar dia</h4>
          {sessao?.modo === 'campanha' && !diaEncerrado(sessao) ? (
            <>
              <p className="atual">
                Entrega {emAberto} pedido{emAberto === 1 ? '' : 's'} em aberto{sessao.fila?.length ? ` e os ${sessao.fila.length} que ainda vão chegar` : ''}.
              </p>
              <CampoNota rotulo="Terminar o dia com que porcentagem?" valor={notaDia} onChange={setNotaDia} />
              <Botao
                tamanho="pequeno"
                variante="rosa"
                disabled={!notaValida(notaDia)}
                onClick={() => {
                  dispatch({ type: 'DEBUG_TERMINAR_DIA', nota: Number(notaDia), sorteio: Math.random() });
                  onFechar();
                }}
              >
                Terminar dia
              </Botao>
            </>
          ) : (
            <p className="atual">{!sessao ? 'Sem partida em andamento.' : sessao.modo !== 'campanha' ? 'O modo infinito não tem fim de dia.' : 'O dia já terminou.'}</p>
          )}
        </section>
        <section>
          <h4>Eventos aleatórios</h4>
          {sessao ? (
            <div className="linha">
              {[['pane', 'Pane'], ['energia', 'Queda de energia'], ['cafe', 'Café derramado']].map(([tipo, nome]) => (
                <Botao key={tipo} tamanho="pequeno" variante="claro" disabled={Boolean(sessao.evento)} onClick={() => { dispatch({ type: 'DEBUG_EVENTO', tipo, sorteio: Math.random() }); onFechar(); }}>
                  {nome}
                </Botao>
              ))}
            </div>
          ) : (
            <p className="atual">Sem partida em andamento.</p>
          )}
        </section>
        <section>
          <h4>Pedido de retorno</h4>
          {sessao?.modo === 'infinito' && state.arquivo?.length ? (
            <div className="linha">
              {[['reenvio', 'Reenvio'], ['ambiguo', 'Ambíguo']].map(([tipo, nome]) => (
                <Botao key={tipo} tamanho="pequeno" variante="claro" onClick={() => { dispatch({ type: 'DEBUG_RETORNO', tipo }); onFechar(); }}>
                  {nome}
                </Botao>
              ))}
            </div>
          ) : (
            <p className="atual">{sessao?.modo === 'infinito' ? 'Entregue algum pedido primeiro (o arquivo está vazio).' : 'Os retornos só chegam no modo infinito.'}</p>
          )}
        </section>
        <section>
          <h4>Conquistas</h4>
          <p className="atual">
            {CONQUISTAS.length - faltam.length} de {CONQUISTAS.length} desbloqueadas.
          </p>
          {faltam.length > 0 && (
            <div className="linha">
              <select className="px-campo seletor-conquista" value={conquista} onChange={(e) => setConquista(e.target.value)} aria-label="Conquista">
                <option value="">Escolha uma conquista…</option>
                {faltam.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {nomeDoPremio(c)}
                  </option>
                ))}
              </select>
              <Botao
                tamanho="pequeno"
                variante="menta"
                disabled={!conquista}
                onClick={() => {
                  dispatch({ type: 'DEBUG_CONQUISTA', id: conquista });
                  setConquista('');
                }}
              >
                Liberar conquista
              </Botao>
              <Botao tamanho="pequeno" variante="claro" onClick={() => dispatch({ type: 'DEBUG_CONQUISTA', todas: true })}>
                Todas
              </Botao>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
  // por cima do jogo inteiro (o app de e-mail recorta o que passa da janela dele)
  const palco = document.querySelector('.palco');
  return palco ? createPortal(janela, palco) : janela;
}
