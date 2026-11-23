import { composicaoDoDia, composicaoDoFimDeSemana, nivelDoModelo } from '../lib/dificuldade.js';
import { tipoDoDiagrama } from '../lib/categorias.js';
import { c, e, n, t } from './gabarito.js';
import { COMPLEXOS } from './complexos.js';
import { TREINOS } from './treino.js';
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
      'Olá! A biblioteca da escola vai ganhar um sistema e queremos ver quem faz o quê nele.',
      'Vamos chamá-lo de "Sistema da Biblioteca".',
      'O "Aluno" entra para "Consultar acervo" e, quando acha o que quer, "Emprestar livro". O empréstimo é feito junto com o "Bibliotecário", que também cuida de "Devolver livro".',
      'Nenhum livro sai sem "Verificar cadastro": isso acontece em todo empréstimo.',
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
      'Boa noite! Nosso app de delivery está saindo do forno e precisamos do mapa de quem usa o quê.',
      'O nome dele é "App da Pizzaria".',
      'O "Cliente" abre o app para "Fazer pedido" e depois "Acompanhar entrega".',
      'Pedido nenhum é fechado sem "Pagar": faz parte de todo pedido.',
      'Do outro lado, o "Entregador" usa o app para "Entregar pedido".',
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
      'Oi! Vamos vender ingressos pela internet e queremos ver como o cliente usa o site.',
      'O site se chama "Site do Cinema".',
      'O "Cliente" entra para "Comprar ingresso", e toda compra passa por "Escolher assento".',
      'Quem tem um código de desconto pode "Aplicar cupom" durante a compra, mas isso é só de vez em quando.',
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
      'Olá, agência! Queremos organizar o cadastro dos bichinhos do petshop.',
      'Atendemos "Cachorro" e "Gato", e os dois são tipos de "Animal".',
      'Todo animal tem um "Dono", que é quem traz ele aqui e com quem a gente fala.',
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
      'Prezados, o caixa eletrônico da agência vai ser trocado e precisamos do mapa do que o cliente faz nele.',
      'O sistema é o "Caixa Eletrônico".',
      'O "Cliente" chega para "Sacar" ou "Depositar".',
      'Seja qual for a operação, antes de tudo ele precisa "Autenticar": acontece no saque e no depósito, sempre.',
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
      'Bom dia! Queremos organizar quem é quem na escola.',
      'Aqui tem "Aluno" e "Professor", e os dois são tipos de "Pessoa".',
      'Cada "Turma" reúne os seus alunos e o professor que dá aula para ela.',
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
      'E aí! A academia vai ter um sistema novo e queremos ver quem usa o quê.',
      'Ele vai se chamar "Sistema da Academia".',
      'O "Aluno" usa para "Matricular" e para "Registrar presença" quando chega para treinar.',
      'O "Instrutor" usa para "Montar treino". Às vezes, enquanto monta, ele aproveita para "Avaliar físico" do aluno, mas nem sempre.',
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
      'Oi, pessoal da agência :) Estamos lançando um app para a cafeteria!',
      'O nome é "App da Cafeteria".',
      'O "Cliente" abre o app para "Ver cardápio" e "Pedir café".',
      'Todo café pedido passa por "Pagar" antes de ir para a máquina.',
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
      'Olá! As reservas do hotel vão para o computador e queremos o mapa de quem faz o quê.',
      'O sistema se chama "Sistema de Reservas".',
      'O "Hóspede" pode "Reservar quarto" e, se mudar de ideia, "Cancelar reserva".',
      'No balcão, o "Recepcionista" cuida de "Fazer check-in".',
      'Só dá para cancelar ou fazer o check-in de algo que já foi reservado: os dois dependem de Reservar quarto (é uma dependência, não um passo incluído).',
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
      'Oi! Estamos montando o nosso app de filmes e séries.',
      'O nome é "App de Streaming".',
      'O "Assinante" usa para "Assinar plano", "Assistir filme" e "Baixar episódio".',
      'Assistir e baixar só funcionam para quem já tem plano: os dois dependem de Assinar plano (é uma dependência, não um passo incluído).',
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
      'Boa tarde! A farmácia vai vender pelo sistema e queremos ver quem participa do quê.',
      'O sistema se chama "Sistema da Farmácia".',
      'O "Cliente" vem para "Comprar remédio", e toda compra termina em "Pagar".',
      'O "Farmacêutico" é quem faz "Validar receita". A compra depende dessa validação (é uma dependência, não um passo incluído).',
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
      'Olá! Nossa floricultura vai vender pela internet.',
      'O site se chama "Site da Floricultura".',
      'O "Cliente" entra para "Ver buquês" e, quando escolhe, "Encomendar buquê".',
      'Toda encomenda passa por "Pagar".',
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
      'Namastê! Queremos algo bem simples para o estúdio.',
      'O app se chama "App do Estúdio".',
      'O "Aluno" usa para "Ver horários" e "Agendar aula". Só isso!',
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
      'Oi! O balcão da sorveteria vai ganhar uma tela de pedidos.',
      'Ela se chama "Balcão Digital".',
      'O "Cliente" usa a tela para "Ver sabores" e "Pedir sorvete".',
      'O "Atendente" acompanha cada pedido de sorvete junto com o cliente.',
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
      'Olá! Nossa lojinha de papelaria vai para a internet.',
      'Ela se chama "Loja da Papelaria".',
      'Por enquanto o "Cliente" só vai "Comprar caderno", e toda compra passa por "Pagar".',
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
      'Boa noite! Queremos organizar as visitas noturnas ao observatório.',
      'O sistema se chama "Agenda do Observatório".',
      'O "Visitante" pode "Ver eventos" do céu e "Agendar visita". Todo agendamento passa por "Escolher horário".',
      'Na noite marcada, o "Guia" é quem vai "Conduzir visita".',
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
      'Olá! A bilheteria do aquário vai ser informatizada.',
      'O sistema se chama "Bilheteria do Aquário".',
      'O "Visitante" pode "Ver programação" e "Comprar ingresso". Estudantes e idosos às vezes aproveitam a compra para "Usar meia-entrada", mas não é todo mundo.',
      'Na entrada, o "Funcionário" faz "Validar ingresso".',
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
      'Oi! O spa vai ter agendamento online e queremos o mapa de quem usa o quê.',
      'O sistema se chama "Agenda do Spa".',
      'O "Cliente" pode "Comprar pacote" e "Agendar massagem". Toda massagem agendada passa por "Escolher terapeuta".',
      'O "Terapeuta" entra para "Confirmar horário".',
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
      'Bom dia! Agora dá para encomendar bolo pelo site da padaria.',
      'Ele se chama "Site da Padaria".',
      'O "Cliente" pode "Ver vitrine" e "Encomendar bolo". Toda encomenda passa por "Pagar".',
      'Se quiser, na encomenda ele pode "Escrever mensagem" no bolo, mas é opcional.',
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
      'Olá! O ateliê vai organizar as oficinas de pintura num portal.',
      'Ele se chama "Portal do Ateliê".',
      'O "Aluno" usa para "Fazer inscrição" (toda inscrição passa por "Pagar") e para "Enviar trabalho".',
      'O "Professor" usa para "Criar oficina" e "Corrigir trabalho".',
      'Só manda trabalho quem já se inscreveu, e só se corrige o que foi enviado: Enviar trabalho depende de Fazer inscrição, e Corrigir trabalho depende de Enviar trabalho (dependências, não passos incluídos).',
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
      'Oi! A agência de viagens vai vender pacotes pelo site.',
      'O site se chama "Site de Viagens".',
      'O "Viajante" pode "Buscar pacote" e "Reservar viagem". Toda reserva passa por "Pagar", e quem quiser pode, na reserva, "Contratar seguro" (opcional).',
      'Depois, o "Agente" faz "Confirmar reserva", que depende da reserva feita (é uma dependência, não um passo incluído).',
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
      'Olá! O coworking vai ganhar um app de reservas.',
      'Ele se chama "App do Coworking".',
      'O "Membro" pode "Reservar sala", "Reservar mesa" e "Cancelar reserva". Sala de reunião é paga: toda reserva de sala passa por "Pagar".',
      'Na entrada, o "Recepcionista" faz "Liberar acesso".',
      'Cancelar e liberar acesso só valem para uma mesa reservada: os dois dependem de Reservar mesa (dependências, não passos incluídos).',
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
      'Olá! Queremos mostrar no site em que pé está cada entrega.',
      'Toda entrega chega como "Recebido". Quando a gente vai "confirmar", ela passa para "Em preparo".',
      'Depois de "despachar", fica "A caminho", e quando o motorista vai "entregar", vira "Entregue".',
      'Enquanto está em Recebido, o cliente ainda pode "cancelar", e aí fica "Cancelado".',
      'Uma entrega Entregue ou Cancelada não muda mais: o processo acaba ali.',
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
      'Bom dia! A prefeitura quer documentar como funciona o novo semáforo.',
      'Ele liga no "Vermelho". Cada vez que dá "tempo esgotado", ele troca: do vermelho para o "Verde", do verde para o "Amarelo" e do amarelo de volta para o vermelho.',
      'Quando alguém vai "desligar" o semáforo, isso só acontece no vermelho, e aí ele para de funcionar.',
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
      'Oi! Precisamos explicar a catraca nova da estação.',
      'Ela fica "Travada" quando está parada. Ao "inserir bilhete", fica "Destravada"; quando a pessoa vai "passar", trava de novo.',
      'Para manutenção, a gente pode "desativar" a catraca, mas só quando ela está travada. Aí ela sai de funcionamento.',
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
      'E aí! Queremos mostrar como o nosso player de música se comporta.',
      'Ele abre "Parado". Com "play", fica "Tocando"; com "pause", fica "Pausado", e outro "play" volta a tocar.',
      'Se a pessoa der "stop" enquanto toca, ele volta a ficar parado.',
      'Parado, dá para "fechar" o player, e aí acabou.',
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
      'Olá! Queremos acompanhar a vida de um chamado de suporte.',
      'Todo chamado nasce "Aberto". Quando a gente vai "atribuir" para alguém, ele fica "Em atendimento", e depois de "resolver", fica "Resolvido".',
      'Se o problema voltar, o cliente pode "reabrir", e o chamado volta para atendimento.',
      'Um chamado resolvido pode ser encerrado com "fechar", e aí acabou.',
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
  // condição ("sim" / "não"; na nota os colchetes, se o jogador puser, são ignorados).
  {
    id: 'login-app',
    cliente: 'Banco Estrela Roxa',
    assunto: 'Login do aplicativo',
    tempo: 300,
    recompensa: 170,
    corpo: [
      'Olá! Precisamos explicar como funciona o login do nosso app.',
      'Tudo começa em "Digitando senha". Quando a pessoa vai "enviar", o app se pergunta: "Senha certa?".',
      'Se "sim", fica "Logado"; se "não", volta a pedir a senha.',
      'Se a pessoa "errar 3 vezes" enquanto digita, o app fica "Bloqueado", e aí não tem volta: acabou.',
      'Logado, a pessoa pode "sair", e o processo termina.',
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
        t('e1', 'd', 'enviar'), t('d', 'e2', 'sim'), t('d', 'e1', 'não'),
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
      'Oi! Queremos mostrar o que acontece com o pagamento de um pedido da loja.',
      'Todo pedido começa "Aguardando pagamento". Quando o cliente vai "pagar", a operadora decide: "Aprovado?".',
      'Se "sim", fica "Pago" e pronto, acabou. Se "não", fica "Recusado".',
      'Recusado, o cliente pode "tentar de novo" (volta a aguardar pagamento) ou "desistir", e aí acaba.',
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
        t('e1', 'd', 'pagar'), t('d', 'e2', 'sim'), t('d', 'e3', 'não'),
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
      'Olá! Queremos explicar o que acontece com um livro na devolução.',
      'O livro está "Emprestado". Quando o leitor vai "devolver", a gente confere: "No prazo?".',
      'Se "sim", ele fica "Disponível". Se "não", fica "Com multa" até o leitor "pagar multa", e aí também fica disponível.',
      'Disponível, o livro termina o processo.',
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
        t('e1', 'd', 'devolver'), t('d', 'e2', 'sim'), t('d', 'e3', 'não'),
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
      'Bom dia! Queremos acompanhar cada encomenda do depósito.',
      'Toda encomenda chega como "Recebido". Quando a gente vai "conferir", a pergunta é: "Tem estoque?".',
      'Se "sim", fica "Separando". Se "não", fica "Aguardando estoque" até "chegar produto", e aí volta para recebido para conferir de novo.',
      'Separando, a gente vai "despachar", e ela fica "Enviado". Aí termina.',
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
        t('e1', 'd', 'conferir'), t('d', 'e2', 'sim'), t('d', 'e3', 'não'),
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
      'Oi! Queremos explicar como o caixa eletrônico funciona num saque. Ele faz duas perguntas no caminho.',
      'O caixa fica "Ocioso" esperando. Quando a pessoa vai "inserir cartão", ele pergunta "Senha certa?": se "sim", fica "Aguardando saque"; se "não", volta a ficar ocioso.',
      'Aguardando saque, a pessoa vai "pedir saque" e o caixa pergunta "Tem saldo?": se "sim", fica "Entregando dinheiro"; se "não", continua aguardando saque.',
      'Depois de "retirar dinheiro", ele volta a ficar ocioso. Ocioso, dá para "desligar" o caixa, e acabou.',
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
        t('e1', 'd1', 'inserir cartão'), t('d1', 'e2', 'sim'), t('d1', 'e1', 'não'),
        t('e2', 'd2', 'pedir saque'), t('d2', 'e3', 'sim'), t('d2', 'e2', 'não'),
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
      'Oi! Nossa luminária de toque é bem simples, mas queremos documentar.',
      'Ela começa "Apagada". Basta "tocar" para ficar "Acesa", e "tocar" de novo para apagar.',
      'Apagada, dá para "desconectar" da tomada, e aí acabou.',
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
      'Olá! Queremos mostrar como a chaleira elétrica funciona.',
      'Ela começa "Desligada". Ao "ligar", fica "Aquecendo"; quando a água vai "ferver", fica "Pronta".',
      'Pronta, o trabalho dela terminou.',
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
      'E aí! Queremos mostrar como a máquina de fliperama funciona.',
      'Ela fica "Esperando ficha". Ao "inserir ficha", fica "Jogando"; quando chega o "fim de jogo", volta a esperar ficha.',
      'Esperando ficha, dá para "desligar" a máquina, e acabou.',
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
      'Olá! A estufa tem irrigação automática e queremos documentar como ela funciona.',
      'Começa "Seca". Quando o sensor vai "ativar", fica "Regando"; quando o solo vai "encher" de água, fica "Úmida".',
      'Com o tempo, a água vai "evaporar" e ela volta a ficar seca.',
      'Úmida, dá para "desligar" o sistema, e acabou.',
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
      'Bom dia! Queremos acompanhar o que acontece com um quarto da pousada.',
      'Todo quarto começa "Livre". No "check-in", fica "Ocupado"; no "check-out", fica "Em limpeza". Depois de "limpar", volta a ficar livre.',
      'Quando é hora de "fechar temporada", isso só acontece com o quarto livre, e aí acabou.',
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
      'Oi! Queremos acompanhar cada bicicleta compartilhada da cidade.',
      'Toda bicicleta começa "Disponível". Ao "desbloquear", fica "Em uso"; ao "devolver", fica disponível de novo.',
      'Se, em uso, a pessoa vai "relatar defeito", ela fica "Em manutenção" até a gente "consertar", e aí volta a ficar disponível.',
      'Uma bicicleta disponível pode ser aposentada: com "aposentar", acabou.',
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
      'Oiê! Queremos mostrar o humor do Mochi, nosso bichinho virtual.',
      'Ele começa "Feliz". Ao "passar o tempo", fica "Com fome", e quando a pessoa vai "alimentar", fica feliz de novo.',
      'Feliz, se a pessoa vai "apagar a luz", ele fica "Dormindo", e ao "acordar" volta a ficar feliz.',
      'Dormindo, dá para "desligar" o jogo, e acabou.',
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
      'Olá! Queremos explicar o caminho de uma carta no correio.',
      'A carta começa "Escrita". Quando a pessoa vai "postar", a gente confere: "Endereço certo?".',
      'Se "sim", fica "Enviada" e o processo termina. Se "não", fica "Devolvida", e a pessoa precisa "corrigir endereço" para a carta voltar a ser escrita e ir de novo.',
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
        t('e1', 'd', 'postar'), t('d', 'e2', 'sim'), t('d', 'e3', 'não'),
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
      'Boa tarde! Queremos mostrar como preparamos cada chá.',
      'Tudo começa com o "Pedido feito". Ao "aquecer água", o chá fica "Em infusão".',
      'De tempos em tempos a gente vai "provar" e se pergunta: "No ponto?". Se "sim", ele é "Servido" e acabou; se "não", continua em infusão.',
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
        t('d', 'e3', 'sim'), t('d', 'e2', 'não'),
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
      'Olá! Queremos acompanhar uma obra desde que chega até sair de exposição.',
      'Toda obra começa como "Rascunho". Quando o artista vai "enviar obra", ela fica "Em curadoria".',
      'Lá, a gente vai "avaliar" e decidir: "Aprovada?". Se "sim", fica "Em exposição"; se "não", volta para rascunho.',
      'Ao "encerrar mostra", ela fica "Arquivada", e acabou.',
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
        t('d', 'e3', 'sim'), t('d', 'e1', 'não'),
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
      'Olá! Queremos o modelo das contas do banco, já com o que cada uma guarda e sabe fazer.',
      'Todo "Cliente" tem "- nome: String" e "- cpf: String".',
      'A "ContaBancaria" guarda "- numero: String", "- saldo: float" e "- titular: Cliente" (o dono da conta é um cliente).',
      'Na conta dá para "+ depositar(valor: float)", "+ sacar(valor: float): bool" (diz se deu certo) e "+ consultarSaldo(): float".',
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
      'Oi! Queremos o modelo dos empréstimos da biblioteca, com o que cada parte guarda e sabe fazer.',
      'Cada "Livro" tem "- titulo: String" e "- isbn: String". Cada "Leitor" tem "- nome: String" e "- matricula: int".',
      'O "Emprestimo" guarda "- dataRetirada: Date", qual livro saiu ("- livro: Livro") e com quem ("- leitor: Leitor").',
      'O leitor pode "+ renovar(): bool" o empréstimo. Na renovação, o próprio empréstimo usa "- calcularMulta(dias: int): float", que é privado: ninguém de fora chama.',
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
      'Boa tarde! Queremos o modelo dos carros e dos relatórios da locadora.',
      'Cada "Carro" tem "- placa: String" e "- modelo: String", e dá para "+ alugar()" e "+ devolver()".',
      'O "RelatorioLocacao" guarda "- dataGeracao: Date" e sabe "+ gerar(carro: Carro): String".',
      'O relatório não guarda carro nenhum: só recebe o carro na hora de gerar e consulta de passagem.',
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
      'Olá! A cozinha do bistrô vai trocar o papel por comandas no sistema.',
      'Cada "Comanda" tem "- mesa: int" e "- aberta: bool", e dá para "+ adicionarItem(item: ItemComanda)" e "+ calcularTotal(): float".',
      'A comanda é formada pelos seus "ItemComanda" (pelo menos um): se a comanda for apagada, os itens somem junto, e cada item é de uma comanda só.',
      'Cada item tem "- quantidade: int" e qual "- produto: Produto" é, e sabe "+ subtotal(): float". O "Produto" tem "- nome: String" e "- preco: float".',
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
      'Oi! A construtora quer o modelo das plantas das casas.',
      'Cada "Casa" tem "- endereco: String", e dá para "+ adicionarComodo(comodo: Comodo)" e "+ calcularArea(): float".',
      'A casa é formada pelos seus "Comodo" ("- nome: String", "- area: float"): se a casa for demolida, os cômodos deixam de existir junto.',
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
      'Olá! A plataforma de cursos precisa do seu modelo de classes.',
      'Cada "Curso" tem "- titulo: String" e "- cargaHoraria: int", e dá para "+ publicar()".',
      'O curso é formado pelos seus "Modulo" ("- titulo: String", "- ordem: int"), e cada módulo é formado pelas suas "Aula" ("- titulo: String", "- duracao: int", e o aluno pode "+ assistir()").',
      'Apagar um curso apaga os módulos dele, e apagar um módulo apaga as aulas dele.',
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
      'Oi! Quero organizar os pedidos do balcão da lanchonete.',
      'Cada "Pedido" tem "- numero: int" e "- total: float", e dá para "+ calcularTotal(): float" e "+ adicionarItem(item: Item)".',
      'O pedido é formado pelos seus "Item" (pelo menos um): se o pedido for apagado, os itens somem junto, e cada item é de um pedido só.',
      'Cada item tem "- descricao: String", "- quantidade: int" e "- precoUnitario: float", e sabe "+ subtotal(): float".',
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
      'Olá! Coordeno uma escola de idiomas e quero organizar as matrículas.',
      'Cada "Aluno" tem "- matricula: int" e "- nome: String", e pode "+ matricular(curso: Curso)".',
      'Cada "Curso" tem "- codigo: String", "- nome: String" e "- cargaHoraria: int".',
      'Todo aluno faz pelo menos um curso, e tem curso que ainda está sem nenhum aluno (ou com vários).',
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
      'E aí! Estou montando um app de música e preciso organizar as playlists.',
      'Cada "Playlist" tem "- nome: String", e dá para "+ adicionarMusica(musica: Música)" e ver a "+ duracaoTotal(): int".',
      'Cada "Música" tem "- titulo: String" e "- duracaoSegundos: int".',
      'A playlist reúne músicas, mas se a playlist for apagada as músicas continuam no app. Uma playlist pode estar vazia ou ter várias, e uma música pode estar em nenhuma ou em várias playlists.',
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
      'Bom dia! Tenho uma cooperativa de crédito e quero organizar as contas.',
      'Cada "Cliente" tem "- nome: String" e "- cpf: String".',
      'Cada "Conta" tem "- numero: int" e "- saldo: float", e dá para "+ depositar(valor: float)" e "+ sacar(valor: float): bool" (o saque diz se deu certo).',
      'Todo cliente tem pelo menos uma conta, e cada conta é de um cliente só.',
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
      'Olá! Minha loja online precisa de um carrinho de compras.',
      'O "Carrinho" tem "- total: float", e dá para "+ adicionar(item: ItemCarrinho)" e "+ calcularTotal(): float".',
      'O carrinho é formado pelos seus "ItemCarrinho" (pode estar vazio): se o carrinho for apagado, os itens somem junto, e cada item é de um carrinho só. O item tem "- quantidade: int" e sabe "+ subtotal(): float".',
      'Cada item é de um único "Produto" ("- nome: String", "- preco: float"), e um produto pode estar em nenhum ou em vários itens.',
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
      'Olá! Administro uma clínica e quero organizar as consultas.',
      '"Paciente" e "Médico" são dois tipos de "Pessoa". Toda pessoa tem "# nome: String" e "# cpf: String" (protegidos, para os dois tipos usarem).',
      'O paciente tem "- convenio: String". O médico tem "- crm: String" e é quem pode "+ atender(consulta: Consulta)".',
      'Cada "Consulta" ("- data: String", "- horario: String") tem um paciente e um médico, e cada um deles pode ter nenhuma ou várias consultas.',
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
      'Oi! Sou bibliotecária e quero organizar o acervo e os empréstimos.',
      '"Aluno" e "Professor" são dois tipos de "Usuário". Todo usuário tem "# nome: String" e "# matricula: String" (protegidos, para os tipos usarem) e sabe "+ limiteEmprestimos(): int".',
      'O aluno tem "- curso: String" e o professor tem "- departamento: String". Cada um calcula o próprio limite, então os dois também têm "+ limiteEmprestimos(): int".',
      'Um usuário pode ter nenhum ou vários "Empréstimo"s, e cada empréstimo é de um usuário só. O empréstimo guarda "- dataRetirada: Date" e "- dataDevolucao: Date" e sabe "+ estaAtrasado(): bool".',
      'Cada empréstimo é de um único "Livro" ("- titulo: String", "- isbn: String"), e um livro pode ter sido emprestado nenhuma ou várias vezes.',
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
      'Boa noite! Quero organizar a minha frota.',
      'Todo "Veículo" segue as regras de "Manutenivel" (é um tipo dela), e o "Caminhão" é um tipo de veículo.',
      'Cada veículo tem o seu "Motor", e cada motor é de um veículo só. Mas o motor pode ser trocado: se o veículo sair da frota, o motor continua no estoque.',
      'Cada motor usa um único "TipoCombustivel", e um mesmo tipo serve para nenhum ou vários motores.',
      'O "RelatorioFrota" só consulta os veículos de passagem, sem guardar nenhum.',
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
      'Olá! Estamos fazendo um atlas interativo.',
      'Cada "País" tem a sua "Capital", e cada capital é de um país só.',
      'Do mesmo jeito, cada país tem o seu "Hino", e cada hino é de um país só.',
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
      'Oi! Sou do RH e quero organizar a equipe.',
      'Cada "Departamento" tem pelo menos um "Funcionário", e cada funcionário trabalha num departamento só.',
      'Alguns funcionários têm uma "Vaga" no estacionamento (no máximo uma, e tem quem não tenha); cada vaga é de um funcionário só.',
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
      'Boa noite! Queremos organizar o catálogo da cinemateca.',
      'Todo "Filme" tem pelo menos um "Ator" no elenco, e um ator pode estar em nenhum ou em vários filmes.',
      'Todo filme tem pelo menos um "Gênero", e um gênero pode ter nenhum ou vários filmes.',
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
      'Olá! Precisamos organizar as turmas do conservatório.',
      'Cada "Turma" tem um único "Professor", e um professor pode dar nenhuma ou várias turmas.',
      'Cada turma tem pelo menos um "Aluno", e um aluno pode estar em nenhuma ou em várias turmas.',
      'A turma é formada pelas suas "Aula"s (pelo menos uma): se a turma acabar, as aulas dela somem junto, e cada aula é de uma turma só.',
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
      'Oi! Pedido JUMBO: o programa de fidelidade precisa de DOIS diagramas, um de casos de uso e um de classes.',
      'No app, que se chama "App Fidelidade", o "Cliente" pode "Juntar pontos" e "Trocar pontos".',
      'Por trás, todo "Cliente" tem o seu "Cartão Fidelidade", e os pontos do cartão viram uma "Recompensa".',
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
      'Olá! Pedido JUMBO: o clube do caderno precisa de um diagrama de casos de uso e um de classes.',
      'No "Clube da Papelaria", o "Assinante" pode "Assinar clube" e "Receber kit" todo mês.',
      'No kit vêm "Caderno" e "Caneta", e os dois são tipos de "Produto".',
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
      'Olá! Pedido JUMBO: o hotel precisa de um diagrama de casos de uso e um de classes.',
      'No "Portal do Hotel", o "Hóspede" pode "Ver fotos" e "Reservar quarto", e toda reserva passa por "Pagar". O "Recepcionista" cuida de "Fazer check-in".',
      'Por trás: o "Hotel" é formado pelos seus "Quarto"s (se o hotel fechar, os quartos deixam de existir junto), e a "Suíte" é um tipo de quarto.',
      'Cada "Reserva" liga um quarto a um "Hóspede".',
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
      'E aí! Pedido JUMBO: a academia precisa de um diagrama de casos de uso e um de classes.',
      'No "App da Academia", o "Aluno" pode "Assinar plano" e "Ver treino". O "Instrutor" pode "Montar treino" e, às vezes, aproveita para "Avaliar físico" (nem sempre).',
      'Por trás: cada "Aluno" tem o seu "Treino", e o treino reúne vários "Exercício"s, que continuam existindo se o treino for apagado.',
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
      'Prezados, pedido JUMBO: a conta digital precisa de um diagrama de casos de uso e um de classes.',
      'No "App do Banco", o "Cliente" pode "Fazer Pix", "Pagar boleto" e "Ver extrato". Pix e boleto sempre passam por "Autenticar", e no boleto dá para, se quiser, "Agendar pagamento".',
      'Por trás: cada "Cliente" tem a sua "Conta", com "- saldo: float" e "+ transferir(valor: float): bool". A "Conta Poupança" é um tipo de conta.',
      'A conta é formada pelas suas "Transação"s: se a conta for encerrada, as transações somem junto.',
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
      'Oi! Pedido JUMBO: o cinema precisa de um diagrama de casos de uso e um de estados.',
      'No "Site do Cine", o "Cliente" pode "Ver sessões" e "Comprar ingresso".',
      'Depois da compra, o ingresso fica "Comprado". Quando a pessoa vai "entrar na sala", ele fica "Usado", e acabou.',
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
      'E aí! Pedido JUMBO: a lanchonete precisa de um diagrama de casos de uso e um de estados.',
      'No "App da Lanchonete", o "Cliente" pode "Fazer pedido", e todo pedido passa por "Pagar".',
      'O pedido começa "Na cozinha". Ao "finalizar", fica "Pronto"; quando o cliente vai "retirar", fica "Retirado", e acabou.',
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
      'Oi! Pedido JUMBO: o streaming precisa de um diagrama de casos de uso e um de estados.',
      'No "App de Streaming", o "Assinante" pode "Assinar plano", "Assistir série" e "Baixar episódio". Assistir e baixar só funcionam com plano: dependem de Assinar plano (dependências, não passos incluídos).',
      'O player abre "Parado". Com "play", fica "Reproduzindo"; com "pause", fica "Pausado", e outro "play" volta a reproduzir.',
      'Quando o episódio vai "terminar" durante a reprodução, acabou.',
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
      'Olá! Pedido JUMBO: o rastreio precisa de um diagrama de casos de uso e um de estados.',
      'No "App de Entregas", o "Cliente" pode "Rastrear pacote" e "Agendar entrega", e o "Entregador" faz "Confirmar entrega".',
      'Todo pacote começa "Postado". Ao "coletar", fica "Em trânsito". De lá, ao "entregar", fica "Entregue" e acabou; ou, se precisar "devolver", volta a ficar postado.',
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
      'Olá! Pedido JUMBO: as consultas precisam de um diagrama de casos de uso e um de estados.',
      'No "Portal da Clínica", o "Paciente" pode "Marcar consulta" (toda marcação passa por "Escolher horário") e "Cancelar consulta", que só vale para uma consulta marcada (é uma dependência, não um passo incluído). O "Médico" faz "Atender paciente".',
      'Toda consulta começa "Marcada". Ao "chegar o horário", a pergunta é: "Paciente veio?". Se "sim", fica "Realizada"; se "não", fica "Faltou". Nos dois casos, acabou.',
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
          t('e1', 'd', 'chegar o horário'), t('d', 'e2', 'sim'), t('d', 'e3', 'não'),
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
      'Olá, agência! Pedido JUMBO: o banho e tosa precisa de um diagrama de classes e um de estados.',
      'Todo "Pet" tem um "Dono", e cada "Agendamento" é de um pet.',
      'No dia, o pet fica "Esperando". Ao "começar", fica "No banho"; depois de "secar", fica "Pronto", e acabou.',
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
      'Olá! Pedido JUMBO: o acervo precisa de um diagrama de classes e um de estados.',
      'No acervo tem "Livro" e "Revista", e os dois são tipos de "Item".',
      'Todo livro começa "Na estante". Ao "emprestar", fica "Emprestado", e ao "devolver", volta para a estante.',
      'Na estante, um livro velho pode ser descartado: com "descartar", acabou.',
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
      'Boa noite! Pedido JUMBO: a pizzaria precisa de um diagrama de classes e um de estados.',
      'Cada "Cliente" faz o seu "Pedido". O pedido é formado pelos seus "Item do Pedido" (se o pedido for apagado, os itens somem junto), e cada item é de uma "Pizza".',
      'O pedido começa "Recebido". Ao "assar", fica "No forno"; ao "despachar", fica "Saiu para entrega"; ao "entregar", fica "Entregue".',
      'Recebido, o cliente ainda pode "cancelar", e aí fica "Cancelado". Entregue ou cancelado, acabou.',
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
      'E aí! Pedido JUMBO: a rádio precisa de um diagrama de classes e um de estados.',
      'Cada "Locutor" apresenta o seu "Programa". O programa reúne várias "Música"s, mas as músicas continuam no acervo se o programa acabar. A "Vinheta" é um tipo de música.',
      'A transmissão começa "Fora do ar". Ao "ligar transmissor", fica "No ar", e ao "desligar", sai do ar de novo.',
      'No ar, ao "chamar comercial", entra no "Intervalo"; ao "voltar", fica no ar de novo. Fora do ar, dá para "encerrar" o dia, e acabou.',
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
      'Oi! Pedido JUMBO: a loja precisa de um diagrama de classes e um de estados.',
      'Cada "Cliente" pode ter feito nenhum ou vários "Pedido"s, e cada pedido é de um cliente só. O pedido é formado pelos seus "Item"s (pelo menos um; se o pedido for apagado, os itens somem junto), e cada item é de um "Produto".',
      'O pagamento começa no "Carrinho". Ao "finalizar compra", a pergunta é: "Cartão aprovado?". Se "sim", fica "Pago"; se "não", volta para o carrinho.',
      'Pago, a gente vai "despachar", e fica "Enviado". Aí acabou.',
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
          t('e1', 'd', 'finalizar compra'), t('d', 'e2', 'sim'), t('d', 'e1', 'não'),
          t('e2', 'e3', 'despachar'), t('e3', 'f'),
        ],
      }),
    ],
  },
];

// Todos os modelos que chegam por e-mail (normais + JUMBO + complexos). Urgentes saem só de MODELOS.
export const TODOS_MODELOS = [...MODELOS, ...JUMBOS, ...COMPLEXOS];
export { COMPLEXOS };
// (o pedido de treino do tutorial, data/treino.js, não chega por e-mail, mas também tem modelo)
export const modeloPorId = (id) => TODOS_MODELOS.find((m) => m.id === id) ?? TREINOS.find((m) => m.id === id);
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
