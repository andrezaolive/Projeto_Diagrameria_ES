import { nivelDoModelo, ordemPorDificuldade } from '../lib/dificuldade.js';
// Modelos de pedidos recebidos por e-mail. "esperado" é o diagrama-gabarito usado na avaliação.
// Coordenadas do gabarito já estão no grid (múltiplos de 20).

// w/h: só no sistema (fronteira), que tem tamanho próprio
const n = (id, tipo, rotulo, x, y, w, h) => ({ id, tipo, rotulo, x, y, ...(w ? { w, h } : {}) });
// multDe / multPara: multiplicidade em cada ponta (só associação, agregação e composição; ver lib/multiplicidade.js)
const e = (tipo, de, para, multDe, multPara) => ({
  id: `${de}-${tipo}-${para}`,
  tipo,
  de,
  para,
  ...(multDe ? { multDe } : {}),
  ...(multPara ? { multPara } : {}),
});
// Classe com atributos e métodos (uma linha UML por membro: "- saldo: float", "+ sacar(valor: float): bool")
const c = (id, rotulo, x, y, atributos = [], metodos = []) => ({ id, tipo: 'classe', rotulo, x, y, atributos, metodos });
// Transição do diagrama de estados: `evento` vai no rótulo da seta (vazio saindo do início e chegando ao fim)
const t = (de, para, evento = '') => ({ id: `${de}-transicao-${para}`, tipo: 'transicao', de, para, rotulo: evento });

export const MODELOS = [
  {
    id: 'biblioteca',
    cliente: 'Biblioteca Lua Cheia',
    assunto: 'Sistema de empréstimos',
    tempo: 270,
    recompensa: 120,
    corpo: [
      'Olá! Precisamos de um diagrama de casos de uso.',
      'O sistema se chama "Sistema da Biblioteca".',
      'Atores: "Aluno" e "Bibliotecário".',
      'O Aluno pode "Consultar acervo" e "Emprestar livro".',
      'O Bibliotecário participa de "Emprestar livro" e "Devolver livro".',
      'Todo empréstimo inclui "Verificar cadastro".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Sistema da Biblioteca', 140, 20, 460, 380),
        n('a1', 'ator', 'Aluno', 20, 140),
        n('a2', 'ator', 'Bibliotecário', 660, 200),
        n('c1', 'casoDeUso', 'Consultar acervo', 180, 80),
        n('c2', 'casoDeUso', 'Emprestar livro', 180, 200),
        n('c3', 'casoDeUso', 'Devolver livro', 180, 320),
        n('c4', 'casoDeUso', 'Verificar cadastro', 400, 200),
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
    tempo: 270,
    recompensa: 130,
    corpo: [
      'Boa noite! Queremos um diagrama de casos de uso do nosso app.',
      'O sistema se chama "App da Pizzaria".',
      'Atores: "Cliente" e "Entregador".',
      'O Cliente pode "Fazer pedido" e "Acompanhar entrega".',
      'Fazer pedido sempre inclui "Pagar".',
      'O Entregador realiza "Entregar pedido".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'App da Pizzaria', 140, 20, 460, 360),
        n('a1', 'ator', 'Cliente', 20, 120),
        n('a2', 'ator', 'Entregador', 660, 240),
        n('c1', 'casoDeUso', 'Fazer pedido', 180, 80),
        n('c2', 'casoDeUso', 'Acompanhar entrega', 180, 240),
        n('c3', 'casoDeUso', 'Pagar', 400, 80),
        n('c4', 'casoDeUso', 'Entregar pedido', 400, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c1', 'c3'),
        e('associacao', 'a2', 'c4'),
      ],
    },
  },
  {
    id: 'cinema',
    cliente: 'Cine Pastel',
    assunto: 'Venda de ingressos',
    tempo: 230,
    recompensa: 140,
    corpo: [
      'Oi! Precisamos modelar a venda online.',
      'O sistema se chama "Site do Cinema".',
      'Ator: "Cliente". Ele pode "Comprar ingresso".',
      'Comprar ingresso inclui "Escolher assento".',
      'Opcionalmente, "Aplicar cupom" estende Comprar ingresso.',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Site do Cinema', 140, 20, 460, 340),
        n('a1', 'ator', 'Cliente', 20, 140),
        n('c1', 'casoDeUso', 'Comprar ingresso', 180, 160),
        n('c2', 'casoDeUso', 'Escolher assento', 400, 80),
        n('c3', 'casoDeUso', 'Aplicar cupom', 400, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'),
        e('include', 'c1', 'c2'),
        e('extend', 'c3', 'c1'),
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
    tempo: 230,
    recompensa: 140,
    corpo: [
      'Prezados, precisamos do diagrama de casos de uso do caixa.',
      'O sistema se chama "Caixa Eletrônico".',
      'Ator: "Cliente". Ele pode "Sacar" e "Depositar".',
      'Tanto Sacar quanto Depositar incluem "Autenticar".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Caixa Eletrônico', 140, 20, 460, 340),
        n('a1', 'ator', 'Cliente', 20, 140),
        n('c1', 'casoDeUso', 'Sacar', 180, 80),
        n('c2', 'casoDeUso', 'Depositar', 180, 240),
        n('c3', 'casoDeUso', 'Autenticar', 400, 160),
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
    tempo: 270,
    recompensa: 150,
    corpo: [
      'E aí! Queremos um diagrama de casos de uso.',
      'O sistema se chama "Sistema da Academia".',
      'Atores: "Aluno" e "Instrutor".',
      'O Aluno pode "Matricular" e "Registrar presença".',
      'O Instrutor pode "Montar treino".',
      '"Avaliar físico" estende Montar treino.',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Sistema da Academia', 140, 20, 460, 380),
        n('a1', 'ator', 'Aluno', 20, 120),
        n('a2', 'ator', 'Instrutor', 660, 120),
        n('c1', 'casoDeUso', 'Matricular', 180, 80),
        n('c2', 'casoDeUso', 'Registrar presença', 180, 220),
        n('c3', 'casoDeUso', 'Montar treino', 400, 120),
        n('c4', 'casoDeUso', 'Avaliar físico', 400, 280),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c3'),
        e('extend', 'c4', 'c3'),
      ],
    },
  },
  {
    id: 'cafeteria',
    cliente: 'Café Lo-Fi',
    assunto: 'Cardápio digital',
    tempo: 210,
    recompensa: 110,
    corpo: [
      'Oi, pessoal da agência :)',
      'O sistema se chama "App da Cafeteria".',
      'Ator: "Cliente". Ele pode "Ver cardápio" e "Pedir café".',
      'Pedir café inclui "Pagar".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'App da Cafeteria', 140, 20, 460, 300),
        n('a1', 'ator', 'Cliente', 20, 120),
        n('c1', 'casoDeUso', 'Ver cardápio', 180, 80),
        n('c2', 'casoDeUso', 'Pedir café', 180, 200),
        n('c3', 'casoDeUso', 'Pagar', 400, 200),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c2', 'c3'),
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Casos de uso com dependência entre casos (um só acontece se o outro já existir/tiver acontecido).
  // Linha tracejada com seta: sai de quem depende e aponta para aquilo de que ele depende.
  {
    id: 'hotel',
    cliente: 'Hotel Brisa Lilás',
    assunto: 'Reservas online',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Olá! Queremos um diagrama de casos de uso das reservas.',
      'O sistema se chama "Sistema de Reservas".',
      'Atores: "Hóspede" e "Recepcionista".',
      'O Hóspede pode "Reservar quarto" e "Cancelar reserva".',
      'O Recepcionista faz o "Fazer check-in".',
      'Cancelar reserva depende de Reservar quarto, e Fazer check-in também depende de Reservar quarto (use dependência).',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Sistema de Reservas', 140, 20, 460, 360),
        n('a1', 'ator', 'Hóspede', 20, 120),
        n('a2', 'ator', 'Recepcionista', 660, 220),
        n('c1', 'casoDeUso', 'Reservar quarto', 180, 80),
        n('c2', 'casoDeUso', 'Cancelar reserva', 180, 240),
        n('c3', 'casoDeUso', 'Fazer check-in', 400, 240),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c3'),
        e('dependencia', 'c2', 'c1'), e('dependencia', 'c3', 'c1'),
      ],
    },
  },
  {
    id: 'streaming',
    cliente: 'Streaming Nébula',
    assunto: 'App de filmes e séries',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Oi! Precisamos do diagrama de casos de uso do nosso app.',
      'O sistema se chama "App de Streaming".',
      'Ator: "Assinante". Ele pode "Assinar plano", "Assistir filme" e "Baixar episódio".',
      'Assistir filme depende de Assinar plano, e Baixar episódio também depende de Assinar plano (use dependência).',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'App de Streaming', 140, 20, 460, 360),
        n('a1', 'ator', 'Assinante', 20, 160),
        n('c1', 'casoDeUso', 'Assinar plano', 400, 180),
        n('c2', 'casoDeUso', 'Assistir filme', 180, 100),
        n('c3', 'casoDeUso', 'Baixar episódio', 180, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('associacao', 'a1', 'c3'),
        e('dependencia', 'c2', 'c1'), e('dependencia', 'c3', 'c1'),
      ],
    },
  },
  {
    id: 'farmacia',
    cliente: 'Farmácia Lavanda',
    assunto: 'Venda de remédios',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Boa tarde! Queremos um diagrama de casos de uso da farmácia.',
      'O sistema se chama "Sistema da Farmácia".',
      'Atores: "Cliente" e "Farmacêutico".',
      'O Cliente pode "Comprar remédio". O Farmacêutico faz o "Validar receita".',
      'Comprar remédio depende de Validar receita (use dependência).',
      'Comprar remédio sempre inclui "Pagar".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Sistema da Farmácia', 140, 20, 460, 360),
        n('a1', 'ator', 'Cliente', 20, 120),
        n('a2', 'ator', 'Farmacêutico', 660, 200),
        n('c1', 'casoDeUso', 'Comprar remédio', 180, 80),
        n('c2', 'casoDeUso', 'Validar receita', 400, 200),
        n('c3', 'casoDeUso', 'Pagar', 180, 260),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a2', 'c2'),
        e('dependencia', 'c1', 'c2'),
        e('include', 'c1', 'c3'),
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Diagramas de estados: começam na bolinha preta (estado inicial) e terminam na bolinha com
  // anel (estado final). Transições levam o evento escrito na seta; saindo do início e chegando
  // ao fim não há evento.
  {
    id: 'rastreio',
    cliente: 'Entregas Cometa',
    assunto: 'Status da entrega',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Olá! Precisamos de um diagrama de estados das nossas entregas.',
      'Estados: "Recebido", "Em preparo", "A caminho", "Entregue" e "Cancelado".',
      'Tudo começa em Recebido.',
      'Recebido vai para Em preparo com o evento "confirmar". Em preparo vai para A caminho com "despachar". A caminho vai para Entregue com "entregar".',
      'Recebido também pode ir para Cancelado com o evento "cancelar".',
      'Entregue e Cancelado terminam o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Recebido', 100, 100),
        n('e2', 'estado', 'Em preparo', 340, 100),
        n('e3', 'estado', 'A caminho', 580, 100),
        n('e4', 'estado', 'Entregue', 580, 260),
        n('e5', 'estado', 'Cancelado', 100, 260),
        n('f', 'estadoFinal', 'Fim', 400, 380),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'confirmar'), t('e2', 'e3', 'despachar'), t('e3', 'e4', 'entregar'),
        t('e1', 'e5', 'cancelar'),
        t('e4', 'f'), t('e5', 'f'),
      ],
    },
  },
  {
    id: 'semaforo',
    cliente: 'Prefeitura de Vila Lilás',
    assunto: 'Semáforo inteligente',
    tempo: 240,
    recompensa: 130,
    corpo: [
      'Bom dia! Queremos o diagrama de estados do novo semáforo.',
      'Estados: "Vermelho", "Verde" e "Amarelo".',
      'O semáforo começa em Vermelho.',
      'Vermelho vai para Verde, Verde vai para Amarelo e Amarelo volta para Vermelho, sempre com o evento "tempo esgotado".',
      'Do Vermelho, o evento "desligar" encerra o funcionamento.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Vermelho', 100, 100),
        n('e2', 'estado', 'Verde', 400, 100),
        n('e3', 'estado', 'Amarelo', 260, 260),
        n('f', 'estadoFinal', 'Fim', 40, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'tempo esgotado'), t('e2', 'e3', 'tempo esgotado'), t('e3', 'e1', 'tempo esgotado'),
        t('e1', 'f', 'desligar'),
      ],
    },
  },
  {
    id: 'catraca',
    cliente: 'Metrô Aurora',
    assunto: 'Catraca da estação',
    tempo: 210,
    recompensa: 120,
    corpo: [
      'Oi! Precisamos do diagrama de estados da catraca.',
      'Estados: "Travada" e "Destravada". Ela começa Travada.',
      'Travada vai para Destravada com o evento "inserir bilhete".',
      'Destravada volta para Travada com o evento "passar".',
      'Travada termina com o evento "desativar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Travada', 100, 100),
        n('e2', 'estado', 'Destravada', 420, 100),
        n('f', 'estadoFinal', 'Fim', 160, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'inserir bilhete'), t('e2', 'e1', 'passar'),
        t('e1', 'f', 'desativar'),
      ],
    },
  },
  {
    id: 'player',
    cliente: 'Rádio Vinil Roxo',
    assunto: 'Player de música',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'E aí! Queremos o diagrama de estados do nosso player.',
      'Estados: "Parado", "Tocando" e "Pausado". O player começa Parado.',
      'Parado vai para Tocando com "play". Tocando vai para Pausado com "pause", e Pausado volta para Tocando com "play".',
      'Tocando volta para Parado com "stop".',
      'Parado termina com o evento "fechar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Parado', 100, 100),
        n('e2', 'estado', 'Tocando', 420, 100),
        n('e3', 'estado', 'Pausado', 420, 280),
        n('f', 'estadoFinal', 'Fim', 160, 300),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'play'), t('e2', 'e3', 'pause'), t('e3', 'e2', 'play'), t('e2', 'e1', 'stop'),
        t('e1', 'f', 'fechar'),
      ],
    },
  },
  {
    id: 'chamado',
    cliente: 'Suporte Nuvem Roxa',
    assunto: 'Chamados de suporte',
    tempo: 270,
    recompensa: 160,
    corpo: [
      'Olá! Precisamos do diagrama de estados de um chamado de suporte.',
      'Estados: "Aberto", "Em atendimento" e "Resolvido". Todo chamado começa Aberto.',
      'Aberto vai para Em atendimento com "atribuir". Em atendimento vai para Resolvido com "resolver".',
      'Resolvido pode voltar para Em atendimento com "reabrir".',
      'Resolvido termina com o evento "fechar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Aberto', 100, 100),
        n('e2', 'estado', 'Em atendimento', 400, 100),
        n('e3', 'estado', 'Resolvido', 400, 280),
        n('f', 'estadoFinal', 'Fim', 700, 300),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'atribuir'), t('e2', 'e3', 'resolver'), t('e3', 'e2', 'reabrir'),
        t('e3', 'f', 'fechar'),
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Classes com atributos e métodos (avaliados: nome e tipo de cada membro, na classe certa).
  // As ligações nascem dos membros: atributo do tipo de outra classe → associação; outra classe
  // só como parâmetro de método → dependência. Os três últimos focam em composição.
  {
    id: 'conta-bancaria',
    cliente: 'Banco Lilás',
    assunto: 'Contas e clientes',
    tempo: 330,
    recompensa: 190,
    corpo: [
      'Olá! Precisamos de um diagrama de classes com atributos e métodos.',
      'Classe "Cliente" com os atributos "- nome: String" e "- cpf: String".',
      'Classe "ContaBancaria" com os atributos "- numero: String", "- saldo: float" e "- titular: Cliente".',
      'Métodos de ContaBancaria: "+ depositar(valor: float)", "+ sacar(valor: float): bool" e "+ consultarSaldo(): float".',
      'Como o titular é um Cliente, ContaBancaria se associa a Cliente.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Cliente', 40, 60, ['- nome: String', '- cpf: String']),
        c('k2', 'ContaBancaria', 400, 60,
          ['- numero: String', '- saldo: float', '- titular: Cliente'],
          ['+ depositar(valor: float)', '+ sacar(valor: float): bool', '+ consultarSaldo(): float']),
      ],
      edges: [e('associacao', 'k2', 'k1')],
    },
  },
  {
    id: 'emprestimo',
    cliente: 'Biblioteca Pixel Azul',
    assunto: 'Empréstimos com prazo',
    tempo: 360,
    recompensa: 210,
    corpo: [
      'Oi! Queremos um diagrama de classes dos empréstimos, com atributos e métodos.',
      'Classe "Livro" com "- titulo: String" e "- isbn: String".',
      'Classe "Leitor" com "- nome: String" e "- matricula: int".',
      'Classe "Emprestimo" com os atributos "- dataRetirada: Date", "- livro: Livro" e "- leitor: Leitor", e os métodos "+ renovar(): bool" e "+ calcularMulta(dias: int): float".',
      'Os atributos livro e leitor ligam Emprestimo a Livro e a Leitor por associação.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Livro', 40, 40, ['- titulo: String', '- isbn: String']),
        c('k2', 'Leitor', 40, 280, ['- nome: String', '- matricula: int']),
        c('k3', 'Emprestimo', 400, 140,
          ['- dataRetirada: Date', '- livro: Livro', '- leitor: Leitor'],
          ['+ renovar(): bool', '+ calcularMulta(dias: int): float']),
      ],
      edges: [e('associacao', 'k3', 'k1'), e('associacao', 'k3', 'k2')],
    },
  },
  {
    id: 'locadora',
    cliente: 'Locadora Veloz Roxa',
    assunto: 'Relatório de aluguéis',
    tempo: 300,
    recompensa: 180,
    corpo: [
      'Boa tarde! Precisamos de um diagrama de classes com atributos e métodos.',
      'Classe "Carro" com "- placa: String" e "- modelo: String", e os métodos "+ alugar()" e "+ devolver()".',
      'Classe "RelatorioLocacao" com o atributo "- dataGeracao: Date" e o método "+ gerar(carro: Carro): String".',
      'O RelatorioLocacao só usa Carro como parâmetro do método gerar: ele depende de Carro (use dependência, saindo do relatório).',
    ],
    esperado: {
      nodes: [
        c('k1', 'Carro', 40, 60, ['- placa: String', '- modelo: String'], ['+ alugar()', '+ devolver()']),
        c('k2', 'RelatorioLocacao', 420, 60, ['- dataGeracao: Date'], ['+ gerar(carro: Carro): String']),
      ],
      edges: [e('dependencia', 'k2', 'k1')],
    },
  },
  {
    id: 'comanda',
    cliente: 'Bistrô Ametista',
    assunto: 'Comandas da cozinha',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Olá! Precisamos do diagrama de classes das comandas, com atributos e métodos.',
      'Classe "Comanda" com "- mesa: int" e "- aberta: bool", e os métodos "+ adicionarItem(item: ItemComanda)" e "+ calcularTotal(): float".',
      'Classe "ItemComanda" com "- quantidade: int" e "- produto: Produto", e o método "+ subtotal(): float".',
      'Classe "Produto" com "- nome: String" e "- preco: float".',
      'A Comanda é composta de ItemComanda (sem a comanda, os itens não existem): cada Comanda tem 1..* itens e cada item pertence a 1 comanda.',
      'ItemComanda se associa a Produto pelo atributo produto.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Comanda', 40, 40, ['- mesa: int', '- aberta: bool'], ['+ adicionarItem(item: ItemComanda)', '+ calcularTotal(): float']),
        c('k2', 'ItemComanda', 500, 40, ['- quantidade: int', '- produto: Produto'], ['+ subtotal(): float']),
        c('k3', 'Produto', 500, 300, ['- nome: String', '- preco: float']),
      ],
      edges: [e('composicao', 'k1', 'k2', '1', '1..*'), e('associacao', 'k2', 'k3')],
    },
  },
  {
    id: 'casa',
    cliente: 'Construtora Pedra Lilás',
    assunto: 'Projeto de casas',
    tempo: 300,
    recompensa: 190,
    corpo: [
      'Oi! Queremos um diagrama de classes das nossas plantas, com atributos e métodos.',
      'Classe "Casa" com "- endereco: String" e os métodos "+ adicionarComodo(comodo: Comodo)" e "+ calcularArea(): float".',
      'Classe "Comodo" com "- nome: String" e "- area: float".',
      'A Casa é composta de Comodo: se a casa é demolida, os cômodos deixam de existir (composição, com o losango cheio na Casa).',
    ],
    esperado: {
      nodes: [
        c('k1', 'Casa', 40, 60, ['- endereco: String'], ['+ adicionarComodo(comodo: Comodo)', '+ calcularArea(): float']),
        c('k2', 'Comodo', 480, 60, ['- nome: String', '- area: float']),
      ],
      edges: [e('composicao', 'k1', 'k2')],
    },
  },
  {
    id: 'curso-online',
    cliente: 'Escola Nebulosa',
    assunto: 'Cursos, módulos e aulas',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Olá! Precisamos de um diagrama de classes da plataforma de cursos, com atributos e métodos.',
      'Classe "Curso" com "- titulo: String" e "- cargaHoraria: int", e o método "+ publicar()".',
      'Classe "Modulo" com "- titulo: String" e "- ordem: int".',
      'Classe "Aula" com "- titulo: String" e "- duracao: int", e o método "+ assistir()".',
      'O Curso é composto de Modulo, e o Modulo é composto de Aula (apagar o curso apaga os módulos e as aulas).',
    ],
    esperado: {
      nodes: [
        c('k1', 'Curso', 40, 60, ['- titulo: String', '- cargaHoraria: int'], ['+ publicar()']),
        c('k2', 'Modulo', 380, 60, ['- titulo: String', '- ordem: int']),
        c('k3', 'Aula', 700, 60, ['- titulo: String', '- duracao: int'], ['+ assistir()']),
      ],
      edges: [e('composicao', 'k1', 'k2'), e('composicao', 'k2', 'k3')],
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

export const modeloPorId = (id) => MODELOS.find((m) => m.id === id);

// Ordem de introdução na campanha: por dificuldade (lib/dificuldade.js), alternando os tipos de diagrama.
export const ORDEM_CAMPANHA = ordemPorDificuldade(MODELOS);
// Depois que todos os pedidos já apareceram, a campanha repete só os médios e difíceis
const REPETICAO = ORDEM_CAMPANHA.filter((id) => nivelDoModelo(modeloPorId(id)).id !== 'facil');


// Pedidos de um dia da campanha: 1 pedido nos primeiros dias, até 3 depois. Os dias seguem a
// ORDEM_CAMPANHA em sequência (cada dia continua de onde o anterior parou), então todos os modelos
// aparecem, do fácil ao difícil; depois disso, só médios e difíceis.
export const pedidosNoDia = (dia) => Math.min(3, 1 + Math.floor((dia - 1) / 4));
export function pedidosDoDia(dia) {
  let inicio = 0;
  for (let d = 1; d < dia; d++) inicio += pedidosNoDia(d);
  return Array.from({ length: pedidosNoDia(dia) }, (_, i) => {
    const k = inicio + i;
    return k < ORDEM_CAMPANHA.length ? ORDEM_CAMPANHA[k] : REPETICAO[(k - ORDEM_CAMPANHA.length) % REPETICAO.length];
  });
}

// Pagamento cresce levemente com o dia
export const bonusDoDia = (dia) => 1 + (dia - 1) * 0.05;

// Multa por pedido perdido (recusado ou cliente que foi embora): metade do que ele pagaria.
// Quem já está devendo (saldo negativo no momento da multa) paga só um quarto.
// Urgente perdido ou recusado: só 20% (com ou sem dívida)
export const MULTA = { normal: 0.5, emDivida: 0.25, urgente: 0.2 };
export const taxaDeMulta = (pedido, saldo = 0) => (pedido.urgente ? MULTA.urgente : saldo < 0 ? MULTA.emDivida : MULTA.normal);
export const multaPedido = (pedido, saldo = 0) => Math.round(pedido.recompensa * taxaDeMulta(pedido, saldo));

// Campanha: o 1º pedido do dia chega na hora; cada seguinte chega de 45 s a 90 s depois do anterior
// (ou na hora, se o jogador não tiver mais nenhum pedido em aberto). `sorteio` em [0, 1).
export const CHEGADA = { min: 45, max: 90 };
export const intervaloChegada = (sorteio = 0.5) => CHEGADA.min + Math.round(Math.min(1, Math.max(0, sorteio)) * (CHEGADA.max - CHEGADA.min));

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

// ---------------------------------------------------------------------------
// Pedido urgente: a cada minuto de jogo (relógio rodando) há 1 chance em 3 de chegar um, se não
// houver outro urgente na fila. Paga mais, mas o cliente espera pouco e o prazo de entrega é curto.
export const URGENTE = {
  intervalo: 60, // segundos de jogo entre sorteios
  chance: 1 / 3,
  pagamento: 1.8, // × recompensa normal
  prazo: 0.5, // × tempo de entrega normal
  paciencia: 0.35, // × paciência normal
  prazoMinimo: 45,
  pacienciaMinima: 20,
};

export function criarPedidoUrgente(modeloId, seq, dia = 1) {
  const p = criarPedido(modeloId, seq, dia);
  const tempo = Math.max(URGENTE.prazoMinimo, Math.round(p.tempo * URGENTE.prazo));
  const paciencia = Math.max(URGENTE.pacienciaMinima, Math.round(p.pacienciaTotal * URGENTE.paciencia));
  return {
    ...p,
    id: `urgente-${p.id}`,
    urgente: true,
    assunto: `URGENTE: ${p.assunto}`,
    recompensa: Math.round(p.recompensa * URGENTE.pagamento),
    tempo,
    tempoRestante: tempo,
    paciencia,
    pacienciaTotal: paciencia,
  };
}

// Aba de dicas: a resposta é dividida numa grade; cada pedaço custa parte do pagamento
export const GRADE_PEDACOS = { colunas: 2, linhas: 2 };
export const TOTAL_PEDACOS = GRADE_PEDACOS.colunas * GRADE_PEDACOS.linhas;
export const precoPedaco = (pedido) => Math.max(10, Math.round(pedido.recompensa * 0.15));
