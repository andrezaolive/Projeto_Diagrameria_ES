import relogio from '../assets/ui/icon-relogio-16.png';
import editor from '../assets/ui/icon-editor-16.png';
import { Botao } from '../components/ui.jsx';
import { FundoMenu } from './Menu.jsx';
import { sfx } from '../lib/sfx.js';

export default function Modos({ onInfinito, onCampanha, onVoltar }) {
  const escolher = (f) => () => { sfx.clique(); f(); };
  return (
    <div className="tela">
      <FundoMenu />
      <div className="modos">
        <h2 className="titulo-px">MODO DE JOGO</h2>
        <div className="cartoes">
          <button className="cartao-modo" onClick={escolher(onCampanha)}>
            <img src={editor} alt="" className="pixel" />
            <strong>CAMPANHA</strong>
            <span>Um mês de trabalho na agência. Cumpra os pedidos de cada dia para liberar o próximo.</span>
          </button>
          <button className="cartao-modo" onClick={escolher(onInfinito)}>
            <img src={relogio} alt="" className="pixel" />
            <strong>INFINITO</strong>
            <span>Pedidos sem fim. Entregue quantos conseguir e junte dinheiro para a lojinha.</span>
          </button>
        </div>
        <Botao className="voltar" variante="claro" som="voltar" onClick={onVoltar}>Voltar</Botao>
      </div>
    </div>
  );
}
