# Formato do diagrama UML — guia para o time de frontend

Este documento explica, em português, o que o arquivo [`diagrama.schema.json`](diagrama.schema.json)
define formalmente. Se houver divergência entre os dois, **o schema é a autoridade** — ele é o que
o servidor executa.

## Por que este formato existe

O mesmo JSON é usado em três lugares:

1. o que o **Canvas** monta e envia ao entregar um pedido;
2. o **gabarito** guardado no banco (coluna `gabaritos.diagrama`);
3. a entrada do **ValidadorUML**, que compara os dois e devolve o diff.

Se os três não falarem exatamente a mesma língua, a validação não funciona. Por isso o schema é
fechado: `additionalProperties: false` em todos os objetos. Um campo escrito errado (`nome` vs
`name`, `visibilidade: "-"` vs `"privado"`) falha na hora, com mensagem clara, em vez de virar um
diagrama silenciosamente errado.

## Estrutura

```json
{
  "versao": "1.0",
  "classes": [ ... ],
  "relacionamentos": [ ... ]
}
```

Os três campos são obrigatórios. `classes` e `relacionamentos` podem vir como listas vazias — um
canvas em branco é uma entrega ruim, não uma requisição malformada.

Há também um campo opcional `tipo`, o tipo de diagrama. Hoje o único valor é `"classes"`, que é
também o padrão quando o campo não vem. Diagramas de estados e de casos de uso vão entrar como
novos valores desse campo, sem invalidar os diagramas de classe já gravados.

### Classe

```json
{
  "id": "c1",
  "nome": "Pedido",
  "estereotipo": "classe",
  "atributos": [{ "nome": "total", "tipo": "double", "visibilidade": "privado" }],
  "metodos": [{ "nome": "calcularTotal", "retorno": "double", "visibilidade": "publico" }],
  "posicao": { "x": 120, "y": 80 }
}
```

| Campo         | Obrigatório | Observação                                                                                                                                                                              |
| ------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | sim         | Gerado por vocês, local ao diagrama. Só serve para os relacionamentos apontarem para a classe. **Nunca é comparado com o gabarito** — pode ser `"c1"`, um nanoid, o que for conveniente |
| `nome`        | sim         | **É por aqui que a comparação acontece**                                                                                                                                                |
| `estereotipo` | não         | `classe` (padrão), `abstrata`, `interface`, `enum`                                                                                                                                      |
| `atributos`   | não         | Lista vazia se omitido                                                                                                                                                                  |
| `metodos`     | não         | Lista vazia se omitido                                                                                                                                                                  |
| `posicao`     | não         | Persistida, mas **ignorada** na validação: mover o bloco não muda se o diagrama está certo                                                                                              |

### Visibilidade

Escrita por extenso, não em símbolo. O Canvas exibe o símbolo correspondente:

| No JSON     | Exibir como |
| ----------- | ----------- |
| `publico`   | `+`         |
| `privado`   | `-`         |
| `protegido` | `#`         |
| `pacote`    | `~`         |

### Relacionamento

```json
{
  "id": "r1",
  "tipo": "composicao",
  "origem": "c1",
  "destino": "c2",
  "multiplicidadeOrigem": "1",
  "multiplicidadeDestino": "1..*",
  "rotulo": "contem"
}
```

`origem` e `destino` são **ids de classes deste mesmo diagrama**, nunca nomes.

**A direção importa, e cada tipo lê a seta de um jeito.** Este é o detalhe que mais gera bug de
integração, então está explícito:

| `tipo`        | Como ler                                                                             | Multiplicidade |
| ------------- | ------------------------------------------------------------------------------------ | -------------- |
| `associacao`  | `origem` se relaciona com `destino`                                                  | permitida      |
| `agregacao`   | `origem` **contém** `destino` (losango vazio fica na origem, que é o todo)           | permitida      |
| `composicao`  | `origem` **contém** `destino` (losango cheio na origem; a parte não vive sem o todo) | permitida      |
| `heranca`     | `origem` **herda de** `destino` — **a origem é a subclasse**                         | proibida       |
| `dependencia` | `origem` **depende de** `destino`                                                    | proibida       |

Herança e dependência não têm cardinalidade em UML; o schema **rejeita** o envio se elas vierem
com multiplicidade.

### Multiplicidade

Enum fechado: `"1"`, `"0..1"`, `"1..*"`, `"0..*"`, `"*"`.

É fechado de propósito. Formato livre faria o gabarito guardar `"0..*"` e o canvas mandar `"*"`,
e a comparação falharia por formatação em vez de por erro do jogador. Na validação, `"*"` é
tratado como equivalente a `"0..*"`.

### Implementação de interface

O enum de tipos é fechado nos cinco tipos acima. Então "classe implementa interface" é
representado como **`heranca` apontando para uma classe de `estereotipo: "interface"`**. O Canvas
pode desenhar a linha tracejada ao perceber que o destino é uma interface.

## Como o gabarito é comparado

O comparador fica em `src/dominio/diagrama/validadorUML.js`. A nota é calculada a partir dele em
`src/dominio/jogo/pontuacao.js`, com os pesos de `src/dominio/jogo/regras.js`.

**Como as coisas casam**

- **Classes casam por `nome` normalizado**: sem espaços nas pontas, sem diferença de
  maiúscula/minúscula, sem acento, com espaços internos colapsados. `"pedido "` casa com
  `"Pedido"`.
- **Atributos e métodos casam por nome dentro da classe que casou.** Se o tipo (ou o retorno) ou a
  visibilidade estiverem errados, o item vale metade do peso.
- **Relacionamentos casam pela tripla** (nome da origem, nome do destino, tipo), em três passadas:
  1. **exato**;
  2. **invertido**: mesmo tipo, com origem e destino trocados, como uma herança ao contrário;
  3. **tipo errado**: o mesmo par de classes, com outro tipo.

  Uma passada só usa o que sobrou da anterior. Assim, um relacionamento invertido não "rouba" o
  par de um exato.

- **`associacao` não tem direção.** Desenhar `Aluno → Curso` ou `Curso → Aluno` dá no mesmo, e as
  multiplicidades acompanham as pontas. Os outros tipos têm direção (veja a tabela acima).
- **Multiplicidade só pontua nas pontas que o gabarito define.** Pôr multiplicidade numa ponta que
  o gabarito não tem não custa nada. Se o relacionamento em si estiver errado, as pontas dele
  contam como perdidas.
- **Estereótipo só pontua** quando o gabarito declara `abstrata`, `interface` ou `enum`. Marcar
  estereótipo numa classe que o gabarito tem como comum desconta.

**O que fica de fora da comparação:** `id`, `posicao`, `rotulo` e a ordem dos itens em qualquer
lista.

**O que desconta:** classe, atributo, método ou relacionamento inventado, ou seja, algo que não
está no gabarito. Sem esse desconto, desenhar "de tudo" tiraria 100%.

A resposta da entrega traz o **diff por categoria**, a nota, o pagamento e o diagrama esperado,
para a tela de comparação (RF15/RF22). O formato completo está no schema `Diff` do
[`openapi.yaml`](../api/openapi.yaml).

## Duas coisas que o schema _não_ pega

JSON Schema não consegue expressar estas duas regras, então **passar no schema não significa que o
diagrama é coerente**:

1. relacionamento apontando para um `id` que não existe;
2. duas classes com o mesmo `id`.

As duas são verificadas em código, em `src/dominio/diagrama/integridade.js`, logo depois do schema.
Isso é validação de **entrada**, separada do `ValidadorUML`: um id solto é um bug do Canvas (ou um
gabarito gravado errado), não um erro de UML do jogador, e volta como `400 ENTRADA_INVALIDA` com o
campo apontado (`relacionamentos/0/destino`). Os ids de relacionamento, quando enviados, também
precisam ser únicos.

Do lado de vocês, o Ajv só pega o que está no schema. Se quiserem pegar ids soltos antes de enviar,
repliquem as duas regras. Elas cabem em poucas linhas; veja o arquivo acima.

## Como validar um diagrama do lado de vocês

O mesmo arquivo funciona no frontend — é JSON Schema padrão (draft 2020-12):

```js
import Ajv2020 from 'ajv/dist/2020';
import schema from './diagrama.schema.json';

const ajv = new Ajv2020({ allErrors: true });
const validar = ajv.compile(schema);

if (!validar(diagrama)) {
  console.error(validar.errors); // mesma mensagem que o servidor vai devolver
}
```

Validar antes de enviar economiza um round-trip e dá erro imediato no canvas.

## Exemplos prontos

Em [`exemplos/`](exemplos/), todos válidos e cobertos por teste automatizado:

| Arquivo                 | O que exercita                                                             |
| ----------------------- | -------------------------------------------------------------------------- |
| `pedido-item.json`      | composição `1 → 1..*`, atributos e métodos                                 |
| `biblioteca.json`       | herança (duas subclasses) + associações com multiplicidade nas duas pontas |
| `veiculos.json`         | interface, classe abstrata, enum, agregação e dependência                  |
| `aluno-curso.json`      | associação muitos-para-muitos (`0..*` ↔ `1..*`)                            |
| `playlist-musica.json`  | agregação                                                                  |
| `conta-bancaria.json`   | associação `1 → 1..*`, métodos com retorno `boolean`                       |
| `carrinho-produto.json` | composição e associação encadeadas (três classes)                          |
| `consulta-medica.json`  | classe abstrata com atributos `protegido`, duas heranças, associações      |

Cada exemplo também é um gabarito do jogo: o seed (`db/seeds/01_gabaritos.js`) grava cada um com um
enunciado, uma dificuldade e uma paciência. Um teste de integração garante que cada enunciado cite
todas as classes do seu gabarito.

## Versionamento

O campo `versao` existe para o formato poder evoluir sem invalidar gabaritos já gravados. Hoje o
único valor aceito é `"1.0"`.

Já previsto para a v1.1, **fora da v1** para não travar a Sprint 1: `metodos[].parametros`
(lista de `{nome, tipo}`). Quando entrar, será opcional, e diagramas `"1.0"` continuarão válidos.
