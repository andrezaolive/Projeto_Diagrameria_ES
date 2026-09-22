const fs = require('fs');
const path = require('path');
const { validarDiagrama } = require('../../src/dominio/diagrama');
const { normalizarNome } = require('../../src/dominio/diagrama/validadorUML');
const { clientesPorFase } = require('../../src/dominio/jogo/regras');
const { bancoDeDados, prepararBanco, limparTabelas, encerrarBanco } = require('./ajuda/banco');

/**
 * O seed e a tabela `gabaritos`.
 *
 * O teste que mais importa aqui: o diagrama que sai do banco tem que passar no
 * mesmo validador que a entrega do Canvas vai passar. Se um dia alguem gravar um
 * gabarito com o formato errado, o ValidadorUML da Sprint 2 compararia contra
 * lixo — e falharia culpando o jogador.
 */

const RAIZ = path.resolve(__dirname, '..', '..');
const seed = require(path.join(RAIZ, 'db', 'seeds', '01_gabaritos.js'));

// Cada exemplo de docs/schemas/exemplos/ vira um gabarito no seed.
const TOTAL_DE_EXEMPLOS = fs
  .readdirSync(path.join(RAIZ, 'docs', 'schemas', 'exemplos'))
  .filter((arquivo) => arquivo.endsWith('.json')).length;

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
  it('insere um gabarito por exemplo', async () => {
    const linhas = await bancoDeDados('gabaritos').select('*');
    expect(linhas).toHaveLength(TOTAL_DE_EXEMPLOS);
  });

  it('rodar duas vezes nao duplica', async () => {
    await seed.seed(bancoDeDados);

    const linhas = await bancoDeDados('gabaritos').select('*');
    expect(linhas).toHaveLength(TOTAL_DE_EXEMPLOS);
  });

  // Apagar e recriar trocaria o id — e partida que aponta para o gabarito
  // antigo quebraria (ou sumiria junto, com CASCADE).
  it('rodar de novo atualiza no lugar, mantendo o id', async () => {
    const antes = await bancoDeDados('gabaritos').select('id', 'titulo').orderBy('titulo');

    await seed.seed(bancoDeDados);

    const depois = await bancoDeDados('gabaritos').select('id', 'titulo').orderBy('titulo');
    expect(depois).toEqual(antes);
  });

  it('nao reativa um gabarito aposentado', async () => {
    await bancoDeDados('gabaritos').where({ titulo: 'Pedido e Item' }).update({ ativo: false });

    await seed.seed(bancoDeDados);

    const linha = await bancoDeDados('gabaritos').where({ titulo: 'Pedido e Item' }).first();
    expect(linha.ativo).toBe(false);
  });

  it('todo diagrama gravado passa no validador do Canvas', async () => {
    const linhas = await bancoDeDados('gabaritos').select('titulo', 'diagrama');

    for (const linha of linhas) {
      // Mostra os problemas e de qual gabarito, em vez de um "false !== true" mudo.
      expect({ titulo: linha.titulo, problemas: validarDiagrama(linha.diagrama) }).toEqual({
        titulo: linha.titulo,
        problemas: [],
      });
    }
  });

  // O enunciado e o ticket que o jogador le (RF03). Classe que o gabarito cobra
  // e o enunciado nao cita e impossivel de acertar.
  it('todo enunciado cita todas as classes do gabarito', async () => {
    const linhas = await bancoDeDados('gabaritos').select('titulo', 'enunciado', 'diagrama');

    for (const linha of linhas) {
      const texto = normalizarNome(linha.enunciado);
      const naoCitadas = linha.diagrama.classes
        .map((classe) => classe.nome)
        .filter((nome) => !texto.includes(normalizarNome(nome)));
      expect({ titulo: linha.titulo, naoCitadas }).toEqual({
        titulo: linha.titulo,
        naoCitadas: [],
      });
    }
  });

  it('a fase 1 tem gabaritos de dificuldade 1 para todos os clientes do dia', async () => {
    const [{ total }] = await bancoDeDados('gabaritos')
      .where({ ativo: true, dificuldade: 1 })
      .count({ total: '*' });
    expect(Number(total)).toBeGreaterThanOrEqual(clientesPorFase(1));
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

  it('recusa titulo repetido', async () => {
    await expect(
      bancoDeDados('gabaritos').insert({ ...base, titulo: 'Pedido e Item' })
    ).rejects.toThrow();
  });

  it('preenche id, ativo e criado_em sozinho', async () => {
    const [linha] = await bancoDeDados('gabaritos').insert(base).returning('*');

    expect(linha.id).toEqual(expect.any(String));
    expect(linha.ativo).toBe(true);
    expect(linha.criado_em).toBeInstanceOf(Date);
  });

  it('atualizado_em avanca no UPDATE e criado_em fica', async () => {
    const [criada] = await bancoDeDados('gabaritos').insert(base).returning('*');

    // now() do Postgres e o inicio da transacao: sem esta pausa, INSERT e
    // UPDATE seguidos podem cair no mesmo milissegundo.
    await new Promise((resolve) => setTimeout(resolve, 20));

    const [atualizada] = await bancoDeDados('gabaritos')
      .where({ id: criada.id })
      .update({ dificuldade: 2 })
      .returning('*');

    expect(atualizada.atualizado_em.getTime()).toBeGreaterThan(criada.atualizado_em.getTime());
    expect(atualizada.criado_em).toEqual(criada.criado_em);
  });
});
