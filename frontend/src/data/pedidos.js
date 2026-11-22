import { composicaoDoDia, composicaoDoFimDeSemana, nivelDoModelo } from '../lib/dificuldade.js';
import { tipoDoDiagrama } from '../lib/categorias.js';
import { c, e, n, t } from './gabarito.js';
import { COMPLEXOS } from './complexos.js';
// Modelos de pedidos recebidos por e-mail. "esperado" é o diagrama-gabarito usado na avaliação.
// Coordenadas do gabarito já estão no grid (múltiplos de 20).

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
  // Mais casos de uso (fáceis, médios e difíceis)
  {
    id: 'floricultura',
    cliente: 'Floricultura Orvalho',
    assunto: 'Encomenda de buquês',
    tempo: 210,
    recompensa: 110,
    corpo: [
      'Olá! Queremos um diagrama de casos de uso da nossa loja de flores.',
      'O sistema se chama "Site da Floricultura".',
      'Ator: "Cliente". Ele pode "Ver buquês" e "Encomendar buquê".',
      'Encomendar buquê sempre inclui "Pagar".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Site da Floricultura', 140, 20, 460, 300),
        n('a1', 'ator', 'Cliente', 20, 120),
        n('c1', 'casoDeUso', 'Ver buquês', 180, 80),
        n('c2', 'casoDeUso', 'Encomendar buquê', 180, 200),
        n('c3', 'casoDeUso', 'Pagar', 400, 120),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c2', 'c3'),
      ],
    },
  },
  {
    id: 'yoga',
    cliente: 'Estúdio Yoga Incenso',
    assunto: 'Agenda de aulas',
    tempo: 180,
    recompensa: 100,
    corpo: [
      'Namastê! Precisamos de um diagrama de casos de uso bem simples.',
      'O sistema se chama "App do Estúdio".',
      'Ator: "Aluno". Ele pode "Ver horários" e "Agendar aula".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'App do Estúdio', 140, 20, 460, 260),
        n('a1', 'ator', 'Aluno', 20, 100),
        n('c1', 'casoDeUso', 'Ver horários', 180, 80),
        n('c2', 'casoDeUso', 'Agendar aula', 180, 180),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
      ],
    },
  },
  {
    id: 'sorveteria',
    cliente: 'Sorveteria Nuvem Doce',
    assunto: 'Pedidos no balcão',
    tempo: 210,
    recompensa: 120,
    corpo: [
      'Oi! Queremos o diagrama de casos de uso da sorveteria.',
      'O sistema se chama "Balcão Digital".',
      'Atores: "Cliente" e "Atendente".',
      'O Cliente pode "Ver sabores" e "Pedir sorvete".',
      'O Atendente também participa de "Pedir sorvete".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Balcão Digital', 140, 20, 460, 280),
        n('a1', 'ator', 'Cliente', 20, 100),
        n('a2', 'ator', 'Atendente', 660, 140),
        n('c1', 'casoDeUso', 'Ver sabores', 180, 80),
        n('c2', 'casoDeUso', 'Pedir sorvete', 300, 200),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c2'),
      ],
    },
  },
  {
    id: 'papelaria',
    cliente: 'Papelaria Washi',
    assunto: 'Lojinha online',
    tempo: 180,
    recompensa: 100,
    corpo: [
      'Olá! Precisamos de um diagrama de casos de uso da nossa lojinha.',
      'O sistema se chama "Loja da Papelaria".',
      'Ator: "Cliente". Ele pode "Comprar caderno".',
      'Comprar caderno inclui "Pagar".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Loja da Papelaria', 140, 20, 460, 240),
        n('a1', 'ator', 'Cliente', 20, 80),
        n('c1', 'casoDeUso', 'Comprar caderno', 180, 80),
        n('c2', 'casoDeUso', 'Pagar', 400, 160),
      ],
      edges: [
        e('associacao', 'a1', 'c1'),
        e('include', 'c1', 'c2'),
      ],
    },
  },
  {
    id: 'observatorio',
    cliente: 'Observatório Céu Lilás',
    assunto: 'Visitas noturnas',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Boa noite! Queremos o diagrama de casos de uso das visitas ao observatório.',
      'O sistema se chama "Agenda do Observatório".',
      'Atores: "Visitante" e "Guia".',
      'O Visitante pode "Ver eventos" e "Agendar visita".',
      'Agendar visita sempre inclui "Escolher horário".',
      'O Guia realiza "Conduzir visita".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Agenda do Observatório', 140, 20, 460, 360),
        n('a1', 'ator', 'Visitante', 20, 120),
        n('a2', 'ator', 'Guia', 660, 220),
        n('c1', 'casoDeUso', 'Ver eventos', 180, 80),
        n('c2', 'casoDeUso', 'Agendar visita', 180, 240),
        n('c3', 'casoDeUso', 'Escolher horário', 400, 80),
        n('c4', 'casoDeUso', 'Conduzir visita', 400, 240),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c2', 'c3'),
        e('associacao', 'a2', 'c4'),
      ],
    },
  },
  {
    id: 'aquario',
    cliente: 'Aquário Água-Viva',
    assunto: 'Bilheteria',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Olá! Precisamos do diagrama de casos de uso da bilheteria.',
      'O sistema se chama "Bilheteria do Aquário".',
      'Atores: "Visitante" e "Funcionário".',
      'O Visitante pode "Comprar ingresso" e "Ver programação".',
      'Opcionalmente, "Usar meia-entrada" estende Comprar ingresso.',
      'O Funcionário faz o "Validar ingresso".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Bilheteria do Aquário', 140, 20, 460, 360),
        n('a1', 'ator', 'Visitante', 20, 120),
        n('a2', 'ator', 'Funcionário', 660, 220),
        n('c1', 'casoDeUso', 'Comprar ingresso', 180, 140),
        n('c2', 'casoDeUso', 'Ver programação', 180, 280),
        n('c3', 'casoDeUso', 'Usar meia-entrada', 400, 60),
        n('c4', 'casoDeUso', 'Validar ingresso', 400, 240),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('extend', 'c3', 'c1'),
        e('associacao', 'a2', 'c4'),
      ],
    },
  },
  {
    id: 'spa',
    cliente: 'Spa Lótus Rosa',
    assunto: 'Agendamentos',
    tempo: 270,
    recompensa: 160,
    corpo: [
      'Oi! Queremos o diagrama de casos de uso do nosso spa.',
      'O sistema se chama "Agenda do Spa".',
      'Atores: "Cliente" e "Terapeuta".',
      'O Cliente pode "Comprar pacote" e "Agendar massagem".',
      'Agendar massagem sempre inclui "Escolher terapeuta".',
      'O Terapeuta faz o "Confirmar horário".',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Agenda do Spa', 140, 20, 460, 360),
        n('a1', 'ator', 'Cliente', 20, 120),
        n('a2', 'ator', 'Terapeuta', 660, 220),
        n('c1', 'casoDeUso', 'Comprar pacote', 180, 80),
        n('c2', 'casoDeUso', 'Agendar massagem', 180, 240),
        n('c3', 'casoDeUso', 'Escolher terapeuta', 400, 80),
        n('c4', 'casoDeUso', 'Confirmar horário', 400, 240),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c2', 'c3'),
        e('associacao', 'a2', 'c4'),
      ],
    },
  },
  {
    id: 'padaria',
    cliente: 'Padaria Fermento Lunar',
    assunto: 'Encomenda de bolos',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Bom dia! Precisamos do diagrama de casos de uso das encomendas.',
      'O sistema se chama "Site da Padaria".',
      'Ator: "Cliente". Ele pode "Ver vitrine" e "Encomendar bolo".',
      'Encomendar bolo sempre inclui "Pagar".',
      'Opcionalmente, "Escrever mensagem" estende Encomendar bolo.',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Site da Padaria', 140, 20, 460, 360),
        n('a1', 'ator', 'Cliente', 20, 140),
        n('c1', 'casoDeUso', 'Ver vitrine', 180, 80),
        n('c2', 'casoDeUso', 'Encomendar bolo', 180, 220),
        n('c3', 'casoDeUso', 'Pagar', 400, 140),
        n('c4', 'casoDeUso', 'Escrever mensagem', 400, 280),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('include', 'c2', 'c3'),
        e('extend', 'c4', 'c2'),
      ],
    },
  },
  {
    id: 'atelie',
    cliente: 'Ateliê Aquarela',
    assunto: 'Oficinas de pintura',
    tempo: 360,
    recompensa: 210,
    corpo: [
      'Olá! Queremos o diagrama de casos de uso das nossas oficinas.',
      'O sistema se chama "Portal do Ateliê".',
      'Atores: "Aluno" e "Professor".',
      'O Aluno pode "Fazer inscrição" e "Enviar trabalho". O Professor pode "Corrigir trabalho" e "Criar oficina".',
      'Fazer inscrição sempre inclui "Pagar".',
      'Enviar trabalho depende de Fazer inscrição, e Corrigir trabalho depende de Enviar trabalho (use dependência).',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Portal do Ateliê', 140, 20, 460, 440),
        n('a1', 'ator', 'Aluno', 20, 160),
        n('a2', 'ator', 'Professor', 660, 300),
        n('c1', 'casoDeUso', 'Fazer inscrição', 180, 140),
        n('c2', 'casoDeUso', 'Enviar trabalho', 180, 260),
        n('c3', 'casoDeUso', 'Pagar', 400, 60),
        n('c4', 'casoDeUso', 'Corrigir trabalho', 400, 260),
        n('c5', 'casoDeUso', 'Criar oficina', 400, 380),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c4'), e('associacao', 'a2', 'c5'),
        e('include', 'c1', 'c3'),
        e('dependencia', 'c2', 'c1'), e('dependencia', 'c4', 'c2'),
      ],
    },
  },
  {
    id: 'viagens',
    cliente: 'Viagens Pôr do Sol',
    assunto: 'Pacotes de viagem',
    tempo: 360,
    recompensa: 210,
    corpo: [
      'Oi! Precisamos do diagrama de casos de uso da agência de viagens.',
      'O sistema se chama "Site de Viagens".',
      'Atores: "Viajante" e "Agente".',
      'O Viajante pode "Buscar pacote" e "Reservar viagem".',
      'Reservar viagem sempre inclui "Pagar", e "Contratar seguro" estende Reservar viagem (é opcional).',
      'O Agente faz o "Confirmar reserva", que depende de Reservar viagem (use dependência).',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'Site de Viagens', 140, 20, 460, 440),
        n('a1', 'ator', 'Viajante', 20, 120),
        n('a2', 'ator', 'Agente', 660, 260),
        n('c1', 'casoDeUso', 'Buscar pacote', 180, 60),
        n('c2', 'casoDeUso', 'Reservar viagem', 180, 200),
        n('c3', 'casoDeUso', 'Pagar', 400, 100),
        n('c4', 'casoDeUso', 'Contratar seguro', 180, 340),
        n('c5', 'casoDeUso', 'Confirmar reserva', 400, 280),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
        e('associacao', 'a2', 'c5'),
        e('include', 'c2', 'c3'),
        e('extend', 'c4', 'c2'),
        e('dependencia', 'c5', 'c2'),
      ],
    },
  },
  {
    id: 'coworking',
    cliente: 'Coworking Horizonte',
    assunto: 'Reserva de espaços',
    tempo: 390,
    recompensa: 220,
    corpo: [
      'Olá! Queremos o diagrama de casos de uso do nosso coworking.',
      'O sistema se chama "App do Coworking".',
      'Atores: "Membro" e "Recepcionista".',
      'O Membro pode "Reservar sala", "Reservar mesa" e "Cancelar reserva".',
      'Reservar sala sempre inclui "Pagar".',
      'Cancelar reserva depende de Reservar mesa. O Recepcionista faz o "Liberar acesso", que também depende de Reservar mesa (use dependência).',
    ],
    esperado: {
      nodes: [
        n('s1', 'sistema', 'App do Coworking', 140, 20, 460, 440),
        n('a1', 'ator', 'Membro', 20, 160),
        n('a2', 'ator', 'Recepcionista', 660, 260),
        n('c1', 'casoDeUso', 'Reservar sala', 180, 60),
        n('c2', 'casoDeUso', 'Reservar mesa', 180, 200),
        n('c3', 'casoDeUso', 'Cancelar reserva', 180, 340),
        n('c4', 'casoDeUso', 'Pagar', 400, 140),
        n('c5', 'casoDeUso', 'Liberar acesso', 400, 280),
      ],
      edges: [
        e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('associacao', 'a1', 'c3'),
        e('associacao', 'a2', 'c5'),
        e('include', 'c1', 'c4'),
        e('dependencia', 'c3', 'c2'), e('dependencia', 'c5', 'c2'),
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
  // Estados com decisão (losango): a pergunta fica dentro do losango e cada seta que sai leva a
  // condição entre colchetes ("[sim]" / "[não]"; na nota os colchetes são opcionais).
  {
    id: 'login-app',
    cliente: 'Banco Estrela Roxa',
    assunto: 'Login do aplicativo',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Olá! Precisamos do diagrama de estados do login do nosso app.',
      'Estados: "Digitando senha", "Logado" e "Bloqueado". Tudo começa em Digitando senha.',
      'Com o evento "enviar", o app chega a uma decisão (losango) com a pergunta "Senha certa?".',
      'Da decisão, com a condição "[sim]" vai para Logado; com "[não]" volta para Digitando senha.',
      'Digitando senha vai para Bloqueado com o evento "errar 3 vezes".',
      'Logado termina com o evento "sair", e Bloqueado termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Digitando senha', 100, 100),
        n('d', 'decisao', 'Senha certa?', 400, 80),
        n('e2', 'estado', 'Logado', 700, 100),
        n('e3', 'estado', 'Bloqueado', 100, 260),
        n('f', 'estadoFinal', 'Fim', 480, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd', 'enviar'), t('d', 'e2', '[sim]'), t('d', 'e1', '[não]'),
        t('e1', 'e3', 'errar 3 vezes'),
        t('e2', 'f', 'sair'), t('e3', 'f'),
      ],
    },
  },
  {
    id: 'pagamento',
    cliente: 'Loja Pixel Lilás',
    assunto: 'Pagamento do pedido',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Oi! Queremos o diagrama de estados do pagamento dos pedidos da loja.',
      'Estados: "Aguardando pagamento", "Pago" e "Recusado". O pedido começa em Aguardando pagamento.',
      'Com o evento "pagar", o pedido passa por uma decisão (losango): "Aprovado?".',
      'Com a condição "[sim]" vai para Pago; com "[não]" vai para Recusado.',
      'Recusado volta para Aguardando pagamento com "tentar de novo", ou termina com "desistir".',
      'Pago termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Aguardando pagamento', 100, 100),
        n('d', 'decisao', 'Aprovado?', 480, 80),
        n('e2', 'estado', 'Pago', 740, 100),
        n('e3', 'estado', 'Recusado', 480, 260),
        n('f', 'estadoFinal', 'Fim', 800, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd', 'pagar'), t('d', 'e2', '[sim]'), t('d', 'e3', '[não]'),
        t('e3', 'e1', 'tentar de novo'),
        t('e2', 'f'), t('e3', 'f', 'desistir'),
      ],
    },
  },
  {
    id: 'devolucao',
    cliente: 'Biblioteca Pixel Azul',
    assunto: 'Devolução de livros',
    tempo: 270,
    recompensa: 160,
    corpo: [
      'Olá! Precisamos do diagrama de estados de um livro na devolução.',
      'Estados: "Emprestado", "Disponível" e "Com multa". O livro começa Emprestado.',
      'Com o evento "devolver", há uma decisão (losango): "No prazo?".',
      'Com a condição "[sim]" o livro fica Disponível; com "[não]" fica Com multa.',
      'Com multa vai para Disponível com o evento "pagar multa".',
      'Disponível termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Emprestado', 100, 100),
        n('d', 'decisao', 'No prazo?', 380, 80),
        n('e2', 'estado', 'Disponível', 640, 100),
        n('e3', 'estado', 'Com multa', 380, 260),
        n('f', 'estadoFinal', 'Fim', 700, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd', 'devolver'), t('d', 'e2', '[sim]'), t('d', 'e3', '[não]'),
        t('e3', 'e2', 'pagar multa'),
        t('e2', 'f'),
      ],
    },
  },
  {
    id: 'encomenda',
    cliente: 'Peças e Pixels',
    assunto: 'Separação de encomendas',
    tempo: 330,
    recompensa: 180,
    corpo: [
      'Bom dia! Queremos o diagrama de estados das encomendas do nosso depósito.',
      'Estados: "Recebido", "Separando", "Aguardando estoque" e "Enviado". Toda encomenda começa em Recebido.',
      'Com o evento "conferir", a encomenda passa por uma decisão (losango): "Tem estoque?".',
      'Com a condição "[sim]" vai para Separando; com "[não]" vai para Aguardando estoque.',
      'Aguardando estoque volta para Recebido com o evento "chegar produto".',
      'Separando vai para Enviado com "despachar", e Enviado termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Recebido', 100, 100),
        n('d', 'decisao', 'Tem estoque?', 400, 80),
        n('e2', 'estado', 'Separando', 700, 100),
        n('e3', 'estado', 'Aguardando estoque', 380, 260),
        n('e4', 'estado', 'Enviado', 700, 260),
        n('f', 'estadoFinal', 'Fim', 940, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd', 'conferir'), t('d', 'e2', '[sim]'), t('d', 'e3', '[não]'),
        t('e3', 'e1', 'chegar produto'),
        t('e2', 'e4', 'despachar'), t('e4', 'f'),
      ],
    },
  },
  {
    id: 'caixa-eletronico',
    cliente: 'Rede Caixa Lua',
    assunto: 'Saque no caixa eletrônico',
    tempo: 390,
    recompensa: 220,
    corpo: [
      'Oi! Queremos o diagrama de estados do nosso caixa eletrônico. Ele tem duas decisões (losangos).',
      'Estados: "Ocioso", "Aguardando saque" e "Entregando dinheiro". O caixa começa Ocioso.',
      'Com o evento "inserir cartão", ele chega à decisão "Senha certa?": com "[sim]" vai para Aguardando saque; com "[não]" volta para Ocioso.',
      'Em Aguardando saque, o evento "pedir saque" leva à decisão "Tem saldo?": com "[sim]" vai para Entregando dinheiro; com "[não]" volta para Aguardando saque.',
      'Entregando dinheiro volta para Ocioso com o evento "retirar dinheiro".',
      'Ocioso termina com o evento "desligar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Ocioso', 100, 100),
        n('d1', 'decisao', 'Senha certa?', 420, 80),
        n('e2', 'estado', 'Aguardando saque', 720, 100),
        n('d2', 'decisao', 'Tem saldo?', 900, 260),
        n('e3', 'estado', 'Entregando dinheiro', 520, 280),
        n('f', 'estadoFinal', 'Fim', 40, 300),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd1', 'inserir cartão'), t('d1', 'e2', '[sim]'), t('d1', 'e1', '[não]'),
        t('e2', 'd2', 'pedir saque'), t('d2', 'e3', '[sim]'), t('d2', 'e2', '[não]'),
        t('e3', 'e1', 'retirar dinheiro'),
        t('e1', 'f', 'desligar'),
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Mais diagramas de estados (fáceis, médios e difíceis; os três últimos com decisão)
  {
    id: 'luminaria',
    cliente: 'Luminária Vagalume',
    assunto: 'Luminária de toque',
    tempo: 210,
    recompensa: 120,
    corpo: [
      'Oi! Queremos o diagrama de estados da nossa luminária de toque.',
      'Estados: "Apagada" e "Acesa". Ela começa Apagada.',
      'Apagada vai para Acesa com o evento "tocar", e Acesa volta para Apagada também com "tocar".',
      'Apagada termina com o evento "desconectar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Apagada', 100, 100),
        n('e2', 'estado', 'Acesa', 420, 100),
        n('f', 'estadoFinal', 'Fim', 160, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'tocar'), t('e2', 'e1', 'tocar'),
        t('e1', 'f', 'desconectar'),
      ],
    },
  },
  {
    id: 'chaleira',
    cliente: 'Chaleira Sereno',
    assunto: 'Chaleira elétrica',
    tempo: 210,
    recompensa: 120,
    corpo: [
      'Olá! Precisamos do diagrama de estados da nossa chaleira.',
      'Estados: "Desligada", "Aquecendo" e "Pronta". A chaleira começa Desligada.',
      'Desligada vai para Aquecendo com "ligar". Aquecendo vai para Pronta com "ferver".',
      'Pronta termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Desligada', 100, 100),
        n('e2', 'estado', 'Aquecendo', 380, 100),
        n('e3', 'estado', 'Pronta', 380, 260),
        n('f', 'estadoFinal', 'Fim', 180, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'ligar'), t('e2', 'e3', 'ferver'),
        t('e3', 'f'),
      ],
    },
  },
  {
    id: 'fliperama',
    cliente: 'Fliperama Algodão Doce',
    assunto: 'Máquina de fliperama',
    tempo: 210,
    recompensa: 120,
    corpo: [
      'E aí! Queremos o diagrama de estados da nossa máquina de fliperama.',
      'Estados: "Esperando ficha" e "Jogando". A máquina começa em Esperando ficha.',
      'Esperando ficha vai para Jogando com "inserir ficha". Jogando volta para Esperando ficha com "fim de jogo".',
      'Esperando ficha termina com o evento "desligar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Esperando ficha', 100, 100),
        n('e2', 'estado', 'Jogando', 440, 100),
        n('f', 'estadoFinal', 'Fim', 180, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'inserir ficha'), t('e2', 'e1', 'fim de jogo'),
        t('e1', 'f', 'desligar'),
      ],
    },
  },
  {
    id: 'estufa',
    cliente: 'Estufa Hortelã',
    assunto: 'Irrigação automática',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Olá! Precisamos do diagrama de estados da irrigação da estufa.',
      'Estados: "Seca", "Regando" e "Úmida". A estufa começa Seca.',
      'Seca vai para Regando com "ativar". Regando vai para Úmida com "encher". Úmida volta para Seca com "evaporar".',
      'Úmida termina com o evento "desligar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Seca', 100, 100),
        n('e2', 'estado', 'Regando', 400, 100),
        n('e3', 'estado', 'Úmida', 400, 260),
        n('f', 'estadoFinal', 'Fim', 700, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'ativar'), t('e2', 'e3', 'encher'), t('e3', 'e1', 'evaporar'),
        t('e3', 'f', 'desligar'),
      ],
    },
  },
  {
    id: 'pousada',
    cliente: 'Pousada Maré Mansa',
    assunto: 'Quartos da pousada',
    tempo: 270,
    recompensa: 160,
    corpo: [
      'Bom dia! Queremos o diagrama de estados de um quarto da pousada.',
      'Estados: "Livre", "Ocupado" e "Em limpeza". Todo quarto começa Livre.',
      'Livre vai para Ocupado com "check-in". Ocupado vai para Em limpeza com "check-out". Em limpeza volta para Livre com "limpar".',
      'Livre termina com o evento "fechar temporada".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Livre', 100, 100),
        n('e2', 'estado', 'Ocupado', 400, 100),
        n('e3', 'estado', 'Em limpeza', 400, 260),
        n('f', 'estadoFinal', 'Fim', 160, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'check-in'), t('e2', 'e3', 'check-out'), t('e3', 'e1', 'limpar'),
        t('e1', 'f', 'fechar temporada'),
      ],
    },
  },
  {
    id: 'bicicletas',
    cliente: 'Bicicletas Vento Leve',
    assunto: 'Bicicletas compartilhadas',
    tempo: 300,
    recompensa: 160,
    corpo: [
      'Oi! Precisamos do diagrama de estados das nossas bicicletas.',
      'Estados: "Disponível", "Em uso" e "Em manutenção". Toda bicicleta começa Disponível.',
      'Disponível vai para Em uso com "desbloquear", e Em uso volta para Disponível com "devolver".',
      'Em uso vai para Em manutenção com "relatar defeito", e Em manutenção volta para Disponível com "consertar".',
      'Disponível termina com o evento "aposentar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Disponível', 100, 100),
        n('e2', 'estado', 'Em uso', 420, 100),
        n('e3', 'estado', 'Em manutenção', 420, 280),
        n('f', 'estadoFinal', 'Fim', 160, 300),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'desbloquear'), t('e2', 'e1', 'devolver'),
        t('e2', 'e3', 'relatar defeito'), t('e3', 'e1', 'consertar'),
        t('e1', 'f', 'aposentar'),
      ],
    },
  },
  {
    id: 'mochi',
    cliente: 'Bichinho Virtual Mochi',
    assunto: 'Bichinho virtual',
    tempo: 270,
    recompensa: 150,
    corpo: [
      'Oiê! Queremos o diagrama de estados do nosso bichinho virtual, o Mochi.',
      'Estados: "Feliz", "Com fome" e "Dormindo". O Mochi começa Feliz.',
      'Feliz vai para Com fome com "passar o tempo", e Com fome volta para Feliz com "alimentar".',
      'Feliz vai para Dormindo com "apagar a luz", e Dormindo volta para Feliz com "acordar".',
      'Dormindo termina com o evento "desligar".',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 460, 0),
        n('e1', 'estado', 'Feliz', 400, 100),
        n('e2', 'estado', 'Com fome', 700, 100),
        n('e3', 'estado', 'Dormindo', 100, 100),
        n('f', 'estadoFinal', 'Fim', 160, 260),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'passar o tempo'), t('e2', 'e1', 'alimentar'),
        t('e1', 'e3', 'apagar a luz'), t('e3', 'e1', 'acordar'),
        t('e3', 'f', 'desligar'),
      ],
    },
  },
  {
    id: 'correio',
    cliente: 'Correio Pombo Rosa',
    assunto: 'Envio de cartas',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Olá! Precisamos do diagrama de estados de uma carta.',
      'Estados: "Escrita", "Enviada" e "Devolvida". A carta começa Escrita.',
      'Com o evento "postar", a carta chega a uma decisão (losango): "Endereço certo?".',
      'Com a condição "[sim]" vai para Enviada; com "[não]" vai para Devolvida.',
      'Devolvida volta para Escrita com o evento "corrigir endereço".',
      'Enviada termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Escrita', 100, 100),
        n('d', 'decisao', 'Endereço certo?', 360, 80),
        n('e2', 'estado', 'Enviada', 700, 100),
        n('e3', 'estado', 'Devolvida', 400, 260),
        n('f', 'estadoFinal', 'Fim', 760, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'd', 'postar'), t('d', 'e2', '[sim]'), t('d', 'e3', '[não]'),
        t('e3', 'e1', 'corrigir endereço'),
        t('e2', 'f'),
      ],
    },
  },
  {
    id: 'casa-de-cha',
    cliente: 'Casa de Chá Jasmim',
    assunto: 'Preparo do chá',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Boa tarde! Queremos o diagrama de estados do preparo de um chá.',
      'Estados: "Pedido feito", "Em infusão" e "Servido". Tudo começa em Pedido feito.',
      'Pedido feito vai para Em infusão com o evento "aquecer água".',
      'Em infusão, com o evento "provar", chega a uma decisão (losango): "No ponto?".',
      'Com a condição "[sim]" vai para Servido; com "[não]" volta para Em infusão.',
      'Servido termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Pedido feito', 100, 100),
        n('e2', 'estado', 'Em infusão', 380, 100),
        n('d', 'decisao', 'No ponto?', 660, 80),
        n('e3', 'estado', 'Servido', 660, 260),
        n('f', 'estadoFinal', 'Fim', 420, 280),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'aquecer água'), t('e2', 'd', 'provar'),
        t('d', 'e3', '[sim]'), t('d', 'e2', '[não]'),
        t('e3', 'f'),
      ],
    },
  },
  {
    id: 'galeria',
    cliente: 'Galeria Vapor',
    assunto: 'Curadoria de obras',
    tempo: 360,
    recompensa: 210,
    corpo: [
      'Olá! Precisamos do diagrama de estados de uma obra na galeria.',
      'Estados: "Rascunho", "Em curadoria", "Em exposição" e "Arquivada". Toda obra começa como Rascunho.',
      'Rascunho vai para Em curadoria com o evento "enviar obra".',
      'Em curadoria, com o evento "avaliar", chega a uma decisão (losango): "Aprovada?".',
      'Com a condição "[sim]" vai para Em exposição; com "[não]" volta para Rascunho.',
      'Em exposição vai para Arquivada com "encerrar mostra", e Arquivada termina o processo.',
    ],
    esperado: {
      nodes: [
        n('i', 'estadoInicial', 'Início', 20, 120),
        n('e1', 'estado', 'Rascunho', 100, 100),
        n('e2', 'estado', 'Em curadoria', 400, 100),
        n('d', 'decisao', 'Aprovada?', 400, 240),
        n('e3', 'estado', 'Em exposição', 700, 260),
        n('e4', 'estado', 'Arquivada', 700, 420),
        n('f', 'estadoFinal', 'Fim', 460, 440),
      ],
      edges: [
        t('i', 'e1'),
        t('e1', 'e2', 'enviar obra'), t('e2', 'd', 'avaliar'),
        t('d', 'e3', '[sim]'), t('d', 'e1', '[não]'),
        t('e3', 'e4', 'encerrar mostra'), t('e4', 'f'),
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
      'Classe "Emprestimo" com os atributos "- dataRetirada: Date", "- livro: Livro" e "- leitor: Leitor", e os métodos "+ renovar(): bool" e "- calcularMulta(dias: int): float" (privado: só o próprio empréstimo calcula a multa, quando renova).',
      'Os atributos livro e leitor ligam Emprestimo a Livro e a Leitor por associação.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Livro', 40, 40, ['- titulo: String', '- isbn: String']),
        c('k2', 'Leitor', 40, 280, ['- nome: String', '- matricula: int']),
        c('k3', 'Emprestimo', 400, 140,
          ['- dataRetirada: Date', '- livro: Livro', '- leitor: Leitor'],
          ['+ renovar(): bool', '- calcularMulta(dias: int): float']),
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
      'Oi! Preciso de um diagrama de classes dos pedidos da lanchonete, com atributos e métodos.',
      'Classe "Pedido" com "- numero: int" e "- total: float", e os métodos "+ calcularTotal(): float" e "+ adicionarItem(item: Item)".',
      'Classe "Item" com "- descricao: String", "- quantidade: int" e "- precoUnitario: float", e o método "+ subtotal(): float".',
      'O Pedido é composto de Itens: se o pedido some, os itens somem junto.',
      'Cada Pedido tem um ou mais Itens, e cada Item pertence a exatamente um Pedido.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Pedido', 80, 80, ['- numero: int', '- total: float'], ['+ calcularTotal(): float', '+ adicionarItem(item: Item)']),
        c('k2', 'Item', 500, 80, ['- descricao: String', '- quantidade: int', '- precoUnitario: float'], ['+ subtotal(): float']),
      ],
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
      'Olá! Coordeno uma escola de idiomas e quero um diagrama de classes com atributos e métodos.',
      'Classe "Aluno" com "- matricula: int" e "- nome: String", e o método "+ matricular(curso: Curso)".',
      'Classe "Curso" com "- codigo: String", "- nome: String" e "- cargaHoraria: int".',
      'Aluno e Curso se ligam por uma associação: um Aluno cursa um ou mais Cursos, e um Curso pode ter nenhum ou vários Alunos.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Aluno', 80, 100, ['- matricula: int', '- nome: String'], ['+ matricular(curso: Curso)']),
        c('k2', 'Curso', 480, 100, ['- codigo: String', '- nome: String', '- cargaHoraria: int']),
      ],
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
      'E aí! Estou montando um app de música. Preciso de um diagrama de classes com atributos e métodos.',
      'Classe "Playlist" com "- nome: String" e os métodos "+ adicionarMusica(musica: Música)" e "+ duracaoTotal(): int".',
      'Classe "Música" com "- titulo: String" e "- duracaoSegundos: int".',
      'A Playlist agrega Músicas: a música continua existindo se a playlist sumir.',
      'Uma Playlist tem nenhuma ou várias Músicas, e uma Música pode estar em nenhuma ou várias Playlists.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Playlist', 60, 100, ['- nome: String'], ['+ adicionarMusica(musica: Música)', '+ duracaoTotal(): int']),
        c('k2', 'Música', 520, 100, ['- titulo: String', '- duracaoSegundos: int']),
      ],
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
      'Bom dia! Tenho uma cooperativa de crédito e preciso de um diagrama de classes com atributos e métodos.',
      'Classe "Cliente" com "- nome: String" e "- cpf: String".',
      'Classe "Conta" com "- numero: int" e "- saldo: float", e os métodos "+ depositar(valor: float)" e "+ sacar(valor: float): bool" (o saque diz se deu certo).',
      'Cliente e Conta se ligam por uma associação: cada Cliente possui uma ou mais Contas, e cada Conta pertence a exatamente um Cliente.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Cliente', 80, 100, ['- nome: String', '- cpf: String']),
        c('k2', 'Conta', 420, 100, ['- numero: int', '- saldo: float'], ['+ depositar(valor: float)', '+ sacar(valor: float): bool']),
      ],
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
      'Olá! Minha loja online precisa de um carrinho. Quero um diagrama de classes com atributos e métodos.',
      'Classe "Carrinho" com "- total: float" e os métodos "+ adicionar(item: ItemCarrinho)" e "+ calcularTotal(): float".',
      'Classe "ItemCarrinho" com "- quantidade: int" e o método "+ subtotal(): float". Classe "Produto" com "- nome: String" e "- preco: float".',
      'O Carrinho é composto de ItemCarrinho (sem o carrinho, os itens não existem): cada Carrinho tem nenhum ou vários itens, e cada item é de exatamente um Carrinho.',
      'Cada ItemCarrinho se associa a exatamente um Produto, e um Produto pode estar em nenhum ou vários itens.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Carrinho', 40, 100, ['- total: float'], ['+ adicionar(item: ItemCarrinho)', '+ calcularTotal(): float']),
        c('k2', 'ItemCarrinho', 480, 100, ['- quantidade: int'], ['+ subtotal(): float']),
        c('k3', 'Produto', 800, 100, ['- nome: String', '- preco: float']),
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
      'Olá! Administro uma clínica e preciso de um diagrama de classes com atributos e métodos.',
      'Classe "Pessoa" com "# nome: String" e "# cpf: String" (protegidos, para os filhos usarem).',
      '"Paciente" e "Médico" são tipos de Pessoa (herdam de Pessoa). O Paciente tem "- convenio: String"; o Médico tem "- crm: String" e o método "+ atender(consulta: Consulta)".',
      'Classe "Consulta" com "- data: String" e "- horario: String".',
      'Consulta se associa a Paciente e a Médico: cada Consulta tem exatamente um Paciente e exatamente um Médico, e cada um deles pode ter nenhuma ou várias Consultas.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Pessoa', 300, 20, ['# nome: String', '# cpf: String']),
        c('k2', 'Paciente', 80, 220, ['- convenio: String']),
        c('k3', 'Médico', 480, 220, ['- crm: String'], ['+ atender(consulta: Consulta)']),
        c('k4', 'Consulta', 300, 420, ['- data: String', '- horario: String']),
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
      'Oi! Sou bibliotecária e preciso de um diagrama de classes do acervo, com atributos e métodos.',
      'Todo "Usuário" tem "# nome: String" e "# matricula: String" (protegidos, para quem herda usar) e sabe "+ limiteEmprestimos(): int".',
      '"Aluno" e "Professor" são tipos de Usuário (herdam de Usuário). O Aluno tem "- curso: String" e o Professor tem "- departamento: String"; cada um calcula o próprio limite, então os dois também têm "+ limiteEmprestimos(): int".',
      'Usuário se associa a "Empréstimo": um Usuário faz nenhum ou vários Empréstimos, e cada Empréstimo é de exatamente um Usuário. O empréstimo tem "- dataRetirada: Date" e "- dataDevolucao: Date" e sabe "+ estaAtrasado(): bool".',
      'Empréstimo se associa a "Livro" ("- titulo: String", "- isbn: String"): cada Empréstimo é de exatamente um Livro, e um Livro pode ter nenhum ou vários Empréstimos.',
    ],
    esperado: {
      nodes: [
        c('k1', 'Usuário', 160, 60, ['# nome: String', '# matricula: String'], ['+ limiteEmprestimos(): int']),
        c('k2', 'Aluno', 20, 300, ['- curso: String'], ['+ limiteEmprestimos(): int']),
        c('k3', 'Professor', 340, 300, ['- departamento: String'], ['+ limiteEmprestimos(): int']),
        c('k4', 'Empréstimo', 560, 60, ['- dataRetirada: Date', '- dataDevolucao: Date'], ['+ estaAtrasado(): bool']),
        c('k5', 'Livro', 700, 320, ['- titulo: String', '- isbn: String']),
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

// ---------------------------------------------------------------------------
// Pedidos JUMBO: o cliente pede DOIS diagramas de uma vez (casos de uso + classes, casos de uso +
// estados ou classes + estados). Cada diagrama é montado na sua aba do editor (Casos / Classes /
// Estados) e fica salvo lá; a nota é a média das partes. Nunca chegam como urgentes (não estão em
// MODELOS, que é de onde o urgente é sorteado). A complexidade (fácil/médio/difícil) é a média
// das partes, com os mesmos limites dos pedidos normais (lib/dificuldade.js).
const parte = (secao, esperado) => ({ secao, esperado });

export const JUMBOS = [
  // ----- casos de uso + classes
  {
    id: 'jumbo-fidelidade',
    cliente: 'Café Lo-Fi',
    assunto: 'Programa de fidelidade',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Oi! Pedido JUMBO: precisamos de DOIS diagramas, um de casos de uso e um de classes.',
      'Casos de uso: o sistema se chama "App Fidelidade". Ator: "Cliente". Ele pode "Juntar pontos" e "Trocar pontos".',
      'Classes: "Cliente", "Cartão Fidelidade" e "Recompensa".',
      'Cliente se associa a Cartão Fidelidade, e Cartão Fidelidade se associa a Recompensa.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App Fidelidade', 140, 20, 460, 260),
          n('a1', 'ator', 'Cliente', 20, 100),
          n('c1', 'casoDeUso', 'Juntar pontos', 180, 80),
          n('c2', 'casoDeUso', 'Trocar pontos', 180, 180),
        ],
        edges: [e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2')],
      }),
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Cliente', 40, 60),
          n('k2', 'classe', 'Cartão Fidelidade', 320, 60),
          n('k3', 'classe', 'Recompensa', 600, 60),
        ],
        edges: [e('associacao', 'k1', 'k2'), e('associacao', 'k2', 'k3')],
      }),
    ],
  },
  {
    id: 'jumbo-clube-papel',
    cliente: 'Papelaria Washi',
    assunto: 'Clube do caderno',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Olá! Pedido JUMBO: queremos um diagrama de casos de uso e um de classes.',
      'Casos de uso: o sistema se chama "Clube da Papelaria". Ator: "Assinante". Ele pode "Assinar clube" e "Receber kit".',
      'Classes: "Produto", "Caderno" e "Caneta".',
      'Caderno e Caneta herdam de Produto.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'Clube da Papelaria', 140, 20, 460, 260),
          n('a1', 'ator', 'Assinante', 20, 100),
          n('c1', 'casoDeUso', 'Assinar clube', 180, 80),
          n('c2', 'casoDeUso', 'Receber kit', 180, 180),
        ],
        edges: [e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2')],
      }),
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Produto', 240, 20),
          n('k2', 'classe', 'Caderno', 100, 220),
          n('k3', 'classe', 'Caneta', 380, 220),
        ],
        edges: [e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1')],
      }),
    ],
  },
  {
    id: 'jumbo-hotel',
    cliente: 'Hotel Brisa Lilás',
    assunto: 'Reservas e quartos',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'Olá! Pedido JUMBO: precisamos de um diagrama de casos de uso e um de classes do hotel.',
      'Casos de uso: o sistema se chama "Portal do Hotel". Atores: "Hóspede" e "Recepcionista". O Hóspede pode "Reservar quarto" e "Ver fotos"; o Recepcionista faz o "Fazer check-in". Reservar quarto sempre inclui "Pagar".',
      'Classes: "Hotel", "Quarto", "Suíte", "Reserva" e "Hóspede".',
      'Hotel é composto de Quarto (composição). Suíte herda de Quarto. Reserva se associa a Quarto e a Hóspede.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'Portal do Hotel', 140, 20, 460, 360),
          n('a1', 'ator', 'Hóspede', 20, 120),
          n('a2', 'ator', 'Recepcionista', 660, 220),
          n('c1', 'casoDeUso', 'Ver fotos', 180, 80),
          n('c2', 'casoDeUso', 'Reservar quarto', 180, 240),
          n('c3', 'casoDeUso', 'Pagar', 400, 80),
          n('c4', 'casoDeUso', 'Fazer check-in', 400, 240),
        ],
        edges: [
          e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
          e('associacao', 'a2', 'c4'),
          e('include', 'c2', 'c3'),
        ],
      }),
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Hotel', 40, 40),
          n('k2', 'classe', 'Quarto', 320, 40),
          n('k3', 'classe', 'Suíte', 320, 240),
          n('k4', 'classe', 'Reserva', 600, 40),
          n('k5', 'classe', 'Hóspede', 600, 240),
        ],
        edges: [
          e('composicao', 'k1', 'k2'),
          e('heranca', 'k3', 'k2'),
          e('associacao', 'k4', 'k2'), e('associacao', 'k4', 'k5'),
        ],
      }),
    ],
  },
  {
    id: 'jumbo-academia',
    cliente: 'Academia Halter Lilás',
    assunto: 'Treinos e planos',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'E aí! Pedido JUMBO: um diagrama de casos de uso e um de classes.',
      'Casos de uso: o sistema se chama "App da Academia". Atores: "Aluno" e "Instrutor". O Aluno pode "Assinar plano" e "Ver treino"; o Instrutor pode "Montar treino". Opcionalmente, "Avaliar físico" estende Montar treino.',
      'Classes: "Aluno", "Treino" e "Exercício".',
      'Aluno se associa a Treino, e Treino agrega Exercício (agregação: o exercício existe sem o treino).',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App da Academia', 140, 20, 460, 360),
          n('a1', 'ator', 'Aluno', 20, 120),
          n('a2', 'ator', 'Instrutor', 660, 120),
          n('c1', 'casoDeUso', 'Assinar plano', 180, 80),
          n('c2', 'casoDeUso', 'Ver treino', 180, 240),
          n('c3', 'casoDeUso', 'Montar treino', 400, 120),
          n('c4', 'casoDeUso', 'Avaliar físico', 400, 280),
        ],
        edges: [
          e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
          e('associacao', 'a2', 'c3'),
          e('extend', 'c4', 'c3'),
        ],
      }),
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Aluno', 40, 60),
          n('k2', 'classe', 'Treino', 320, 60),
          n('k3', 'classe', 'Exercício', 600, 60),
        ],
        edges: [e('associacao', 'k1', 'k2'), e('agregacao', 'k2', 'k3')],
      }),
    ],
  },
  {
    id: 'jumbo-banco',
    cliente: 'Banco Nuvem',
    assunto: 'Conta digital completa',
    tempo: 540,
    recompensa: 340,
    corpo: [
      'Prezados, pedido JUMBO: precisamos de um diagrama de casos de uso e um de classes da conta digital.',
      'Casos de uso: o sistema se chama "App do Banco". Ator: "Cliente". Ele pode "Fazer Pix", "Pagar boleto" e "Ver extrato". Fazer Pix e Pagar boleto sempre incluem "Autenticar". Opcionalmente, "Agendar pagamento" estende Pagar boleto.',
      'Classes: "Cliente", "Conta", "Conta Poupança" e "Transação". Cliente se associa a Conta. Conta é composta de Transação (composição). Conta Poupança herda de Conta.',
      'Conta tem o atributo "- saldo: float" e o método "+ transferir(valor: float): bool".',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App do Banco', 140, 20, 460, 440),
          n('a1', 'ator', 'Cliente', 20, 180),
          n('c1', 'casoDeUso', 'Fazer Pix', 180, 60),
          n('c2', 'casoDeUso', 'Pagar boleto', 180, 200),
          n('c3', 'casoDeUso', 'Ver extrato', 180, 340),
          n('c4', 'casoDeUso', 'Autenticar', 400, 120),
          n('c5', 'casoDeUso', 'Agendar pagamento', 400, 300),
        ],
        edges: [
          e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('associacao', 'a1', 'c3'),
          e('include', 'c1', 'c4'), e('include', 'c2', 'c4'),
          e('extend', 'c5', 'c2'),
        ],
      }),
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Cliente', 40, 60),
          c('k2', 'Conta', 320, 60, ['- saldo: float'], ['+ transferir(valor: float): bool']),
          n('k3', 'classe', 'Transação', 680, 60),
          n('k4', 'classe', 'Conta Poupança', 320, 300),
        ],
        edges: [
          e('associacao', 'k1', 'k2'),
          e('composicao', 'k2', 'k3'),
          e('heranca', 'k4', 'k2'),
        ],
      }),
    ],
  },
  // ----- casos de uso + estados
  {
    id: 'jumbo-cinema',
    cliente: 'Cine Pastel',
    assunto: 'Sessões e ingressos',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Oi! Pedido JUMBO: um diagrama de casos de uso e um de estados.',
      'Casos de uso: o sistema se chama "Site do Cine". Ator: "Cliente". Ele pode "Ver sessões" e "Comprar ingresso".',
      'Estados do ingresso: "Comprado" e "Usado". Tudo começa em Comprado.',
      'Comprado vai para Usado com o evento "entrar na sala", e Usado termina o processo.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'Site do Cine', 140, 20, 460, 260),
          n('a1', 'ator', 'Cliente', 20, 100),
          n('c1', 'casoDeUso', 'Ver sessões', 180, 80),
          n('c2', 'casoDeUso', 'Comprar ingresso', 180, 180),
        ],
        edges: [e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Comprado', 100, 100),
          n('e2', 'estado', 'Usado', 420, 100),
          n('f', 'estadoFinal', 'Fim', 480, 280),
        ],
        edges: [t('i', 'e1'), t('e1', 'e2', 'entrar na sala'), t('e2', 'f')],
      }),
    ],
  },
  {
    id: 'jumbo-lanchonete',
    cliente: 'Lanchonete Pixel',
    assunto: 'Pedidos pelo app',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'E aí! Pedido JUMBO: queremos um diagrama de casos de uso e um de estados.',
      'Casos de uso: o sistema se chama "App da Lanchonete". Ator: "Cliente". Ele pode "Fazer pedido", que sempre inclui "Pagar".',
      'Estados do pedido: "Na cozinha", "Pronto" e "Retirado". Tudo começa Na cozinha.',
      'Na cozinha vai para Pronto com "finalizar", Pronto vai para Retirado com "retirar", e Retirado termina o processo.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App da Lanchonete', 140, 20, 460, 240),
          n('a1', 'ator', 'Cliente', 20, 80),
          n('c1', 'casoDeUso', 'Fazer pedido', 180, 80),
          n('c2', 'casoDeUso', 'Pagar', 400, 160),
        ],
        edges: [e('associacao', 'a1', 'c1'), e('include', 'c1', 'c2')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Na cozinha', 100, 100),
          n('e2', 'estado', 'Pronto', 400, 100),
          n('e3', 'estado', 'Retirado', 400, 260),
          n('f', 'estadoFinal', 'Fim', 160, 280),
        ],
        edges: [t('i', 'e1'), t('e1', 'e2', 'finalizar'), t('e2', 'e3', 'retirar'), t('e3', 'f')],
      }),
    ],
  },
  {
    id: 'jumbo-streaming',
    cliente: 'Streaming Nébula',
    assunto: 'Assinaturas e player',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'Oi! Pedido JUMBO: um diagrama de casos de uso e um de estados.',
      'Casos de uso: o sistema se chama "App de Streaming". Ator: "Assinante". Ele pode "Assinar plano", "Assistir série" e "Baixar episódio". Assistir série e Baixar episódio dependem de Assinar plano (use dependência).',
      'Estados do player: "Parado", "Reproduzindo" e "Pausado". O player começa Parado.',
      'Parado vai para Reproduzindo com "play". Reproduzindo vai para Pausado com "pause", e Pausado volta para Reproduzindo com "play". Reproduzindo termina com o evento "terminar".',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App de Streaming', 140, 20, 460, 360),
          n('a1', 'ator', 'Assinante', 20, 160),
          n('c1', 'casoDeUso', 'Assinar plano', 400, 180),
          n('c2', 'casoDeUso', 'Assistir série', 180, 100),
          n('c3', 'casoDeUso', 'Baixar episódio', 180, 260),
        ],
        edges: [
          e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('associacao', 'a1', 'c3'),
          e('dependencia', 'c2', 'c1'), e('dependencia', 'c3', 'c1'),
        ],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Parado', 100, 100),
          n('e2', 'estado', 'Reproduzindo', 400, 100),
          n('e3', 'estado', 'Pausado', 400, 280),
          n('f', 'estadoFinal', 'Fim', 720, 120),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'e2', 'play'), t('e2', 'e3', 'pause'), t('e3', 'e2', 'play'),
          t('e2', 'f', 'terminar'),
        ],
      }),
    ],
  },
  {
    id: 'jumbo-entregas',
    cliente: 'Entregas Cometa',
    assunto: 'Rastreio pelo app',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'Olá! Pedido JUMBO: precisamos de um diagrama de casos de uso e um de estados.',
      'Casos de uso: o sistema se chama "App de Entregas". Atores: "Cliente" e "Entregador". O Cliente pode "Rastrear pacote" e "Agendar entrega"; o Entregador faz o "Confirmar entrega".',
      'Estados do pacote: "Postado", "Em trânsito" e "Entregue". Todo pacote começa Postado.',
      'Postado vai para Em trânsito com "coletar". Em trânsito vai para Entregue com "entregar", ou volta para Postado com "devolver". Entregue termina o processo.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'App de Entregas', 140, 20, 460, 300),
          n('a1', 'ator', 'Cliente', 20, 100),
          n('a2', 'ator', 'Entregador', 660, 140),
          n('c1', 'casoDeUso', 'Rastrear pacote', 180, 80),
          n('c2', 'casoDeUso', 'Agendar entrega', 180, 200),
          n('c3', 'casoDeUso', 'Confirmar entrega', 400, 140),
        ],
        edges: [e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'), e('associacao', 'a2', 'c3')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Postado', 100, 100),
          n('e2', 'estado', 'Em trânsito', 420, 100),
          n('e3', 'estado', 'Entregue', 420, 280),
          n('f', 'estadoFinal', 'Fim', 160, 300),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'e2', 'coletar'), t('e2', 'e3', 'entregar'), t('e2', 'e1', 'devolver'),
          t('e3', 'f'),
        ],
      }),
    ],
  },
  {
    id: 'jumbo-clinica',
    cliente: 'Clínica Bem-Estar',
    assunto: 'Consultas',
    tempo: 540,
    recompensa: 340,
    corpo: [
      'Olá! Pedido JUMBO: um diagrama de casos de uso e um de estados das consultas.',
      'Casos de uso: o sistema se chama "Portal da Clínica". Atores: "Paciente" e "Médico". O Paciente pode "Marcar consulta" e "Cancelar consulta"; o Médico faz o "Atender paciente". Marcar consulta sempre inclui "Escolher horário", e Cancelar consulta depende de Marcar consulta (use dependência).',
      'Estados da consulta: "Marcada", "Realizada" e "Faltou". Toda consulta começa Marcada.',
      'Com o evento "chegar o horário", a consulta chega a uma decisão (losango): "Paciente veio?". Com a condição "[sim]" vai para Realizada; com "[não]" vai para Faltou.',
      'Realizada e Faltou terminam o processo.',
    ],
    partes: [
      parte('casos', {
        nodes: [
          n('s1', 'sistema', 'Portal da Clínica', 140, 20, 460, 380),
          n('a1', 'ator', 'Paciente', 20, 140),
          n('a2', 'ator', 'Médico', 660, 240),
          n('c1', 'casoDeUso', 'Marcar consulta', 180, 80),
          n('c2', 'casoDeUso', 'Cancelar consulta', 180, 280),
          n('c3', 'casoDeUso', 'Escolher horário', 400, 140),
          n('c4', 'casoDeUso', 'Atender paciente', 400, 280),
        ],
        edges: [
          e('associacao', 'a1', 'c1'), e('associacao', 'a1', 'c2'),
          e('associacao', 'a2', 'c4'),
          e('include', 'c1', 'c3'),
          e('dependencia', 'c2', 'c1'),
        ],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Marcada', 100, 100),
          n('d', 'decisao', 'Paciente veio?', 380, 80),
          n('e2', 'estado', 'Realizada', 700, 100),
          n('e3', 'estado', 'Faltou', 400, 260),
          n('f', 'estadoFinal', 'Fim', 760, 280),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'd', 'chegar o horário'), t('d', 'e2', '[sim]'), t('d', 'e3', '[não]'),
          t('e2', 'f'), t('e3', 'f'),
        ],
      }),
    ],
  },
  // ----- classes + estados
  {
    id: 'jumbo-banho-tosa',
    cliente: 'Petshop Bigode',
    assunto: 'Banho e tosa',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Olá, agência! Pedido JUMBO: um diagrama de classes e um de estados.',
      'Classes: "Dono", "Pet" e "Agendamento". Dono se associa a Pet, e Agendamento se associa a Pet.',
      'Estados do banho: "Esperando", "No banho" e "Pronto". Tudo começa em Esperando.',
      'Esperando vai para No banho com "começar", No banho vai para Pronto com "secar", e Pronto termina o processo.',
    ],
    partes: [
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Dono', 40, 60),
          n('k2', 'classe', 'Pet', 320, 60),
          n('k3', 'classe', 'Agendamento', 600, 60),
        ],
        edges: [e('associacao', 'k1', 'k2'), e('associacao', 'k3', 'k2')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Esperando', 100, 100),
          n('e2', 'estado', 'No banho', 400, 100),
          n('e3', 'estado', 'Pronto', 400, 260),
          n('f', 'estadoFinal', 'Fim', 160, 280),
        ],
        edges: [t('i', 'e1'), t('e1', 'e2', 'começar'), t('e2', 'e3', 'secar'), t('e3', 'f')],
      }),
    ],
  },
  {
    id: 'jumbo-acervo',
    cliente: 'Biblioteca Lua Cheia',
    assunto: 'Acervo e empréstimos',
    tempo: 360,
    recompensa: 220,
    corpo: [
      'Olá! Pedido JUMBO: precisamos de um diagrama de classes e um de estados.',
      'Classes: "Item", "Livro" e "Revista". Livro e Revista herdam de Item.',
      'Estados do livro: "Na estante" e "Emprestado". Todo livro começa Na estante.',
      'Na estante vai para Emprestado com "emprestar", e Emprestado volta para Na estante com "devolver". Na estante termina com o evento "descartar".',
    ],
    partes: [
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Item', 240, 20),
          n('k2', 'classe', 'Livro', 100, 220),
          n('k3', 'classe', 'Revista', 380, 220),
        ],
        edges: [e('heranca', 'k2', 'k1'), e('heranca', 'k3', 'k1')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Na estante', 100, 100),
          n('e2', 'estado', 'Emprestado', 420, 100),
          n('f', 'estadoFinal', 'Fim', 160, 280),
        ],
        edges: [t('i', 'e1'), t('e1', 'e2', 'emprestar'), t('e2', 'e1', 'devolver'), t('e1', 'f', 'descartar')],
      }),
    ],
  },
  {
    id: 'jumbo-pizzaria',
    cliente: 'Pizzaria Forno Roxo',
    assunto: 'Cardápio e pedidos',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'Boa noite! Pedido JUMBO: um diagrama de classes e um de estados.',
      'Classes: "Cliente", "Pedido", "Item do Pedido" e "Pizza". Cliente se associa a Pedido. Pedido é composto de Item do Pedido (composição). Item do Pedido se associa a Pizza.',
      'Estados do pedido: "Recebido", "No forno", "Saiu para entrega", "Entregue" e "Cancelado". Tudo começa em Recebido.',
      'Recebido vai para No forno com "assar", No forno vai para Saiu para entrega com "despachar", e Saiu para entrega vai para Entregue com "entregar". Recebido também pode ir para Cancelado com "cancelar".',
      'Entregue e Cancelado terminam o processo.',
    ],
    partes: [
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Cliente', 40, 60),
          n('k2', 'classe', 'Pedido', 320, 60),
          n('k3', 'classe', 'Item do Pedido', 320, 280),
          n('k4', 'classe', 'Pizza', 600, 280),
        ],
        edges: [e('associacao', 'k1', 'k2'), e('composicao', 'k2', 'k3'), e('associacao', 'k3', 'k4')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Recebido', 100, 100),
          n('e2', 'estado', 'No forno', 380, 100),
          n('e3', 'estado', 'Saiu para entrega', 660, 100),
          n('e4', 'estado', 'Entregue', 660, 260),
          n('e5', 'estado', 'Cancelado', 100, 260),
          n('f', 'estadoFinal', 'Fim', 420, 380),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'e2', 'assar'), t('e2', 'e3', 'despachar'), t('e3', 'e4', 'entregar'),
          t('e1', 'e5', 'cancelar'),
          t('e4', 'f'), t('e5', 'f'),
        ],
      }),
    ],
  },
  {
    id: 'jumbo-radio',
    cliente: 'Rádio Vinil Roxo',
    assunto: 'Programação da rádio',
    tempo: 450,
    recompensa: 280,
    corpo: [
      'E aí! Pedido JUMBO: um diagrama de classes e um de estados.',
      'Classes: "Locutor", "Programa", "Música" e "Vinheta". Locutor se associa a Programa. Programa agrega Música (agregação: a música existe sem o programa). Vinheta herda de Música.',
      'Estados da transmissão: "Fora do ar", "No ar" e "Intervalo". Tudo começa Fora do ar.',
      'Fora do ar vai para No ar com "ligar transmissor", e No ar volta para Fora do ar com "desligar". No ar vai para Intervalo com "chamar comercial", e Intervalo volta para No ar com "voltar".',
      'Fora do ar termina com o evento "encerrar".',
    ],
    partes: [
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Locutor', 40, 60),
          n('k2', 'classe', 'Programa', 320, 60),
          n('k3', 'classe', 'Música', 600, 60),
          n('k4', 'classe', 'Vinheta', 600, 280),
        ],
        edges: [e('associacao', 'k1', 'k2'), e('agregacao', 'k2', 'k3'), e('heranca', 'k4', 'k3')],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Fora do ar', 100, 100),
          n('e2', 'estado', 'No ar', 440, 100),
          n('e3', 'estado', 'Intervalo', 440, 280),
          n('f', 'estadoFinal', 'Fim', 160, 300),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'e2', 'ligar transmissor'), t('e2', 'e1', 'desligar'),
          t('e2', 'e3', 'chamar comercial'), t('e3', 'e2', 'voltar'),
          t('e1', 'f', 'encerrar'),
        ],
      }),
    ],
  },
  {
    id: 'jumbo-loja',
    cliente: 'Loja Pixel Lilás',
    assunto: 'Loja e pagamentos',
    tempo: 540,
    recompensa: 340,
    corpo: [
      'Oi! Pedido JUMBO: precisamos de um diagrama de classes e um de estados da loja.',
      'Classes: "Cliente", "Pedido", "Item" e "Produto". Cliente se associa a Pedido: cada Cliente faz zero ou mais Pedidos, e cada Pedido é de exatamente um Cliente. Pedido é composto de Item (composição): cada Pedido tem um ou mais Itens, e cada Item é de exatamente um Pedido. Item se associa a Produto.',
      'Estados do pagamento: "Carrinho", "Pago" e "Enviado". Tudo começa em Carrinho.',
      'Com o evento "finalizar compra", chega a uma decisão (losango): "Cartão aprovado?". Com a condição "[sim]" vai para Pago; com "[não]" volta para Carrinho.',
      'Pago vai para Enviado com "despachar", e Enviado termina o processo.',
    ],
    partes: [
      parte('classes', {
        nodes: [
          n('k1', 'classe', 'Cliente', 40, 60),
          n('k2', 'classe', 'Pedido', 360, 60),
          n('k3', 'classe', 'Item', 360, 300),
          n('k4', 'classe', 'Produto', 680, 300),
        ],
        edges: [
          e('associacao', 'k1', 'k2', '1', '0..*'),
          e('composicao', 'k2', 'k3', '1', '1..*'),
          e('associacao', 'k3', 'k4'),
        ],
      }),
      parte('estados', {
        nodes: [
          n('i', 'estadoInicial', 'Início', 20, 120),
          n('e1', 'estado', 'Carrinho', 100, 100),
          n('d', 'decisao', 'Cartão aprovado?', 380, 80),
          n('e2', 'estado', 'Pago', 740, 100),
          n('e3', 'estado', 'Enviado', 740, 260),
          n('f', 'estadoFinal', 'Fim', 500, 280),
        ],
        edges: [
          t('i', 'e1'),
          t('e1', 'd', 'finalizar compra'), t('d', 'e2', '[sim]'), t('d', 'e1', '[não]'),
          t('e2', 'e3', 'despachar'), t('e3', 'f'),
        ],
      }),
    ],
  },
];

// Todos os modelos que chegam por e-mail (normais + JUMBO + complexos). Urgentes saem só de MODELOS.
export const TODOS_MODELOS = [...MODELOS, ...JUMBOS, ...COMPLEXOS];
export { COMPLEXOS };
export const modeloPorId = (id) => TODOS_MODELOS.find((m) => m.id === id);
export const ehJumbo = (modelo) => Boolean(modelo?.partes);
// Pedido complexo (data/complexos.js): só nos fins de semana da campanha e no modo infinito
export const ehComplexo = (modelo) => Boolean(modelo?.complexo);
// Diagramas pedidos pelo modelo: [{ secao, esperado }] (pedido normal = uma parte só)
export const partesDoModelo = (modelo) => modelo.partes ?? [{ secao: tipoDoDiagrama(modelo.esperado), esperado: modelo.esperado }];

// Quantos pedidos chegam num dia da campanha (soma da composição do dia, `composicaoDoDia`)
export const pedidosNoDia = (dia) => Object.values(composicaoDoDia(dia)).reduce((a, b) => a + b, 0);
// Pedidos de um dia útil da campanha: para cada nível, a quantidade da composição do dia
// (`composicaoDoDia`), sorteada entre os modelos daquele nível (JUMBO só a partir do dia
// JUMBO_NA_CAMPANHA; complexos nunca). Dia novo: em cada nível, primeiro os que o jogador ainda não
// tem na coleção (nunca entregou), depois os outros. Dia já concluído jogado de novo (`repeticao`):
// só os desbloqueados (já entregues); faltando do nível, completa com desbloqueados de outros níveis
// (pode vir menos pedidos se não houver o bastante). A ordem de chegada também é sorteada.
// `semente` torna o sorteio reproduzível (o reducer continua puro).
export const JUMBO_NA_CAMPANHA = 5;
export function sortearPedidosDoDia(dia, { colecao = {}, repeticao = false, semente = dia } = {}) {
  const modelos = TODOS_MODELOS.filter((m) => !ehComplexo(m) && (dia >= JUMBO_NA_CAMPANHA || !ehJumbo(m)));
  return sortearComposicao(composicaoDoDia(dia), modelos, { colecao, repeticao, semente });
}

// Fim de semana da campanha: só pedidos complexos, na composição da data (`composicaoDoFimDeSemana`),
// com as mesmas regras de coleção e de dia repetido
export function pedidosDoFimDeSemana(data, { colecao = {}, repeticao = false, semente = data } = {}) {
  return sortearComposicao(composicaoDoFimDeSemana(data), COMPLEXOS, { colecao, repeticao, semente });
}
export const pedidosNoFimDeSemana = (data) => Object.values(composicaoDoFimDeSemana(data)).reduce((a, b) => a + b, 0);

function sortearComposicao(composicao, modelos, { colecao, repeticao, semente }) {
  const sorteio = gerador(semente);
  const embaralhar = (lista) => {
    const l = [...lista];
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(sorteio() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    return l;
  };
  const doNivel = (nivel) => modelos.filter((m) => nivelDoModelo(m).id === nivel);
  const tem = (m) => (colecao[m.id]?.entregas ?? 0) > 0;
  const total = Object.values(composicao).reduce((a, b) => a + b, 0);
  const escolhidos = [];
  if (repeticao && modelos.some(tem)) {
    for (const [nivel, qtd] of Object.entries(composicao)) escolhidos.push(...embaralhar(doNivel(nivel).filter(tem)).slice(0, qtd));
    const sobra = embaralhar(modelos.filter((m) => tem(m) && !escolhidos.includes(m)));
    escolhidos.push(...sobra.slice(0, total - escolhidos.length));
  } else {
    for (const [nivel, qtd] of Object.entries(composicao)) {
      const lista = doNivel(nivel);
      escolhidos.push(...[...embaralhar(lista.filter((m) => !tem(m))), ...embaralhar(lista.filter(tem))].slice(0, qtd));
    }
  }
  return embaralhar(escolhidos).map((m) => m.id);
}

// Gerador pseudoaleatório pequeno (mulberry32): mesma semente, mesma sequência
function gerador(semente) {
  let a = Math.floor(Math.abs(semente) * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dia já concluído jogado de novo: todos os pedidos pagam metade (a multa também, por ser sobre o pagamento)
export const FATOR_REPETICAO = 0.5;
// Modo infinito: todos os pedidos pagam 60% (não vira uma fonte de dinheiro sem fim)
export const FATOR_INFINITO = 0.6;

// Pagamento cresce levemente com o dia: +2% por dia, até +40% (a quantidade de pedidos do dia já
// faz a renda crescer)
export const BONUS_DIA = { porDia: 0.02, maximo: 0.4 };
export const bonusDoDia = (dia) => 1 + Math.min(BONUS_DIA.maximo, (dia - 1) * BONUS_DIA.porDia);

// Despesa fixa do escritório ("aluguel e luz"), cobrada no fim de cada dia útil da campanha: cresce
// de R$ 30 (dia 1) a R$ 200 (último dia), uns 15% do que um dia bem jogado rende. Fim de semana não paga.
export const DESPESA = { inicio: 30, fim: 200, dias: 23 };
export const despesaDoDia = (dia) =>
  Math.round((DESPESA.inicio + ((Math.min(dia, DESPESA.dias) - 1) * (DESPESA.fim - DESPESA.inicio)) / (DESPESA.dias - 1)) / 10) * 10;

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
// Pedido urgente: a cada minuto de jogo (relógio rodando) há 1 chance em 5 de chegar um, se não
// houver outro urgente na fila. Paga mais, mas o cliente espera pouco e o prazo de entrega é curto.
export const URGENTE = {
  intervalo: 60, // segundos de jogo entre sorteios
  chance: 1 / 5,
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
    // entregue atrasado, o urgente perde o bônus e paga como um pedido normal atrasado
    recompensaNormal: p.recompensa,
    tempo,
    tempoRestante: tempo,
    paciencia,
    pacienciaTotal: paciencia,
  };
}

// Aba de dicas: a resposta é dividida numa grade; cada pedaço revela uma parte.
// Preço pelo nível do pedido (`PRECO_DICA`) e cada pedaço comprado encarece o próximo do mesmo
// diagrama: grade 2x2 → +25%, +50% e +100% sobre o primeiro (`AUMENTO_DICA`); pedido complexo
// (grade 4x4, 16 pedaços) → +10% sobre o primeiro a cada pedaço (`AUMENTO_COMPLEXA`).
export const PRECO_DICA = { facil: 100, medio: 150, dificil: 200 };
export const AUMENTO_DICA = [0, 0.25, 0.5, 1];
export const AUMENTO_COMPLEXA = 0.1;
export const GRADE_PEDACOS = { colunas: 2, linhas: 2 };
export const GRADE_COMPLEXA = { colunas: 4, linhas: 4 };
export const TOTAL_PEDACOS = GRADE_PEDACOS.colunas * GRADE_PEDACOS.linhas;
export const gradeDePedacos = (modelo) => (ehComplexo(modelo) ? GRADE_COMPLEXA : GRADE_PEDACOS);
export const pedacosDoModelo = (modelo) => gradeDePedacos(modelo).colunas * gradeDePedacos(modelo).linhas;
// Preço do próximo pedaço da parte `parte` (pedido JUMBO: cada diagrama conta os seus)
export function precoPedaco(pedido, parte = 0) {
  const m = modeloPorId(pedido.modelo);
  const total = m ? pedacosDoModelo(m) : TOTAL_PEDACOS;
  const comprados = (pedido.pedacos ?? []).filter((i) => i >= parte * total && i < (parte + 1) * total).length;
  const base = PRECO_DICA[m ? nivelDoModelo(m).id : 'facil'];
  const aumento = m && ehComplexo(m) ? AUMENTO_COMPLEXA * comprados : AUMENTO_DICA[Math.min(comprados, AUMENTO_DICA.length - 1)];
  return Math.round(base * (1 + aumento));
}
