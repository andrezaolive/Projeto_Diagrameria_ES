import { describe, expect, it } from 'vitest';
import OBJETOS from '../art/objetos.json';
import { SALA } from '../art/layout.js';
import { CONQUISTAS, objetoDaConquista, vaiNoQuadro } from '../art/conquistas.js';
import { REGRAS, desbloquear, naSala, progressoDe } from './conquistas.js';
import { salaDe } from './decoracao.js';
import { objetosPresentes } from '../data/loja.js';
import { estadoInicial, reducer } from '../state/reducer.js';
import { chegarAgora } from '../state/testeAjuda.js';

const dentroDoQuadro = (p, nome) => {
  const q = SALA.quadro, m = OBJETOS[nome];
  return p.x >= q.x && p.y >= q.y && p.x + m.w <= q.x + q.w && p.y + m.h <= q.y + q.h;
};

// começa uma partida do modo infinito e entrega o primeiro pedido com a nota dada
function entregar(s, nota, extra = {}) {
  if (!s.sessao) s = reducer(s, { type: 'INICIAR_SESSAO', modo: 'infinito' }); // sempre chega outro pedido
  const p = s.sessao.pedidos.find((x) => x.status === 'novo');
  s = reducer(s, { type: 'ACEITAR', id: p.id });
  return chegarAgora(reducer(s, { type: 'ENTREGAR', id: p.id, nota, valor: 50, erros: {}, ...extra }));
}

describe('conquistas', () => {
  it('cada conquista tem regra, prêmio (objeto da sala) e o tipo de prêmio certo para a raridade', () => {
    for (const cq of CONQUISTAS) {
      expect(REGRAS[cq.id], cq.id).toBeTruthy();
      const meta = OBJETOS[objetoDaConquista(cq.id)];
      expect(meta, cq.id).toBeTruthy();
      expect(meta.sala).toBe('sala');
      // broches/medalhas agem como itens de parede; troféus, como itens de mesa
      expect(meta.zona).toBe(vaiNoQuadro(cq) ? 'parede' : 'mesa');
      if (cq.raridade === 'bronze' || cq.raridade === 'prata') expect(cq.forma).toBe('broche');
      if (cq.raridade === 'esforco') expect(cq.forma).toBe('trofeu');
    }
  });

  it('troféus maiores para conquistas mais difíceis', () => {
    const h = (t) => OBJETOS[objetoDaConquista(CONQUISTAS.find((c) => c.tamanho === t).id)].h;
    expect(h('p')).toBeLessThan(h('m'));
    expect(h('m')).toBeLessThan(h('g'));
    expect(h('g')).toBeLessThan(h('gg'));
    expect(h('gg')).toBeLessThan(h('mestre'));
  });

  it('entregar com 100% desbloqueia e põe os broches no quadro, com aviso', () => {
    const s = entregar(estadoInicial(), 100);
    expect(s.conquistas['primeiro-pedido']).toBeTruthy();
    expect(s.conquistas.carimbo).toBeTruthy();
    for (const id of ['primeiro-pedido', 'carimbo']) {
      const nome = objetoDaConquista(id);
      const p = s.escritorio.posicoes[nome];
      expect(p.sala).toBe('sala');
      expect(dentroDoQuadro(p, nome)).toBe(true);
      expect(objetosPresentes(s)).toContain(nome);
      expect(salaDe(nome, s.escritorio.posicoes)).toBe('sala');
    }
    expect(s.avisosConquista.map((a) => a.id)).toEqual(expect.arrayContaining(['primeiro-pedido', 'carimbo']));
    expect(s.avisosConquista.every((a) => !a.noBau)).toBe(true);
    // os dois broches não se sobrepõem
    const [a, b] = ['primeiro-pedido', 'carimbo'].map(objetoDaConquista);
    const pa = s.escritorio.posicoes[a], pb = s.escritorio.posicoes[b];
    const sobrepoe = pa.x < pb.x + OBJETOS[b].w && pa.x + OBJETOS[a].w > pb.x && pa.y < pb.y + OBJETOS[b].h && pa.y + OBJETOS[a].h > pb.y;
    expect(sobrepoe).toBe(false);
    // o aviso sai da fila depois de mostrado
    const visto = reducer(s, { type: 'CONQUISTA_VISTA' });
    expect(visto.avisosConquista.length).toBe(s.avisosConquista.length - 1);
  });

  it('quadro lotado: o broche vai direto para o baú e o aviso diz isso', () => {
    let s = estadoInicial();
    const broches = CONQUISTAS.filter(vaiNoQuadro).map((c) => c.id);
    s = desbloquear(s, broches);
    const noBau = s.avisosConquista.filter((a) => a.noBau);
    expect(noBau.length).toBeGreaterThan(0); // são mais broches do que vagas
    for (const a of noBau) {
      expect(s.escritorio.guardados).toContain(objetoDaConquista(a.id));
      expect(s.escritorio.posicoes[objetoDaConquista(a.id)]).toBeUndefined();
    }
    // os que couberam estão todos dentro do quadro
    for (const a of s.avisosConquista.filter((x) => !x.noBau)) expect(dentroDoQuadro(s.escritorio.posicoes[objetoDaConquista(a.id)], objetoDaConquista(a.id))).toBe(true);
    // tirar do baú e guardar de novo funciona como os outros objetos
    const nome = objetoDaConquista(noBau[0].id);
    const fora = reducer(s, { type: 'RETIRAR_OBJETO', objeto: nome });
    expect(fora.escritorio.guardados).not.toContain(nome);
  });

  it('troféu vai para uma prateleira (primeiro o armário de vidro) e cabe embaixo do que está acima', () => {
    const s = desbloquear(estadoInicial(), ['semana-dourada']);
    const p = s.escritorio.posicoes[objetoDaConquista('semana-dourada')];
    expect(p).toMatchObject({ sala: 'sala', sobre: 'armario-cima' });
    // o troféu gigante não cabe no armário: vai para uma prateleira mais alta
    const m = desbloquear(estadoInicial(), ['mestre']);
    const pm = m.escritorio.posicoes[objetoDaConquista('mestre')];
    expect(pm.sobre).toBeTruthy();
    const nome = objetoDaConquista('mestre');
    const prat = SALA.prateleiras[pm.sobre];
    const teto = SALA.tetos[pm.sobre] ?? 0;
    expect(prat.y - OBJETOS[nome].h).toBeGreaterThanOrEqual(teto);
  });

  it('sequência interrompida volta a zero (barra de progresso)', () => {
    let s = entregar(estadoInicial(), 100);
    expect(s.marcos.seqCem).toBe(1);
    s = entregar(s, 100);
    expect(progressoDe(s, CONQUISTAS.find((c) => c.id === 'sequencia-perfeita'))).toEqual({ atual: 2, meta: 5 });
    s = entregar(s, 80);
    expect(s.marcos.seqCem).toBe(0);
  });

  it('visitar a sala, beber café e mudar o avatar contam', () => {
    let s = reducer(estadoInicial(), { type: 'VISITAR_SALA' });
    expect(s.conquistas['abra-a-porta']).toBeTruthy();
    s = { ...s, cafe: { ...s.cafe, xicara: 'forte' } };
    s = reducer(s, { type: 'BEBER_CAFE' });
    expect(s.conquistas.cafezinho).toBeTruthy();
    expect(s.marcos.tiposCafe).toEqual(['forte']);
    // criar o perfil (tela de nome do save novo) não conta; mudar o avatar depois, sim
    s = reducer(s, { type: 'DEFINIR_PERFIL', nome: 'Ana', avatar: { cabelo: 2 } });
    expect(s.conquistas['foto-de-familia']).toBeFalsy();
    s = reducer(s, { type: 'DEFINIR_PERFIL', avatar: { cabelo: 2 } });
    expect(s.conquistas['foto-de-familia']).toBeFalsy(); // mesmo avatar
    s = reducer(s, { type: 'DEFINIR_PERFIL', avatar: { cabelo: 3 } });
    expect(s.conquistas['foto-de-familia']).toBeTruthy();
  });

  it('o dia 1 jogado com 100% não libera conquistas demais', () => {
    let s = reducer(estadoInicial(), { type: 'DEFINIR_PERFIL', nome: 'Ana', avatar: { cabelo: 1 } });
    s = reducer(s, { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1, semente: 0.3 });
    s = reducer(s, { type: 'DEBUG_TERMINAR_DIA', nota: 100, sorteio: 0.5 });
    expect(Object.keys(s.conquistas).sort()).toEqual(['carimbo', 'primeiro-expediente', 'primeiro-pedido']);
  });

  it('nada muda nas ações que não mexem em nada', () => {
    const s = estadoInicial();
    expect(reducer(s, { type: 'ACAO_QUE_NAO_EXISTE' })).toBe(s);
  });

  it('arrumar devolve os prêmios ao quadro e às prateleiras', () => {
    let s = desbloquear(estadoInicial(), ['carimbo', 'semana-dourada']);
    s = reducer(s, { type: 'ARRUMAR_ESCRITORIO' });
    expect(dentroDoQuadro(s.escritorio.posicoes[objetoDaConquista('carimbo')], objetoDaConquista('carimbo'))).toBe(true);
    expect(s.escritorio.posicoes[objetoDaConquista('semana-dourada')].sobre).toBe('armario-cima');
  });

  it('o mestre vem depois de todas as outras', () => {
    const outras = CONQUISTAS.filter((c) => c.id !== 'mestre').map((c) => c.id);
    let s = desbloquear(estadoInicial(), outras.slice(1));
    s = reducer(s, { type: 'VISITAR_SALA' });
    expect(s.conquistas.mestre).toBeFalsy();
    s = desbloquear(s, [outras[0]]);
    s = reducer(s, { type: 'VISITAR_SALA' });
    expect(s.conquistas.mestre).toBeTruthy();
  });
});

describe('Museu Particular', () => {
  it('conta itens na sala sem os prêmios, e item de várias peças conta uma vez', () => {
    let s = estadoInicial();
    const base = naSala(s);
    // um prêmio de conquista na sala não conta
    s = desbloquear(s, ['decorador']);
    expect(naSala(s)).toBe(base);
    // a pilha de livros (4 peças) levada para a sala conta como 1
    const livros = ['pilha-azul', 'pilha-rosa', 'pilha-menta', 'pilha-amarelo'];
    const posicoes = { ...s.escritorio.posicoes };
    for (const n of livros) posicoes[n] = { sala: 'sala', x: 40, sobre: 'p-baixo' };
    s = { ...s, loja: { ...s.loja, possui: [...s.loja.possui, 'obj-livros'], moveis: [...s.loja.moveis, 'obj-livros'] }, escritorio: { ...s.escritorio, posicoes } };
    expect(livros.every((n) => salaDe(n, s.escritorio.posicoes) === 'sala')).toBe(true);
    expect(naSala(s)).toBe(base + 1);
  });
});

describe('Clode e conquistas', () => {
  it('100% com o Clode não dá o Carimbo de Qualidade (sem o Clode, dá)', () => {
    const entregar100 = (comClode) => {
      let s = reducer({ ...estadoInicial(), dinheiro: 5000 }, { type: 'INICIAR_SESSAO', modo: 'infinito' });
      const p = s.sessao.pedidos[0];
      s = reducer(s, { type: 'ACEITAR', id: p.id });
      if (comClode) s = reducer(s, { type: 'USAR_CLODE', id: p.id, chave: 'pedido:' + p.id, n: 1 });
      return reducer(s, { type: 'ENTREGAR', id: p.id, nota: 100, valor: 10, erros: {} });
    };
    expect(entregar100(true).conquistas?.carimbo).toBeFalsy();
    expect(entregar100(false).conquistas?.carimbo).toBeTruthy();
  });
});
