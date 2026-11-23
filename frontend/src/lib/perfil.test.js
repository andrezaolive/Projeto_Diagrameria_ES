import { describe, expect, it } from 'vitest';
import { partesComAspas } from '../components/TextoPedido.jsx';
import { DIAS_CAMPANHA, MAX_HISTORICO, NIVEIS_INTERFACE, estadoInicial, migrar, reducer } from '../state/reducer.js';
import { reacaoMascote } from './mascote.js';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CABELOS, CORES_CHAVE, ITENS_AVATAR, OPCOES_AVATAR, TAM_AVATAR, alternar, avatarPadrao, camadasExportaveis, gradeDaCamada, montarAvatar, opcoesDoJogador, temOpcao } from './avatar.js';
import { ITENS_LOJA } from '../data/loja.js';
import { PALETTE } from '../art/palette.js';
import { criarServicoContas } from './conta.js';
import { resumoEstatisticas } from './estatisticas.js';
import { criarPedido } from '../data/pedidos.js';
import { chegarAgora } from '../state/testeAjuda.js';

const rodar = (state, ...acoes) => acoes.reduce(reducer, state);

describe('reação do mascote', () => {
  it.each([
    [0, 'espatifado'],
    [1, 'triste'],
    [29, 'triste'],
    [30, 'neutro'],
    [59, 'neutro'],
    [60, 'feliz'],
    [84, 'feliz'],
    [85, 'comemorando'],
    [100, 'comemorando'],
  ])('nota %i -> %s', (nota, esperado) => expect(reacaoMascote(nota)).toBe(esperado));
});

describe('avatar', () => {
  it('monta uma grade 32x32 para todas as combinações de cabelo e pele', () => {
    for (const cabelo of OPCOES_AVATAR.cabelo)
      for (const pele of OPCOES_AVATAR.pele) {
        const g = montarAvatar({ ...avatarPadrao(), cabelo, pele });
        expect(g).toHaveLength(TAM_AVATAR);
        expect(g.every((l) => l.length === TAM_AVATAR)).toBe(true);
      }
  });

  it('tem cabelos masculinos e femininos', () => {
    expect(CABELOS.some((c) => c.grupo === 'masc')).toBe(true);
    expect(CABELOS.some((c) => c.grupo === 'fem')).toBe(true);
  });

  it('monta todas as roupas e acessórios', () => {
    for (const modeloRoupa of OPCOES_AVATAR.modeloRoupa)
      for (const acessorio of OPCOES_AVATAR.acessorio) expect(montarAvatar({ ...avatarPadrao(), modeloRoupa, acessorio })).toHaveLength(TAM_AVATAR);
  });

  it('cabelos, roupas e acessórios novos estão à venda na aba Avatar; os de sempre continuam de graça', () => {
    expect(ITENS_AVATAR.length).toBeGreaterThanOrEqual(15);
    for (const i of ITENS_AVATAR) expect(ITENS_LOJA).toContainEqual(i);
    const inicio = opcoesDoJogador([]);
    expect(inicio.cabelo).toContain('cacheado');
    expect(inicio.cabelo).not.toContain('moicano');
    expect(inicio.modeloRoupa).toEqual(['camiseta']);
    expect(inicio.acessorio).toEqual(['nenhum']);
    expect(temOpcao(['avatar-acessorio-oculos'], 'acessorio', 'oculos')).toBe(true);
    // o padrão nunca é uma parte à venda
    for (const [campo, valor] of Object.entries(avatarPadrao())) expect(temOpcao([], campo, valor)).toBe(true);
  });

  it('toda camada editável tem o seu PNG em assets/avatar', () => {
    const pasta = fileURLToPath(new URL('../assets/avatar/', import.meta.url));
    for (const { chave } of camadasExportaveis()) expect(existsSync(`${pasta}${chave}.png`), chave).toBe(true);
  });

  it('o PNG (sprites) substitui a camada do código e as cores-chave viram a escolha do jogador', () => {
    const chave = 'acessorios/laco';
    const grade = gradeDaCamada(chave).map((l) => l.slice());
    grade[0][0] = PALETTE.mint; // pixel "editado"
    const g = montarAvatar({ ...avatarPadrao(), acessorio: 'laco' }, { [chave]: grade });
    expect(g[0][0]).toBe(PALETTE.mint);
    // cabelo de referência (plum) pintado com a cor escolhida
    const loiro = montarAvatar({ ...avatarPadrao(), corCabelo: 'butter' });
    expect(loiro.flat()).toContain(PALETTE.butter);
    expect(gradeDaCamada('cabelos/curto-frente').flat()).toContain(CORES_CHAVE.H);
  });

  it('alternar dá a volta na lista', () => {
    const a = { ...avatarPadrao(), olhos: OPCOES_AVATAR.olhos[0] };
    expect(alternar(a, 'olhos', -1).olhos).toBe(OPCOES_AVATAR.olhos.at(-1));
    expect(alternar(alternar(a, 'olhos', 1), 'olhos', -1).olhos).toBe(a.olhos);
  });
});

describe('perfil e estatísticas', () => {
  it('jogo novo começa sem nome (pede o nome na primeira vez)', () => {
    expect(estadoInicial().perfil.nome).toBeNull();
  });

  it('define nome e avatar; ignora nome vazio', () => {
    let s = rodar(estadoInicial(), { type: 'DEFINIR_PERFIL', nome: '  Ana  ', avatar: { cabelo: 'longo' } });
    expect(s.perfil.nome).toBe('Ana');
    expect(s.perfil.avatar.cabelo).toBe('longo');
    s = rodar(s, { type: 'DEFINIR_PERFIL', nome: '   ' });
    expect(s.perfil.nome).toBe('Ana');
  });

  it('conta jogos, entregas, notas e recusas', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    const [a, b] = s.sessao.pedidos;
    s = rodar(s, { type: 'ACEITAR', id: a.id }, { type: 'ENTREGAR', id: a.id, nota: 90, valor: 40 }, { type: 'RECUSAR', id: b.id });
    expect(s.estatisticas).toMatchObject({ jogos: 1, entregues: 1, recusados: 1, somaNotas: 90, melhorNota: 90, excelentes: 1, ganhoTotal: 40 });
    const resumo = Object.fromEntries(resumoEstatisticas(s).map((x) => [x.rotulo, x.valor]));
    expect(resumo['Média de acerto']).toBe('90%');
    expect(resumo['Coleção']).toMatch(/^1\//);
  });

  it('resetar volta ao estado inicial', () => {
    const s = rodar(estadoInicial(), { type: 'DEFINIR_PERFIL', nome: 'Bia' }, { type: 'ENTRAR_CONTA', email: 'a@b.co' }, { type: 'RESETAR' });
    expect(s).toEqual(estadoInicial());
  });

  it('save antigo ganha perfil e estatísticas', () => {
    const { perfil, estatisticas, ...antigo } = estadoInicial();
    const s = migrar(antigo);
    expect(s.perfil.avatar).toEqual(avatarPadrao());
    expect(s.estatisticas.jogos).toBe(0);
  });
});

function memoria() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

describe('contas', () => {
  it('registra, entra, guarda progresso e altera e-mail/senha', async () => {
    const c = criarServicoContas(memoria());
    const email = await c.registrar('Ana@Email.com', 'segredo1', { dinheiro: 5 });
    expect(email).toBe('ana@email.com');
    await expect(c.registrar('ana@email.com', 'outra123', {})).rejects.toThrow(/existe/);
    await expect(c.entrar('ana@email.com', 'errada')).rejects.toThrow(/incorretos/);
    c.salvarProgresso(email, { dinheiro: 99 });
    expect(await c.entrar('ana@email.com', 'segredo1')).toEqual({ dinheiro: 99 });

    const novo = await c.alterar(email, 'segredo1', { email: 'bia@email.com', senha: 'nova1234' });
    expect(novo).toBe('bia@email.com');
    await expect(c.entrar('ana@email.com', 'segredo1')).rejects.toThrow();
    expect(await c.entrar('bia@email.com', 'nova1234')).toEqual({ dinheiro: 99 });
  });

  it('valida e-mail e senha', async () => {
    const c = criarServicoContas(memoria());
    await expect(c.registrar('nao-e-email', 'segredo1')).rejects.toThrow(/E-mail/);
    await expect(c.registrar('a@b.co', '123')).rejects.toThrow(/6/);
  });
});

describe('gráficos das estatísticas e nível da interface', () => {
  it('guarda histórico limitado e jogos por modo', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'infinito' });
    for (let i = 0; i < MAX_HISTORICO + 5; i++) {
      const id = s.sessao.pedidos.find((p) => p.status === 'novo').id;
      s = chegarAgora(rodar(s, { type: 'ACEITAR', id }, { type: 'ENTREGAR', id, nota: i % 101, valor: 1 }));
    }
    expect(s.estatisticas.historico).toHaveLength(MAX_HISTORICO);
    expect(s.estatisticas.historico.at(-1).nota).toBe((MAX_HISTORICO + 4) % 101);
    expect(s.estatisticas.jogosPorModo).toEqual({ campanha: 0, infinito: 1 });
  });

  it('toda estatística tem um gráfico ou explica por que está vazio', () => {
    const vazio = resumoEstatisticas(estadoInicial());
    for (const it of vazio) expect(it.grafico.tipo === 'dias' || typeof it.vazio === 'string').toBe(true);
    const cal = vazio.find((i) => i.id === 'calendario').grafico;
    expect(cal.dias).toHaveLength(DIAS_CAMPANHA);
  });

  it('estatísticas úteis: pior tipo de diagrama, erro mais comum, prazo, gastos e dicas', () => {
    let s = rodar(estadoInicial(), { type: 'INICIAR_SESSAO', modo: 'campanha', dia: 1 });
    const ped = (modelo) => ({ ...criarPedido(modelo, 50, 1), id: `t-${modelo}`, status: 'aceito', tempoRestante: 100 });
    // um de casos de uso (90), um de estados (40, atrasado, com dica e dois erros)
    const casos = ped('cinema');
    const estados = { ...ped('catraca'), tempoRestante: 0, atraso: 20, pedacos: [0] };
    s = { ...s, dinheiro: 1000, sessao: { ...s.sessao, pedidos: [...s.sessao.pedidos, casos, estados] } };
    s = rodar(
      s,
      { type: 'ENTREGAR', id: casos.id, nota: 90, valor: 100 },
      { type: 'ENTREGAR', id: estados.id, nota: 40, valor: 30, atrasado: true, erros: { eventoErrado: 2, faltando: 1 } },
      { type: 'COMPRAR', id: 'obj-vela', preco: 130 },
    );
    const r = Object.fromEntries(resumoEstatisticas(s).map((x) => [x.id, x]));
    expect(r.tipos.valor).toBe('Estados (40%)');
    expect(r.erros.valor).toBe('Evento');
    expect(r.erros.dica).toContain('evento');
    expect(r.prazo.grafico.barras.slice(0, 2).map((b) => b.valor)).toEqual([1, 1]);
    expect(r.lucro.grafico.barras.find((b) => b.rotulo === 'Loja').valor).toBe(130);
    expect(r.dicas.grafico.barras.map((b) => b.valor)).toEqual([40, 90]); // com dica 40%, sem dica 90%
    expect(r.tempo.valor).not.toBe('—');
    for (const it of Object.values(r)) expect(typeof it.dica === 'string' || it.dica == null).toBe(true);
  });

  it('save antigo com interface numérica vira "auto"', () => {
    expect(migrar({ config: { musica: 10, efeitos: 20, interface: 70 } }).config).toEqual({ musica: 10, efeitos: 20, interface: 'auto', vhsAtivo: false, vhsIntensidade: 50, nomesNegrito: false });
    expect(migrar({ config: { interface: 'grande' } }).config.interface).toBe('grande');
    expect(NIVEIS_INTERFACE).toEqual(['reduzido', 'auto', 'grande']);
  });
});

describe('nomes dos pedidos em negrito', () => {
  it('separa o que está entre aspas (índices ímpares)', () => {
    expect(partesComAspas('O "Leitor" usa o sistema para "Pegar livro".')).toEqual(['O ', 'Leitor', ' usa o sistema para ', 'Pegar livro', '.']);
    expect(partesComAspas('sem aspas')).toEqual(['sem aspas']);
  });
});
