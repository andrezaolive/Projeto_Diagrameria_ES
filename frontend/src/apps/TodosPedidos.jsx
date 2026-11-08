import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Botao, Modal } from '../components/ui.jsx';
import { MODELOS } from '../data/pedidos.js';
import { TIPOS_DIAGRAMA, categoriasDoModelo, tipoDoDiagrama } from '../lib/categorias.js';
import { nivelDoModelo, pontuacao } from '../lib/dificuldade.js';

// DEBUG (só em npm run dev): lista todos os modelos de pedido do jogo, com as categorias embaixo.
// Escolher um troca o primeiro pedido da caixa de e-mail por ele.
export default function TodosPedidos({ onEscolher, onFechar }) {
  const [filtro, setFiltro] = useState('todos');
  // do mais fácil ao mais difícil
  const lista = MODELOS.filter((m) => filtro === 'todos' || tipoDoDiagrama(m.esperado) === filtro).sort((a, b) => pontuacao(a) - pontuacao(b));
  const janela = (
    <Modal titulo={`TODOS_OS_PEDIDOS.TXT · ${MODELOS.length}`} w={1000} h={640} onFechar={onFechar}>
      <div className="todos-pedidos">
        <div className="todos-filtros">
          {[{ id: 'todos', nome: 'Todos' }, ...TIPOS_DIAGRAMA].map((t) => (
            <Botao key={t.id} tamanho="pequeno" variante={filtro === t.id ? 'ativo' : 'claro'} onClick={() => setFiltro(t.id)}>
              {t.nome} ({t.id === 'todos' ? MODELOS.length : MODELOS.filter((m) => tipoDoDiagrama(m.esperado) === t.id).length})
            </Botao>
          ))}
        </div>
        <ul className="todos-lista rolagem">
          {lista.map((m) => (
            <li key={m.id}>
              <button className="todos-item" onClick={() => onEscolher(m.id)} title="Troca o primeiro pedido da caixa por este">
                <span className="todos-cabeca">
                  <b>{m.cliente}</b>
                  <span className={`tag-nivel ${nivelDoModelo(m).id}`} title={`complexidade ${pontuacao(m)}`}>{nivelDoModelo(m).nome}</span>
                  <code>[{m.id}]</code>
                </span>
                <span className="todos-assunto">
                  {m.assunto} · R$ {m.recompensa} · {Math.floor(m.tempo / 60)}:{String(m.tempo % 60).padStart(2, '0')}
                </span>
                <span className="todos-tags">
                  {categoriasDoModelo(m).map((c, i) => (
                    <span key={c} className={`todos-tag ${i === 0 ? 'principal' : ''}`}>{c}</span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="aviso-loja">Debug: escolher um pedido troca o primeiro e-mail da caixa por ele.</p>
      </div>
    </Modal>
  );
  // por cima do jogo inteiro (o app de e-mail recorta o que passa da janela dele)
  const palco = document.querySelector('.palco');
  return palco ? createPortal(janela, palco) : janela;
}
