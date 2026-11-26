import { Botao, Modal } from '../components/ui.jsx';
import Disco from '../components/Disco.jsx';
import { ALEATORIA, faixasDoJogador } from '../data/musicas.js';

// Janelinha do toca-fitas (abre com um clique nele no escritório): escolhe entre as músicas que o
// jogador tem, no mesmo estilo da lojinha. "Aleatória" sorteia uma a cada vez que o jogo começa.
export default function TocaFitas({ possui, escolhida, tocando, onEscolher, onFechar }) {
  return (
    <Modal titulo="TOCA-FITAS.EXE" w={760} h={500} onFechar={onFechar}>
      <ListaMusicas possui={possui} escolhida={escolhida} tocando={tocando} onEscolher={onEscolher} />
    </Modal>
  );
}

// A lista de músicas em si: usada no toca-fitas do escritório e no app Músicas do computador
export function ListaMusicas({ possui, escolhida, tocando, onEscolher }) {
  const faixas = faixasDoJogador(possui);
  const opcoes = [...faixas, { id: ALEATORIA, nome: 'Aleatória', cor: 'var(--c-lavender)' }];
  return (
      <div className="toca-fitas">
        <div className="loja-grade rolagem">
          {opcoes.map((f) => {
            const ativa = f.id === ALEATORIA ? !escolhida || escolhida === ALEATORIA : escolhida === f.id;
            const soando = f.id === tocando;
            return (
              <div key={f.id} className={`loja-item musica-item ${ativa ? 'em-uso' : ''}`}>
                <div className="miniatura disco-mini">
                  {f.id === ALEATORIA ? <span className="aleatoria">?</span> : <Disco cor={f.cor} tamanho={80} girando={soando} />}
                </div>
                <strong>{f.nome}</strong>
                <Botao tamanho="pequeno" variante={ativa ? 'ativo' : 'claro'} disabled={ativa && f.id !== ALEATORIA} onClick={() => onEscolher(f.id)}>
                  {f.id === ALEATORIA ? (ativa ? 'Sortear' : 'Usar') : ativa ? 'Tocando' : 'Tocar'}
                </Botao>
              </div>
            );
          })}
        </div>
      </div>
  );
}
