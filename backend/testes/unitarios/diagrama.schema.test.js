const fs = require('fs');
const path = require('path');
const { validarDiagrama } = require('../../src/dominio/diagrama');

const RAIZ = path.resolve(__dirname, '..', '..');
const DIR_EXEMPLOS = path.join(RAIZ, 'docs', 'schemas', 'exemplos');

/** true quando o diagrama e aceito — formato e integridade. */
function aceita(doc) {
  return validarDiagrama(doc).length === 0;
}

/** Diagrama minimo valido, usado como base para as variacoes invalidas. */
function diagramaBase() {
  return {
    versao: '1.0',
    classes: [
      { id: 'c1', nome: 'Pedido' },
      { id: 'c2', nome: 'Item' },
    ],
    relacionamentos: [
      {
        tipo: 'composicao',
        origem: 'c1',
        destino: 'c2',
        multiplicidadeOrigem: '1',
        multiplicidadeDestino: '1..*',
      },
    ],
  };
}

describe('schema do diagrama — exemplos da documentacao', () => {
  const exemplos = fs.readdirSync(DIR_EXEMPLOS).filter((a) => a.endsWith('.json'));

  it('a pasta de exemplos nao esta vazia', () => {
    expect(exemplos.length).toBeGreaterThanOrEqual(3);
  });

  it.each(exemplos)('%s e um diagrama valido', (arquivo) => {
    const doc = JSON.parse(fs.readFileSync(path.join(DIR_EXEMPLOS, arquivo), 'utf8'));
    // Em caso de falha, mostra os problemas em vez de um "false !== true" mudo.
    expect(validarDiagrama(doc)).toEqual([]);
  });
});

describe('schema do diagrama — o que deve ser recusado', () => {
  it('recusa diagrama sem o campo versao', () => {
    const doc = diagramaBase();
    delete doc.versao;
    expect(aceita(doc)).toBe(false);
  });

  it('recusa versao diferente de 1.0', () => {
    const doc = { ...diagramaBase(), versao: '2.0' };
    expect(aceita(doc)).toBe(false);
  });

  it('recusa classe sem nome', () => {
    const doc = diagramaBase();
    doc.classes.push({ id: 'c3' });
    expect(aceita(doc)).toBe(false);
  });

  it('recusa multiplicidade fora do enum', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].multiplicidadeDestino = '2..7';
    expect(aceita(doc)).toBe(false);
  });

  it('recusa multiplicidade em heranca (heranca nao tem cardinalidade em UML)', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0] = {
      tipo: 'heranca',
      origem: 'c1',
      destino: 'c2',
      multiplicidadeDestino: '1',
    };
    expect(aceita(doc)).toBe(false);
  });

  it('aceita heranca sem multiplicidade', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0] = { tipo: 'heranca', origem: 'c1', destino: 'c2' };
    expect(aceita(doc)).toBe(true);
  });

  it('recusa tipo de relacionamento inexistente', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].tipo = 'implementa';
    expect(aceita(doc)).toBe(false);
  });

  it('recusa visibilidade em simbolo em vez de por extenso', () => {
    const doc = diagramaBase();
    doc.classes[0].atributos = [{ nome: 'total', tipo: 'double', visibilidade: '-' }];
    expect(aceita(doc)).toBe(false);
  });

  it('recusa campo desconhecido na classe (protege contra erro de digitacao)', () => {
    const doc = diagramaBase();
    doc.classes[0].corDoBloco = 'azul';
    expect(aceita(doc)).toBe(false);
  });

  it('recusa atributo sem tipo', () => {
    const doc = diagramaBase();
    doc.classes[0].atributos = [{ nome: 'total', visibilidade: 'privado' }];
    expect(aceita(doc)).toBe(false);
  });

  it('aceita canvas vazio: entrega ruim nao e requisicao malformada', () => {
    expect(aceita({ versao: '1.0', classes: [], relacionamentos: [] })).toBe(true);
  });

  it('aponta o campo obrigatorio que falta dentro de um item da lista', () => {
    const doc = diagramaBase();
    doc.classes.push({ id: 'c3' });

    expect(validarDiagrama(doc)).toEqual([
      { campo: 'classes/2/nome', mensagem: expect.any(String) },
    ]);
  });

  it('recusa entrada que nem e objeto, sem lancar', () => {
    expect(aceita(null)).toBe(false);
    expect(aceita('diagrama')).toBe(false);
  });

  it('descreve o problema em portugues, apontando o campo', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].tipo = 'implementa';

    expect(validarDiagrama(doc)).toEqual(
      expect.arrayContaining([
        { campo: 'relacionamentos/0/tipo', mensagem: expect.stringMatching(/^deve/) },
      ])
    );
  });
});

// O JSON Schema nao consegue expressar estas regras; elas moram em
// src/dominio/diagrama/integridade.js e rodam depois do schema.
describe('integridade do diagrama', () => {
  it('recusa relacionamento apontando para id inexistente', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].destino = 'c99';

    expect(validarDiagrama(doc)).toEqual([
      { campo: 'relacionamentos/0/destino', mensagem: expect.stringContaining('"c99"') },
    ]);
  });

  it('recusa ids de classe duplicados', () => {
    const doc = diagramaBase();
    doc.classes[1].id = 'c1';

    expect(validarDiagrama(doc)).toEqual(
      expect.arrayContaining([
        { campo: 'classes/1/id', mensagem: expect.stringContaining('repetido') },
      ])
    );
  });

  it('recusa ids de relacionamento duplicados, quando informados', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].id = 'r1';
    doc.relacionamentos.push({ id: 'r1', tipo: 'dependencia', origem: 'c2', destino: 'c1' });

    expect(validarDiagrama(doc)).toEqual([
      { campo: 'relacionamentos/1/id', mensagem: expect.stringContaining('repetido') },
    ]);
  });

  it('aceita relacionamentos sem id', () => {
    const doc = diagramaBase();
    doc.relacionamentos.push({ tipo: 'dependencia', origem: 'c2', destino: 'c1' });

    expect(validarDiagrama(doc)).toEqual([]);
  });

  it('so checa integridade depois que o formato passa', () => {
    const doc = diagramaBase();
    doc.classes = 'nao e lista';

    // Um erro de formato, e nenhum TypeError de tentar percorrer uma string.
    expect(() => validarDiagrama(doc)).not.toThrow();
    expect(aceita(doc)).toBe(false);
  });
});
