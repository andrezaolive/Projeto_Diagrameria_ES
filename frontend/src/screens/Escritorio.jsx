import { useCallback, useEffect, useRef, useState } from 'react';
import escritorio from '../assets/scenes/office-320x180.png';
import iconeBau from '../assets/ui/icon-bau-16.png';
import { ITENS_LOJA, OBJETOS_BASE, metaDe, nomeObjeto, objetosDoItem, podeDeitar, spriteDe } from '../data/loja.js';
import { MONITOR, SCENE_W, SCENE_H } from '../art/layout.js';
import { anguloAleatorio, chaveSprite, conteudoDe, estaEmPilha, normalizarEntrada, objetoNoPonto, ordemDeDesenho, posicoesDoGrupo, pousar, resolverCena } from '../lib/decoracao.js';
import { useGame } from '../state/GameContext.jsx';
import { sfx } from '../lib/sfx.js';

const ESCALA = 4; // 1 pixel de arte = 4px no palco
const pct = (v, total) => `${(v / total) * 100}%`;
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

// Máscaras de transparência dos sprites, por chave de sprite (carregadas uma vez)
const MASCARAS = {};
function carregarMascara(nome, deitado) {
  const chave = chaveSprite(nome, deitado);
  if (MASCARAS[chave] !== undefined) return;
  MASCARAS[chave] = null;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height).data;
    const alfa = new Uint8Array(img.width * img.height);
    for (let i = 0; i < alfa.length; i++) alfa[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    MASCARAS[chave] = { w: img.width, h: img.height, alfa };
  };
  img.src = spriteDe(nome, deitado);
}

// Cena do escritório em primeira pessoa: computador clicável, objetos arrastáveis e o baú (inventário).
//
// Pegar objetos:
//  - arrastar e soltar (como antes);
//  - clicar sem arrastar, ou pegar algo que está numa pilha: o objeto fica "na mão", segue o mouse
//    e é solto no próximo clique (Esc devolve);
//  - rodinha do mouse sobre um livro (ou com ele na mão): em pé ↔ deitado;
//  - soltar sobre o baú guarda no inventário.
//  - toca-fitas: clicar (sem arrastar) troca a música; arrastar move como os outros.
// Objetos que abrem algo com um clique (sem arrastar): o toca-fitas (músicas) e o papel (rascunho).
// Arrastar continua movendo como os outros.
const TOCA_FITAS = 'radio';
const PAPEL = 'papeis';
const DICA_CLIQUE = { [TOCA_FITAS]: 'clique: escolher a música', [PAPEL]: 'clique: rabiscar no papel' };

export default function Escritorio({ onComputador, onTocaFitas, onPapel, desativado }) {
  const clicaveis = { [TOCA_FITAS]: onTocaFitas, [PAPEL]: onPapel };
  const { state, dispatch } = useGame();
  const ref = useRef(null);
  const bauRef = useRef(null);
  // mao = { nome, deitado, ox, oy, px, py, modo: 'arraste'|'segurando', apertado, moveu, original, origem }
  const [mao, setMao] = useState(null);
  const maoRef = useRef(null);
  maoRef.current = mao;
  const [sobre, setSobre] = useState(null);
  const [sobreBau, setSobreBau] = useState(false);
  const [painel, setPainel] = useState(false);
  const novos = state.sessao?.pedidos.filter((p) => p.status === 'novo').length ?? 0;

  const { posicoes, guardados } = state.escritorio;
  const comprados = ITENS_LOJA.filter((i) => i.objeto && state.loja.possui.includes(i.id));
  const usados = comprados.filter((i) => state.loja.moveis.includes(i.id));
  // em uso: os objetos de cada item (a pilha de livros são 4), menos os livros guardados um a um
  const emUso = usados.flatMap(objetosDoItem).filter((n) => !guardados.includes(n));
  // inventário: objetos do jogo guardados + livros da pilha guardados soltos + itens comprados fora de uso
  // (a pilha inteira guardada aparece como uma entrada só: "Pilha de livros")
  // canetas guardadas DENTRO do pote não aparecem soltas: o pote mostra quantas leva
  const guardadosDentro = state.escritorio.guardadosDentro ?? {};
  const dentroDePote = new Set(Object.entries(guardadosDentro).filter(([pote]) => guardados.includes(pote)).flatMap(([, ns]) => ns));
  const inventario = [
    ...OBJETOS_BASE.filter((n) => guardados.includes(n)),
    ...usados.flatMap((i) => (i.objetos ?? []).filter((n) => guardados.includes(n) && !dentroDePote.has(n))),
    ...comprados.filter((i) => !state.loja.moveis.includes(i.id)).map((i) => i.objeto),
  ];
  const nomeNoInventario = (nome) => {
    const n = (guardadosDentro[nome] ?? []).filter((c) => guardados.includes(c)).length;
    return n ? `${nomeObjeto(nome)} (${n} caneta${n > 1 ? 's' : ''})` : nomeObjeto(nome);
  };
  const ehGrupo = (nome) => Boolean(ITENS_LOJA.find((i) => i.objeto === nome)?.objetos);

  const presentes = [...OBJETOS_BASE.filter((n) => !guardados.includes(n)), ...emUso];
  // o pote na mão leva junto o que está dentro dele (as canetas não caem nem ficam para trás)
  const naMaoJunto = mao && metaDe(mao.nome, mao.deitado).porta && !mao.grupo ? conteudoDe(mao.nome, posicoes, presentes) : [];
  const nomes = presentes.filter((n) => n !== mao?.nome && !naMaoJunto.includes(n));
  const cena = resolverCena(nomes, posicoes);
  const objs = ordemDeDesenho(cena);

  useEffect(() => {
    objs.forEach((o) => carregarMascara(o.nome, o.entrada?.deitado));
    if (mao) carregarMascara(mao.nome, mao.deitado);
  });

  // onde o objeto na mão está (segue o mouse) e onde ele pousaria
  const metaMao = mao && metaDe(mao.nome, mao.deitado);
  const noAr = mao && {
    x: limitar(mao.px - mao.ox, -metaMao.w / 2, SCENE_W - metaMao.w / 2),
    y: limitar(mao.py - mao.oy, -metaMao.h / 2, SCENE_H - metaMao.h / 2),
  };
  const destino = mao && pousar(mao.nome, mao.deitado, noAr.x, noAr.y, cena);

  const arte = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * SCENE_W) / r.width, y: ((e.clientY - r.top) * SCENE_H) / r.height };
  };
  const emCimaDoBau = (e) => {
    const r = bauRef.current?.getBoundingClientRect();
    return Boolean(r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
  };

  const soltar = (noBau) => {
    sfx.clickSoltar(); // pegar usa o click normal; soltar, o mesmo bem baixinho
    if (mao.grupo) {
      // grupo inteiro na mão (pilha de livros, pote com canetas): no baú, continua guardado; na mesa,
      // cada um vira um objeto separado, na mesma arrumação de sempre
      if (!noBau) dispatch({ type: 'COLOCAR_GRUPO', grupo: mao.grupo, posicoes: posicoesDoGrupo(mao.nome, mao.grupo, destino.entrada, destino.x) });
    } else if (noBau) {
      dispatch({ type: 'GUARDAR_OBJETO', objeto: mao.nome });
    } else {
      // caneta posta de volta no pote: fica levemente torta (ângulo sorteado, até 30° para cada lado)
      const noPote = cena.find((o) => o.nome === destino.entrada.sobre)?.meta.porta;
      dispatch({ type: 'MOVER_OBJETO', objeto: mao.nome, posicao: noPote ? { ...destino.entrada, angulo: anguloAleatorio() } : destino.entrada });
    }
    setMao(null);
    setSobreBau(false);
  };

  // devolve o objeto na mão para onde estava (ou para o inventário)
  const cancelar = useCallback(() => {
    const m = maoRef.current;
    if (!m) return;
    if (m.grupo) {
      // grupo tirado do baú e devolvido: nada mudou no estado
    } else if (m.origem === 'inventario') dispatch({ type: 'GUARDAR_OBJETO', objeto: m.nome });
    else if (m.original) dispatch({ type: 'MOVER_OBJETO', objeto: m.nome, posicao: m.original });
    setMao(null);
    setSobreBau(false);
  }, [dispatch]);

  // Esc devolve o objeto (e não abre a pausa)
  useEffect(() => {
    if (!mao) return;
    const tecla = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      cancelar();
    };
    // captura: roda antes do Esc da pausa (Jogo.jsx), que ignora eventos já tratados
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  }, [mao, cancelar]);

  // saiu do escritório (zoom no computador) com algo na mão
  useEffect(() => {
    if (desativado && mao) cancelar();
  }, [desativado, mao, cancelar]);

  const down = (e) => {
    if (desativado || e.button !== 0) return;
    if (mao) {
      // segurando: este clique solta (no baú, guarda). A captura faz o "click" seguinte cair aqui,
      // e não no monitor ou no baú (que entraria no computador / abriria o painel).
      e.preventDefault();
      ref.current.setPointerCapture(e.pointerId);
      soltar(emCimaDoBau(e));
      return;
    }
    if (e.target.closest('.inventario')) return; // clique no baú/painel
    const p = arte(e);
    const o = objetoNoPonto(objs, MASCARAS, p.x, p.y);
    if (!o) return; // deixa o clique seguir para o monitor
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
    setPainel(false);
    sfx.click(); // só ao apertar: soltar o item não toca de novo
    // o toca-fitas só sai do lugar se for arrastado (clique troca a música)
    // pote: o que está dentro vai junto (não conta como pilha e nada cai)
    const empilhado = !clicaveis[o.nome] && o.meta.zona === 'mesa' && (o.meta.porta ? o.nivel > 0 : estaEmPilha(o, cena));
    if (empilhado && !o.meta.porta) dispatch({ type: 'PEGAR_OBJETO', objeto: o.nome }); // quem está em cima cai
    setMao({
      nome: o.nome,
      deitado: Boolean(o.entrada?.deitado),
      ox: p.x - o.x,
      oy: p.y - o.y,
      px: p.x,
      py: p.y,
      sx: p.x,
      sy: p.y,
      modo: empilhado ? 'segurando' : 'arraste',
      apertado: true,
      moveu: false,
      original: o.entrada,
      origem: 'cena',
    });
  };

  const move = (e) => {
    const p = arte(e);
    if (!mao) {
      if (!desativado) setSobre(objetoNoPonto(objs, MASCARAS, p.x, p.y)?.nome ?? null);
      return;
    }
    setSobreBau(emCimaDoBau(e));
    setMao((m) => (m ? { ...m, px: p.x, py: p.y, moveu: m.moveu || Math.abs(p.x - m.sx) + Math.abs(p.y - m.sy) > 1.5 } : m));
  };

  const up = (e) => {
    if (!mao?.apertado) return;
    if (mao.modo === 'arraste' && mao.moveu) {
      soltar(emCimaDoBau(e));
      return;
    }
    if (clicaveis[mao.nome] && mao.modo === 'arraste') {
      const abrir = clicaveis[mao.nome];
      setMao(null); // nem saiu do lugar (o click já tocou ao apertar)
      abrir?.();
      return;
    }
    // clique sem arrastar (ou objeto tirado de uma pilha): continua na mão até o próximo clique
    // (o pote não derruba as canetas: elas vão na mão junto com ele)
    if (mao.modo === 'arraste' && !metaDe(mao.nome, mao.deitado).porta) dispatch({ type: 'PEGAR_OBJETO', objeto: mao.nome });
    setMao((m) => (m ? { ...m, modo: 'segurando', apertado: false } : m));
  };

  // rodinha: livro em pé (rolar para cima) ou deitado (rolar para baixo)
  const roda = (e) => {
    if (desativado || !e.deltaY) return;
    const deitar = e.deltaY > 0;
    if (mao) {
      if (!podeDeitar(mao.nome) || mao.deitado === deitar) return;
      const m = metaDe(mao.nome, deitar);
      setMao((x) => ({ ...x, deitado: deitar, ox: m.w / 2, oy: m.h / 2 }));
      sfx.click();
      return;
    }
    const p = arte(e);
    const o = objetoNoPonto(objs, MASCARAS, p.x, p.y);
    if (!o || !podeDeitar(o.nome) || Boolean(o.entrada.deitado) === deitar) return;
    // gira no lugar e pousa de novo com gravidade: deitado e mais largo que o vão, ele fica
    // por cima dos vizinhos. Quem está em cima dele (e acima disso) não serve de apoio.
    const acima = new Set([o.nome]);
    for (let mudou = true; mudou; ) {
      mudou = false;
      for (const x of cena) if (!acima.has(x.nome) && acima.has(x.entrada?.sobre)) acima.add(x.nome), (mudou = true);
    }
    const m = metaDe(o.nome, deitar);
    const centro = o.x + o.meta.w / 2;
    const base = o.y + o.meta.h;
    const novo = pousar(o.nome, deitar, Math.round(centro - m.w / 2), base - m.h, cena.filter((x) => !acima.has(x.nome)));
    dispatch({ type: 'MOVER_OBJETO', objeto: o.nome, posicao: novo.entrada });
    sfx.click();
  };

  const retirar = (nome, e) => {
    const p = arte(e);
    const m = metaDe(nome, false);
    // grupo (pilha de livros, pote com canetas): fica na mão inteiro e só se separa quando for solto
    if (ehGrupo(nome)) {
      sfx.click();
      setPainel(false);
      const grupo = ITENS_LOJA.find((i) => i.objeto === nome).id;
      setMao({ nome, grupo, deitado: false, ox: m.w / 2, oy: m.h / 2, px: p.x, py: p.y, sx: p.x, sy: p.y, modo: 'segurando', apertado: false, moveu: true, original: null, origem: 'inventario' });
      return;
    }
    dispatch({ type: 'RETIRAR_OBJETO', objeto: nome });
    sfx.click();
    setPainel(false);
    setMao({ nome, deitado: false, ox: m.w / 2, oy: m.h / 2, px: p.x, py: p.y, sx: p.x, sy: p.y, modo: 'segurando', apertado: false, moveu: true, original: null, origem: 'inventario' });
  };

  // `angulo`: canetas no pote ficam inclinadas, girando pela base
  const estilo = (x, y, meta, angulo) => ({
    left: x * ESCALA,
    top: y * ESCALA,
    width: meta.w * ESCALA,
    height: meta.h * ESCALA,
    ...(angulo ? { transform: `rotate(${angulo}deg)`, transformOrigin: '50% 100%' } : {}),
  });

  return (
    <div
      ref={ref}
      className={`escritorio ${mao ? 'arrastando' : sobre ? 'sobre-objeto' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => mao?.modo === 'arraste' && cancelar()}
      onPointerLeave={() => setSobre(null)}
      onWheel={roda}
    >
      <img src={escritorio} alt="Escritório: mesa com computador" className="cena pixel" draggable={false} />
      <div className="tela-brilho" />
      <button
        className="monitor-hotspot"
        style={{
          left: pct(MONITOR.x, SCENE_W),
          top: pct(MONITOR.y, SCENE_H),
          width: pct(MONITOR.w, SCENE_W),
          height: pct(MONITOR.h, SCENE_H),
        }}
        onClick={() => {
          sfx.click();
          onComputador();
        }}
        disabled={desativado || Boolean(mao)}
        aria-label="Usar o computador"
      >
        {novos > 0 && <span className="badge-email">{novos}</span>}
      </button>
      {objs.map((o) => (
        <img
          key={o.nome}
          src={spriteDe(o.nome, o.entrada?.deitado)}
          alt=""
          draggable={false}
          className={`objeto pixel ${sobre === o.nome && !mao ? 'realce' : ''}`}
          style={estilo(o.x, o.y, o.meta, o.dentro ? o.entrada?.angulo : 0)}
        />
      ))}

      {mao && (
        <>
          {/* prévia de onde vai pousar */}
          {!sobreBau && <img src={spriteDe(mao.nome, mao.deitado)} alt="" draggable={false} className="objeto pixel fantasma" style={estilo(destino.x, destino.y, metaMao)} />}
          {/* canetas dentro do pote na mão: mesma posição e inclinação, desenhadas antes do pote */}
          {naMaoJunto.map((n) => {
            const e = normalizarEntrada(n, posicoes[n]);
            const m = metaDe(n, false);
            const x0 = normalizarEntrada(mao.nome, posicoes[mao.nome]).x; // onde o pote estava (as canetas guardam a posição relativa a ele)
            return (
              <img
                key={n}
                src={spriteDe(n, false)}
                alt=""
                draggable={false}
                className={`objeto pixel levantado ${sobreBau ? 'indo-pro-bau' : ''}`}
                style={estilo(noAr.x + (e.x - x0), noAr.y + metaMao.fundo - m.h, m, e.angulo)}
              />
            );
          })}
          <img
            src={spriteDe(mao.nome, mao.deitado)}
            alt=""
            draggable={false}
            className={`objeto pixel levantado ${sobreBau ? 'indo-pro-bau' : ''}`}
            style={estilo(noAr.x, noAr.y, metaMao)}
          />
        </>
      )}

      {/* dica do monitor numa camada própria, depois dos objetos: fica sempre na frente deles.
          Aparece pelo :hover do botão do monitor (seletor de irmão no CSS). */}
      <div className="dica-monitor-camada" aria-hidden="true" style={{ left: pct(MONITOR.x, SCENE_W), top: pct(MONITOR.y, SCENE_H), width: pct(MONITOR.w, SCENE_W) }}>
        <span className="dica-monitor">clique para usar</span>
      </div>

      {/* toca-fitas e papel: dica ao passar o mouse */}
      {!mao && !desativado && DICA_CLIQUE[sobre] && (() => {
        const o = objs.find((x) => x.nome === sobre);
        return o && (
          <div className="dica-objeto" role="tooltip" style={{ left: (o.x + o.meta.w / 2) * ESCALA, top: o.y * ESCALA }}>
            {DICA_CLIQUE[sobre]}
          </div>
        );
      })()}

      <div className="inventario">
        {painel && !mao && (
          <div className="inventario-painel" role="dialog" aria-label="Inventário">
            <div className="titulo">INVENTARIO</div>
            {inventario.length === 0 ? (
              <p className="vazio">Nada guardado. Arraste um objeto até o baú para guardar.</p>
            ) : (
              <ul>
                {inventario.map((nome) => {
                  const m = metaDe(nome, false);
                  const k = Math.min(40 / m.w, 40 / m.h, 3);
                  return (
                    <li key={nome}>
                      <button onClick={(e) => retirar(nome, e)} title={`Pegar: ${nomeNoInventario(nome)}`}>
                        <span className="miniatura">
                          <img src={spriteDe(nome, false)} alt="" className="pixel" draggable={false} style={{ width: m.w * k, height: m.h * k }} />
                        </span>
                        <span className="nome">{nomeNoInventario(nome)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="dica">clique num item para pegar · clique no escritório para soltar</p>
          </div>
        )}
        {mao && sobreBau && <span className="bau-dica" role="tooltip">guardar item</span>}
        <button
          ref={bauRef}
          className={`bau-btn ${mao ? 'alvo' : ''} ${sobreBau ? 'brilho' : ''} ${painel ? 'aberto' : ''}`}
          onClick={() => {
            if (mao) return;
            sfx.click();
            setPainel((v) => !v);
          }}
          disabled={desativado}
          aria-label={`Inventário (${inventario.length} ${inventario.length === 1 ? 'item' : 'itens'})`}
          aria-expanded={painel}
        >
          <img src={iconeBau} alt="" className="pixel" draggable={false} />
          {inventario.length > 0 && <span className="contagem">{inventario.length}</span>}
        </button>
      </div>
    </div>
  );
}
