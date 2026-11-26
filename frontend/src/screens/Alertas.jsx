import { useEffect, useRef, useState } from 'react';
import LogoEmpresa from '../components/LogoEmpresa.jsx';
import { CLICAVEIS, detectarAlertas, sortearFrase, vistosIniciais } from '../lib/alertas.js';
import { formatarTempo } from './Computador.jsx';
import { sfx } from '../lib/sfx.js';

const DURACAO = 7000; // ms na tela

// Pop-ups dos clientes, no canto inferior direito (escritório e computador). Os de pedido novo,
// urgente e cliente impaciente são clicáveis: `onAbrir(id)` leva ao e-mail com o pedido aberto.
export default function Alertas({ pedidos, onAbrir }) {
  const [lista, setLista] = useState([]);
  const vistos = useRef(null);

  useEffect(() => {
    if (!vistos.current) {
      vistos.current = vistosIniciais(pedidos);
    }
    const r = detectarAlertas(pedidos, vistos.current);
    vistos.current = r.vistos;
    if (!r.alertas.length) return;
    r.alertas.some((a) => a.tipo === 'saiu') ? sfx.erro?.() : sfx.email?.();
    setLista((l) => {
      const novos = [...l];
      for (const a of r.alertas) {
        const frase = sortearFrase(a.tipo, Math.random, novos.map((x) => x.frase));
        novos.push({ chave: `${a.tipo}-${a.pedido.id}`, tipo: a.tipo, id: a.pedido.id, frase });
      }
      return novos;
    });
  }, [pedidos]);

  const fechar = (chave) => setLista((l) => l.filter((a) => a.chave !== chave));

  return (
    <div className="alertas" aria-live="polite">
      {lista.map((a) => {
        const p = pedidos.find((x) => x.id === a.id);
        if (!p) return null;
        const clicavel = onAbrir && CLICAVEIS.includes(a.tipo) && p.status === 'novo';
        return (
          <Alerta
            key={a.chave}
            alerta={a}
            pedido={p}
            onFechar={() => fechar(a.chave)}
            onAbrir={clicavel ? () => { setLista((l) => l.filter((x) => !CLICAVEIS.includes(x.tipo))); onAbrir(p.id); } : null}
          />
        );
      })}
    </div>
  );
}

function Alerta({ alerta, pedido, onFechar, onAbrir }) {
  // some sozinho; o de atenção também some quando o pedido deixa de estar esperando
  useEffect(() => {
    const t = setTimeout(onFechar, DURACAO);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (alerta.tipo !== 'saiu' && pedido.status !== 'novo') onFechar();
  }, [alerta.tipo, pedido.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const saiu = alerta.tipo === 'saiu';
  const urgente = alerta.tipo === 'urgente';
  const novo = alerta.tipo === 'novo';
  // clicável: o cartão inteiro leva ao e-mail (o "×" só fecha)
  const clicar = onAbrir
    ? {
        onClick: onAbrir,
        onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onAbrir()),
        tabIndex: 0,
        title: 'Abrir no e-mail',
      }
    : {};
  return (
    <div className={`alerta ${alerta.tipo} ${onAbrir ? 'clicavel' : ''}`} role={saiu || urgente ? 'alert' : 'status'} {...clicar}>
      {urgente && <span className="alerta-selo">PEDIDO URGENTE</span>}
      {novo && <span className="alerta-selo novo">NOVO PEDIDO</span>}
      <div className="alerta-topo">
        <LogoEmpresa nome={pedido.cliente} tamanho={24} />
        <strong>{pedido.cliente}</strong>
        <button className="alerta-fechar" onClick={(e) => { e.stopPropagation(); onFechar(); }} aria-label="Fechar aviso">×</button>
      </div>
      <span className="alerta-assunto">{pedido.assunto}</span>
      <p className="alerta-frase">"{alerta.frase}"</p>
      <span className="alerta-rodape">
        {saiu
          ? `Foi embora${pedido.multa ? ` · −R$ ${pedido.multa}` : ''}`
          : urgente
            ? `Paga R$ ${pedido.recompensa} · prazo ${formatarTempo(pedido.tempo)} · responda em ${formatarTempo(pedido.paciencia ?? 0)}`
            : `Responda em ${formatarTempo(pedido.paciencia ?? 0)} no e-mail`}
        {onAbrir && ' · clique para abrir'}
      </span>
    </div>
  );
}
