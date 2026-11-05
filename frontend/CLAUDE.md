# Diagrameria — guia do frontend

Guia do `frontend/` (o `CLAUDE.md` da raiz cobre o monorepo e o backend). Caminhos abaixo são relativos a `frontend/`.

Jogo de estratégia/gerenciamento no navegador: o jogador administra uma agência de diagramação sob demanda (recebe pedidos por e-mail, monta diagramas UML, é avaliado e recebe pagamento).

- `frontend/` — React 18 + Vite (JS) — este guia
- `backend/` — API Node/Express (ver `../CLAUDE.md`)
- CI em `.github/workflows/ci-testes.yml` (lint + testes nos dois pacotes)

## Frontend: comandos

```bash
cd frontend
npm run dev      # servidor de desenvolvimento
npm test         # vitest (lógica de grid, avaliação e reducer)
npm run build
npm run assets   # regenera todos os PNGs em pixel art (scripts/gen-assets.mjs)
```

## Frontend: estrutura

- Palco fixo de **1280×720** (`components/ui.jsx` → `Palco`) escalado para a janela; 1 pixel de arte = 4px. Coordenadas de ponteiro precisam desfazer essa escala (ver `local()` no editor).
- Fluxo de telas em `App.jsx`: splash → (tela de nome, obrigatória enquanto `state.perfil.nome` for nulo) → menu → modos (campanha/infinito) → calendário → `screens/Jogo.jsx` (escritório ↔ computador, com zoom no monitor).
- Estado global: `state/reducer.js` (puro, testado) + `GameContext.jsx` (salva em `localStorage`, chave `diagrameria-save-v1`).
- Apps do computador em `apps/` (Editor, Email, Dicas, Loja, Resultado). Para adicionar um app, registre em `APPS` em `screens/Computador.jsx`.
- Paciência dos clientes: cada pedido nasce com `paciencia` (`pacienciaDoDia` em `data/pedidos.js`, menor nos dias avançados). O `TICK` (1/s em `Jogo.jsx`, enquanto `temRelogio(sessao)`) desconta a paciência dos pedidos `novo`; ao zerar, o pedido vira `expirado` (cliente foi embora): no infinito chega outro, na campanha conta como finalizado (`FINALIZADOS`). Barra no app de e-mail. Pop-ups no canto inferior direito (`screens/Alertas.jsx`, regra em `lib/alertas.js`): amarelo quando um pedido novo chega a 25% da paciência; vermelho quando o cliente vai embora e ainda há pedidos na fila (`novo`/`aceito`); se era o último do dia, nada. O aviso do topo (`.toast-saiu` em `Jogo.jsx`) fica só para recusas. Pedido perdido (recusado ou expirado) cobra multa de 50% da recompensa, ou 25% se o saldo já estiver negativo no momento da multa (`multaPedido(pedido, saldo)`, taxas em `MULTA`), descontada do dinheiro e do ganho do dia; o saldo pode ficar negativo (dívida: `Dinheiro` mostra em vermelho com `−R$`, e compras exigem saldo suficiente); fica em `pedido.multa` e em `estatisticas.multas`.
- Pedidos (`data/pedidos.js` → `MODELOS`, ordem da campanha em `ORDEM_CAMPANHA`): 8 de casos de uso/classes originais + 8 de classes adaptados dos gabaritos do backend (branch `feature/front-finalizado`, `backend/db/seeds/01_gabaritos.js`). Só classes e relações entram na nota (atributos, métodos e multiplicidades dos gabaritos ficam de fora). Relações: associação, include, extend, herança, dependência, agregação e composição; em agregação/composição o `de` é o todo (losango na origem, como no schema do backend).
- Multiplicidade (`lib/multiplicidade.js`): arestas de associação/agregação/composição podem ter `multDe`/`multPara` (`1`, `0..1`, `1..*`, `0..*`; `*` = `0..*`), o número fica na ponta da classe contada. No editor, ao selecionar a relação, a barra troca o campo de rótulo por um seletor por ponta. A nota só muda em pedidos que cobram multiplicidade: entra `multiplicidades` (15%, fórmula 35/25/25/15); nos demais vale 40/30/30. Feedback: problema `multiplicidade` + conceito com 1:1, 1:* e *:*. Pedidos de multiplicidade: `atlas` (1:1), `rh` (1:* e 0..1), `cinemateca` (*:*), `conservatorio` (misto), além dos 8 do backend com as multiplicidades originais.
- Debug (só em `npm run dev`, via `import.meta.env.DEV`): no app de e-mail, "↻ Refresh pedidos" (`DEBUG_REFRESH_PEDIDOS`) troca os pedidos não aceitos pelos próximos de `MODELOS`, em sequência, e cada e-mail mostra o id do modelo. Não entra no build.
- Editor: formas UML em `editor/Formas.jsx`; grid invisível, zoom e geometria em `lib/grid.js` (`GRID = 20`); nota da entrega em `lib/avaliacao.js` contra o gabarito `esperado` de cada pedido em `data/pedidos.js`.
- Assets são **gerados por código** (`scripts/pixel.mjs` + `scripts/gen-assets.mjs`) usando só a paleta de `src/art/palette.js`. Coordenadas compartilhadas entre arte e jogo (ex.: monitor clicável) ficam em `src/art/layout.js`. A splash usa a keyart da equipe (`assets/scenes/splash-keyart-1024x1024.png`, reduzida sem `pixelated` por não estar em grade exata).
- Objetos do escritório: cada um é desenhado em `officeItems()` do gerador com `objeto(id, zona, draw)`, recortado como sprite em `assets/objetos/` e listado em `src/art/objetos.json` (posição padrão, tamanho e zona `mesa` | `parede` | `fixo`). O jogador arrasta os de mesa e parede (`lib/decoracao.js` limita a zona e detecta o clique pelo pixel visível); as posições ficam em `state.escritorio.posicoes`. Para criar um item novo: desenhe com `objeto(...)`, rode `npm run assets` e registre o preço em `ITENS_LOJA` (`data/loja.js`). Posições (`lib/decoracao.js`): parede guarda `{ x, y }`; mesa guarda o **apoio** (`sobre`: `mesa` + `chao`, `monitor`, `estante` ou o nome de um objeto `empilhavel`) e a altura é calculada (`resolverCena`), então quem estava em cima cai quando o apoio sai (`soltarDependentes`). Metadados do gerador: `elevavel` (sobe em monitor, estante e livros), `empilhavel` (aceita coisas em cima), `apoio: 'estante'`, `rotulo` (nome no inventário) e `variante` (sprite alternativo, ex.: `livro-*-deitado`). Nenhum objeto cobre `MONITOR_SCREEN`. Post-its, livros e o vasinho da estante são objetos-base (`OBJETOS_BASE`). Inventário (baú no canto do escritório): objetos-base guardados vão para `state.escritorio.guardados`; os da loja saem de `loja.moveis`. No escritório: arrastar solta; clicar sem arrastar (ou pegar algo empilhado) deixa o objeto na mão até o próximo clique; rodinha vira livros (em pé ↔ deitado); Esc devolve.
- Perfil: `state.perfil` (`nome`, `avatar`, `conta`). Avatar 32×32 montado em tempo de execução por `lib/avatar.js` (partes como retângulos, contorno automático) e desenhado em SVG por `components/Avatar.jsx`. Tons de pele em `PELES` (`art/palette.js`) são a única exceção à paleta. Aba de perfil no canto superior esquerdo do menu (`screens/Perfil.jsx`). As telas de nome e conta abrem como janelas **sobre** o menu (`Menu` com `sobreposto`), não como telas separadas. Estatísticas: contadores e histórico curto em `state.estatisticas`; `lib/estatisticas.js` gera os dados de cada gráfico e `components/Grafico.jsx` desenha (barras, linha, dias) em SVG com cores da paleta.
- Contas (`lib/conta.js`): API assíncrona de registro/login/alteração. Enquanto o backend não existe, guarda contas e progresso no `localStorage` (`diagrameria-contas-v1`); trocar a implementação por HTTP sem mexer nas telas. "Resetar dados" fica em Configurações do menu (`RESETAR`).
- Feedback da entrega: `lib/feedback.js` (`gerarFeedback(jogador, esperado)`) lista os problemas (grafia, tipo trocado, faltando/sobrando, relação invertida/trocada/faltando/sobrando) com as mesmas regras da nota, e os conceitos envolvidos (`CONCEITOS`: o que é include, extend, classe...). `apps/Feedback.jsx` mostra em vermelho (`.fb-errado`) a partir do botão no Resultado, que não aparece com entrega vazia (`diagramaVazio`).
- Reações do mascote no resultado: `lib/mascote.js` (`reacaoMascote(nota)`) escolhe entre `mascote-{espatifado,triste,neutro,feliz,comemorando}-40x40.png`, desenhados em `REACOES` no gerador.
- Tamanho da interface (`config.interface`: `reduzido` | `auto` | `grande`): o `Palco` recebe `data-ui`; botões `.px-btn` usam `zoom: var(--ui-btn)` e janelas `Modal` são ampliadas por `ESCALA_JANELA` (sem passar do palco, e sem ampliar de novo os botões de dentro).
- Filtro VHS (`config.vhsAtivo`, `config.vhsIntensidade` 10–100): `FiltroVhs` em `components/ui.jsx`, desenhado pelo `Palco` por cima de tudo (sem capturar cliques); camadas e animações em `.vhs*` no `global.css`, todas controladas por `--vhs` (0–1). As Configurações mostram prévia ao vivo via `usePreviaVhs()`.
- Música (`lib/musica.js`, Web Audio): a do menu (`assets/audio/musica-menu.mp3`, MP3 192 kbps gerado a partir do `Menu.wav` original, que fica fora do repositório em `../audio/`, ignorado no git) toca nas telas de `TELAS_MENU` em `App.jsx` e para com fade ao entrar no jogo. Tem 82 BPM e a partir de ~0:52 (compasso 19) faz um fade-out composto: cada repetição começa em `LOOP_MENU` (18 compassos = 52,683 s) e a cauda da anterior toca por cima, agendado no relógio do `AudioContext`. Volume em `config.musica` (prévia ao vivo nas Configurações). Entra com fade in de 30% a 100% em 2 s (`FADE_IN`).
- Sombras de texto: use `--sombra-texto` / `--sombra-suave` (ink translúcido), não `--c-ink` sólido.
- Fonte `Press Start 2P` não tem maiúsculas acentuadas como Í/É: evite-as em títulos com essa fonte.

## Referências visuais (obrigatório consultar antes de criar telas)

1. **`../../telas_exemplo.png`**: esboço de todas as telas. É a fonte principal para layout e fluxo.
2. **`../../assets_exemplo.png`**: esboço dos componentes e assets (botões, janelas, ícones, avatar, mascote, diagramas).
3. **Figma** (disposição de detalhes): https://www.figma.com/site/vA0hm4f6ccDw4pufY6cQ16/diagrameria?node-id=0-3
   - O link não abre por fetch automático (só carrega a casca JS). Quando for preciso, peça ao usuário um export (PNG/SVG) dos frames ou use acesso autenticado ao Figma.

### Telas (conforme `telas_exemplo.png`)

| # | Tela | Conteúdo principal |
|---|------|--------------------|
| 1 | **Escritório** | Cena da mesa: computador CRT com diagrama na tela, teclado, caneca, planta, janela, porta. É o "hub" do jogo. |
| 2 | **Splash / tela de início** | Monitor com o mascote (personagem-diagrama sorrindo), notas adesivas ao redor, logo "DIAGRAMERIA", "Aperte em qualquer lugar". |
| 3 | **Menu inicial** | Logo no topo, mascote, botão grande **JOGAR**, botões menores: Menu/Perfil, Configurações, Créditos. |
| 4 | **Configurações** | Janela com sliders: volume, FX, outro; botões Voltar / Cancelar / Aplicar; controles de janela (minimizar/maximizar/fechar). |
| 5 | **Tela de nome** | Avatar do jogador (editável: cabelo, rosto, roupa), campo de nome ("fulano de tal"), Cancelar / Confirmar. |
| 6 | **Tela do computador** | Área de trabalho do PC: ícones de apps à esquerda e no canto, wallpaper de pôr do sol lofi, barra de tarefas embaixo. |
| 7 | **Montagem de diagrama** | Editor: timer (⏱ 0:30) no topo, painel de requisitos à esquerda, canvas no centro, paleta de elementos à direita (ator, setas sólidas/tracejadas, include/extend, caixas, círculos), ferramenta de texto. |
| 8 | **Aba de e-mail** | Cliente de e-mail com lista de pedidos ("PEDIDO NOVO", "PEDIDO"…) e scrollbar. Ações: Aceitar / Recusar / Entregar / Voltar. |
| 9 | **Aba de dicas** | O diagrama-resposta do pedido em andamento, coberto por uma grade 2×2 de pedaços trancados (cadeado + preço). Cada compra revela um pedaço (`COMPRAR_PEDACO`; grade e preço em `data/pedidos.js`). |
| 10 | **Pausa** | Overlay "PAUSA ⏸" com sliders de áudio, botões Menu / Continuar. |
| 11 | **Lojinha** | Grade de itens com preço (R$), abas Fundo / Móveis / Avatar / Escritório, carrinho, total, Pagar. |
| 12 | **Resultado** | Lado a lado: "seu diagrama" × "esperado", nota/desempenho (acerto %), pagamento, botões Guardar/baixar e OK. |

Apps da área de trabalho (janelas estilo desktop retrô, ver `assets_exemplo.png`): `EMAIL-PEDIDOS.EXE`, `MEBOL-LOJA VIRTUAL.EXE`, `DIAGRAMERIA-EDITOR.EXE`, `CLAUDIA-IA.EXE`.

## Direção de arte

**Estilo:** pixel art 8/16-bit, estética **lofi** (aconchegante, noturna, luz quente de abajur, plantas, chuva na janela, CRT), **roxos e tons pastéis**.

### Regras de pixel art
- Sem anti-aliasing, sem gradientes suaves. Sombreamento por faixas de cor e **dithering**.
- Resolução lógica base **320×180** (cenas) escalada por inteiros (×3 = 960×540, ×4 = 1280×720, ×6 = 1920×1080).
- Grade: tiles/ícones **16×16**, ícones grandes/itens de loja **32×32**, retrato do avatar **48×48** ou **64×64**.
- Contorno de 1px na cor mais escura da paleta (não preto puro).
- Exportar em **PNG** (sem compressão com perda), tamanho nativo; escalar só no CSS.
- CSS obrigatório para imagens e canvas pixelados:
  ```css
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  ```
- Fonte pixel: `Press Start 2P` para títulos, `VT323` ou `Silkscreen` para textos (Google Fonts).
- Bordas de UI em 9-slice (janelas, botões, campos), cantos chanfrados de 1–2px.

### Paleta (16 cores — usar somente estas)

| Token | Hex | Uso |
|-------|-----|-----|
| `ink` | `#1e1a2e` | contornos, texto principal |
| `night` | `#2d2640` | fundo da cena noturna |
| `plum` | `#463a5e` | sombras, barra de tarefas |
| `grape` | `#5f4d7a` | bordas de janela |
| `violet` | `#7d6a9e` | botões (estado normal) |
| `orchid` | `#9d87c0` | botões hover, destaques |
| `lavender` | `#b8a4d9` | painéis |
| `lilac` | `#d4c4ec` | fundo de janela |
| `mist` | `#ece4f7` | campos, papel |
| `cream` | `#fbf7ff` | brilho, texto sobre escuro |
| `blush` | `#f4b6c8` | acento rosa, notas adesivas |
| `peach` | `#f7d6a8` | luz do abajur, pôr do sol |
| `butter` | `#f2e6a0` | dinheiro, estrelas, alertas leves |
| `mint` | `#a8d8d0` | sucesso, plantas |
| `sky` | `#a9c4ec` | links, chuva, seleção |
| `rose` | `#e88a9e` | erro, fechar, recusar |

No frontend, expor como variáveis CSS (`--c-ink`, `--c-night`, …) e não usar cores fora da paleta.

### Organização dos assets
```
frontend/src/assets/
  sprites/     # personagens, mascote, avatar (partes separadas: cabelo, rosto, roupa)
  ui/          # botões, janelas 9-slice, sliders, ícones 16×16
  scenes/      # escritório, wallpaper do PC, splash
  diagram/     # elementos UML: ator, caso de uso, setas, include/extend
  shop/        # itens da lojinha 32×32
```
Nomes em `kebab-case` com tamanho: `btn-jogar-96x24.png`, `icon-email-16.png`.
