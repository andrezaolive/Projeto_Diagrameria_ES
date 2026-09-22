const fs = require('fs');
const path = require('path');
const ambiente = require('../../src/config/ambiente');
const { validarDiagrama } = require('../../src/dominio/diagrama');

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
    // O enunciado e o ticket que o jogador le (RF03): tem que citar tudo o que o
    // gabarito cobra, senao ninguem consegue acertar.
    enunciado:
      'Sou bibliotecaria. Todo Usuario tem nome e matricula e sabe seu limite de emprestimos. ' +
      'Aluno (com curso) e Professor (com departamento) sao tipos de Usuario, e cada um ' +
      'calcula o proprio limite. Um usuario realiza nenhum ou varios Emprestimos, cada um de ' +
      'exatamente um usuario; o emprestimo tem data de retirada e de devolucao e sabe se esta ' +
      'atrasado. Cada emprestimo refere-se a um Livro (titulo e ISBN), que pode ter varios ' +
      'emprestimos ao longo do tempo.',
    diagrama: lerExemplo('biblioteca.json'),
    dificuldade: 3,
    tempo_limite_segundos: 300,
  },
  {
    titulo: 'Frota de veiculos',
    enunciado:
      'Modele minha frota. Tudo que e Manutenivel (uma interface) agenda revisao e informa o ' +
      'custo de manutencao. Veiculo e uma classe abstrata manutenivel, com placa e ' +
      'quilometragem; Caminhao e um veiculo com capacidade de carga. Cada veiculo possui ' +
      'exatamente um Motor (numero de serie e potencia), agregado a ele; o motor usa um ' +
      'TipoCombustivel, um enum com DIESEL, GASOLINA e ELETRICO. O RelatorioFrota gera a ' +
      'lista de veiculos e depende de Veiculo.',
    diagrama: lerExemplo('veiculos.json'),
    dificuldade: 5,
    // RF20: paciencia de 2 a 5 minutos. Era 420 s antes da restricao existir.
    tempo_limite_segundos: 300,
  },
  {
    titulo: 'Matricula em cursos',
    enunciado:
      'Coordeno uma escola de idiomas. Cada Aluno tem matricula e nome e pode se matricular. ' +
      'Cada Curso tem codigo, nome e carga horaria. Um aluno cursa um ou mais cursos, e um ' +
      'curso pode ter nenhum ou varios alunos.',
    diagrama: lerExemplo('aluno-curso.json'),
    dificuldade: 1,
    tempo_limite_segundos: 180,
  },
  {
    titulo: 'Playlist de musicas',
    enunciado:
      'Estou montando um app de musica. Uma Playlist tem nome, adiciona musicas e calcula a ' +
      'duracao total. Cada Musica tem titulo e duracao em segundos. A playlist agrega musicas: ' +
      'a mesma musica pode estar em varias playlists, e continua existindo se a playlist sumir.',
    diagrama: lerExemplo('playlist-musica.json'),
    dificuldade: 1,
    tempo_limite_segundos: 180,
  },
  {
    titulo: 'Conta bancaria',
    enunciado:
      'Tenho uma cooperativa de credito. O Cliente tem nome e CPF. A Conta tem numero e saldo, ' +
      'permite depositar e sacar (o saque diz se deu certo). Cada cliente possui uma ou mais ' +
      'contas, e cada conta pertence a exatamente um cliente.',
    diagrama: lerExemplo('conta-bancaria.json'),
    dificuldade: 1,
    tempo_limite_segundos: 180,
  },
  {
    titulo: 'Carrinho de compras',
    enunciado:
      'Minha loja online precisa de um carrinho. O Carrinho tem total, adiciona itens e ' +
      'calcula o total. Ele e composto de ItemCarrinho, cada um com quantidade e subtotal; sem ' +
      'o carrinho os itens nao existem. Cada item aponta para um Produto, que tem nome e preco; ' +
      'um produto pode estar em varios itens.',
    diagrama: lerExemplo('carrinho-produto.json'),
    dificuldade: 2,
    tempo_limite_segundos: 240,
  },
  {
    titulo: 'Consultas da clinica',
    enunciado:
      'Administro uma clinica. Paciente e Medico sao tipos de Pessoa, que e abstrata e tem ' +
      'nome e CPF protegidos. O paciente tem convenio; o medico tem CRM e atende. Cada ' +
      'Consulta tem data e horario, e e de um paciente e de um medico; cada um deles pode ter ' +
      'varias consultas.',
    diagrama: lerExemplo('consulta-medica.json'),
    dificuldade: 2,
    tempo_limite_segundos: 240,
  },
];

exports.seed = async function seed(knex) {
  // Seed e dado de brincadeira para jogar localmente. Em producao, gabarito
  // entra por um caminho revisado, nao por `npm run seed` rodado por engano.
  if (ambiente.ehProducao) {
    throw new Error('O seed de gabaritos nao roda em producao.');
  }

  // Mesmo portao por onde qualquer diagrama entra no sistema: um exemplo
  // quebrado falha aqui, com o campo, em vez de virar gabarito que reprova
  // todo jogador.
  for (const gabarito of GABARITOS) {
    const problemas = validarDiagrama(gabarito.diagrama);
    if (problemas.length > 0) {
      throw new Error(
        `Gabarito "${gabarito.titulo}" invalido:\n` +
          problemas.map((p) => `  ${p.campo}: ${p.mensagem}`).join('\n')
      );
    }
  }

  // Upsert por titulo, sem apagar nada: gabarito ja usado em partida continua
  // existindo, e rodar o seed duas vezes nao duplica. `ativo` nao entra no
  // merge, entao um gabarito aposentado a mao continua aposentado.
  await knex('gabaritos').insert(GABARITOS).onConflict('titulo').merge();
};
