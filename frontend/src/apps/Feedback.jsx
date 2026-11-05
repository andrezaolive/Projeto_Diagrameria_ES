import { Botao, Modal } from '../components/ui.jsx';
import { CONCEITOS, NOME_TIPO, gerarFeedback } from '../lib/feedback.js';
import { lerMult } from '../lib/multiplicidade.js';
import './apps.css';

// Trecho errado, em vermelho
const Errado = ({ children }) => <mark className="fb-errado">{children}</mark>;
const Nome = ({ children }) => <b>"{children}"</b>;

// Relação escrita como no diagrama: A — B, A → «include» → B, A → herda de → B...
function Relacao({ r, errada = false }) {
  const meio = {
    associacao: ' — ',
    include: ' → «include» → ',
    extend: ' → «extend» → ',
    heranca: ' → herda de → ',
    dependencia: ' ⇢ depende de ⇢ ',
    agregacao: ' ◇— agrega — ',
    composicao: ' ◆— é composto de — ',
  }[r.tipo] ?? ` → ${NOME_TIPO[r.tipo] ?? r.tipo} → `;
  const texto = `"${r.ra}"${meio}"${r.rb}"`;
  return errada ? <Errado>{texto}</Errado> : <span className="fb-certo">{texto}</span>;
}

// Por que o sentido importa, por tipo de relação
const SENTIDO = {
  include: 'No include a seta sai do caso que SEMPRE executa o outro (o base) e aponta para o incluído.',
  extend: 'No extend a seta sai do caso OPCIONAL e aponta para o caso base que ele estende.',
  heranca: 'Na herança a seta sai da classe filha e aponta para a mãe ("filha é um tipo de mãe").',
  dependencia: 'Na dependência a seta sai de quem usa e aponta para quem é usado.',
  agregacao: 'Na agregação a ligação sai do "todo" (o losango vazado fica nele) e vai até a parte.',
  composicao: 'Na composição a ligação sai do "todo" (o losango cheio fica nele) e vai até a parte.',
};

function Problema({ p }) {
  switch (p.tipo) {
    case 'grafia':
      return (
        <>
          <p>
            Erro de escrita:{' '}
            {/* palavra escrita inteira em vermelho; letras trocadas/sobrando sublinhadas dentro dela */}
            <Errado>
              <span className="fb-palavra">
                {p.diff.escrito.map((x, i) => (x.errado ? <s key={i} className="fb-letra-errada">{x.t}</s> : <span key={i}>{x.t}</span>))}
              </span>
            </Errado>{' '}
            → o certo é{' '}
            <span className="fb-palavra">
              {p.diff.correto.map((x, i) => (x.faltou ? <u key={i} className="fb-faltou">{x.t}</u> : <span key={i}>{x.t}</span>))}
            </span>
          </p>
          <p className="fb-sugestao">Com outro nome, o elemento conta como diferente, e as relações ligadas a ele também deixam de valer.</p>
        </>
      );
    case 'tipoErrado':
      return (
        <p>
          <Nome>{p.rotulo}</Nome> deveria ser <b>{NOME_TIPO[p.certo]}</b>, mas você usou <Errado>{NOME_TIPO[p.usado]}</Errado>.
        </p>
      );
    case 'faltando':
      return (
        <p>
          Faltou {NOME_TIPO[p.esperado.tipo]}: <Errado>"{p.esperado.rotulo}"</Errado>
        </p>
      );
    case 'sobrando':
      return (
        <p>
          <Errado>"{p.jogador.rotulo}"</Errado> ({NOME_TIPO[p.jogador.tipo]}) não foi pedido no e-mail.
        </p>
      );
    case 'sentidoInvertido':
      return (
        <>
          <p>
            O <b>{NOME_TIPO[p.certa.tipo]}</b> entre <Nome>{p.certa.ra}</Nome> e <Nome>{p.certa.rb}</Nome> está <Errado>ao contrário</Errado>.
          </p>
          <p className="fb-sugestao">
            O certo seria: <Relacao r={p.certa} />. {SENTIDO[p.certa.tipo]}
          </p>
        </>
      );
    case 'relacaoTipoErrado':
      return (
        <>
          <p>
            Entre <Nome>{p.certa.ra}</Nome> e <Nome>{p.certa.rb}</Nome> você usou <Errado>{NOME_TIPO[p.usada.tipo]}</Errado>, mas o pedido pede{' '}
            <b>{NOME_TIPO[p.certa.tipo]}</b>.
          </p>
          <p className="fb-sugestao">
            O certo seria: <Relacao r={p.certa} />
          </p>
        </>
      );
    case 'relacaoFaltando':
      return (
        <>
          <p>
            Faltou a relação: <Relacao r={p.certa} errada />
          </p>
          <p className="fb-sugestao">Releia o e-mail: cada frase com "participa", "inclui", "estende", "herda", "agrega" ou "é composto de" vira uma ligação.</p>
        </>
      );
    case 'multiplicidade':
      return (
        <>
          <p>
            Na relação <Relacao r={p.certa} />, do lado de <Nome>{p.lado}</Nome> a multiplicidade deveria ser <b>{p.esperado}</b>, mas você{' '}
            {p.usado ? <>colocou <Errado>{p.usado}</Errado></> : <Errado>não colocou nenhuma</Errado>}.
          </p>
          <p className="fb-sugestao">
            Leia assim: cada "{p.outro}" tem <b>{lerMult(p.esperado)}</b> "{p.lado}". O número fica na ponta da classe que está sendo contada.
          </p>
        </>
      );
    case 'relacaoSobrando':
      return (
        <p>
          A relação <Relacao r={p.usada} errada /> não foi pedida.
        </p>
      );
    default:
      return null;
  }
}

const SECOES = [
  ['nome', 'Nomes'],
  ['elemento', 'Elementos'],
  ['relacao', 'Relações'],
];

export default function Feedback({ diagrama, esperado, onFechar }) {
  const { problemas, conceitos } = gerarFeedback(diagrama, esperado);
  return (
    <Modal titulo="FEEDBACK.TXT" w={920} h={620} onFechar={onFechar}>
      <div className="feedback">
        <div className="feedback-corpo rolagem">
          {problemas.length === 0 ? (
            <p className="fb-tudo-certo">Nenhum erro encontrado. Diagrama igual ao pedido!</p>
          ) : (
            SECOES.map(([cat, titulo]) => {
              const lista = problemas.filter((p) => p.categoria === cat);
              if (!lista.length) return null;
              return (
                <section key={cat}>
                  <h4>
                    {titulo} <span className="contagem">{lista.length}</span>
                  </h4>
                  <ul>
                    {lista.map((p, i) => (
                      <li key={i}>
                        <Problema p={p} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}

          {conceitos.length > 0 && (
            <section className="fb-dicas">
              <h4>Dicas</h4>
              {conceitos.map((c) => (
                <div key={c} className="fb-dica">
                  <b>{CONCEITOS[c].titulo}</b>
                  <p>{CONCEITOS[c].texto}</p>
                  <p className="exemplo">Exemplo: {CONCEITOS[c].exemplo}</p>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="feedback-rodape">
          <span className="legenda">
            <mark className="fb-errado">vermelho</mark> = o que está errado · <u className="fb-faltou">sublinhado</u> = o que faltou
          </span>
          <Botao variante="menta" onClick={onFechar} autoFocus>
            Entendi
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
