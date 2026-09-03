const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const RAIZ = path.resolve(__dirname, '..', '..');
const CAMINHO_SCHEMA = path.join(RAIZ, 'docs', 'schemas', 'diagrama.schema.json');
const DIR_EXEMPLOS = path.join(RAIZ, 'docs', 'schemas', 'exemplos');

const schema = JSON.parse(fs.readFileSync(CAMINHO_SCHEMA, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validar = ajv.compile(schema);

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
    const valido = validar(doc);
    // Em caso de falha, mostra o erro do Ajv em vez de um "false !== true" mudo.
    expect(validar.errors ?? []).toEqual([]);
    expect(valido).toBe(true);
  });
});

describe('schema do diagrama — o que deve ser recusado', () => {
  it('recusa diagrama sem o campo versao', () => {
    const doc = diagramaBase();
    delete doc.versao;
    expect(validar(doc)).toBe(false);
  });

  it('recusa versao diferente de 1.0', () => {
    const doc = { ...diagramaBase(), versao: '2.0' };
    expect(validar(doc)).toBe(false);
  });

  it('recusa classe sem nome', () => {
    const doc = diagramaBase();
    doc.classes.push({ id: 'c3' });
    expect(validar(doc)).toBe(false);
  });

  it('recusa multiplicidade fora do enum', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].multiplicidadeDestino = '2..7';
    expect(validar(doc)).toBe(false);
  });

  it('recusa multiplicidade em heranca (heranca nao tem cardinalidade em UML)', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0] = {
      tipo: 'heranca',
      origem: 'c1',
      destino: 'c2',
      multiplicidadeDestino: '1',
    };
    expect(validar(doc)).toBe(false);
  });

  it('aceita heranca sem multiplicidade', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0] = { tipo: 'heranca', origem: 'c1', destino: 'c2' };
    expect(validar(doc)).toBe(true);
  });

  it('recusa tipo de relacionamento inexistente', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].tipo = 'implementa';
    expect(validar(doc)).toBe(false);
  });

  it('recusa visibilidade em simbolo em vez de por extenso', () => {
    const doc = diagramaBase();
    doc.classes[0].atributos = [{ nome: 'total', tipo: 'double', visibilidade: '-' }];
    expect(validar(doc)).toBe(false);
  });

  it('recusa campo desconhecido na classe (protege contra erro de digitacao)', () => {
    const doc = diagramaBase();
    doc.classes[0].corDoBloco = 'azul';
    expect(validar(doc)).toBe(false);
  });

  it('recusa atributo sem tipo', () => {
    const doc = diagramaBase();
    doc.classes[0].atributos = [{ nome: 'total', visibilidade: 'privado' }];
    expect(validar(doc)).toBe(false);
  });

  it('aceita canvas vazio: entrega ruim nao e requisicao malformada', () => {
    expect(validar({ versao: '1.0', classes: [], relacionamentos: [] })).toBe(true);
  });
});

// Estas duas checagens NAO sao expressaveis em JSON Schema. O teste documenta a
// limitacao para ninguem supor que "passou no schema" significa "diagrama coerente".
// A verificacao de integridade entra junto com o ValidadorUML, na Sprint 2.
describe('schema do diagrama — limitacoes conhecidas', () => {
  it('NAO detecta relacionamento apontando para id inexistente', () => {
    const doc = diagramaBase();
    doc.relacionamentos[0].destino = 'c99';
    expect(validar(doc)).toBe(true);
  });

  it('NAO detecta ids de classe duplicados', () => {
    const doc = diagramaBase();
    doc.classes[1].id = 'c1';
    expect(validar(doc)).toBe(true);
  });
});
