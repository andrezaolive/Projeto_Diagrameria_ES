import { useEffect, useRef, useState } from 'react';
import iconeEmail from '../assets/ui/icon-email-16.png';
import { detectarAlertas, sortearFrase, vistosIniciais } from '../lib/alertas.js';
import { formatarTempo } from './Computador.jsx';
import { sfx } from '../lib/sfx.js';

const DURACAO = 7000; // ms na tela

// Pop-ups de clientes impacientes, no canto inferior direito (escritório e computador)
export default function Alertas({ pedidos }) {
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
        return <Alerta key={a.chave} alerta={a} pedido={p} onFechar={() => fechar(a.chave)} />;
      })}
    </div>
  );
}

function Alerta({ alerta, pedido, onFechar }) {
  // some sozinho; o de atenção também some quando o pedido deixa de estar esperando
  useEffect(() => {
    const t = setTimeout(onFechar, DURACAO);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (alerta.tipo === 'atencao' && pedido.status !== 'novo') onFechar();
  }, [alerta.tipo, pedido.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const saiu = alerta.tipo === 'saiu';
  return (
    <div className={`alerta ${saiu ? 'saiu' : 'atencao'}`} role={saiu ? 'alert' : 'status'}>
      <div className="alerta-topo">
        <img src={iconeEmail} alt="" className="pixel" />
        <strong>{pedido.cliente}</strong>
        <button className="alerta-fechar" onClick={onFechar} aria-label="Fechar aviso">×</button>
      </div>
      <span className="alerta-assunto">{pedido.assunto}</span>
      <p className="alerta-frase">"{alerta.frase}"</p>
      <span className="alerta-rodape">
        {saiu
          ? `Foi embora${pedido.multa ? ` · −R$ ${pedido.multa}` : ''}`
          : `Responda em ${formatarTempo(pedido.paciencia ?? 0)} no e-mail`}
      </span>
    </div>
  );
}
