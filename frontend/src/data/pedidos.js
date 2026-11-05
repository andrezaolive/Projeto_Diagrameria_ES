// Modelos de pedidos recebidos por e-mail. "esperado" é o diagrama-gabarito usado na avaliação.
// Coordenadas do gabarito já estão no grid (múltiplos de 20).

const n = (id, tipo, rotulo, x, y) => ({ id, tipo, rotulo, x, y });
// multDe / multPara: multiplicidade em cada ponta (só associação, agregação e composição; ver lib/multiplicidade.js)
const e = (tipo, de, para, multDe, multPara) => ({
  id: `${de}-${tipo}-${para}`,
  tipo,
  de,
  para,
  ...(multDe ? { multDe } : {}),
  ...(multPara ? { multPara } : {}),
});

export const MODELOS = [
  {
    id: 'biblioteca',
    cliente: 'Biblioteca Lua Cheia',
    assunto: 'Sistema de empréstimos',
    tempo: 240,
    recompensa: 120,
    corpo: [
      'Olá! Precisamos de um diagrama de casos de uso.',
      'Atores: "Aluno" e "Bibliotecário".',
      'O Aluno pode "Consultar acervo" e "Emprestar livro".',
      'O Bibliotecário participa de "Emprestar livro" e "Devolver livro".',
      'Todo empréstimo inclui "Verificar cadastro".',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Aluno', 40, 100),
        n('a2', 'ator', 'Bibliotecário', 600, 120),
        n('c1', 'casoDeUso', 'Consultar acervo', 200, 40),
        n('c2', 'casoDeUso', 'Emprestar livro', 200, 160),
        n('c3', 'casoDeUso', 'Devolver livro', 200, 280),
        n('c4', 'casoDeUso', 'Verificar cadastro', 400, 220),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c2'), e('associacao', 'a2', 'c3'),
        e('include', 'c2', 'c4'),
      ],
    },
  },
  {
    id: 'pizzaria',
    cliente: 'Pizzaria Forno Roxo',
    assunto: 'App de delivery',
    tempo: 240,
    recompensa: 130,
    corpo: [
      'Boa noite! Queremos um diagrama de casos de uso do nosso app.',
      'Atores: "Cliente" e "Entregador".',
      'O Cliente pode "Fazer pedido" e "Acompanhar entrega".',
      'Fazer pedido sempre inclui "Pagar".',
      'O Entregador realiza "Entregar pedido".',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Cliente', 40, 100),
        n('a2', 'ator', 'Entregador', 600, 200),
        n('c1', 'casoDeUso', 'Fazer pedido', 200, 60),
        n('c2', 'casoDeUso', 'Acompanhar entrega', 200, 180),
        n('c3', 'casoDeUso', 'Pagar', 400, 20),
        n('c4', 'casoDeUso', 'Entregar pedido', 380, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c1', 'c3'), e('associacao', 'a2', 'c4'),
      ],
    },
  },
  {
    id: 'cinema',
    cliente: 'Cine Pastel',
    assunto: 'Venda de ingressos',
    tempo: 200,
    recompensa: 140,
    corpo: [
      'Oi! Precisamos modelar a venda online.',
      'Ator: "Cliente". Ele pode "Comprar ingresso".',
      'Comprar ingresso inclui "Escolher assento".',
      'Opcionalmente, "Aplicar cupom" estende Comprar ingresso.',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Cliente', 40, 120),
        n('c1', 'casoDeUso', 'Comprar ingresso', 220, 140),
        n('c2', 'casoDeUso', 'Escolher assento', 440, 60),
        n('c3', 'casoDeUso', 'Aplicar cupom', 440, 240),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('include', 'c1', 'c2'), e('extend', 'c3', 'c1'),
      ],
    },
  },
  {
    id: 'petshop',
    cliente: 'Petshop Bigode',
    assunto: 'Cadastro de animais',
    tempo: 220,
    recompensa: 150,
    corpo: [
      'Olá, agência! Queremos um diagrama de classes.',
      'Classes: "Animal", "Cachorro", "Gato" e "Dono".',
      'Cachorro e Gato herdam de Animal.',
      'Dono tem associação com Animal.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Animal', 240, 20),
        n('k2', 'classe', 'Cachorro', 120, 220),
        n('k3', 'classe', 'Gato', 360, 220),
        n('k4', 'classe', 'Dono', 520, 20),
      ],
      edges: [
        e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1'), e('associacao', 'k4', 'k1'),
      ],
    },
  },
  {
    id: 'banco',
    cliente: 'Banco Nuvem',
    assunto: 'Caixa eletrônico',
    tempo: 200,
    recompensa: 140,
    corpo: [
      'Prezados, precisamos do diagrama de casos de uso do caixa.',
      'Ator: "Cliente". Ele pode "Sacar" e "Depositar".',
      'Tanto Sacar quanto Depositar incluem "Autenticar".',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Cliente', 40, 120),
        n('c1', 'casoDeUso', 'Sacar', 220, 60),
        n('c2', 'casoDeUso', 'Depositar', 220, 220),
        n('c3', 'casoDeUso', 'Autenticar', 440, 140),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c1', 'c3'), e('include', 'c2', 'c3'),
      ],
    },
  },
  {
    id: 'escola',
    cliente: 'Escola Arco-Íris',
    assunto: 'Modelo de turmas',
    tempo: 240,
    recompensa: 160,
    corpo: [
      'Bom dia! Precisamos de um diagrama de classes.',
      'Classes: "Pessoa", "Aluno", "Professor" e "Turma".',
      'Aluno e Professor herdam de Pessoa.',
      'Turma se associa a Aluno e a Professor.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Pessoa', 240, 20),
        n('k2', 'classe', 'Aluno', 100, 220),
        n('k3', 'classe', 'Professor', 380, 220),
        n('k4', 'classe', 'Turma', 240, 400),
      ],
      edges: [
        e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1'),
        e('associacao', 'k4', 'k2'), e('associacao', 'k4', 'k3'),
      ],
    },
  },
  {
    id: 'academia',
    cliente: 'Academia Halter Lilás',
    assunto: 'Gestão de treinos',
    tempo: 240,
    recompensa: 150,
    corpo: [
      'E aí! Queremos um diagrama de casos de uso.',
      'Atores: "Aluno" e "Instrutor".',
      'O Aluno pode "Matricular" e "Registrar presença".',
      'O Instrutor pode "Montar treino".',
      '"Avaliar físico" estende Montar treino.',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Aluno', 40, 100),
        n('a2', 'ator', 'Instrutor', 620, 120),
        n('c1', 'casoDeUso', 'Matricular', 200, 40),
        n('c2', 'casoDeUso', 'Registrar presença', 200, 180),
        n('c3', 'casoDeUso', 'Montar treino', 420, 100),
        n('c4', 'casoDeUso', 'Avaliar físico', 420, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c3'), e('extend', 'c4', 'c3'),
      ],
    },
  },
  {
    id: 'cafeteria',
    cliente: 'Café Lo-Fi',
    assunto: 'Cardápio digital',
    tempo: 180,
    recompensa: 110,
    corpo: [
      'Oi, pessoal da agência :)',
      'Ator: "Cliente". Ele pode "Ver cardápio" e "Pedir café".',
      'Pedir café inclui "Pagar".',
    ],
    esperado: {
      nodes: [
        n('a1', 'ator', 'Cliente', 40, 100),
        n('c1', 'casoDeUso', 'Ver cardápio', 220, 40),
        n('c2', 'casoDeUso', 'Pedir café', 220, 180),
        n('c3', 'casoDeUso', 'Pagar', 440, 180),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('include', 'c2', 'c3'),
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Pedidos vindos dos gabaritos do backend (branch feature/front-finalizado:
  // backend/db/seeds/01_gabaritos.js + docs/schemas/exemplos/*.json), com as mesmas
  // multiplicidades. Adaptados ao editor: atributos e métodos ficam de fora.
  // Agregação/composição: "de" é o todo. Multiplicidade: o número fica na ponta da classe contada.
  {
    id: 'lanchonete',
    cliente: 'Lanchonete Pixel',
    assunto: 'Pedidos do balcão',
    tempo: 240,
    recompensa: 120,
    corpo: [
      'Oi! Preciso de um diagrama de classes dos pedidos da lanchonete.',
      'Classes: "Pedido" e "Item".',
      'O Pedido é composto de Itens: se o pedido some, os itens somem junto.',
      'Cada Pedido tem um ou mais Itens, e cada Item pertence a exatamente um Pedido.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Pedido', 120, 80), n('k2', 'classe', 'Item', 420, 80)],
      edges: [e('composicao', 'k1', 'k2', '1', '1..*')],
    },
  },
  {
    id: 'idiomas',
    cliente: 'Escola de Idiomas Babel',
    assunto: 'Matrícula em cursos',
    tempo: 180,
    recompensa: 120,
    corpo: [
      'Olá! Coordeno uma escola de idiomas e quero um diagrama de classes.',
      'Classes: "Aluno" e "Curso", ligadas por uma associação.',
      'Um Aluno cursa um ou mais Cursos, e um Curso pode ter nenhum ou vários Alunos.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Aluno', 80, 100), n('k2', 'classe', 'Curso', 400, 100)],
      edges: [e('associacao', 'k1', 'k2', '0..*', '1..*')],
    },
  },
  {
    id: 'playlist',
    cliente: 'App Vinil Roxo',
    assunto: 'Playlists de músicas',
    tempo: 180,
    recompensa: 120,
    corpo: [
      'E aí! Estou montando um app de música. Preciso de um diagrama de classes.',
      'Classes: "Playlist" e "Música".',
      'A Playlist agrega Músicas: a música continua existindo se a playlist sumir.',
      'Uma Playlist tem nenhuma ou várias Músicas, e uma Música pode estar em nenhuma ou várias Playlists.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Playlist', 80, 100), n('k2', 'classe', 'Música', 400, 100)],
      edges: [e('agregacao', 'k1', 'k2', '0..*', '0..*')],
    },
  },
  {
    id: 'cooperativa',
    cliente: 'Cooperativa Lavanda',
    assunto: 'Contas dos cooperados',
    tempo: 180,
    recompensa: 120,
    corpo: [
      'Bom dia! Tenho uma cooperativa de crédito e preciso de um diagrama de classes.',
      'Classes: "Cliente" e "Conta", ligadas por uma associação.',
      'Cada Cliente possui uma ou mais Contas, e cada Conta pertence a exatamente um Cliente.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Cliente', 80, 100), n('k2', 'classe', 'Conta', 400, 100)],
      edges: [e('associacao', 'k1', 'k2', '1', '1..*')],
    },
  },
  {
    id: 'loja-online',
    cliente: 'Loja Neblina',
    assunto: 'Carrinho de compras',
    tempo: 240,
    recompensa: 150,
    corpo: [
      'Olá! Minha loja online precisa de um carrinho. Quero um diagrama de classes.',
      'Classes: "Carrinho", "ItemCarrinho" e "Produto".',
      'O Carrinho é composto de ItemCarrinho (sem o carrinho, os itens não existem): cada Carrinho tem nenhum ou vários itens, e cada item é de exatamente um Carrinho.',
      'Cada ItemCarrinho se associa a exatamente um Produto, e um Produto pode estar em nenhum ou vários itens.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Carrinho', 60, 100),
        n('k2', 'classe', 'ItemCarrinho', 320, 100),
        n('k3', 'classe', 'Produto', 580, 100),
      ],
      edges: [e('composicao', 'k1', 'k2', '1', '0..*'), e('associacao', 'k2', 'k3', '0..*', '1')],
    },
  },
  {
    id: 'clinica',
    cliente: 'Clínica Bem-Estar',
    assunto: 'Agenda de consultas',
    tempo: 240,
    recompensa: 150,
    corpo: [
      'Olá! Administro uma clínica e preciso de um diagrama de classes.',
      'Classes: "Pessoa", "Paciente", "Médico" e "Consulta".',
      'Paciente e Médico são tipos de Pessoa (herdam de Pessoa).',
      'Consulta se associa a Paciente e a Médico: cada Consulta tem exatamente um Paciente e exatamente um Médico, e cada um deles pode ter nenhuma ou várias Consultas.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Pessoa', 300, 20),
        n('k2', 'classe', 'Paciente', 120, 220),
        n('k3', 'classe', 'Médico', 480, 220),
        n('k4', 'classe', 'Consulta', 300, 420),
      ],
      edges: [
        e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1'),
        e('associacao', 'k2', 'k4', '1', '0..*'), e('associacao', 'k3', 'k4', '1', '0..*'),
      ],
    },
  },
  {
    id: 'acervo',
    cliente: 'Biblioteca Estrela Cadente',
    assunto: 'Acervo e empréstimos',
    tempo: 300,
    recompensa: 180,
    corpo: [
      'Oi! Sou bibliotecária e preciso de um diagrama de classes do acervo.',
      'Classes: "Usuário", "Aluno", "Professor", "Empréstimo" e "Livro".',
      'Aluno e Professor são tipos de Usuário (herdam de Usuário).',
      'Usuário se associa a Empréstimo: um Usuário faz nenhum ou vários Empréstimos, e cada Empréstimo é de exatamente um Usuário.',
      'Empréstimo se associa a Livro: cada Empréstimo é de exatamente um Livro, e um Livro pode ter nenhum ou vários Empréstimos.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Usuário', 100, 60),
        n('k2', 'classe', 'Aluno', 20, 260),
        n('k3', 'classe', 'Professor', 240, 260),
        n('k4', 'classe', 'Empréstimo', 480, 60),
        n('k5', 'classe', 'Livro', 480, 280),
      ],
      edges: [
        e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1'),
        e('associacao', 'k1', 'k4', '1', '0..*'), e('associacao', 'k4', 'k5', '0..*', '1'),
      ],
    },
  },
  {
    id: 'frota',
    cliente: 'Transportes Aurora',
    assunto: 'Frota de veículos',
    tempo: 300,
    recompensa: 230,
    corpo: [
      'Boa noite! Modele minha frota num diagrama de classes.',
      'Classes: "Manutenivel", "Veículo", "Caminhão", "Motor", "TipoCombustivel" e "RelatorioFrota".',
      'Veículo herda de Manutenivel (uma interface), e Caminhão herda de Veículo.',
      'O Veículo agrega um Motor: cada Veículo tem exatamente um Motor, e cada Motor é de exatamente um Veículo.',
      'O Motor se associa a um TipoCombustivel: cada Motor usa exatamente um tipo, e um tipo serve para nenhum ou vários Motores.',
      'O RelatorioFrota depende de Veículo.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Manutenivel', 60, 40),
        n('k2', 'classe', 'Veículo', 60, 240),
        n('k3', 'classe', 'Caminhão', 60, 440),
        n('k4', 'classe', 'Motor', 380, 240),
        n('k5', 'classe', 'TipoCombustivel', 380, 440),
        n('k6', 'classe', 'RelatorioFrota', 700, 40),
      ],
      edges: [
        e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k2'),
        e('agregacao', 'k2', 'k4', '1', '1'), e('associacao', 'k4', 'k5', '0..*', '1'),
        e('dependencia', 'k6', 'k2'),
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Pedidos de multiplicidade: 1:1, 1:*, *:* (e 0..1)
  {
    id: 'atlas',
    cliente: 'Atlas Geografia Roxa',
    assunto: 'Países e capitais',
    tempo: 210,
    recompensa: 130,
    corpo: [
      'Olá! Estamos fazendo um atlas interativo. Precisamos de um diagrama de classes.',
      'Classes: "País", "Capital" e "Hino".',
      'País se associa a Capital: cada País tem exatamente uma Capital, e cada Capital é de exatamente um País (1:1).',
      'País se associa a Hino: cada País tem exatamente um Hino, e cada Hino é de exatamente um País.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'País', 300, 40), n('k2', 'classe', 'Capital', 80, 240), n('k3', 'classe', 'Hino', 520, 240)],
      edges: [e('associacao', 'k1', 'k2', '1', '1'), e('associacao', 'k1', 'k3', '1', '1')],
    },
  },
  {
    id: 'rh',
    cliente: 'RH Ameixa Ltda.',
    assunto: 'Equipe e estacionamento',
    tempo: 240,
    recompensa: 150,
    corpo: [
      'Oi! Sou do RH e preciso de um diagrama de classes da equipe.',
      'Classes: "Departamento", "Funcionário" e "Vaga" (de estacionamento).',
      'Departamento se associa a Funcionário: cada Departamento tem um ou mais Funcionários, e cada Funcionário trabalha em exatamente um Departamento (1:*).',
      'Funcionário se associa a Vaga: cada Funcionário tem no máximo uma Vaga (pode não ter), e cada Vaga é de exatamente um Funcionário.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Departamento', 60, 100), n('k2', 'classe', 'Funcionário', 340, 100), n('k3', 'classe', 'Vaga', 620, 100)],
      edges: [e('associacao', 'k1', 'k2', '1', '1..*'), e('associacao', 'k2', 'k3', '1', '0..1')],
    },
  },
  {
    id: 'cinemateca',
    cliente: 'Cinemateca Neon',
    assunto: 'Catálogo de filmes',
    tempo: 240,
    recompensa: 150,
    corpo: [
      'Boa noite! Queremos um diagrama de classes do nosso catálogo.',
      'Classes: "Ator", "Filme" e "Gênero".',
      'Filme se associa a Ator: cada Filme tem um ou mais Atores, e um Ator pode estar em nenhum ou vários Filmes (*:*).',
      'Filme se associa a Gênero: cada Filme tem um ou mais Gêneros, e um Gênero pode ter nenhum ou vários Filmes.',
    ],
    esperado: {
      nodes: [n('k1', 'classe', 'Ator', 60, 100), n('k2', 'classe', 'Filme', 340, 100), n('k3', 'classe', 'Gênero', 620, 100)],
      edges: [e('associacao', 'k2', 'k1', '0..*', '1..*'), e('associacao', 'k2', 'k3', '0..*', '1..*')],
    },
  },
  {
    id: 'conservatorio',
    cliente: 'Conservatório Sol Maior',
    assunto: 'Turmas e aulas',
    tempo: 300,
    recompensa: 190,
    corpo: [
      'Olá! Precisamos organizar o conservatório num diagrama de classes.',
      'Classes: "Professor", "Turma", "Aluno" e "Aula".',
      'Professor se associa a Turma: cada Professor dá nenhuma ou várias Turmas, e cada Turma tem exatamente um Professor.',
      'Turma se associa a Aluno: cada Turma tem um ou mais Alunos, e um Aluno pode estar em nenhuma ou várias Turmas.',
      'A Turma é composta de Aulas (sem a turma, as aulas não existem): cada Turma tem uma ou mais Aulas, e cada Aula é de exatamente uma Turma.',
    ],
    esperado: {
      nodes: [
        n('k1', 'classe', 'Professor', 60, 40),
        n('k2', 'classe', 'Turma', 340, 40),
        n('k3', 'classe', 'Aluno', 620, 40),
        n('k4', 'classe', 'Aula', 340, 240),
      ],
      edges: [
        e('associacao', 'k1', 'k2', '1', '0..*'),
        e('associacao', 'k2', 'k3', '0..*', '1..*'),
        e('composicao', 'k2', 'k4', '1', '1..*'),
      ],
    },
  },
];

// Ordem de introdução na campanha (fáceis primeiro)
// Os pedidos de diagrama de classes vindos do backend entram intercalados, por dificuldade.
const ORDEM_CAMPANHA = [
  'cafeteria', 'idiomas', 'biblioteca', 'cooperativa', 'cinema', 'atlas', 'playlist', 'pizzaria',
  'lanchonete', 'rh', 'petshop', 'loja-online', 'banco', 'cinemateca', 'clinica', 'academia',
  'acervo', 'conservatorio', 'escola', 'frota',
];

export const modeloPorId = (id) => MODELOS.find((m) => m.id === id);

// Pedidos de um dia da campanha: 1 pedido nos primeiros dias, até 3 depois.
export function pedidosDoDia(dia) {
  const qtd = Math.min(3, 1 + Math.floor((dia - 1) / 4));
  const ids = [];
  for (let i = 0; i < qtd; i++) ids.push(ORDEM_CAMPANHA[(dia - 1 + i * 3) % ORDEM_CAMPANHA.length]);
  return ids;
}

// Pagamento cresce levemente com o dia
export const bonusDoDia = (dia) => 1 + (dia - 1) * 0.05;

// Multa por pedido perdido (recusado ou cliente que foi embora): metade do que ele pagaria.
// Quem já está devendo (saldo negativo no momento da multa) paga só um quarto.
export const MULTA = { normal: 0.5, emDivida: 0.25 };
export const multaPedido = (pedido, saldo = 0) => Math.round(pedido.recompensa * (saldo < 0 ? MULTA.emDivida : MULTA.normal));

// Paciência do cliente: segundos que ele espera o pedido ser aceito antes de ir embora.
// Nos dias mais avançados da campanha os clientes são mais apressados (mínimo de 1 minuto).
export const pacienciaDoDia = (dia = 1) => Math.max(60, 150 - (dia - 1) * 4);

export function criarPedido(modeloId, seq, dia = 1) {
  const m = modeloPorId(modeloId);
  return {
    id: `${modeloId}-${seq}`,
    modelo: modeloId,
    cliente: m.cliente,
    assunto: m.assunto,
    recompensa: Math.round(m.recompensa * bonusDoDia(dia)),
    tempo: m.tempo,
    tempoRestante: m.tempo,
    paciencia: pacienciaDoDia(dia), // segundos até o cliente desistir (só conta enquanto está "novo")
    pacienciaTotal: pacienciaDoDia(dia),
    status: 'novo', // novo | aceito | entregue | recusado | expirado (o cliente foi embora)
    pedacos: [], // pedaços da resposta já revelados na aba de dicas
  };
}

// Aba de dicas: a resposta é dividida numa grade; cada pedaço custa parte do pagamento
export const GRADE_PEDACOS = { colunas: 2, linhas: 2 };
export const TOTAL_PEDACOS = GRADE_PEDACOS.colunas * GRADE_PEDACOS.linhas;
export const precoPedaco = (pedido) => Math.max(10, Math.round(pedido.recompensa * 0.15));
