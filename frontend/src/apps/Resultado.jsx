import { useState } from 'react';
import { Botao, Modal } from '../components/ui.jsx';
import { DiagramaEstatico, SECOES } from '../editor/Formas.jsx';
import { REACOES, reacaoMascote } from '../lib/mascote.js';
import { sortearMascoteFeliz } from '../data/mascote.js';
import { diagramaVazio } from '../lib/feedback.js';
import Feedback from './Feedback.jsx';
import './apps.css';

// sprites das reações do mascote (50x50, desenhados à mão pela equipe), indexados pelo nome da reação
const SPRITES = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/sprites/mascote-*-50x50.png', { eager: true, import: 'default' })).map(([caminho, url]) => [
    caminho.match(/mascote-(\w+)-50x50/)[1],
    url,
  ]),
);

function Barra({ rotulo, valor }) {
  return (
    <div className="linha-barra">
      <span>{rotulo}: {Math.round(valor * 100)}%</span>
      <div className="barra"><i style={{ width: `${valor * 100}%` }} /></div>
    </div>
  );
}

// Nome do diagrama de uma parte do pedido JUMBO: "Diagrama de casos de uso", "Diagrama de estados"...
export const nomeDaParte = (secao) => `Diagrama de ${SECOES.find((s) => s.id === secao).nome.toLowerCase()}`;

export default function Resultado({ resultado, onOk }) {
  const reacao = reacaoMascote(resultado.nota);
  const [feliz] = useState(sortearMascoteFeliz); // reação "feliz": um dos dois desenhos, sorteado por entrega
  // pedido JUMBO: `partes` traz um resultado por diagrama; os botões escolhem qual mostrar
  const [indiceParte, setIndiceParte] = useState(0);
  const parte = resultado.partes?.[indiceParte];
  const { nota, valor, atrasado, pedido, fatorAtraso, perdeuBonus } = resultado;
  const { estrutura, rotulos, relacoes, multiplicidades, fronteira, membros, diagrama, esperado } = parte ?? resultado;
  const [vendoFeedback, setVendoFeedback] = useState(false);
  // entrega vazia: não há o que comentar, então não há botão de feedback
  const temFeedback = !diagramaVazio(diagrama);
  // muitas linhas no meio (barras extras, atraso, nota da parte do JUMBO): versão compacta, para
  // caber na janela sem esticar os lados
  const linhasExtras = [multiplicidades, fronteira, membros].filter((v) => v != null).length + (atrasado ? 1 : 0) + (parte ? 1 : 0);
  const compacto = linhasExtras >= 2;
  return (
    <>
    <Modal titulo={`RESULTADO · ${pedido.cliente}${resultado.partes ? ' · JUMBO' : ''}`} w={1180} h={660}>
      <div className="resultado">
        <div className="lado">
          <h4>SEU DIAGRAMA</h4>
          <DiagramaEstatico key={indiceParte} diagrama={diagrama} prefixo={`rj${indiceParte}`} />
        </div>
        <div className={`meio ${compacto ? 'compacto' : ''}`}>
          <div className={`reacao reacao-${reacao}`}>
            <img src={reacao === 'feliz' ? feliz : SPRITES[reacao]} alt={`Mascote: ${REACOES[reacao].rotulo}`} className="pixel" width={compacto ? 100 : 150} height={compacto ? 100 : 150} />
            <span className="fala">{REACOES[reacao].fala}</span>
          </div>
          <span className="nota">{nota}%</span>
          {parte && <span className="nota-parte">{nomeDaParte(parte.secao)}: {parte.nota}%</span>}
          <Barra rotulo="Estrutura" valor={estrutura} />
          <Barra rotulo="Nomes" valor={rotulos} />
          <Barra rotulo="Relações" valor={relacoes} />
          {multiplicidades != null && <Barra rotulo="Multiplicidade" valor={multiplicidades} />}
          {fronteira != null && <Barra rotulo="Sistema" valor={fronteira} />}
          {membros != null && <Barra rotulo="Atributos/métodos" valor={membros} />}
          {atrasado && (
            <span className="atraso">
              Fora do prazo: paga {Math.round((fatorAtraso ?? 0.5) * 100)}%{perdeuBonus ? ' e sem o bônus de urgente' : ''}
            </span>
          )}
          <span className="pago">+ R$ {valor}</span>
          <div className="acoes-resultado">
            {temFeedback && (
              <Botao variante="rosa" tamanho="pequeno" onClick={() => setVendoFeedback(true)}>
                {(parte ? parte.nota : nota) === 100 ? 'Feedback' : 'Ver erros e dicas'}
              </Botao>
            )}
            <Botao variante="menta" onClick={onOk} autoFocus>OK</Botao>
          </div>
        </div>
        <div className="lado">
          <h4>ESPERADO</h4>
          {resultado.partes && (
            <div className="partes-jumbo" role="tablist" aria-label="Diagramas do pedido JUMBO">
              {resultado.partes.map((p, i) => (
                <Botao
                  key={p.secao}
                  role="tab"
                  aria-selected={i === indiceParte}
                  tamanho="pequeno"
                  variante={i === indiceParte ? 'ativo' : 'claro'}
                  onClick={() => setIndiceParte(i)}
                  title={`Ver o ${nomeDaParte(p.secao).toLowerCase()} (o seu e o esperado)`}
                >
                  {nomeDaParte(p.secao)}
                </Botao>
              ))}
            </div>
          )}
          <DiagramaEstatico key={indiceParte} diagrama={esperado} prefixo={`re${indiceParte}`} />
        </div>
      </div>
    </Modal>
    {vendoFeedback && <Feedback diagrama={diagrama} esperado={esperado} onFechar={() => setVendoFeedback(false)} />}
    </>
  );
}
