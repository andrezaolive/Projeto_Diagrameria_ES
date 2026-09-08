const fs = require('fs');
const path = require('path');

/**
 * Gabaritos de exemplo para dar para jogar localmente sem inventar diagrama.
 *
 * Os diagramas sao lidos de docs/schemas/exemplos/ em vez de copiados para ca:
 * os exemplos ja sao validados contra o schema pelos testes, entao o seed
 * herda essa garantia de graca e nao existe uma segunda copia para divergir.
 */

const DIR_EXEMPLOS = path.resolve(__dirname, '..', '..', 'docs', 'schemas', 'exemplos');

function lerExemplo(arquivo) {
  return JSON.parse(fs.readFileSync(path.join(DIR_EXEMPLOS, arquivo), 'utf8'));
}

const GABARITOS = [
  {
    titulo: 'Pedido e Item',
    enunciado:
      'Preciso modelar o pedido da minha lanchonete. Um Pedido tem numero e total, e sabe ' +
      'calcular o proprio total e adicionar itens. Cada Item tem descricao, quantidade e preco ' +
      'unitario, e calcula o subtotal. O Pedido e composto de um ou mais Itens — se o pedido ' +
      'some, os itens somem junto.',
    diagrama: lerExemplo('pedido-item.json'),
    dificuldade: 1,
    tempo_limite_segundos: 240,
  },
  {
    titulo: 'Acervo da biblioteca',
    enunciado:
      'Sou bibliotecaria. Livro e Revista sao tipos de Publicacao. Um Usuario pode ter varios ' +
      'Emprestimos e cada Emprestimo e de uma Publicacao. Quero ver a heranca e as ' +
      'multiplicidades das duas pontas.',
    diagrama: lerExemplo('biblioteca.json'),
    dificuldade: 3,
    tempo_limite_segundos: 300,
  },
  {
    titulo: 'Frota de veiculos',
    enunciado:
      'Modele minha frota: uma interface para o que pode ser dirigido, uma classe abstrata ' +
      'Veiculo, um enum de combustivel, a Frota agregando os veiculos e a dependencia do ' +
      'servico de manutencao.',
    diagrama: lerExemplo('veiculos.json'),
    dificuldade: 5,
    tempo_limite_segundos: 420,
  },
];

exports.seed = async function seed(knex) {
  // Recomeca do zero: rodar o seed duas vezes nao deve gerar gabarito duplicado.
  await knex('gabaritos').del();
  await knex('gabaritos').insert(GABARITOS);
};
