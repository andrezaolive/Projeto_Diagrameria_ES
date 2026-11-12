import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Botao, Modal } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';

// DEBUG (só em npm run dev): editar o dinheiro e parar o relógio do jogo (prazos, paciência e
// chegada de pedidos). Aberto pelo botão "⚙ Dev" no app de e-mail.
const ATALHOS = [-100, 100, 1000];

export default function PainelDev({ onFechar }) {
  const { state, dispatch } = useGame();
  const [valor, setValor] = useState(String(state.dinheiro));
  const parado = Boolean(state.sessao?.relogioParado);
  const numero = Number(valor);
  const valido = valor.trim() !== '' && Number.isInteger(numero);
  const definir = (v) => {
    dispatch({ type: 'DEBUG_DINHEIRO', valor: v });
    setValor(String(v));
  };

  const janela = (
    <Modal titulo="DEV.EXE" w={460} h={360} onFechar={onFechar}>
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
      </div>
    </Modal>
  );
  // por cima do jogo inteiro (o app de e-mail recorta o que passa da janela dele)
  const palco = document.querySelector('.palco');
  return palco ? createPortal(janela, palco) : janela;
}
