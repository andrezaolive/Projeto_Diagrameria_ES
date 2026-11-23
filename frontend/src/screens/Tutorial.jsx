import { useEffect, useState } from 'react';
import { Botao } from '../components/ui.jsx';
import { spriteMascote } from '../data/mascote.js';
import { useSpritesAtualizados } from '../data/spritesVivos.js';
import { MAX_ACEITOS_INFINITO, MEDIA_MINIMA, VIDAS_INFINITO } from '../state/reducer.js';
import { pixelDaCelula } from '../lib/areaTrabalho.js';

// Tutorial da primeira vez no computador: passo a passo com um destaque no ícone (ou na barra de
// tarefas) de que o texto fala. Enquanto ele está aberto, os pedidos da partida esperam
// (`sessao.esperaTutorial` no reducer); "Vamos nessa!"/"Pular" mandam CONCLUIR_TUTORIAL e eles chegam.

const ICONE = { w: 124, h: 112 }; // tamanho do botão do ícone na área de trabalho (jogo.css)
const BARRA = { x: 0, y: 668, w: 1280, h: 52 };
const CARTAO_W = 470;
// mascote falando: alterna boca aberta/sorriso enquanto "fala" o texto do passo (tempo pelo tamanho
// do texto) e termina sorrindo (fala2)
const QUADRO_FALA_MS = 160;
const duracaoDaFala = (texto) => Math.min(3200, 500 + texto.join(' ').length * 12);

function MascoteFalando({ texto }) {
  const [boca, setBoca] = useState(true);
  const [falando, setFalando] = useState(true);
  useSpritesAtualizados(); // PNG do mascote editado (npm run dev): desenha de novo
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setFalando(false);
    const t = setInterval(() => setBoca((b) => !b), QUADRO_FALA_MS);
    const fim = setTimeout(() => setFalando(false), duracaoDaFala(texto));
    return () => {
      clearInterval(t);
      clearTimeout(fim);
    };
  }, [texto]);
  return <img src={spriteMascote(falando && boca ? 'fala1' : 'fala2')} alt="" className="pixel tutorial-mascote" />;
}

// `revendo`: aberto de novo pelo Guia (os pedidos já estão chegando; o relógio fica parado)
export const passosDoTutorial = (nome, modo, revendo = false) => [
  {
    titulo: 'BEM-VINDO(A)!',
    texto: [
      `Oi${nome ? `, ${nome}` : ''}! Esta é a sua agência de diagramas.`,
      'Clientes mandam pedidos por e-mail, você monta o diagrama UML que eles pedem e recebe pelo acerto.',
      revendo ? 'Vamos rever o computador. O relógio do jogo fica parado até o tutorial acabar.' : 'Antes do primeiro cliente chegar, vou te mostrar o computador.',
    ],
  },
  {
    alvo: 'email',
    titulo: 'E-MAIL',
    texto: [
      'Os pedidos chegam aqui (e num aviso no canto da tela). Leia o que o cliente quer e aceite ou recuse.',
      'Não demore: cada cliente tem uma barra de paciência. Se ele for embora, ou se você recusar, paga multa.',
    ],
  },
  {
    alvo: 'editor',
    titulo: 'DIAGRAMAS',
    texto: [
      'Depois de aceitar, monte o diagrama aqui: arraste as peças da paleta à direita e ligue com as relações.',
      'A paleta tem casos de uso, classes e estados. Descobrir qual tipo o cliente quer faz parte do desafio!',
      'Terminou? Aperte "Entregar". Quanto mais certo, mais você recebe.',
    ],
  },
  {
    alvo: 'guia',
    titulo: 'GUIA',
    texto: ['Em dúvida sobre ator, herança ou transição? O Guia explica cada tipo de diagrama com um exemplo pronto.'],
  },
  {
    alvo: 'dicas',
    titulo: 'DICAS',
    texto: ['Travou num pedido? Aqui você compra pedaços da resposta do pedido em andamento. Cada pedaço sai mais caro que o anterior.'],
  },
  {
    alvo: 'loja',
    titulo: 'LOJINHA',
    texto: ['Com o que ganhar, compre fundos de tela, objetos para o escritório, músicas, café e roupas para o seu avatar.'],
  },
  {
    alvo: 'barra',
    titulo: 'BARRA DE TAREFAS',
    texto: [
      'Aqui ficam as janelas abertas, o prazo do pedido em andamento e o seu dinheiro.',
      '"Sair" volta para o escritório, onde dá para arrumar a mesa. Os ícones podem ser arrastados para outro lugar.',
    ],
  },
  {
    titulo: 'PRONTO?',
    texto:
      modo === 'campanha'
        ? [
            `No fim do dia, a média dos pedidos precisa ser de pelo menos ${MEDIA_MINIMA}% para liberar o dia seguinte. E o aluguel vence todo dia, então capriche!`,
            revendo ? 'Pedido novo chega com um aviso no canto da tela: clique nele para abrir o pedido. Esc pausa o jogo.' : 'Seu primeiro cliente já vai escrever: clique no aviso que aparecer no canto da tela para abrir o pedido. Esc pausa o jogo.',
          ]
        : [
            `No modo infinito os pedidos não param de chegar: entregue o máximo que conseguir, com até ${MAX_ACEITOS_INFINITO} em andamento ao mesmo tempo. Cliente que vai embora ou entrega atrasada custam um dos ${VIDAS_INFINITO} corações.`,
            revendo ? 'Pedido novo chega com um aviso no canto da tela: clique nele para abrir o pedido. Esc pausa o jogo.' : 'Seus primeiros clientes já vão escrever: clique no aviso que aparecer no canto da tela para abrir o pedido. Esc pausa o jogo.',
          ],
  },
];

// Retângulo do destaque (coordenadas do palco) ou null para o cartão no centro
function retanguloDoAlvo(alvo, posicoes) {
  if (!alvo) return null;
  if (alvo === 'barra') return BARRA;
  const p = posicoes[alvo];
  if (!p) return null;
  const c = pixelDaCelula(p);
  return { x: c.x - 6, y: c.y - 6, w: ICONE.w + 12, h: ICONE.h + 12 };
}

// Cartão ao lado do destaque: à direita dos ícones da esquerda, à esquerda dos da direita, em cima da barra
function posicaoDoCartao(r) {
  if (!r) return { left: (1280 - CARTAO_W) / 2, top: 150 };
  if (r === BARRA) return { left: (1280 - CARTAO_W) / 2, bottom: 720 - BARRA.y + 28 };
  const top = Math.max(16, Math.min(r.y, 720 - 52 - 330));
  return r.x < 640 ? { left: r.x + r.w + 28, top } : { left: r.x - 28 - CARTAO_W, top };
}

export default function Tutorial({ nome, modo, posicoes, onConcluir, revendo = false }) {
  const passos = passosDoTutorial(nome, modo, revendo);
  const [i, setI] = useState(0);
  const passo = passos[i];
  const ultimo = i === passos.length - 1;
  const r = retanguloDoAlvo(passo.alvo, posicoes);

  // Enter/→ avança, ← volta
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        ultimo ? onConcluir() : setI(i + 1);
      } else if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [i, ultimo, onConcluir]);

  return (
    <div className={`tutorial ${r ? '' : 'sem-alvo'}`} role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo">
      {r && <div key={i} className="tutorial-destaque" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />}
      <div key={`c${i}`} className="tutorial-cartao" style={{ width: CARTAO_W, ...posicaoDoCartao(r) }}>
        <div className="tutorial-topo">
          <MascoteFalando key={i} texto={passo.texto} />
          <h3 id="tutorial-titulo">{passo.titulo}</h3>
        </div>
        {passo.texto.map((t) => (
          <p key={t}>{t}</p>
        ))}
        <div className="tutorial-rodape">
          <span className="tutorial-passo">
            {i + 1}/{passos.length}
          </span>
          {!ultimo && (
            <Botao tamanho="pequeno" variante="claro" som="voltar" onClick={onConcluir}>
              Pular
            </Botao>
          )}
          {i > 0 && (
            <Botao tamanho="pequeno" variante="claro" onClick={() => setI(i - 1)}>
              Voltar
            </Botao>
          )}
          <Botao tamanho="pequeno" variante={ultimo ? 'rosa' : 'menta'} onClick={() => (ultimo ? onConcluir() : setI(i + 1))} autoFocus>
            {/* (sem Ó/Ç: a fonte dos botões não tem essas maiúsculas) */}
            {ultimo ? 'Vamos nessa!' : 'Seguir'}
          </Botao>
        </div>
      </div>
    </div>
  );
}
