import { useCallback, useEffect, useRef, useState } from 'react';
import escritorio from '../assets/scenes/office-320x180.png';
// depois de uma pane que falhou: o mesmo escritório com o monitor em tela azul (desenho da equipe)
import escritorioTelaAzul from '../assets/scenes/office-blue_screen.png';
import fundoSala from '../assets/scenes/sala-320x180.png';
import vidroSala from '../assets/scenes/sala-vidro-320x180.png';
import iconeBau from '../assets/ui/icon-bau-16.png';
import { ITENS_LOJA, metaDe, metaObjeto, nomeObjeto, objetosDoJogo, objetosPresentes, podeDeitar, spriteDe, spriteObjeto } from '../data/loja.js';
import { CAFETEIRA, CANECA } from '../data/cafe.js';
import { tempoDeLimpeza } from '../lib/eventos.js';
import { MONITOR, SCENE_W, SCENE_H } from '../art/layout.js';
import { CENARIOS, anguloAleatorio, chaveSprite, conteudoDe, entradaNaSala, estaEmPilha, normalizarEntrada, objetoNoPonto, ordemDeDesenho, posicoesDoGrupo, pousar, resolverCena, salaDe } from '../lib/decoracao.js';
import { useGame } from '../state/GameContext.jsx';
import { usePremiosAtualizados } from '../data/premios.js';
import { Avatar } from '../components/Avatar.jsx';
import { sfx } from '../lib/sfx.js';

const ESCALA = 4; // 1 pixel de arte = 4px no palco
const pct = (v, total) => `${(v / total) * 100}%`;
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

// Máscaras de transparência dos sprites, por chave de sprite (carregadas uma vez; de novo se o PNG
// mudar, como um prêmio editado no npm run dev)
const MASCARAS = {};
const ORIGEM_MASCARA = {};
function carregarMascara(nome, deitado) {
  const chave = chaveSprite(nome, deitado);
  const src = spriteDe(nome, deitado);
  if (MASCARAS[chave] !== undefined && ORIGEM_MASCARA[chave] === src) return;
  MASCARAS[chave] = null;
  ORIGEM_MASCARA[chave] = src;
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
    if (ORIGEM_MASCARA[chave] === src) MASCARAS[chave] = { w: img.width, h: img.height, alfa };
  };
  img.src = src;
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
// Cafeteira: clique abre os botões das cápsulas; caneca cheia: clique bebe o café (arrastar move as duas).
const TOCA_FITAS = 'radio';
const PAPEL = 'papeis';
const VAPOR = 'vapor';
const CALENDARIO = 'calendario-mesa'; // calendário de mesa: clique mostra o calendário da campanha
const ALBUM = 'album-conquistas'; // livro de conquistas da sala: clique abre a lista // sprite do vapor por cima da caneca cheia (posição relativa à caneca, no gerador)

// `sala`: 'escritorio' (mesa e computador) ou 'sala' (sala de exposição: quadro de broches, armário de
// vidro e prateleiras). A seta na lateral troca de sala (`onTrocarSala`); soltar um objeto em cima dela
// leva o objeto para a outra sala.
const OUTRA = { escritorio: 'sala', sala: 'escritorio' };
const NOME_SALA = { escritorio: 'Escritório', sala: 'Sala de exposição' };

// `reiniciando`: computador inacessível no modo infinito ('pane': reiniciando depois de uma pane;
// 'energia': queda de energia; 'cafe': café derramado): o monitor não entra e a dica vira
// "sistema reiniciando · N s" ou "sem energia · N s" (ao passar o mouse e, piscando, ao clicar) ou,
// com o café, "limpe o café derramado primeiro" (sempre à mostra). A poça fica debaixo da
// cafeteira: clicar nela limpa (EVENTOS.cafe.limpeza, 5 a 7 s, com a barra de progresso).
export default function Escritorio({ onComputador, onTocaFitas, onPapel, onCafeteira, onConquistas, onCalendario, desativado, sala = 'escritorio', onTrocarSala, chamarComputador = false, reiniciando = null }) {
  const { state, dispatch } = useGame();
  const [avisoReinicio, setAvisoReinicio] = useState(0);
  const telaAzul = reiniciando === 'pane'; // computador reiniciando depois da pane: monitor em tela azul
  useEffect(() => {
    if (!avisoReinicio) return;
    const t = setTimeout(() => setAvisoReinicio(0), 1500);
    return () => clearTimeout(t);
  }, [avisoReinicio]);
  useEffect(() => {
    if (!reiniciando) setAvisoReinicio(0);
  }, [reiniciando]);
  // limpeza do café derramado: { inicio, dura } em ms (performance.now) e o progresso de 0 a 1
  const [limpeza, setLimpeza] = useState(null);
  const [progresso, setProgresso] = useState(0);
  const derramado = Boolean(state.sessao?.cafeDerramado);
  useEffect(() => {
    if (!derramado) setLimpeza(null), setProgresso(0);
  }, [derramado]);
  useEffect(() => {
    if (!limpeza) return;
    let raf;
    const passo = () => {
      const p = Math.min(1, (performance.now() - limpeza.inicio) / limpeza.dura);
      setProgresso(p);
      if (p >= 1) {
        sfx.moeda();
        dispatch({ type: 'LIMPAR_CAFE' });
      } else raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [limpeza, dispatch]);
  const limpar = () => {
    if (limpeza) return;
    sfx.click();
    setLimpeza({ inicio: performance.now(), dura: tempoDeLimpeza(Math.random()) * 1000 });
  };
  usePremiosAtualizados(); // PNG de prêmio editado (npm run dev): desenha de novo
  const cen = CENARIOS[sala];
  const outra = OUTRA[sala];
  const { preparando, xicara } = state.cafe;
  const beber = () => {
    sfx.click();
    dispatch({ type: 'BEBER_CAFE' });
  };
  const clicaveis = { [TOCA_FITAS]: onTocaFitas, [PAPEL]: onPapel, [CAFETEIRA]: onCafeteira, [ALBUM]: onConquistas, [CALENDARIO]: onCalendario, ...(xicara ? { [CANECA]: beber } : {}) };
  const DICA_CLIQUE = {
    [TOCA_FITAS]: 'clique: escolher a música',
    [PAPEL]: 'clique: rabiscar no papel',
    [ALBUM]: 'clique: ver as conquistas',
    [CALENDARIO]: 'clique: ver o calendário',
    [CAFETEIRA]: preparando ? `preparando o café... ${preparando.falta} s` : 'clique: fazer café',
    ...(xicara ? { [CANECA]: 'clique: beber o café' } : {}),
  };
  // enquanto a cafeteira trabalha, a caneca e a cafeteira não saem do lugar
  // café sendo feito (ou derramado): a cafeteira e a caneca não saem do lugar
  const presa = (nome) => Boolean(preparando || state.sessao?.cafeDerramado) && (nome === CANECA || nome === CAFETEIRA);
  // a caneca cheia usa o sprite com café (a cor mostra a força)
  const sprite = (nome, deitado) => (nome === CANECA && xicara ? spriteObjeto(`caneca-cheia-${xicara}`) : spriteDe(nome, deitado));
  const ref = useRef(null);
  const bauRef = useRef(null);
  const setaRef = useRef(null);
  const [sobreSeta, setSobreSeta] = useState(false);
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
  // inventário: objetos do jogo guardados + livros da pilha guardados soltos + itens comprados fora de uso
  // (a pilha inteira guardada aparece como uma entrada só: "Pilha de livros")
  // canetas guardadas DENTRO do pote não aparecem soltas: o pote mostra quantas leva
  const guardadosDentro = state.escritorio.guardadosDentro ?? {};
  const dentroDePote = new Set(Object.entries(guardadosDentro).filter(([pote]) => guardados.includes(pote)).flatMap(([, ns]) => ns));
  const inventario = [
    // (os do jogo incluem os prêmios das conquistas que não couberam na sala)
    ...objetosDoJogo(state).filter((n) => guardados.includes(n)),
    ...usados.flatMap((i) => (i.objetos ?? []).filter((n) => guardados.includes(n) && !dentroDePote.has(n))),
    ...comprados.filter((i) => !state.loja.moveis.includes(i.id)).map((i) => i.objeto),
  ];
  const nomeNoInventario = (nome) => {
    const n = (guardadosDentro[nome] ?? []).filter((c) => guardados.includes(c)).length;
    return n ? `${nomeObjeto(nome)} (${n} caneta${n > 1 ? 's' : ''})` : nomeObjeto(nome);
  };
  const ehGrupo = (nome) => Boolean(ITENS_LOJA.find((i) => i.objeto === nome)?.objetos);

  // só os desta sala (quem está em cima de outro objeto fica na sala dele)
  const presentes = objetosPresentes(state).filter((n) => salaDe(n, posicoes) === sala);
  // o pote na mão leva junto o que está dentro dele (as canetas não caem nem ficam para trás)
  // (a cafeteira leva a caneca da bandeja do mesmo jeito)
  const levaJunto = (m) => m.porta || m.bandeja;
  const naMaoJunto = mao && levaJunto(metaDe(mao.nome, mao.deitado)) && !mao.grupo ? conteudoDe(mao.nome, posicoes, presentes) : [];
  const nomes = presentes.filter((n) => n !== mao?.nome && !naMaoJunto.includes(n));
  const cena = resolverCena(nomes, posicoes, cen);
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
  const destino = mao && pousar(mao.nome, mao.deitado, noAr.x, noAr.y, cena, cen);

  const arte = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * SCENE_W) / r.width, y: ((e.clientY - r.top) * SCENE_H) / r.height };
  };
  const dentroDe = (el, e) => {
    const r = el?.getBoundingClientRect();
    return Boolean(r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
  };
  const emCimaDoBau = (e) => dentroDe(bauRef.current, e);
  const emCimaDaSeta = (e) => dentroDe(setaRef.current, e);

  const soltar = (noBau, naSeta = false) => {
    sfx.clickSoltar(); // pegar usa o click normal; soltar, o mesmo bem baixinho
    if (naSeta) {
      // leva o objeto para a outra sala (e vai junto). Grupo inteiro tirado do baú: solte numa sala.
      if (mao.grupo) return cancelar();
      dispatch({ type: 'MOVER_OBJETO', objeto: mao.nome, posicao: entradaNaSala(mao.nome, outra) });
      setMao(null);
      setSobreSeta(false);
      onTrocarSala?.(outra);
      return;
    }
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
      soltar(emCimaDoBau(e), emCimaDaSeta(e));
      return;
    }
    if (e.target.closest('.inventario, .seta-sala, .poca-cafe')) return; // clique no baú/painel, na seta ou na poça
    const p = arte(e);
    const o = objetoNoPonto(objs, MASCARAS, p.x, p.y);
    if (!o) return; // deixa o clique seguir para o monitor
    e.preventDefault();
    if (presa(o.nome)) {
      // café sendo feito: a cafeteira só mostra o andamento; a caneca não sai da bandeja
      if (o.nome === CAFETEIRA && state.sessao?.cafeDerramado) sfx.erro();
      else if (o.nome === CAFETEIRA) {
        sfx.click();
        onCafeteira?.();
      }
      return;
    }
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
    setSobreSeta(emCimaDaSeta(e));
    setMao((m) => (m ? { ...m, px: p.x, py: p.y, moveu: m.moveu || Math.abs(p.x - m.sx) + Math.abs(p.y - m.sy) > 1.5 } : m));
  };

  const up = (e) => {
    if (!mao?.apertado) return;
    if (mao.modo === 'arraste' && mao.moveu) {
      soltar(emCimaDoBau(e), emCimaDaSeta(e));
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
    const novo = pousar(o.nome, deitar, Math.round(centro - m.w / 2), base - m.h, cena.filter((x) => !acima.has(x.nome)), cen);
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

  // porta-retrato (metadado `foto`): o avatar do jogador aparece na janela da moldura
  const foto = (x, y, meta, classe = '') =>
    meta.foto && (
      <div
        className={`objeto foto-avatar ${classe}`}
        style={{ left: (x + meta.foto.x) * ESCALA, top: (y + meta.foto.y) * ESCALA, width: meta.foto.w * ESCALA, height: meta.foto.h * ESCALA }}
      >
        <Avatar avatar={state.perfil.avatar} tamanho={meta.foto.w * ESCALA} />
      </div>
    );

  return (
    <div
      ref={ref}
      className={`escritorio ${sala === 'sala' ? 'sala-exposicao' : ''} ${mao ? 'arrastando' : sobre ? 'sobre-objeto' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => mao?.modo === 'arraste' && cancelar()}
      onPointerLeave={() => setSobre(null)}
      onWheel={roda}
    >
      <img
        src={sala === 'sala' ? fundoSala : telaAzul ? escritorioTelaAzul : escritorio}
        alt={sala === 'sala' ? 'Sala de exposição: quadro de broches, armário de vidro e prateleiras' : telaAzul ? 'Escritório: o computador travou na tela azul' : 'Escritório: mesa com computador'}
        className="cena pixel"
        draggable={false}
      />
      {sala === 'escritorio' && !telaAzul && <div className="tela-brilho" />}
      {sala === 'escritorio' && <button
        className="monitor-hotspot"
        style={{
          left: pct(MONITOR.x, SCENE_W),
          top: pct(MONITOR.y, SCENE_H),
          width: pct(MONITOR.w, SCENE_W),
          height: pct(MONITOR.h, SCENE_H),
        }}
        onClick={() => {
          if (reiniciando) {
            sfx.erro();
            setAvisoReinicio(Date.now());
            return;
          }
          sfx.click();
          onComputador();
        }}
        disabled={desativado || Boolean(mao)}
        aria-label={reiniciando === 'cafe' ? 'Limpe o café derramado primeiro' : reiniciando ? 'Computador reiniciando' : 'Usar o computador'}
      >
        {novos > 0 && <span className="badge-email">{novos}</span>}
      </button>}
      {objs.map((o) => (
        <span key={o.nome} style={{ display: 'contents' }}>
          <img
            src={sprite(o.nome, o.entrada?.deitado)}
            alt=""
            draggable={false}
            className={`objeto pixel ${sobre === o.nome && !mao ? 'realce' : ''}`}
            style={estilo(o.x, o.y, o.meta, o.dentro ? o.entrada?.angulo : 0)}
          />
          {foto(o.x, o.y, o.meta)}
        </span>
      ))}
      {/* armário da sala: o vidro das portas fica por cima do que está dentro */}
      {sala === 'sala' && <img src={vidroSala} alt="" className="cena pixel vidro-armario" draggable={false} />}
      {/* café: gotas caindo do bico enquanto prepara; vapor saindo da caneca cheia */}
      {(() => {
        const maquina = objs.find((o) => o.nome === CAFETEIRA);
        const caneca = objs.find((o) => o.nome === CANECA);
        const v = metaObjeto(VAPOR), c0 = metaObjeto(CANECA);
        return (
          <>
            {/* café derramado: poça debaixo da cafeteira (clique para limpar) */}
            {state.sessao?.cafeDerramado && maquina && (
              <button
                className={`poca-cafe ${limpeza ? 'limpando' : ''}`}
                style={{ left: (maquina.x + maquina.meta.w / 2) * ESCALA, top: (maquina.y + maquina.meta.h - 3) * ESCALA, '--resta': 1 - progresso }}
                onClick={limpar}
                aria-label={limpeza ? 'Limpando o café' : 'Limpar o café derramado'}
              >
                <span className="poca" />
                <span className="poca-dica">{limpeza ? 'limpando...' : 'clique para limpar'}</span>
                {limpeza && (
                  <span className="poca-barra">
                    <i style={{ width: `${progresso * 100}%` }} />
                  </span>
                )}
              </button>
            )}
            {preparando && maquina && (
              <span className="cafe-gotejando" style={{ left: (maquina.x + 7) * ESCALA, top: (maquina.y + 11) * ESCALA, height: (maquina.meta.bandeja.base - 14 - 11 + 1) * ESCALA }} aria-hidden="true" />
            )}
            {/* (na bandeja, o vapor ficaria por cima da cabeça da cafeteira: só aparece fora dela) */}
            {xicara && caneca && caneca.entrada?.sobre !== CAFETEIRA && (
              <img src={spriteObjeto(VAPOR)} alt="" draggable={false} className="objeto pixel vapor" style={estilo(caneca.x + v.x - c0.x, caneca.y + v.y - c0.y, v)} />
            )}
          </>
        );
      })()}

      {mao && (
        <>
          {/* prévia de onde vai pousar */}
          {!sobreBau && <img src={sprite(mao.nome, mao.deitado)} alt="" draggable={false} className="objeto pixel fantasma" style={estilo(destino.x, destino.y, metaMao)} />}
          {!sobreBau && foto(destino.x, destino.y, metaMao, 'fantasma')}
          {/* canetas dentro do pote na mão: mesma posição e inclinação, desenhadas antes do pote */}
          {naMaoJunto.map((n) => {
            const e = normalizarEntrada(n, posicoes[n]);
            const m = metaDe(n, false);
            // pote: canetas no centro do fundo, inclinadas; cafeteira: caneca na bandeja
            const b = metaMao.bandeja;
            const pos = b ? [noAr.x + b.x, noAr.y + b.base - m.h, 0] : [noAr.x + Math.round((metaMao.w - m.w) / 2), noAr.y + metaMao.fundo - m.h, e.angulo];
            return (
              <img
                key={n}
                src={sprite(n, false)}
                alt=""
                draggable={false}
                className={`objeto pixel levantado ${sobreBau ? 'indo-pro-bau' : ''}`}
                style={estilo(pos[0], pos[1], m, pos[2])}
              />
            );
          })}
          <img
            src={sprite(mao.nome, mao.deitado)}
            alt=""
            draggable={false}
            className={`objeto pixel levantado ${sobreBau ? 'indo-pro-bau' : ''}`}
            style={estilo(noAr.x, noAr.y, metaMao)}
          />
          {!sobreBau && foto(noAr.x, noAr.y, metaMao, 'levantado')}
        </>
      )}

      {/* dica do monitor numa camada própria, depois dos objetos: fica sempre na frente deles.
          Aparece pelo :hover do botão do monitor (seletor de irmão no CSS). */}
      {sala === 'escritorio' && (
        <div className="dica-monitor-camada" aria-hidden="true" style={{ left: pct(MONITOR.x, SCENE_W), top: pct(MONITOR.y, SCENE_H), width: pct(MONITOR.w, SCENE_W) }}>
          {/* primeira partida (tutorial pendente): a dica fica sempre à mostra, piscando */}
          {reiniciando === 'cafe' ? (
            <span key={avisoReinicio} className={`dica-monitor reiniciando fixa ${avisoReinicio ? 'chamando' : ''}`}>limpe o café derramado primeiro</span>
          ) : reiniciando ? (
            <span key={avisoReinicio} className={`dica-monitor reiniciando ${avisoReinicio ? 'chamando' : ''}`}>{reiniciando === 'energia' ? 'sem energia' : 'sistema reiniciando'} · {state.sessao?.bloqueio?.falta ?? 0} s</span>
          ) : (
            <span className={`dica-monitor ${chamarComputador ? 'chamando' : ''}`}>{chamarComputador ? 'clique para começar' : 'clique para usar'}</span>
          )}
        </div>
      )}

      {/* seta para a outra sala (direita no escritório, esquerda na sala); com um objeto na mão,
          soltar em cima dela leva o objeto junto */}
      <button
        ref={setaRef}
        className={`seta-sala ${sala === 'sala' ? 'esquerda' : 'direita'} ${mao ? 'alvo' : ''} ${sobreSeta ? 'brilho' : ''}`}
        onClick={() => {
          if (mao) return;
          sfx.click();
          onTrocarSala?.(outra);
        }}
        disabled={desativado}
        aria-label={`Ir para: ${NOME_SALA[outra]}`}
        title={mao ? `Soltar aqui leva para: ${NOME_SALA[outra]}` : NOME_SALA[outra]}
      >
        {sala === 'sala' ? '◀' : '▶'}
      </button>
      {mao && sobreSeta && <span className={`seta-dica ${sala === 'sala' ? 'esquerda' : 'direita'}`} role="tooltip">levar para: {NOME_SALA[outra].toLowerCase()}</span>}

      {/* toca-fitas, papel, cafeteira e caneca cheia: dica ao passar o mouse */}
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
                          <img src={sprite(nome, false)} alt="" className="pixel" draggable={false} style={{ width: m.w * k, height: m.h * k }} />
                        </span>
                        <span className="nome">{nomeNoInventario(nome)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="dica">clique num item para pegar · clique na sala para soltar</p>
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
