# Diagrameria — Backend

Um jogo de estratégia e gerenciamento baseado em navegador onde você administra sua própria
agência de diagramação sob demanda. O jogador atende clientes no balcão e monta o pedido
arrastando blocos UML no canvas; o servidor compara o diagrama entregue com o gabarito e calcula
pontuação, gorjeta e punição conforme acerto e tempo.

Este repositório é o **backend**: API REST em Node.js + PostgreSQL. O frontend (React) vive em
outro repositório e consome os contratos documentados em [`docs/api/`](docs/api/).

## Como rodar localmente

Pré-requisitos: **Node.js 20+** e **Docker** (o Postgres sobe em container, não precisa instalar
Postgres na máquina).

```bash
# 1. Dependências
npm install

# 2. Banco de dados (Postgres 16 na porta 5432)
docker compose up -d

# 3. Variáveis de ambiente
cp .env.example .env
#    Abra o .env e troque JWT_SEGREDO. Gere um valor com:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Testes
npm test
```

No Windows (PowerShell), troque o `cp` do passo 3 por `Copy-Item .env.example .env`.

Para conferir se o banco subiu: `docker compose ps` deve mostrar o container como `healthy`.
Para derrubar: `docker compose down` (os dados ficam salvos no volume). Para apagar tudo e
começar do zero: `docker compose down -v`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor com reload automático |
| `npm start` | Sobe o servidor |
| `npm test` | Roda a suíte Jest |
| `npm run test:unitarios` | Só os testes unitários (não precisam de banco) |
| `npm run migrate` | Aplica as migrations |
| `npm run migrate:rollback` | Desfaz a última leva de migrations |
| `npm run seed` | Popula o banco com gabaritos de exemplo |
| `npm run lint` | ESLint |
| `npm run formatar` | Prettier |

## Estrutura

```
docs/schemas/    Formato JSON do diagrama UML — o contrato entre Canvas, gabarito e validador
docs/api/        Contratos das rotas (OpenAPI)
db/migrations/   Schema do banco, versionado
db/seeds/        Gabaritos de exemplo para jogar localmente
src/rotas/       Definição das rotas
src/controladores/  Camada HTTP: lê a requisição, chama o serviço, responde
src/servicos/    Regra de negócio
src/repositorios/   Único lugar que fala com o banco; SQL explícito
src/dominio/     Funções puras (validador, pontuação) — sem banco, sem relógio
src/middlewares/ Autenticação, tratamento de erro, validação de entrada
testes/          Unitários e de integração
```

A pasta `src/dominio/` é a única com uma regra rígida: **nada lá dentro acessa banco ou lê o
relógio**. Tudo chega por parâmetro. É o que torna o validador e a calculadora de pontuação
testáveis sem infraestrutura.

## Decisões de arquitetura

1. **Só REST, sem WebSocket.** Os cronômetros de paciência rodam no frontend apenas para exibição.
   O servidor grava `criado_em` e `prazo_em` de cada pedido e recalcula a pontuação no momento do
   envio, comparando timestamps. **O servidor é a autoridade**: o cliente nunca envia pontuação
   nem tempo decorrido.
2. **O gabarito é JSON em coluna `JSONB`**, no mesmo formato que o Canvas produz.
3. **O validador retorna um diff, não um booleano.** A pontuação é parcial e depende de saber *o
   que* errou — classe faltando, multiplicidade incorreta, herança invertida.
4. **Validador e calculadora de pontuação são funções puras.**
5. **Migrations e queries explícitas** (Knex como query builder e ferramenta de migration, não
   como ORM). O schema fica visível.

## Estado atual (Sprint 1)

- [x] Formato JSON do diagrama UML + exemplos — [`docs/schemas/`](docs/schemas/)
- [ ] Modelo de dados e migrations
- [ ] Contratos de API (OpenAPI)
- [ ] Cadastro e login (bcrypt + JWT)
- [ ] Pipeline de CI

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
