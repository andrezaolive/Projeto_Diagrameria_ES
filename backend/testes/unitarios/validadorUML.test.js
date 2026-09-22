const fs = require('fs');
const path = require('path');
const { compararDiagramas } = require('../../src/dominio/diagrama');
const { calcularNota } = require('../../src/dominio/jogo/pontuacao');
const { pesosPorFase } = require('../../src/dominio/jogo/regras');

const DIR_EXEMPLOS = path.resolve(__dirname, '..', '..', 'docs', 'schemas', 'exemplos');
const exemplo = (nome) =>
  JSON.parse(fs.readFileSync(path.join(DIR_EXEMPLOS, `${nome}.json`), 'utf8'));

/** Copia profunda: cada teste altera o seu diagrama sem afetar os outros. */
const copia = (valor) => JSON.parse(JSON.stringify(valor));

const PESOS = pesosPorFase(1);
const notaDe = (esperado, entregue) =>
  calcularNota(compararDiagramas(esperado, entregue), PESOS).nota;

const GABARITO = exemplo('pedido-item');

describe('ValidadorUML — o que nao deve mudar a nota', () => {
  const exemplos = fs.readdirSync(DIR_EXEMPLOS).filter((a) => a.endsWith('.json'));

  it.each(exemplos)('%s comparado com ele mesmo tira nota 1', (arquivo) => {
    const diagrama = exemplo(arquivo.replace('.json', ''));
    expect(notaDe(diagrama, copia(diagrama))).toBe(1);
  });

  it('ignora ids, posicao e rotulo (RF25)', () => {
    const entregue = copia(GABARITO);
    entregue.classes[0].id = 'outro-id';
    entregue.relacionamentos[0].origem = 'outro-id';
    entregue.classes[0].posicao = { x: 9999, y: -50 };
    delete entregue.classes[1].posicao;
    entregue.relacionamentos[0].rotulo = 'qualquer coisa';

    expect(notaDe(GABARITO, entregue)).toBe(1);
  });

  it('ignora a ordem das classes, atributos e metodos', () => {
    const entregue = copia(GABARITO);
    entregue.classes.reverse();
    entregue.classes.forEach((classe) => {
      classe.atributos.reverse();
      classe.metodos.reverse();
    });

    expect(notaDe(GABARITO, entregue)).toBe(1);
  });

  it('casa nomes sem diferenca de caixa, acento ou espaco nas pontas', () => {
    const gabarito = copia(GABARITO);
    gabarito.classes[1].nome = 'Ítem';

    const entregue = copia(GABARITO);
    entregue.classes[0].nome = 'pedido';
    entregue.classes[1].nome = 'ITEM';

    expect(notaDe(gabarito, entregue)).toBe(1);
  });

  it('trata "*" como "0..*"', () => {
    const gabarito = copia(GABARITO);
    gabarito.relacionamentos[0].multiplicidadeDestino = '0..*';
    const entregue = copia(gabarito);
    entregue.relacionamentos[0].multiplicidadeDestino = '*';

    expect(notaDe(gabarito, entregue)).toBe(1);
  });

  it('aceita associacao desenhada ao contrario, trocando as multiplicidades junto', () => {
    const gabarito = copia(GABARITO);
    Object.assign(gabarito.relacionamentos[0], { tipo: 'associacao' });

    const entregue = copia(gabarito);
    Object.assign(entregue.relacionamentos[0], {
      origem: 'c2',
      destino: 'c1',
      multiplicidadeOrigem: '1..*',
      multiplicidadeDestino: '1',
    });

    expect(notaDe(gabarito, entregue)).toBe(1);
  });
});

describe('ValidadorUML — o que o diff aponta', () => {
  it('classe faltando: perde a classe e tudo que estava dentro dela', () => {
    const entregue = copia(GABARITO);
    entregue.classes = entregue.classes.filter((classe) => classe.nome !== 'Item');
    entregue.relacionamentos = [];

    const diff = compararDiagramas(GABARITO, entregue);

    expect(diff.classes.faltando).toEqual(['Item']);
    expect(diff.atributos.faltando).toHaveLength(3);
    expect(diff.metodos.faltando).toEqual([{ classe: 'Item', nome: 'subtotal' }]);
    expect(diff.relacionamentos.faltando).toEqual([
      { tipo: 'composicao', origem: 'Pedido', destino: 'Item' },
    ]);
    // As pontas do relacionamento que faltou continuam no maximo possivel.
    expect(diff.multiplicidades.semRelacionamento).toHaveLength(2);
  });

  it('classe inventada entra como extra e desconta', () => {
    const entregue = copia(GABARITO);
    entregue.classes.push({ id: 'c9', nome: 'Garcom' });

    const diff = compararDiagramas(GABARITO, entregue);
    const { nota, desconto } = calcularNota(diff, PESOS);

    expect(diff.classes.extras).toEqual(['Garcom']);
    expect(desconto).toBe(PESOS.classe);
    expect(nota).toBeLessThan(1);
  });

  it('desenhar "de tudo" nao tira nota maxima', () => {
    const entregue = copia(GABARITO);
    for (let i = 0; i < 10; i += 1) entregue.classes.push({ id: `x${i}`, nome: `Extra${i}` });

    expect(notaDe(GABARITO, entregue)).toBe(0);
  });

  it('heranca invertida aparece como invertida, nao como faltando mais extra', () => {
    const gabarito = {
      versao: '1.0',
      classes: [
        { id: 'a', nome: 'Animal', estereotipo: 'abstrata' },
        { id: 'c', nome: 'Cachorro' },
      ],
      relacionamentos: [{ tipo: 'heranca', origem: 'c', destino: 'a' }],
    };
    const entregue = copia(gabarito);
    entregue.relacionamentos[0] = { tipo: 'heranca', origem: 'a', destino: 'c' };

    const diff = compararDiagramas(gabarito, entregue);

    expect(diff.relacionamentos.invertidos).toEqual([
      {
        esperado: { tipo: 'heranca', origem: 'Cachorro', destino: 'Animal' },
        entregue: { tipo: 'heranca', origem: 'Animal', destino: 'Cachorro' },
      },
    ]);
    expect(diff.relacionamentos.faltando).toEqual([]);
    expect(diff.relacionamentos.extras).toEqual([]);
  });

  it('tipo errado entre as classes certas', () => {
    const entregue = copia(GABARITO);
    entregue.relacionamentos[0].tipo = 'associacao';

    const diff = compararDiagramas(GABARITO, entregue);

    expect(diff.relacionamentos.tipoErrado).toEqual([
      {
        esperado: { tipo: 'composicao', origem: 'Pedido', destino: 'Item' },
        entregue: { tipo: 'associacao', origem: 'Pedido', destino: 'Item' },
      },
    ]);
    expect(diff.relacionamentos.extras).toEqual([]);
  });

  it('exato ganha de invertido quando os dois existem', () => {
    const gabarito = {
      versao: '1.0',
      classes: [
        { id: 'a', nome: 'A' },
        { id: 'b', nome: 'B' },
      ],
      relacionamentos: [{ tipo: 'dependencia', origem: 'a', destino: 'b' }],
    };
    const entregue = copia(gabarito);
    // O invertido vem primeiro na lista: um pareamento guloso casaria errado.
    entregue.relacionamentos = [
      { tipo: 'dependencia', origem: 'b', destino: 'a' },
      { tipo: 'dependencia', origem: 'a', destino: 'b' },
    ];

    const diff = compararDiagramas(gabarito, entregue);

    expect(diff.relacionamentos.corretos).toHaveLength(1);
    expect(diff.relacionamentos.invertidos).toEqual([]);
    expect(diff.relacionamentos.extras).toEqual([
      { tipo: 'dependencia', origem: 'B', destino: 'A' },
    ]);
  });

  it('multiplicidade errada ou ausente numa ponta que o gabarito define', () => {
    const entregue = copia(GABARITO);
    entregue.relacionamentos[0].multiplicidadeDestino = '0..1';
    delete entregue.relacionamentos[0].multiplicidadeOrigem;

    const diff = compararDiagramas(GABARITO, entregue);

    expect(diff.multiplicidades.erradas).toEqual([
      expect.objectContaining({ ponta: 'origem', esperado: '1', entregue: null }),
      expect.objectContaining({ ponta: 'destino', esperado: '1..*', entregue: '0..1' }),
    ]);
  });

  it('multiplicidade a mais numa ponta que o gabarito nao define nao pesa', () => {
    const gabarito = copia(GABARITO);
    delete gabarito.relacionamentos[0].multiplicidadeOrigem;

    expect(notaDe(gabarito, copia(GABARITO))).toBe(1);
  });

  it('atributo com tipo ou visibilidade errados vale metade', () => {
    const entregue = copia(GABARITO);
    Object.assign(entregue.classes[0].atributos[0], { tipo: 'String', visibilidade: 'publico' });

    const diff = compararDiagramas(GABARITO, entregue);
    const { ganho, maximo } = calcularNota(diff, PESOS);

    expect(diff.atributos.comDetalheErrado).toEqual([
      {
        classe: 'Pedido',
        nome: 'numero',
        erros: [
          { campo: 'tipo', esperado: 'int', entregue: 'String' },
          { campo: 'visibilidade', esperado: 'privado', entregue: 'publico' },
        ],
      },
    ]);
    expect(maximo - ganho).toBe(PESOS.atributo / 2);
  });

  it('estereotipo so pontua quando o gabarito declara um diferente de classe', () => {
    const gabarito = exemplo('veiculos');
    const entregue = copia(gabarito);
    entregue.classes.forEach((classe) => delete classe.estereotipo);

    const diff = compararDiagramas(gabarito, entregue);

    expect(diff.estereotipos.errados.length).toBeGreaterThan(0);
    expect(diff.estereotipos.corretos).toEqual([]);
  });

  it('estereotipo indevido desconta', () => {
    const entregue = copia(GABARITO);
    entregue.classes[1].estereotipo = 'interface';

    const diff = compararDiagramas(GABARITO, entregue);

    expect(diff.estereotipos.indevidos).toEqual([
      { classe: 'Item', esperado: 'classe', entregue: 'interface' },
    ]);
    expect(calcularNota(diff, PESOS).desconto).toBe(PESOS.estereotipo);
  });

  it('relacionamento ligado a classe extra entra como extra', () => {
    const entregue = copia(GABARITO);
    entregue.classes.push({ id: 'c9', nome: 'Garcom' });
    entregue.relacionamentos.push({ tipo: 'associacao', origem: 'c9', destino: 'c1' });

    const diff = compararDiagramas(GABARITO, entregue);

    expect(diff.relacionamentos.extras).toEqual([
      { tipo: 'associacao', origem: 'Garcom', destino: 'Pedido' },
    ]);
  });

  it('canvas vazio tira 0, sem lancar', () => {
    const vazio = { versao: '1.0', classes: [], relacionamentos: [] };
    expect(notaDe(GABARITO, vazio)).toBe(0);
  });
});
