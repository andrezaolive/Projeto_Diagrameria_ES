# Diagrameria — Frontend

Interface do jogo Diagrameria, feita com React e Vite. O frontend roda separado
do backend e, para usar contas e sincronizar progresso, consome a API REST em
`backend/`.

## Como rodar localmente

Pré-requisito: **Node.js 20+**. Para usar a API com banco local, também é
necessário Docker (ou um PostgreSQL compatível). Consulte o
[`README do backend`](../backend/README.md) para detalhes sobre configuração,
migrations, banco e testes.

Os comandos abaixo partem da raiz do repositório. Inicie backend e frontend em
terminais separados.

O backend fica disponível em `http://localhost:3000`. Para conferir o banco,
rode `docker compose ps` dentro de `backend/`; o container deve estar
`healthy`.

### 1. Frontend

No terminal, a partir da raiz do repositório:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente
`http://localhost:5173`. O arquivo `frontend/.env.local` define a URL da API:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Esse é o valor padrão usado pelo frontend. Se o backend estiver em outro
endereço, ajuste `VITE_API_URL` e reinicie o servidor do Vite.

Os testes ficam junto dos módulos correspondentes, com nomes `*.test.js` ou
`*.test.jsx`. O projeto usa Vite para desenvolvimento e build; os scripts
disponíveis estão listados abaixo.

## Scripts do frontend

Execute-os dentro de `frontend/`:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite |
| `npm test` | Executa os testes com Vitest |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente a versão gerada por `npm run build` |
| `npm run assets` | Gera os assets do jogo |
| `npm run lint` | Ainda não executa um linter; o script é apenas um placeholder |

Para validar o frontend:

```powershell
npm test
npm run build
```

### Parar os serviços

- Frontend e backend: pressione `Ctrl+C` nos respectivos terminais.
- PostgreSQL: em `backend/`, rode `docker compose down`. Os dados permanecem no
  volume do Docker.
- Para remover também os dados do banco: `docker compose down -v`, em
  `backend/`. **Isso apaga os dados locais do PostgreSQL.**

## Estrutura

```
public/            Arquivos estáticos servidos diretamente (favicon)
scripts/           Geração de assets e arquivos de arte
src/
  apps/            Aplicativos e ferramentas dentro do jogo (Editor, Email, Loja)
  art/             Paleta, layout e definições de objetos e conquistas
  assets/          Imagens, sprites e áudio do jogo
  components/      Componentes React reutilizáveis
  data/            Dados e modelos do jogo, como pedidos, loja e treino
  editor/          Formas e elementos usados pelo editor de diagramas UML
  lib/             Lógica auxiliar, avaliação, conta e integração com a API
  screens/         Telas do jogo, como menu, escritório e perfil
  state/           Estado global do jogo, contexto e reducer
  styles/          Estilos globais
  App.jsx          Composição principal da interface
  main.jsx         Ponto de entrada React
index.html         Documento HTML usado pelo Vite
vite.config.js     Configuração do Vite e do Vitest
```

