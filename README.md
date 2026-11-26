# Diagrameria

**Aprenda UML com diagramas, desafios e uma agência para administrar.**

O projeto Diagrameria foi concebido como um jogo educativo digital para apoiar o ensino prático da Linguagem de Modelagem Unificada (UML) e a aprendizagem de Engenharia de Software. Em cada pedido, a pessoa jogadora interpreta os requisitos de um cliente, monta um diagrama e recebe uma avaliação do resultado.

## 🖥️ Tela Inicial

<div align="center">
  <img width="1623" height="902" alt="tela-inicial-diagrameria" src="https://github.com/user-attachments/assets/48744294-6fcd-4afd-8304-9fba64dcc009" width="85%" />
  <br />
  <sub><em>Interface inicial do Diagrameria — substitua o caminho acima pela captura de tela oficial do projeto.</em></sub>
</div>

---
## ✨ Funcionalidades principais

- Montagem de diagramas UML em um editor visual interativo.
- Desafios com pedidos, clientes e diferentes requisitos de modelagem.
- Avaliação dos diagramas com pontuação e feedback sobre os elementos.
- Dicas para apoiar a resolução dos desafios.
- Progressão no jogo com economia, loja, coleção e conquistas.
- Personalização do perfil e do escritório.
- Cadastro e login, com opção de salvar o progresso na conta.

## 🧰 Tecnologias utilizadas

| Parte | Tecnologias |
| --- | --- |
| Frontend | React 18, JavaScript, Vite e CSS |
| Testes do frontend | Vitest |
| Backend | Node.js 20+, Express 5 e JavaScript |
| Banco de dados | PostgreSQL 16 e Knex |
| Autenticação | JWT e bcrypt |
| Testes do backend | Jest e Supertest |

O frontend e o backend são aplicações separadas. A API e o formato dos diagramas UML estão documentados no backend: [contrato OpenAPI](backend/docs/api/openapi.yaml) e [schema dos diagramas](backend/docs/schemas/).

## 🚀 Como executar localmente

Pré-requisitos: Node.js 20+ e Docker para iniciar o PostgreSQL (ou uma instalação PostgreSQL compatível).

1. Siga o [README do backend](backend/README.md) para configurar o ambiente,
   iniciar o banco, aplicar as migrations e executar a API.
2. Em outro terminal, siga o [README do frontend](frontend/README.md) para
   instalar as dependências e iniciar a interface.

Os READMEs de cada pasta contêm os comandos detalhados, as variáveis de ambiente, os testes e os scripts disponíveis.

## 📁 Estrutura do repositório

| Caminho | Conteúdo |
| --- | --- |
| [`backend/`](backend/) | API REST, persistência, documentação dos contratos e testes |
| [`frontend/`](frontend/) | Interface do jogo, editor UML, dados e lógica de gameplay |
| [`.github/workflows/`](.github/workflows/) | Automação de integração contínua |

## 🤝 Contribuições

Contribuições são sempre bem-vindas! Veja o nosso arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para saber como começar.
