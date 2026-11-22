// Conquistas do jogo: só os dados (nome, descrição, raridade e o desenho do prêmio). Este arquivo é
// lido também pelo gerador de assets (scripts/gen-assets.mjs), que desenha um prêmio para cada
// conquista; por isso não importa nada do jogo. As regras (quando cada uma é desbloqueada) ficam em
// lib/conquistas.js.
//
// Raridade → prêmio:
//   bronze  (fácil, sai jogando normalmente)        → broche de bronze, vai para o quadro de broches
//   prata   (média, ainda no fluxo normal do jogo)  → broche de prata, vai para o quadro
//   ouro    (difícil)                               → medalha de ouro (quadro) ou troféu pequeno (prateleira)
//   esforco (pede dedicação de verdade)             → troféu, maior quanto mais difícil (prateleira)
// Broches e medalhas agem como os objetos de parede (post-its); troféus, como os objetos de mesa.
//
// Campos: forma = broche | medalha | trofeu; tamanho (troféu) = p | m | g | gg | mestre;
// glifo = desenho no centro do prêmio (GLIFOS no gerador); meta = alvo da barra de progresso
// (`progresso` em lib/conquistas.js); secreta = descrição escondida até desbloquear.

export const RARIDADES = {
  bronze: { id: 'bronze', nome: 'Bronze', dificuldade: 'Fácil' },
  prata: { id: 'prata', nome: 'Prata', dificuldade: 'Média' },
  ouro: { id: 'ouro', nome: 'Ouro', dificuldade: 'Difícil' },
  esforco: { id: 'esforco', nome: 'Troféu', dificuldade: 'Muito difícil' },
};

export const CATEGORIAS_CONQUISTA = [
  { id: 'inicio', nome: 'Primeiros passos' },
  { id: 'desempenho', nome: 'Desempenho' },
  { id: 'tempo', nome: 'Tempo e prazos' },
  { id: 'uml', nome: 'UML' },
  { id: 'fimdesemana', nome: 'Fins de semana' },
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'cafe', nome: 'Café' },
  { id: 'escritorio', nome: 'Escritório e sala' },
  { id: 'infinito', nome: 'Modo infinito' },
  { id: 'secretas', nome: 'Secretas' },
];

const c = (id, categoria, raridade, forma, glifo, nome, descricao, extra = {}) => ({ id, categoria, raridade, forma, glifo, nome, descricao, ...extra });
const broche = (id, cat, rar, glifo, nome, desc, extra) => c(id, cat, rar, 'broche', glifo, nome, desc, extra);
const medalha = (id, cat, glifo, nome, desc, extra) => c(id, cat, 'ouro', 'medalha', glifo, nome, desc, extra);
const trofeu = (id, cat, rar, tamanho, glifo, nome, desc, extra) => c(id, cat, rar, 'trofeu', glifo, nome, desc, { tamanho, ...extra });

export const CONQUISTAS = [
  // primeiros passos
  broche('primeiro-pedido', 'inicio', 'bronze', 'check', 'Primeiro Pedido', 'Entregue o seu primeiro pedido.'),
  broche('primeiro-expediente', 'inicio', 'bronze', 'maleta', 'Primeiro Expediente', 'Conclua o dia 1 da campanha.'),
  broche('carimbo', 'inicio', 'bronze', 'estrela', 'Carimbo de Qualidade', 'Entregue um pedido com nota 100%.'),
  broche('fregues-fiel', 'inicio', 'bronze', 'coracao', 'Freguês Fiel', 'Entregue o mesmo pedido de um cliente pela segunda vez.'),
  broche('cafezinho', 'inicio', 'bronze', 'xicara', 'Hora do Cafezinho', 'Beba o primeiro café da cafeteira.'),

  // desempenho
  broche('medalha-no-peito', 'desempenho', 'prata', 'estrela', 'Medalha no Peito', 'Conclua com medalha de ouro (95% ou mais) um dia com 3 pedidos ou mais.'),
  broche('volta-por-cima', 'desempenho', 'prata', 'seta', 'Volta por Cima', 'Depois de um dia com bronze, tire ouro no dia seguinte.'),
  medalha('sequencia-perfeita', 'desempenho', 'estrela', 'Sequência Perfeita', 'Entregue 5 pedidos seguidos com 100%.', { meta: 5, interrompivel: true }),
  medalha('sem-rabisco', 'desempenho', 'check', 'Sem Rabisco', 'Conclua um dia com 4 pedidos ou mais, todos com 100%.'),
  medalha('na-raca', 'desempenho', 'chama', 'Na Raça', 'Tire 100% num pedido difícil sem comprar nenhuma dica.'),
  trofeu('semana-dourada', 'desempenho', 'ouro', 'p', 'calendario', 'Semana Dourada', 'Tire ouro em todos os dias úteis de uma mesma semana.'),
  trofeu('arquiteto-senior', 'desempenho', 'esforco', 'm', 'classe', 'Arquiteto Sênior', 'Tire 90% ou mais num pedido complexo difícil sem comprar dicas.'),
  trofeu('calendario-reluzente', 'desempenho', 'esforco', 'gg', 'calendario', 'Calendário Reluzente', 'Tenha ouro em todos os 23 dias úteis da campanha.', { meta: 23 }),

  // tempo e prazos
  broche('pontualidade', 'tempo', 'bronze', 'relogio', 'Pontualidade Britânica', 'Conclua um dia com 3 entregas ou mais, nenhuma fora do prazo e sem cliente indo embora.'),
  broche('relampago', 'tempo', 'prata', 'raio', 'Relâmpago', 'Entregue um pedido médio ou difícil com 90% ou mais usando até um quarto do prazo.'),
  broche('malabarista', 'tempo', 'prata', 'maleta', 'Malabarista', 'Tenha 3 pedidos aceitos ao mesmo tempo e entregue todos no prazo.'),
  medalha('bombeiro', 'tempo', 'chama', 'Bombeiro', 'Entregue 3 pedidos urgentes no prazo no mesmo dia.', { meta: 3, interrompivel: true }),

  // UML
  broche('primeira-classe', 'uml', 'bronze', 'classe', 'Primeira Classe', 'Entregue 3 diagramas de classes.', { meta: 3 }),
  broche('ator-principal', 'uml', 'bronze', 'ator', 'Ator Principal', 'Entregue 3 diagramas de casos de uso.', { meta: 3 }),
  broche('mudanca-de-estado', 'uml', 'bronze', 'estado', 'Mudança de Estado', 'Entregue 3 diagramas de estados.', { meta: 3 }),
  broche('especialista-classes', 'uml', 'prata', 'classe', 'Especialista em Classes', 'Entregue 15 diagramas de classes com média de 80% ou mais.', { meta: 15 }),
  broche('especialista-casos', 'uml', 'prata', 'ator', 'Especialista em Casos de Uso', 'Entregue 15 diagramas de casos de uso com média de 80% ou mais.', { meta: 15 }),
  broche('especialista-estados', 'uml', 'prata', 'estado', 'Especialista em Estados', 'Entregue 15 diagramas de estados com média de 80% ou mais.', { meta: 15 }),
  broche('encapsulamento', 'uml', 'prata', 'chave', 'Encapsulamento', 'Acerte a visibilidade (+ - #) de todos os membros em 10 pedidos de classes que usam + ou #.', { meta: 10 }),
  trofeu('poliglota-uml', 'uml', 'esforco', 'm', 'globo', 'Poliglota UML', 'Tenha média de 90% ou mais nos três tipos de diagrama (10 entregas de cada, no mínimo).'),

  // fins de semana e pedidos complexos
  broche('hora-extra', 'fimdesemana', 'bronze', 'calendario', 'Hora Extra', 'Conclua um fim de semana.'),
  broche('quebra-cabeca', 'fimdesemana', 'prata', 'quebra', 'Quebra-Cabeça', 'Tire 90% ou mais num pedido complexo comprando no máximo 4 pedaços de dica.'),
  trofeu('sem-folga', 'fimdesemana', 'esforco', 'g', 'casa', 'Sem Folga', 'Conclua todos os 8 sábados e domingos do mês.', { meta: 8 }),
  trofeu('grande-final', 'fimdesemana', 'esforco', 'g', 'estrela', 'O Grande Final', 'Tire ouro no domingo 28 (dois pedidos complexos difíceis).'),

  // dinheiro
  broche('primeiro-salario', 'dinheiro', 'bronze', 'moeda', 'Primeiro Salário', 'Junte R$ 1.000.', { meta: 1000 }),
  broche('aluguel-em-dia', 'dinheiro', 'prata', 'casa', 'Aluguel em Dia', 'Conclua 10 dias úteis seguidos com o saldo do dia positivo (já descontado o aluguel).', { meta: 10, interrompivel: true }),
  broche('pao-duro', 'dinheiro', 'prata', 'moeda', 'Pão-duro', 'Conclua com ouro, sem comprar nenhuma dica, um dia que tenha pedido médio ou difícil.'),
  medalha('pe-de-meia', 'dinheiro', 'moeda', 'Pé-de-Meia', 'Tenha R$ 10.000 guardados ao mesmo tempo.', { meta: 10000 }),
  trofeu('cliente-vip', 'dinheiro', 'esforco', 'gg', 'maleta', 'Cliente VIP da Lojinha', 'Compre todos os itens da lojinha.'),

  // café
  broche('movido-a-cafeina', 'cafe', 'bronze', 'raio', 'Movido a Cafeína', 'Entregue um pedido com o café forte fazendo efeito.'),
  broche('barista', 'cafe', 'prata', 'xicara', 'Barista', 'Prove os três tipos de cápsula: descafeinado, normal e forte.', { meta: 3 }),
  trofeu('viciado', 'cafe', 'ouro', 'p', 'xicara', 'Viciado em Café', 'Beba 50 cafés.', { meta: 50 }),

  // escritório, sala e coleção
  broche('decorador', 'escritorio', 'bronze', 'planta', 'Decorador de Interiores', 'Compre o seu primeiro item na lojinha.'),
  broche('abra-a-porta', 'escritorio', 'bronze', 'porta', 'Abra a Porta', 'Visite a sala de exposição.'),
  broche('foto-de-familia', 'escritorio', 'bronze', 'foto', 'Foto de Família', 'Mude o seu avatar depois de criar o perfil (ele aparece no porta-retrato da sala).'),
  broche('dj', 'escritorio', 'bronze', 'nota', 'DJ do Escritório', 'Escolha uma música no toca-fitas.'),
  broche('museu', 'escritorio', 'prata', 'globo', 'Museu Particular', 'Tenha 10 itens na sala de exposição (sem contar broches, medalhas e troféus).', { meta: 10 }),
  broche('colecionador', 'escritorio', 'prata', 'livro', 'Colecionador', 'Desbloqueie metade da coleção de pedidos.'),
  medalha('playlist', 'escritorio', 'nota', 'Playlist Completa', 'Compre todas as músicas.'),
  trofeu('album-completo', 'escritorio', 'esforco', 'gg', 'livro', 'Álbum Completo', 'Tenha ouro em todos os pedidos da coleção.'),

  // modo infinito
  broche('sem-fim', 'infinito', 'bronze', 'infinito', 'Sem Fim', 'Jogue o modo infinito pela primeira vez.'),
  trofeu('maratonista', 'infinito', 'ouro', 'p', 'infinito', 'Maratonista', 'Entregue 30 pedidos numa única partida do modo infinito.', { meta: 30, interrompivel: true }),
  trofeu('inabalavel', 'infinito', 'esforco', 'm', 'chama', 'Inabalável', 'No modo infinito, entregue 15 pedidos seguidos com 90% ou mais.', { meta: 15, interrompivel: true }),

  // secretas (a descrição só aparece depois de desbloquear)
  broche('errar-e-humano', 'secretas', 'bronze', 'xis', 'Errar é Humano', 'Entregue um pedido com menos de 30%. Todo mundo começa em algum lugar.', { secreta: true }),
  broche('antes-tarde', 'secretas', 'bronze', 'relogio', 'Antes Tarde do que Nunca', 'Entregue um pedido com mais de 1 minuto de atraso.', { secreta: true }),
  broche('no-vermelho', 'secretas', 'bronze', 'xis', 'No Vermelho', 'Termine um dia com o saldo do dia negativo.', { secreta: true }),
  broche('comprei-o-gabarito', 'secretas', 'bronze', 'quebra', 'Comprei o Gabarito', 'Compre os 16 pedaços de dica de um pedido complexo.', { secreta: true }),
  broche('alergia-a-prazo', 'secretas', 'bronze', 'xis', 'Alergia a Prazo', 'Deixe um cliente de pedido urgente ir embora sem resposta.', { secreta: true }),
  broche('tentar-de-novo', 'secretas', 'bronze', 'repetir', 'Tentar de Novo', 'Jogue o mesmo dia 3 vezes seguidas.', { secreta: true }),
  broche('organizador', 'secretas', 'bronze', 'torre', 'Organizador Compulsivo', 'Mova objetos do escritório 100 vezes.', { secreta: true, meta: 100 }),
  broche('por-um-fio', 'secretas', 'prata', 'relogio', 'Por um Fio', 'Entregue um pedido no prazo com 3 segundos ou menos restando.', { secreta: true }),
  broche('torre-de-pisa', 'secretas', 'prata', 'torre', 'Torre de Pisa', 'Empilhe 4 objetos, um em cima do outro.', { secreta: true }),
  broche('placebo', 'secretas', 'prata', 'xicara', 'Placebo', 'Tire 100% num pedido com o café descafeinado fazendo efeito.', { secreta: true }),
  broche('investidor', 'secretas', 'prata', 'moeda', 'Investidor de Risco', 'Gaste mais de R$ 1.000 em dicas num único pedido.', { secreta: true }),

  // a última: todas as outras
  trofeu('mestre', 'desempenho', 'esforco', 'mestre', 'estrela', 'Mestre da Diagrameria', 'Desbloqueie todas as outras conquistas.'),
];

export const conquistaPorId = (id) => CONQUISTAS.find((x) => x.id === id) ?? null;

// Cada conquista vira um objeto do escritório (sprite e metadados em art/objetos.json)
export const objetoDaConquista = (id) => `conquista-${id}`;
export const conquistaDoObjeto = (nome) => (nome?.startsWith('conquista-') ? conquistaPorId(nome.slice('conquista-'.length)) : null);

// PNG do prêmio, dentro de src/assets/conquistas/ (os mesmos nomes e subpastas de
// "arte e sprites/conquistas"). São arquivos editáveis: o gerador (npm run assets) só cria os que
// faltam, e o jogo lê direto deles (o Vite atualiza o navegador ao salvar).
const PASTA_PREMIO = (cq) => (cq.forma === 'trofeu' ? 'trofeus' : cq.forma === 'medalha' ? 'medalhas-ouro' : `broches-${cq.raridade}`);
const sufixo = (cq) => (cq.forma === 'trofeu' && cq.tamanho !== 'mestre' ? `-${cq.tamanho}` : '');
export const arquivoDoPremio = (cq) => `${PASTA_PREMIO(cq)}/conquista-${cq.id}${sufixo(cq)}.png`;

// Vai para o quadro de broches (broche, medalha) ou para as prateleiras (troféu)
export const vaiNoQuadro = (cq) => cq.forma !== 'trofeu';

// Nome do prêmio ("Broche de bronze", "Medalha de ouro", "Troféu pequeno"...)
const TAMANHO = { p: 'pequeno', m: 'médio', g: 'grande', gg: 'enorme', mestre: 'gigante' };
export function nomeDoPremio(cq) {
  if (cq.forma === 'broche') return `Broche de ${cq.raridade}`;
  if (cq.forma === 'medalha') return 'Medalha de ouro';
  return `Troféu ${TAMANHO[cq.tamanho]}`;
}
