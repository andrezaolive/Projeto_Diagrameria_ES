# Diagrameria — Backend

Um jogo de estratégia e gerenciamento baseado em navegador onde você administra sua própria
agência de diagramação sob demanda. O jogador atende clientes no balcão e monta o pedido
arrastando blocos UML no canvas; o servidor compara o diagrama entregue com o gabarito e calcula
pontuação, gorjeta e punição conforme acerto e tempo.

Esta pasta é o **backend**: API REST em Node.js + PostgreSQL. O frontend (React) fica em
[`../frontend/`](../frontend/), no mesmo repositório, e consome os contratos documentados em
[`docs/api/`](docs/api/) e [`docs/schemas/`](docs/schemas/).

## Como rodar localmente

Pré-requisitos: **Node.js 20+** e **Docker** (o Postgres sobe em container, não precisa instalar
Postgres na máquina). Sem Docker, um Postgres instalado à mão também serve, inclusive no Ubuntu do
WSL, desde que responda em `localhost:5432` com o usuário `diagrameria` (senha `diagrameria`) e os
bancos `diagrameria` e `diagrameria_teste`.

Todos os comandos abaixo rodam **dentro de `backend/`**.

```bash
# 0. Entre na pasta
cd backend

# 1. Dependências
npm install

# 2. Banco de dados (Postgres 16 na porta 5432)
docker compose up -d

# 3. Variáveis de ambiente
cp .env.example .env
#    Abra o .env e troque JWT_SEGREDO. Gere um valor com:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Schema e dados de exemplo
npm run migrate
npm run seed

# 5. Testes
npm test

# 6. Servidor
npm run dev
```

A aplicação se recusa a subir se `JWT_SEGREDO` estiver ausente ou ainda com o valor de exemplo —
subir assinando token com segredo previsível é pior do que não subir. As migrations e o seed não
dependem dele. `NODE_ENV` precisa ser `development`, `test` ou `production`; qualquer outro valor
também impede a subida.

No Windows (PowerShell), troque o `cp` do passo 3 por `Copy-Item .env.example .env`.

Para conferir se o banco subiu: `docker compose ps` deve mostrar o container como `healthy`.
Para derrubar: `docker compose down` (os dados ficam salvos no volume). Para apagar tudo e
começar do zero: `docker compose down -v`.

## Scripts

| Comando                    | O que faz                                      |
| -------------------------- | ---------------------------------------------- |
| `npm run dev`              | Sobe o servidor com reload automático          |
| `npm start`                | Sobe o servidor                                |
| `npm test`                 | Roda a suíte Jest                              |
| `npm run test:unitarios`   | Só os testes unitários (não precisam de banco) |
| `npm run migrate`          | Aplica as migrations                           |
| `npm run migrate:rollback` | Desfaz a última leva de migrations             |
| `npm run seed`             | Cria/atualiza os gabaritos de exemplo          |
| `npm run lint`             | ESLint                                         |
| `npm run formatar`         | Prettier                                       |

## Estrutura

```
docs/schemas/    Formato JSON do diagrama UML — o contrato entre Canvas, gabarito e validador
docs/api/        Contratos das rotas (OpenAPI)
db/migrations/   Schema do banco, versionado
db/seeds/        Gabaritos de exemplo para jogar localmente (upsert por título; não roda em produção)
src/config/      Variáveis de ambiente validadas (ambiente.js; o JWT fica em autenticacao.js) e o Knex
src/rotas/       Definição das rotas
src/controladores/  Camada HTTP: lê a requisição, chama o serviço, responde
src/servicos/    Regra de negócio
src/repositorios/   Único lugar que fala com o banco; SQL explícito
src/dominio/     Funções puras (erros, validação de diagrama, pontuação) — sem banco, sem relógio
src/middlewares/ Autenticação, limite de tentativas, tratamento de erro, validação de entrada
testes/          Unitários e de integração
```

`src/app.js` monta o Express e `src/server.js` sobe a porta. A separação existe para os testes de
integração passarem o app direto para o supertest, sem ocupar porta.

A pasta `src/dominio/` é a única com uma regra rígida: **nada lá dentro acessa banco ou lê o
relógio**. Tudo chega por parâmetro. É o que torna o validador e a calculadora de pontuação
testáveis sem infraestrutura. Os erros de negócio (`dominio/erros.js`) também não sabem de HTTP: o
status de cada um é decidido só em `middlewares/tratadorDeErros.js`.

Todo diagrama que entra no sistema passa por `validarDiagrama()` (`src/dominio/diagrama/`). Ele
roda primeiro o JSON Schema de `docs/schemas/` e depois a integridade (ids únicos, relacionamento
apontando para classe que existe).

## API

Contrato completo em [`docs/api/openapi.yaml`](docs/api/openapi.yaml). Tudo sob `/api`.

| Rota                  | Auth | O que faz                         |
| --------------------- | ---- | --------------------------------- |
| `GET /saude`          | não  | Diz se o processo está de pé      |
| `POST /auth/cadastro` | não  | Cria a conta e já devolve o token |
| `POST /auth/login`    | não  | Autentica e devolve o token       |
| `GET /auth/eu`        | sim  | Dados do usuário logado           |

O token vai em `Authorization: Bearer <token>`. Todo erro sai no mesmo formato — ramifique pelo
`codigo`, exiba a `mensagem`:

```json
{ "erro": { "codigo": "EMAIL_EM_USO", "mensagem": "Ja existe uma conta com este email." } }
```

## Decisões de arquitetura

1. **Só REST, sem WebSocket.** Os cronômetros de paciência rodam no frontend apenas para exibição.
   O servidor grava `criado_em` e `prazo_em` de cada pedido e recalcula a pontuação no momento do
   envio, comparando timestamps. **O servidor é a autoridade**: o cliente nunca envia pontuação
   nem tempo decorrido.
2. **O gabarito é JSON em coluna `JSONB`**, no mesmo formato que o Canvas produz.
3. **O validador retorna um diff, não um booleano.** A pontuação é parcial e depende de saber _o
   que_ errou — classe faltando, multiplicidade incorreta, herança invertida.
4. **Validador e calculadora de pontuação são funções puras.**
5. **Migrations e queries explícitas** (Knex como query builder e ferramenta de migration, não
   como ORM). O schema fica visível.

## Estado atual (Sprint 1)

- [x] Formato JSON do diagrama UML + exemplos — [`docs/schemas/`](docs/schemas/)
- [x] Modelo de dados e migrations — [`db/migrations/`](db/migrations/)
- [x] Contratos de API (OpenAPI) — [`docs/api/openapi.yaml`](docs/api/openapi.yaml)
- [x] Cadastro e login (bcrypt + JWT) — `POST /api/auth/cadastro`, `POST /api/auth/login`,
      `GET /api/auth/eu`
- [x] Pipeline de CI — [`.github/workflows/ci-testes.yml`](../.github/workflows/ci-testes.yml)

As migrations criam duas tabelas: `usuarios` e `gabaritos`. As de partida, pedido e entrega ficam
para a Sprint 2, junto com as máquinas de estado que definem as colunas de status e prazo — modelar
isso agora seria chutar o desenho da sprint seguinte.

Fora do escopo da Sprint 1: `ValidadorUML`, máquinas de estado de partida/pedido/cliente, cálculo
de pontuação e gorjeta (Sprint 2); fechamento de caixa, loja e inventário (Sprint 3).

## Contribuindo

Branch de trabalho é a `develop`; `main` é protegida. Commits seguem
[Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) em português:

```
feat(auth): implementa cadastro e login com bcrypt e jwt
docs(schema): adiciona json schema do diagrama uml
fix(pedidos): corrige calculo do prazo em fuso diferente
```
