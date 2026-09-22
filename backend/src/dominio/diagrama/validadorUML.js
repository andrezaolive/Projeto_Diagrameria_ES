/**
 * ValidadorUML: compara o diagrama entregue pelo jogador com o gabarito e
 * devolve o que acertou, o que faltou e o que sobrou, por categoria.
 *
 * Devolve um diff, nunca um booleano (decisao de arquitetura 3 do README): a
 * nota e parcial e o jogador ve exatamente o que errou (RF15, RF22). Quem
 * transforma o diff em nota e src/dominio/jogo/pontuacao.js.
 *
 * Regras de comparacao (docs/schemas/README.md):
 * - classes casam pelo nome normalizado (sem espaco nas pontas, sem diferenca de
 *   caixa, sem acento, espacos internos colapsados);
 * - `id`, `posicao`, `rotulo` e a ordem dos itens sao ignorados (RF25);
 * - relacionamentos casam pela tripla (origem, destino, tipo); `associacao` nao
 *   tem direcao, os outros tipos tem;
 * - so pontuam as pontas de multiplicidade que o gabarito define, e `*` e o
 *   mesmo que `0..*`.
 *
 * Pressupoe que os dois diagramas ja passaram por validarDiagrama(): formato
 * certo e ids coerentes.
 */

/** Tipos de relacionamento em que trocar origem e destino muda o significado. */
const TIPOS_SEM_DIRECAO = new Set(['associacao']);

function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Nome de classe, atributo ou metodo, como o jogador provavelmente quis dizer. */
function normalizarNome(nome) {
  return semAcento(nome).trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Tipo de dado: "List< Item >" e "list<item>" sao o mesmo tipo. */
function normalizarTipo(tipo) {
  return semAcento(tipo).replace(/\s+/g, '').toLowerCase();
}

function normalizarMultiplicidade(valor) {
  return valor === '*' ? '0..*' : valor;
}

function estereotipoDe(classe) {
  return classe.estereotipo ?? 'classe';
}

// --- Classes ---------------------------------------------------------------

/**
 * Pareia cada classe do gabarito com no maximo uma classe entregue de mesmo
 * nome normalizado. Nome repetido na entrega: a primeira casa, a segunda sobra.
 */
function parearClasses(esperado, entregue) {
  const livresPorNome = new Map();
  for (const classe of entregue.classes) {
    const chave = normalizarNome(classe.nome);
    if (!livresPorNome.has(chave)) livresPorNome.set(chave, []);
    livresPorNome.get(chave).push(classe);
  }

  // id da classe entregue -> classe do gabarito com que casou
  const esperadaPorIdEntregue = new Map();
  const pares = [];
  const faltando = [];

  for (const classe of esperado.classes) {
    const candidata = livresPorNome.get(normalizarNome(classe.nome))?.shift();
    if (candidata) {
      pares.push({ esperada: classe, entregue: candidata });
      esperadaPorIdEntregue.set(candidata.id, classe);
    } else {
      faltando.push(classe);
    }
  }

  const extras = entregue.classes.filter((classe) => !esperadaPorIdEntregue.has(classe.id));
  return { pares, faltando, extras, esperadaPorIdEntregue };
}

/**
 * Estereotipo so e avaliado quando o gabarito declara um diferente de 'classe'.
 * Marcar 'interface' numa classe que o gabarito tem como classe comum e um
 * erro que desconta (indevido), mas nao entra no maximo possivel.
 */
function compararEstereotipos(pares) {
  const resultado = { corretos: [], errados: [], indevidos: [] };

  for (const { esperada, entregue } of pares) {
    const esperadoValor = estereotipoDe(esperada);
    const entregueValor = estereotipoDe(entregue);
    const item = { classe: esperada.nome, esperado: esperadoValor, entregue: entregueValor };

    if (esperadoValor !== 'classe') {
      (esperadoValor === entregueValor ? resultado.corretos : resultado.errados).push(item);
    } else if (entregueValor !== 'classe') {
      resultado.indevidos.push(item);
    }
  }

  return resultado;
}

// --- Atributos e metodos ---------------------------------------------------

/**
 * @param {string} lista  'atributos' ou 'metodos'.
 * @param {string} campoTipo  'tipo' (atributo) ou 'retorno' (metodo).
 */
function compararMembros({ pares, faltando }, lista, campoTipo) {
  const resultado = { corretos: [], comDetalheErrado: [], faltando: [], extras: [] };

  for (const { esperada, entregue } of pares) {
    const livres = new Map();
    for (const membro of entregue[lista] ?? []) {
      const chave = normalizarNome(membro.nome);
      if (!livres.has(chave)) livres.set(chave, []);
      livres.get(chave).push(membro);
    }

    for (const membro of esperada[lista] ?? []) {
      const candidato = livres.get(normalizarNome(membro.nome))?.shift();
      if (!candidato) {
        resultado.faltando.push({ classe: esperada.nome, nome: membro.nome });
        continue;
      }

      const erros = [];
      if (normalizarTipo(membro[campoTipo]) !== normalizarTipo(candidato[campoTipo])) {
        erros.push({
          campo: campoTipo,
          esperado: membro[campoTipo],
          entregue: candidato[campoTipo],
        });
      }
      if (membro.visibilidade !== candidato.visibilidade) {
        erros.push({
          campo: 'visibilidade',
          esperado: membro.visibilidade,
          entregue: candidato.visibilidade,
        });
      }

      const item = { classe: esperada.nome, nome: membro.nome };
      if (erros.length === 0) resultado.corretos.push(item);
      else resultado.comDetalheErrado.push({ ...item, erros });
    }

    for (const sobra of [...livres.values()].flat()) {
      resultado.extras.push({ classe: esperada.nome, nome: sobra.nome });
    }
  }

  // Membros de classe que nem foi entregue tambem faltam: senao esquecer a
  // classe inteira sairia mais barato do que esquecer um atributo dela.
  for (const classe of faltando) {
    for (const membro of classe[lista] ?? []) {
      resultado.faltando.push({ classe: classe.nome, nome: membro.nome });
    }
  }

  return resultado;
}

// --- Relacionamentos e multiplicidades -------------------------------------

/**
 * Traduz um relacionamento entregue para os nomes normalizados das classes do
 * GABARITO com que as pontas casaram. Ponta em classe extra vira null: esse
 * relacionamento nao tem como casar com nada do gabarito.
 */
function traduzirEntregue(relacionamento, esperadaPorIdEntregue, classesEntregues) {
  const origem = esperadaPorIdEntregue.get(relacionamento.origem);
  const destino = esperadaPorIdEntregue.get(relacionamento.destino);
  const nomePorId = (id) => classesEntregues.find((classe) => classe.id === id)?.nome;

  return {
    original: relacionamento,
    origem: origem ? normalizarNome(origem.nome) : null,
    destino: destino ? normalizarNome(destino.nome) : null,
    // Para exibir o que o jogador desenhou, com os nomes que ele usou.
    descricao: {
      tipo: relacionamento.tipo,
      origem: nomePorId(relacionamento.origem),
      destino: nomePorId(relacionamento.destino),
    },
  };
}

function descreverEsperado(relacionamento, classePorId) {
  return {
    tipo: relacionamento.tipo,
    origem: classePorId.get(relacionamento.origem).nome,
    destino: classePorId.get(relacionamento.destino).nome,
  };
}

/**
 * Pontas de multiplicidade de um relacionamento que casou. `invertido` indica
 * que a associacao foi desenhada ao contrario: a origem do gabarito e o
 * destino da entrega, e as multiplicidades trocam de lado junto.
 */
function compararMultiplicidades(esperado, entregue, invertido, descricao, resultado) {
  for (const ponta of ['Origem', 'Destino']) {
    const valorEsperado = esperado[`multiplicidade${ponta}`];
    if (valorEsperado === undefined) continue;

    const pontaEntregue = invertido ? (ponta === 'Origem' ? 'Destino' : 'Origem') : ponta;
    const valorEntregue = entregue[`multiplicidade${pontaEntregue}`] ?? null;
    const item = { relacionamento: descricao, ponta: ponta.toLowerCase(), esperado: valorEsperado };

    if (
      valorEntregue !== null &&
      normalizarMultiplicidade(valorEsperado) === normalizarMultiplicidade(valorEntregue)
    ) {
      resultado.corretas.push(item);
    } else {
      resultado.erradas.push({ ...item, entregue: valorEntregue });
    }
  }
}

function compararRelacionamentos(esperado, entregue, esperadaPorIdEntregue) {
  const classePorId = new Map(esperado.classes.map((classe) => [classe.id, classe]));

  const pendentes = esperado.relacionamentos.map((relacionamento) => ({
    original: relacionamento,
    origem: normalizarNome(classePorId.get(relacionamento.origem).nome),
    destino: normalizarNome(classePorId.get(relacionamento.destino).nome),
    descricao: descreverEsperado(relacionamento, classePorId),
  }));

  const traduzidos = entregue.relacionamentos.map((relacionamento) =>
    traduzirEntregue(relacionamento, esperadaPorIdEntregue, entregue.classes)
  );
  const temAsDuasPontas = (relacionamento) =>
    relacionamento.origem !== null && relacionamento.destino !== null;
  const livres = traduzidos.filter(temAsDuasPontas);
  // Ligacao com ponta em classe extra nao tem como casar com nada do gabarito.
  const extrasEmClasseExtra = traduzidos.filter(
    (relacionamento) => !temAsDuasPontas(relacionamento)
  );

  const relacionamentos = {
    corretos: [],
    invertidos: [],
    tipoErrado: [],
    faltando: [],
    extras: [],
  };
  const multiplicidades = { corretas: [], erradas: [], semRelacionamento: [] };
  const casaramExatos = new Set();

  const mesmaDirecao = (a, b) => a.origem === b.origem && a.destino === b.destino;
  const direcaoOposta = (a, b) => a.origem === b.destino && a.destino === b.origem;

  /**
   * Uma passada de pareamento. Cada criterio consome o relacionamento entregue
   * que casou, para ele nao contar duas vezes (nem como extra depois).
   */
  function passada(criterio, aoCasar) {
    for (let i = pendentes.length - 1; i >= 0; i -= 1) {
      const alvo = pendentes[i];
      const indice = livres.findIndex((candidato) => criterio(alvo, candidato) !== null);
      if (indice === -1) continue;

      const [candidato] = livres.splice(indice, 1);
      aoCasar(alvo, candidato, criterio(alvo, candidato));
      pendentes.splice(i, 1);
    }
  }

  // 1. Exatos. Associacao aceita as duas direcoes; o retorno diz se veio invertida.
  passada(
    (alvo, candidato) => {
      if (alvo.original.tipo !== candidato.original.tipo) return null;
      if (mesmaDirecao(alvo, candidato)) return { invertido: false };
      if (TIPOS_SEM_DIRECAO.has(alvo.original.tipo) && direcaoOposta(alvo, candidato)) {
        return { invertido: true };
      }
      return null;
    },
    (alvo, candidato, { invertido }) => {
      casaramExatos.add(alvo.original);
      relacionamentos.corretos.push(alvo.descricao);
      compararMultiplicidades(
        alvo.original,
        candidato.original,
        invertido,
        alvo.descricao,
        multiplicidades
      );
    }
  );

  // 2. Tipo certo, direcao trocada (heranca ao contrario, losango no lado errado).
  passada(
    (alvo, candidato) =>
      alvo.original.tipo === candidato.original.tipo && direcaoOposta(alvo, candidato) ? {} : null,
    (alvo, candidato) => {
      relacionamentos.invertidos.push({ esperado: alvo.descricao, entregue: candidato.descricao });
    }
  );

  // 3. Mesmo par de classes, tipo diferente (associacao onde devia ser composicao).
  passada(
    (alvo, candidato) =>
      mesmaDirecao(alvo, candidato) || direcaoOposta(alvo, candidato) ? {} : null,
    (alvo, candidato) => {
      relacionamentos.tipoErrado.push({ esperado: alvo.descricao, entregue: candidato.descricao });
    }
  );

  // A passada percorre de tras para frente (para poder remover); devolve a
  // ordem do gabarito para o diff ficar legivel.
  const ordem = new Map(esperado.relacionamentos.map((relacionamento, i) => [relacionamento, i]));
  pendentes.sort((a, b) => ordem.get(a.original) - ordem.get(b.original));

  for (const alvo of pendentes) {
    relacionamentos.faltando.push(alvo.descricao);
  }

  // Multiplicidade de relacionamento que nao casou exato fica sem avaliar, mas
  // continua no maximo possivel: errar a ligacao custa as pontas junto.
  const semAvaliar = esperado.relacionamentos.filter(
    (relacionamento) => !casaramExatos.has(relacionamento)
  );
  for (const relacionamento of semAvaliar) {
    const descricao = descreverEsperado(relacionamento, classePorId);
    for (const ponta of ['Origem', 'Destino']) {
      const valor = relacionamento[`multiplicidade${ponta}`];
      if (valor !== undefined) {
        multiplicidades.semRelacionamento.push({
          relacionamento: descricao,
          ponta: ponta.toLowerCase(),
          esperado: valor,
        });
      }
    }
  }

  for (const sobra of [...livres, ...extrasEmClasseExtra]) {
    relacionamentos.extras.push(sobra.descricao);
  }

  return { relacionamentos, multiplicidades };
}

// --- Entrada ---------------------------------------------------------------

/**
 * @param {object} esperado  Diagrama do gabarito.
 * @param {object} entregue  Diagrama que o jogador enviou.
 * @returns {object} diff por categoria; ver testes/unitarios/validadorUML.test.js.
 */
function compararDiagramas(esperado, entregue) {
  const classes = parearClasses(esperado, entregue);
  const { relacionamentos, multiplicidades } = compararRelacionamentos(
    esperado,
    entregue,
    classes.esperadaPorIdEntregue
  );

  return {
    classes: {
      corretas: classes.pares.map(({ esperada }) => esperada.nome),
      faltando: classes.faltando.map((classe) => classe.nome),
      extras: classes.extras.map((classe) => classe.nome),
    },
    estereotipos: compararEstereotipos(classes.pares),
    atributos: compararMembros(classes, 'atributos', 'tipo'),
    metodos: compararMembros(classes, 'metodos', 'retorno'),
    relacionamentos,
    multiplicidades,
  };
}

module.exports = { compararDiagramas, normalizarNome };
