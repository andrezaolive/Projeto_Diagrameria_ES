# Projeto_Diagrameria_ES
Um jogo de estratégia e gerenciamento baseado em navegador onde você administra sua própria agência de diagramação sob demanda.

## Estrutura

| Pasta                    | O que é                                                  |
| ------------------------ | -------------------------------------------------------- |
| [`backend/`](backend/)   | API REST em Node.js + PostgreSQL — veja o README de lá   |
| [`frontend/`](frontend/) | Interface em React                                       |

Os contratos entre os dois ficam no backend: rotas em
[`backend/docs/api/openapi.yaml`](backend/docs/api/openapi.yaml) e formato do diagrama UML em
[`backend/docs/schemas/`](backend/docs/schemas/).

O CI ([`.github/workflows/ci-testes.yml`](.github/workflows/ci-testes.yml)) roda lint e testes de
cada pasta em jobs separados.
