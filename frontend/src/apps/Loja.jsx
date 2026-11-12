import { useEffect, useState } from 'react';
import { Botao, Dinheiro } from '../components/ui.jsx';
import { ITENS_LOJA } from '../data/loja.js';
import { FAIXAS_JOGO, temTocaFitas } from '../data/musicas.js';
import { CAPSULAS, EFEITO_SEGUNDOS, iconeCapsula, temCafeteira } from '../data/cafe.js';
import { pararPrevia, tocarPrevia, PREVIA } from '../lib/musica.js';
import Disco from '../components/Disco.jsx';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';
import './apps.css';

const ABAS = [
  { id: 'fundo', nome: 'Fundos' },
  { id: 'mesa', nome: 'Mesa' },
  { id: 'parede', nome: 'Parede' },
  { id: 'musicas', nome: 'Músicas' },
  { id: 'cafe', nome: 'Cafeteira' }, // (sem É: a fonte dos botões não tem maiúsculas acentuadas)
];

// Aba Café: cápsulas compradas uma a uma (precisa da cafeteira), com quantas o jogador já tem
function Capsulas({ state, onComprar }) {
  const pode = temCafeteira(state);
  return (
    <>
      {CAPSULAS.map((c) => (
        <div key={c.id} className="loja-item capsula-item">
          <div className="miniatura objeto-loja">
            <img src={iconeCapsula(c.id)} alt="" className="pixel" style={{ width: 96, height: 96 }} />
          </div>
          <strong>{c.nome}</strong>
          <span className="capsula-info">
            Relógio {Math.round(c.lentidao * 100)}% mais lento por {EFEITO_SEGUNDOS} s · tem {state.cafe.capsulas[c.id] ?? 0}
          </span>
          <Botao
            tamanho="pequeno"
            variante="rosa"
            disabled={!pode || state.dinheiro < c.preco}
            title={pode ? 'Compra 1 cápsula' : 'Compre a cafeteira primeiro'}
            onClick={() => onComprar(c)}
            som=""
          >
            R$ {c.preco}
          </Botao>
        </div>
      ))}
    </>
  );
}

// Miniatura do objeto ampliada por um fator inteiro (pixel art sem borrar)
function Miniatura({ item }) {
  if (item.categoria === 'fundo') return <img src={item.img} alt={item.nome} className="pixel" />;
  return <img src={item.img} alt={item.nome} className="pixel sprite" onLoad={(e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    // zoom inteiro quando cabe; sprites altos usam o maior zoom possível
    const k = Math.max(1, Math.min(6, 232 / w, 128 / h));
    const inteiro = Math.floor(k);
    const z = inteiro >= 2 ? inteiro : k;
    e.currentTarget.style.width = `${w * z}px`;
    e.currentTarget.style.height = `${h * z}px`;
  }} />;
}

// Aba de músicas: disco, nome, prévia (5 s, pausando a música do jogo) e preço
function Musicas({ possui, dinheiro, onComprar }) {
  const [ouvindo, setOuvindo] = useState(null);
  // saiu da aba/fechou a loja no meio da prévia: devolve a música do jogo
  useEffect(() => () => pararPrevia(), []);
  const previa = async (f) => {
    if (ouvindo === f.id) return pararPrevia();
    setOuvindo(f.id);
    await tocarPrevia(f.url);
    setOuvindo((x) => (x === f.id ? null : x));
  };
  return (
    <>
      <div className="loja-grade rolagem">
        {FAIXAS_JOGO.map((f) => {
          const tem = f.preco === 0 || possui.includes(f.id);
          return (
            <div key={f.id} className="loja-item musica-item">
              <div className="miniatura disco-mini">
                <Disco cor={f.cor} tamanho={80} girando={ouvindo === f.id} />
              </div>
              <strong>{f.nome}</strong>
              <div className="musica-acoes">
                <Botao tamanho="pequeno" variante={ouvindo === f.id ? 'ativo' : 'claro'} onClick={() => previa(f)} title={`Ouvir os ${PREVIA.segundos} primeiros segundos`}>
                  {ouvindo === f.id ? '■ Parar' : '▶ Prévia'}
                </Botao>
                {tem ? (
                  <span className="selo-comprada">{f.preco === 0 ? 'Já vem no jogo' : 'Comprada'}</span>
                ) : (
                  <Botao tamanho="pequeno" variante="rosa" disabled={dinheiro < f.preco} onClick={() => onComprar(f)} som="">
                    R$ {f.preco}
                  </Botao>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="aviso-loja">
        Mude a música usando o toca-fitas{temTocaFitas(possui) ? ' do escritório.' : ' (compre o toca-fitas na aba Mesa).'}
      </p>
    </>
  );
}

export default function Loja() {
  const { state, dispatch } = useGame();
  const [aba, setAba] = useState('fundo');
  const { possui, fundo, moveis } = state.loja;

  const comprar = (item) => {
    if (state.dinheiro < item.preco) return sfx.erro();
    sfx.moeda();
    dispatch({ type: 'COMPRAR', id: item.id, preco: item.preco });
    if (item.categoria === 'fundo') dispatch({ type: 'USAR_FUNDO', id: item.id });
    else dispatch({ type: 'ALTERNAR_MOVEL', id: item.id });
  };

  return (
    <div className="loja">
      <div className="loja-topo">
        {ABAS.map((a) => (
          <Botao key={a.id} tamanho="pequeno" variante={aba === a.id ? 'ativo' : 'claro'} onClick={() => setAba(a.id)}>
            {a.nome}
          </Botao>
        ))}
        <span style={{ flex: 1 }} />
        {(aba === 'mesa' || aba === 'parede' || aba === 'cafe') && (
          <span className="com-dica">
            <Botao tamanho="pequeno" variante="claro" onClick={() => dispatch({ type: 'ARRUMAR_ESCRITORIO' })} aria-describedby="dica-arrumar">
              Arrumar
            </Botao>
            <span className="dica-hover" id="dica-arrumar" role="tooltip">
              Devolve todos os objetos do escritório ao lugar original. O que está guardado no baú continua no inventário.
            </span>
          </span>
        )}
        <Dinheiro valor={state.dinheiro} />
      </div>
      {aba === 'musicas' && (
        <Musicas
          possui={possui}
          dinheiro={state.dinheiro}
          onComprar={(f) => {
            if (state.dinheiro < f.preco) return sfx.erro();
            sfx.moeda();
            dispatch({ type: 'COMPRAR', id: f.id, preco: f.preco });
          }}
        />
      )}
      {aba !== 'musicas' && (
      <div className="loja-grade rolagem">
        {ITENS_LOJA.filter((i) => i.categoria === aba).map((item) => {
          const tem = possui.includes(item.id);
          const emUso = item.categoria === 'fundo' ? fundo === item.id : moveis.includes(item.id);
          return (
            <div key={item.id} className={`loja-item ${emUso ? 'em-uso' : ''}`}>
              <div className={`miniatura ${item.categoria === 'fundo' ? '' : 'objeto-loja'}`}>
                <Miniatura item={item} />
              </div>
              <strong>{item.nome}</strong>
              {!tem && (
                <Botao tamanho="pequeno" variante="rosa" disabled={state.dinheiro < item.preco} onClick={() => comprar(item)} som="">
                  R$ {item.preco}
                </Botao>
              )}
              {tem && item.categoria === 'fundo' && (
                <Botao tamanho="pequeno" variante={emUso ? 'ativo' : 'claro'} disabled={emUso} onClick={() => dispatch({ type: 'USAR_FUNDO', id: item.id })}>
                  {emUso ? 'Em uso' : 'Usar'}
                </Botao>
              )}
              {tem && item.categoria !== 'fundo' && (
                <Botao tamanho="pequeno" variante={emUso ? 'ativo' : 'claro'} onClick={() => dispatch({ type: 'ALTERNAR_MOVEL', id: item.id })}>
                  {emUso ? 'Guardar' : 'Colocar'}
                </Botao>
              )}
            </div>
          );
        })}
        {aba === 'cafe' && (
          <Capsulas
            state={state}
            onComprar={(c) => {
              if (state.dinheiro < c.preco) return sfx.erro();
              sfx.moeda();
              dispatch({ type: 'COMPRAR_CAPSULA', tipo: c.id });
            }}
          />
        )}
      </div>
      )}
      {aba === 'cafe' && (
        <p className="aviso-loja">
          {temCafeteira(state)
            ? 'Ponha a caneca na cafeteira do escritório e clique nela para fazer café. Clique na caneca cheia para beber.'
            : 'Compre a cafeteira para poder usar as cápsulas.'}
        </p>
      )}
    </div>
  );
}
