# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Monorepo for **Diagrameria**, a browser game where the player assembles UML class diagrams under
time pressure and the server scores the delivery against a stored answer key (`gabarito`).

- `backend/`: REST API, Node.js 20+ / Express 5 / PostgreSQL 16 via Knex. This is where the real
  code is today, and what the rest of this file describes. **All paths below are relative to
  `backend/`, and all `npm` commands run from inside it.**
- `frontend/`: React UI, currently a placeholder (`package.json` scripts only `echo`). It consumes
  the contracts in `backend/docs/api/openapi.yaml` and `backend/docs/schemas/diagrama.schema.json`.
- `.github/workflows/ci-testes.yml`: one workflow with a separate job per folder
  (`working-directory`). The backend jobs run lint + `prettier --check` and the Jest suite against
  a Postgres service.

The whole codebase is in Portuguese: identifiers, file names, error codes, commit messages. Code
comments are written in Portuguese **without accents** (ASCII); Markdown docs use accents. Follow
that when adding code.

## Commands

Run from `backend/`. Without Docker, any Postgres on `localhost:5432` works (e.g. installed in WSL
Ubuntu, started with `sudo service postgresql start`), as long as it has user/password
`diagrameria` and databases `diagrameria` + `diagrameria_teste`.

```bash
docker compose up -d          # Postgres 16 on :5432; first boot also creates diagrameria_teste (db/init/)
npm run migrate               # knex migrate:latest (dev DB)
npm run seed                  # sample gabaritos
npm run dev                   # nodemon src/server.js
npm test                      # full Jest suite, serial (needs Postgres running)
npm run test:unitarios        # unit tests only, no DB needed
npx jest testes/integracao/autenticacao.test.js     # single file
npx jest -t "normaliza o email"                      # single test by name
npm run lint                  # ESLint (CI also runs `npx prettier --check .`)
npm run formatar              # Prettier --write
```

`.env` is required (copy `.env.example`). `src/config/ambiente.js` (server + DB, used by
`knexfile.js`) throws on missing DB vars or an unknown `NODE_ENV` (only
`development`/`test`/`production`). `src/config/autenticacao.js` (JWT + bcrypt cost) throws on a
missing/placeholder `JWT_SEGREDO`. It is loaded by the app and tests, but not by migrations or seeds.

## Architecture

Layered, with strict responsibilities (see README "Estrutura"):

`rotas/` → `controladores/` → `servicos/` → `repositorios/` → `config/banco.js`

- **rotas**: declare routes and keep the request JSON Schema right next to them, validated by
  `middlewares/validaEntrada.js` (`validaCorpo(schema)`). Schemas use `additionalProperties: false`.
  The single shared Ajv instance (2020, `strict`, no coercion) lives in `src/dominio/validacao.js`.
  It adds two custom keywords: `maxBytes` (bcrypt's 72-byte limit) and `semEspacosNasPontas`. It
  also has `paraDetalhes()`, which turns Ajv errors into `[{ campo, mensagem }]` with pt-BR
  messages via ajv-i18n. Custom keywords are excluded from ajv-i18n, which would overwrite their
  messages. Input is rejected rather than trimmed. Auth routes are rate-limited
  (`middlewares/limitaTentativas.js`; login keyed by IP+email). The limiter is disabled when
  `ehTeste`, and it has its own unit test.
- **controladores**: thin async handlers, no try/catch — Express 5 forwards rejected promises to
  the error handler.
- **servicos**: business rules; shape responses (camelCase, never expose `senha_hash`).
- **repositorios**: the only code that touches the DB; returns raw snake_case rows. Knex is used as
  a query builder/migration tool, never as an ORM. Postgres error codes are translated into
  domain errors here (e.g. `23505` → `ErroDeConflito('EMAIL_EM_USO')` in
  `usuarios.repositorio.js`), never in services.
- **dominio/**: pure functions only — **no DB access and no reading the clock**; everything comes
  in as parameters. This is where the future `ValidadorUML` and scoring calculator belong.
  Every diagram entering the system goes through `validarDiagrama()` (`src/dominio/diagrama/`).
  It checks the schema from `docs/schemas/` first, then integrity (`integridade.js`: unique class
  and relationship ids, no dangling `origem`/`destino`). It returns `[{ campo, mensagem }]`, empty
  when the diagram is valid. This is input validation, kept separate from grading.

Errors: throw subclasses of `ErroDaAplicacao` (`src/dominio/erros.js`) carrying only a stable
`codigo` + message; they know nothing about HTTP. `middlewares/tratadorDeErros.js` maps error
class → status (`STATUS_POR_ERRO`; add new classes there). It is the only place that turns errors
into responses, always as `{ erro: { codigo, mensagem, detalhes? } }`. Unknown errors become a
generic 500 (stack only logged, never returned).

`src/app.js` builds the Express app (`criarApp()`); `src/server.js` only listens. Integration tests
pass `criarApp()` straight to supertest.

Config: `knexfile.js` reads from `src/config/ambiente.js`, so the CLI and the app always target the
same DB. When `NODE_ENV=test`, the DB name switches to `DB_NOME_TESTE` and bcrypt cost drops to 4.

## Game design constraints

- **Server is the authority**: REST only, no WebSocket. Client never sends score or elapsed time;
  the server stores timestamps (`criado_em`, `prazo_em`) and computes scoring at submission.
- JWT carries only identity (`sub` = user id, `email`) — never game state.
- The diagram JSON format (`docs/schemas/diagrama.schema.json`, explained in
  `docs/schemas/README.md`) is shared by the Canvas, the `gabaritos.diagrama` JSONB column and the
  validator. The schema is the authority. Key rules: classes match by normalized `nome`
  (trim/case/accent-insensitive); relationships match by (origin name, target name, type);
  `id`/`posicao`/`rotulo`/order are ignored; the validator returns a **diff**, not a boolean;
  `heranca` origin is the subclass; `heranca`/`dependencia` must not have multiplicity; `"*"` ≡
  `"0..*"`.

## Database

- New tables with `atualizado_em` need the trigger from
  `db/migrations/20260922120000_atualiza_atualizado_em.js`
  (`EXECUTE FUNCTION atualiza_atualizado_em()`) in their own migration.
- `gabaritos.titulo` is unique. The seed validates each diagram and upserts by `titulo` (never
  deletes, so ids stay stable for future FKs and `ativo` is preserved). It refuses to run in
  production.

## Tests

- `testes/configuracao/ambiente-de-teste.js` (Jest `setupFiles`) forces `NODE_ENV=test` before any
  module loads — this is what keeps the suite off the dev database. Don't remove it.
- Integration suites share one DB and run serially (`maxWorkers: 1`, test pool of 1 connection).
  Each suite uses `testes/integracao/ajuda/banco.js`: `prepararBanco()` in `beforeAll` (runs
  migrations), `limparTabelas()` in `beforeEach`, `encerrarBanco()` in `afterAll`.
- `limparTabelas()` truncates every `public` table except `knex_*`, read from `pg_tables`, so new
  tables are covered automatically.
- CI (`.github/workflows/ci-testes.yml`, at the repo root) creates `diagrameria_teste` manually and runs migrations before
  `npm test`.

## Scope / roadmap

Sprint 1 (done): diagram schema, `usuarios` and `gabaritos` migrations, OpenAPI, auth
(bcrypt + JWT), CI. Sprint 2: `ValidadorUML`, match/order/customer state machines, scoring and tips
(tables for partida/pedido/entrega come with it). Sprint 3: cash closing, shop, inventory.

## Git

Work on `develop`; `main` is protected. Conventional Commits in Portuguese, e.g.
`feat(auth): implementa cadastro e login com bcrypt e jwt`.
