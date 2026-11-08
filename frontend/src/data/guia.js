// Conteúdo do app "Guia" (área de trabalho do computador): como funciona cada tipo de diagrama.
// Cada seção tem: para que serve, as peças (com o ícone da paleta do editor), um pedido de exemplo,
// o passo a passo de por que montar assim e o diagrama pronto (desenhado igual aos gabaritos).

const no = (id, tipo, rotulo, x, y, extra = {}) => ({ id, tipo, rotulo, x, y, ...extra });
const ed = (tipo, de, para, extra = {}) => ({ id: `${de}-${tipo}-${para}`, tipo, de, para, ...extra });

export const SECOES_GUIA = [
  {
    id: 'casos',
    nome: 'Caso de uso',
    icone: 'ator',
    resumo:
      'Mostra O QUE o sistema faz e QUEM usa cada função. Não mostra como é feito por dentro: é a visão de fora, do usuário.',
    pecas: [
      { tipo: 'ator', nome: 'Ator', funcao: 'Quem usa o sistema: uma pessoa, um papel ou outro sistema.', uso: 'Fica FORA do retângulo do sistema. Nome de papel, no singular: "Cliente", não "Clientes".' },
      { tipo: 'casoDeUso', nome: 'Caso de uso', funcao: 'Uma coisa que o sistema faz para alguém.', uso: 'Fica DENTRO do sistema. Comece com um verbo: "Agendar coleta", "Pagar".' },
      { tipo: 'sistema', nome: 'Sistema', funcao: 'O limite do sistema: separa o que é dele do que é de fora.', uso: 'Retângulo com o nome do sistema. Puxe as setinhas do meio dos lados para caber todos os casos de uso.' },
      { tipo: 'associacao', nome: 'Associação', funcao: 'Liga um ator ao caso de uso que ele usa.', uso: 'Linha simples, sem seta, atravessando a borda do sistema.' },
      { tipo: 'include', nome: 'Include', funcao: 'O caso base SEMPRE executa o incluído.', uso: 'Sai do caso base e a seta aponta para o incluído. Ex.: "Agendar coleta" → «include» → "Pagar".' },
      { tipo: 'extend', nome: 'Extend', funcao: 'Um comportamento OPCIONAL, que só acontece às vezes.', uso: 'Sai do caso opcional e aponta para o caso base. Ex.: "Aplicar desconto" → «extend» → "Pagar".' },
      { tipo: 'dependencia', nome: 'Dependência', funcao: 'Um caso só pode acontecer se o outro já existir ou já tiver acontecido.', uso: 'Tracejada, sai de quem depende. Ex.: "Confirmar entrega" ⇢ "Agendar coleta".' },
      { tipo: 'nota', nome: 'Nota', funcao: 'Um comentário solto, para lembrar algo.', uso: 'Não vale ponto: use à vontade.' },
    ],
    pedido: {
      cliente: 'Lavanderia Bolha',
      corpo: [
        'O sistema se chama "App da Lavanderia".',
        'Atores: "Cliente" e "Atendente".',
        'O Cliente pode "Agendar coleta". Todo agendamento inclui "Pagar".',
        'Às vezes o Cliente tem um cupom: "Aplicar desconto" estende Pagar.',
        'O Atendente faz o "Confirmar entrega", que depende de Agendar coleta.',
      ],
    },
    passos: [
      { frase: 'O sistema se chama "App da Lavanderia"', porque: 'vira o retângulo Sistema com esse nome exato. Tudo que o app faz vai para dentro dele.' },
      { frase: 'Atores: "Cliente" e "Atendente"', porque: 'são quem USA o app, então são atores e ficam do lado de fora do retângulo.' },
      { frase: 'O Cliente pode "Agendar coleta"', porque: 'é algo que o sistema faz: caso de uso dentro do retângulo, ligado ao Cliente por associação.' },
      { frase: 'Todo agendamento inclui "Pagar"', porque: '"todo" = sempre acontece → include, saindo de Agendar coleta e apontando para Pagar.' },
      { frase: '"Aplicar desconto" estende Pagar', porque: '"às vezes" = opcional → extend, saindo de Aplicar desconto e apontando para Pagar (a seta vai para o caso base).' },
      { frase: '"Confirmar entrega", que depende de Agendar coleta', porque: 'não dá para confirmar o que não foi agendado → dependência, saindo de Confirmar entrega.' },
    ],
    diagrama: {
      nodes: [
        no('s', 'sistema', 'App da Lavanderia', 160, 20, { w: 520, h: 360 }),
        no('a1', 'ator', 'Cliente', 20, 120),
        no('a2', 'ator', 'Atendente', 740, 260),
        no('c1', 'casoDeUso', 'Agendar coleta', 200, 80),
        no('c2', 'casoDeUso', 'Pagar', 460, 80),
        no('c3', 'casoDeUso', 'Aplicar desconto', 460, 180),
        no('c4', 'casoDeUso', 'Confirmar entrega', 460, 280),
      ],
      edges: [
        ed('associacao', 'a1', 'c1'),
        ed('include', 'c1', 'c2'),
        ed('extend', 'c3', 'c2'),
        ed('associacao', 'a2', 'c4'),
        ed('dependencia', 'c4', 'c1'),
      ],
    },
  },
  {
    id: 'classes',
    nome: 'Classes',
    icone: 'classe',
    resumo:
      'Mostra COMO os dados do sistema se organizam: que tipos de coisa existem (classes), o que cada uma guarda (atributos), o que sabe fazer (métodos) e como se ligam.',
    pecas: [
      { tipo: 'classe', nome: 'Classe', funcao: 'Um molde de objetos: um substantivo no singular.', uso: 'Caixa em 3 partes: nome em cima, atributos no meio, métodos embaixo. Com a classe selecionada, clique na parte e escreva; Enter cria outra linha.' },
      { texto: '- a: T', nome: 'Atributo', funcao: 'Um dado que cada objeto guarda.', uso: 'Uma linha por atributo: visibilidade, nome e tipo. "- saldo: float" ("-" = privado).' },
      { texto: '+ m()', nome: 'Método', funcao: 'Algo que o objeto sabe fazer.', uso: 'Nome, parâmetros e retorno. "+ sacar(valor: float): bool" ("+" = público).' },
      { tipo: 'associacao', nome: 'Associação', funcao: 'Duas classes que se conhecem (uma guarda a outra num atributo).', uso: 'Linha simples. Se "Animal" tem "- tutor: Tutor", ligue Animal — Tutor.' },
      { texto: '1  0..*', nome: 'Multiplicidade', funcao: 'Quantos objetos de um lado se ligam a cada um do outro.', uso: 'Selecione a associação e escolha cada ponta: 1, 0..1, 1..* ou 0..*. O número fica do lado da classe contada.' },
      { tipo: 'heranca', nome: 'Herança', funcao: '"É um tipo de": a filha herda tudo da mãe.', uso: 'Sai da filha, triângulo vazado na mãe. "Cachorro" → "Animal".' },
      { tipo: 'composicao', nome: 'Composição', funcao: 'O todo é feito das partes; sem o todo, as partes somem.', uso: 'Losango CHEIO do lado do todo (a ligação sai do todo).' },
      { tipo: 'agregacao', nome: 'Agregação', funcao: 'O todo reúne partes que existem sem ele.', uso: 'Losango VAZADO do lado do todo.' },
      { tipo: 'dependencia', nome: 'Dependência', funcao: 'Uma classe só USA a outra de passagem (ex.: num parâmetro).', uso: 'Tracejada, sai de quem usa. "+ gerar(a: Animal)" no Relatório → Relatório ⇢ Animal.' },
    ],
    pedido: {
      cliente: 'Clínica Vet Patinhas',
      corpo: [
        'Classe "Tutor" com "- nome: String".',
        'Classe "Animal" com "- nome: String" e "- tutor: Tutor", e o método "+ vacinar(vacina: String)".',
        'Cada Animal tem 1 Tutor, e um Tutor pode ter 0..* Animais.',
        '"Cachorro" é um tipo de Animal.',
        'O Animal é composto de um "Prontuario" com "- anotacoes: String": sem o animal, o prontuário não existe.',
      ],
    },
    passos: [
      { frase: 'Classe "Tutor"... Classe "Animal"', porque: 'cada "Classe X" vira uma caixa com esse nome; os atributos e métodos citados vão dentro dela.' },
      { frase: '"- tutor: Tutor"', porque: 'o atributo é do tipo de outra classe, então Animal e Tutor se ligam por associação.' },
      { frase: 'Cada Animal tem 1 Tutor, um Tutor pode ter 0..* Animais', porque: 'multiplicidade: "1" na ponta do Tutor (cada animal tem um tutor) e "0..*" na ponta do Animal.' },
      { frase: '"Cachorro" é um tipo de Animal', porque: '"é um tipo de" = herança, saindo de Cachorro com o triângulo em Animal.' },
      { frase: 'sem o animal, o prontuário não existe', porque: 'a parte morre com o todo = composição, losango cheio no Animal.' },
    ],
    diagrama: {
      nodes: [
        no('k1', 'classe', 'Tutor', 20, 60, { atributos: ['- nome: String'], metodos: [] }),
        no('k2', 'classe', 'Animal', 360, 60, { atributos: ['- nome: String', '- tutor: Tutor'], metodos: ['+ vacinar(vacina: String)'] }),
        no('k3', 'classe', 'Cachorro', 360, 320, { atributos: [], metodos: [] }),
        no('k4', 'classe', 'Prontuario', 760, 60, { atributos: ['- anotacoes: String'], metodos: [] }),
      ],
      edges: [
        ed('associacao', 'k2', 'k1', { multDe: '0..*', multPara: '1' }),
        ed('heranca', 'k3', 'k2'),
        ed('composicao', 'k2', 'k4'),
      ],
    },
  },
  {
    id: 'estados',
    nome: 'Estados',
    icone: 'estado',
    resumo:
      'Mostra a VIDA de um objeto: em que situações (estados) ele pode estar e que acontecimentos (eventos) o fazem mudar de uma para outra.',
    pecas: [
      { tipo: 'estadoInicial', nome: 'Início', funcao: 'Onde tudo começa. Só existe um.', uso: 'Dele sai uma seta, sem evento, para o primeiro estado.' },
      { tipo: 'estado', nome: 'Estado', funcao: 'Uma situação em que o objeto fica até algo acontecer.', uso: 'Nome de situação, sem verbo: "No forno", "Pausado".' },
      { tipo: 'transicao', nome: 'Transição', funcao: 'A mudança de um estado para outro, causada por um evento.', uso: 'Seta do estado atual para o próximo. Selecione a seta e escreva o EVENTO no campo "Evento".' },
      { tipo: 'estadoFinal', nome: 'Fim', funcao: 'Onde a vida do objeto termina.', uso: 'Só chegam setas nele (sem evento quando o fim é natural).' },
    ],
    pedido: {
      cliente: 'Pizzaria Forno Roxo',
      corpo: [
        'Estados do pedido: "Aguardando pagamento", "No forno", "Entregue" e "Cancelado".',
        'Começa em Aguardando pagamento.',
        'Com o evento "pagar" vai para No forno; com "entregar" vai para Entregue.',
        'Aguardando pagamento também pode ir para Cancelado com "cancelar".',
        'Entregue e Cancelado terminam o pedido.',
      ],
    },
    passos: [
      { frase: 'Estados do pedido: ...', porque: 'cada situação vira um estado (retângulo arredondado) com o nome exato.' },
      { frase: 'Começa em Aguardando pagamento', porque: 'a bolinha preta (Início) aponta para ele, com uma seta sem evento.' },
      { frase: 'Com o evento "pagar" vai para No forno', porque: 'transição de Aguardando pagamento para No forno, com "pagar" escrito na seta.' },
      { frase: 'também pode ir para Cancelado com "cancelar"', porque: 'um estado pode ter várias saídas: outra transição, com o seu próprio evento.' },
      { frase: 'Entregue e Cancelado terminam', porque: 'os dois ligam no Fim (bolinha com anel), com setas sem evento.' },
    ],
    diagrama: {
      nodes: [
        no('i', 'estadoInicial', 'Início', 20, 120),
        no('e1', 'estado', 'Aguardando pagamento', 100, 100, {}),
        no('e2', 'estado', 'No forno', 400, 100),
        no('e3', 'estado', 'Entregue', 660, 100),
        no('e4', 'estado', 'Cancelado', 100, 280),
        no('f', 'estadoFinal', 'Fim', 700, 300),
      ],
      edges: [
        ed('transicao', 'i', 'e1', { rotulo: '' }),
        ed('transicao', 'e1', 'e2', { rotulo: 'pagar' }),
        ed('transicao', 'e2', 'e3', { rotulo: 'entregar' }),
        ed('transicao', 'e1', 'e4', { rotulo: 'cancelar' }),
        ed('transicao', 'e3', 'f', { rotulo: '' }),
        ed('transicao', 'e4', 'f', { rotulo: '' }),
      ],
    },
  },
];
