const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco } = require('./ajuda/banco');

/**
 * O seed e a tabela `gabaritos`.
 *
 * O teste que importa aqui e o ultimo: o diagrama que sai do banco tem que
 * passar no mesmo schema que o Canvas usa. Se um dia alguem gravar um gabarito
 * a mao com o formato errado, o ValidadorUML da Sprint 2 comparia contra lixo —
 * e falharia culpando o jogador.
 */

const RAIZ = path.resolve(__dirname, '..', '..');
const schema = JSON.parse(
  fs.readFileSync(path.join(RAIZ, 'docs', 'schemas', 'diagrama.schema.json'), 'utf8')
);

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validarDiagrama = ajv.compile(schema);

const seed = require(path.join(RAIZ, 'db', 'seeds', '01_gabaritos.js'));

beforeAll(async () => {
  await prepararBanco();
});

beforeEach(async () => {
  await limparTabelas();
  await seed.seed(bancoDeDados);
});

afterAll(async () => {
  await encerrarBanco();
});

describe('seed de gabaritos', () => {
  it('insere os tres gabaritos de exemplo', async () => {
    const linhas = await bancoDeDados('gabaritos').select('*');
    expect(linhas).toHaveLength(3);
  });

  it('rodar duas vezes nao duplica', async () => {
    await seed.seed(bancoDeDados);

    const linhas = await bancoDeDados('gabaritos').select('*');
    expect(linhas).toHaveLength(3);
  });

  it('todo diagrama gravado passa no schema do Canvas', async () => {
    const linhas = await bancoDeDados('gabaritos').select('titulo', 'diagrama');

    for (const linha of linhas) {
      validarDiagrama(linha.diagrama);
      // Mostra o erro do Ajv e de qual gabarito, em vez de um "false !== true" mudo.
      expect({ titulo: linha.titulo, erros: validarDiagrama.errors ?? [] }).toEqual({
        titulo: linha.titulo,
        erros: [],
      });
    }
  });

  it('o JSONB volta como objeto, nao como string', async () => {
    const linha = await bancoDeDados('gabaritos').first();

    expect(typeof linha.diagrama).toBe('object');
    expect(Array.isArray(linha.diagrama.classes)).toBe(true);
  });
});

describe('restricoes da tabela gabaritos', () => {
  const base = {
    titulo: 'Teste',
    enunciado: 'Enunciado de teste.',
    diagrama: { versao: '1.0', classes: [], relacionamentos: [] },
  };

  it('recusa dificuldade fora de 1..5', async () => {
    await expect(bancoDeDados('gabaritos').insert({ ...base, dificuldade: 9 })).rejects.toThrow();
  });

  it('recusa tempo limite zerado', async () => {
    await expect(
      bancoDeDados('gabaritos').insert({ ...base, tempo_limite_segundos: 0 })
    ).rejects.toThrow();
  });

  it('preenche id, ativo e criado_em sozinho', async () => {
    const [linha] = await bancoDeDados('gabaritos').insert(base).returning('*');

    expect(linha.id).toEqual(expect.any(String));
    expect(linha.ativo).toBe(true);
    expect(linha.criado_em).toBeInstanceOf(Date);
  });
});
