import { describe, expect, it } from 'vitest';
import { avaliarMembros, lerMembro, linhas, medidasClasse } from './membros.js';
import { avaliar, calcularNota } from './avaliacao.js';
import { gerarFeedback } from './feedback.js';
import { sobrepoe, tamanho } from './grid.js';
import { MODELOS, modeloPorId } from '../data/pedidos.js';

const copia = (d) => JSON.parse(JSON.stringify(d));
const NOVOS = ['conta-bancaria', 'emprestimo', 'locadora', 'comanda', 'casa', 'curso-online'];
const classeDe = (d, nome) => d.nodes.find((n) => n.rotulo === nome);

describe('membros da classe', () => {
  it('lê visibilidade, nome e tipo de atributos e métodos', () => {
    expect(lerMembro('- saldo: float')).toMatchObject({ visibilidade: '-', nome: 'saldo', tipo: 'float' });
    expect(lerMembro('+ sacar(valor: float): bool')).toMatchObject({ visibilidade: '+', nome: 'sacar', tipo: 'bool' });
    expect(lerMembro('+ alugar()')).toMatchObject({ nome: 'alugar', tipo: '' });
    expect(lerMembro('nome')).toMatchObject({ visibilidade: '', nome: 'nome', tipo: '' });
    expect(linhas('  - a: int\n\n+ b()  \n')).toEqual(['- a: int', '+ b()']);
  });

  it('caixa vazia continua 160x100; cresce com membros, sempre no grid', () => {
    expect(medidasClasse({ rotulo: 'Classe' })).toMatchObject({ w: 160, h: 100 });
    const c = { tipo: 'classe', rotulo: 'ContaBancaria', atributos: ['- a: int', '- b: int', '- c: int'], metodos: ['+ depositar(valor: float)', '+ x()'] };
    const t = tamanho(c);
    expect(t.h).toBeGreaterThan(100);
    expect(t.w).toBeGreaterThan(160);
    expect([t.w % 20, t.h % 20]).toEqual([0, 0]);
  });

  it('pedidos novos: membros no e-mail, nota 100 com o gabarito, classes sem se sobrepor', () => {
    for (const id of NOVOS) {
      const m = modeloPorId(id);
      const texto = m.corpo.join(' ');
      const classes = m.esperado.nodes.filter((n) => n.tipo === 'classe');
      for (const k of classes) for (const mb of [...k.atributos, ...k.metodos]) expect(texto, `${id}: ${mb}`).toContain(`"${mb}"`);
      for (let i = 0; i < classes.length; i++) for (let j = i + 1; j < classes.length; j++) expect(sobrepoe(classes[i], classes[j]), id).toBe(false);
      expect(avaliar(copia(m.esperado), m.esperado), id).toMatchObject({ nota: 100, membros: 1 });
    }
  });

  it('ligações nascem dos membros: atributo de outra classe = associação; só parâmetro = dependência', () => {
    for (const id of NOVOS) {
      const { nodes, edges } = modeloPorId(id).esperado;
      const nomes = nodes.map((n) => n.rotulo);
      const ligadas = (a, b) => edges.some((e) => [e.de, e.para].sort().join() === [a.id, b.id].sort().join());
      for (const k of nodes)
        for (const t of [...k.atributos, ...k.metodos].map(lerMembro).flatMap((x) => [x.tipo, ...(x.texto.match(/:\s*(\w+)/g) ?? []).map((s) => s.replace(/:\s*/, ''))]))
          if (nomes.includes(t) && t !== k.rotulo) expect(ligadas(k, nodes.find((n) => n.rotulo === t)), `${id}: ${k.rotulo} → ${t}`).toBe(true);
    }
    const loc = modeloPorId('locadora').esperado;
    expect(loc.edges[0]).toMatchObject({ tipo: 'dependencia', de: 'k2', para: 'k1' });
  });

  it('membro faltando zera, tipo errado vale metade, e o feedback explica', () => {
    const esp = modeloPorId('conta-bancaria').esperado;
    const jog = copia(esp);
    const conta = classeDe(jog, 'ContaBancaria');
    conta.atributos = conta.atributos.filter((a) => !a.includes('saldo'));
    conta.metodos = conta.metodos.map((m) => m.replace('): bool', '): int'));
    expect(avaliarMembros(jog, esp)).toBeCloseTo((8 - 1 - 0.5) / 8); // 8 membros: 1 faltando, 1 com tipo errado
    const fb = gerarFeedback(jog, esp);
    expect(fb.problemas.map((p) => p.tipo).sort()).toEqual(['membroFaltando', 'membroTipo']);
    expect(fb.conceitos).toEqual(expect.arrayContaining(['atributo', 'metodo']));
  });

  it('membro na classe errada é apontado', () => {
    const esp = modeloPorId('casa').esperado;
    const jog = copia(esp);
    const casa = classeDe(jog, 'Casa');
    const comodo = classeDe(jog, 'Comodo');
    comodo.metodos = ['+ calcularArea(): float'];
    casa.metodos = casa.metodos.filter((m) => !m.includes('calcularArea'));
    expect(gerarFeedback(jog, esp).problemas).toEqual([expect.objectContaining({ tipo: 'membroNoLugarErrado', classe: 'Casa', outra: 'Comodo' })]);
  });

  it('pedidos antigos de classes não cobram membros; pesos da nota', () => {
    expect(avaliar(copia(modeloPorId('petshop').esperado), modeloPorId('petshop').esperado).membros).toBeNull();
    const cheio = { estrutura: 1, rotulos: 1, relacoes: 1 };
    expect(calcularNota({ ...cheio, membros: 0 })).toBe(70);
    expect(calcularNota({ ...cheio, multiplicidades: 0 })).toBe(85);
    expect(calcularNota({ estrutura: 1, rotulos: 0, relacoes: 0 })).toBe(40);
    expect(MODELOS.filter((m) => m.esperado.nodes.some((n) => n.atributos?.length)).map((m) => m.id).sort()).toEqual([...NOVOS].sort());
  });
});
