# Graph Report - BancoImobiliario  (2026-10-28)

## Corpus Check
- 51 files · ~31,294 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 407 nodes · 676 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1b58ba8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GameRoom.ts
- package.json
- GameRoom
- Validação visual e de navegador
- GameRoom.test.ts
- Regras do jogo
- compilerOptions
- vitest
- compilerOptions
- steps
- BoardScene.tsx
- compilerOptions
- scripts
- Instruções do projeto
- Como contribuir
- PULL_REQUEST_TEMPLATE.md
- Banco Imobiliário Online
- bug_report.md
- feature_request.md
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `GameRoom` - 35 edges
2. `Validação visual e de navegador` - 30 edges
3. `App()` - 26 edges
4. `compilerOptions` - 18 edges
5. `compilerOptions` - 15 edges
6. `vitest` - 14 edges
7. `compilerOptions` - 12 edges
8. `boardSpaces` - 11 edges
9. `scripts` - 10 edges
10. `Regras do jogo` - 9 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `constructionCost()`  [EXTRACTED]
  src/ui/App.tsx → shared/game.ts
- `App()` --calls--> `buildingSaleValue()`  [EXTRACTED]
  src/ui/App.tsx → shared/game.ts
- `App()` --calls--> `canSellBuilding()`  [EXTRACTED]
  src/ui/App.tsx → shared/game.ts
- `App()` --calls--> `hasLiquidatableAssets()`  [EXTRACTED]
  src/ui/App.tsx → shared/game.ts
- `App()` --calls--> `liquidatablePropertyIds()`  [EXTRACTED]
  src/ui/App.tsx → shared/game.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "GameRoom.ts"
Cohesion: 0.06
Nodes (48): react, applyCardCashEffect(), EVENT_CARDS, EventCard, AUCTION_MIN_INCREMENT, AUCTION_SECONDS, buildingSaleValue(), calculateNetWorth() (+40 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (48): allowScripts, esbuild@0.28.2, dependencies, @colyseus/core@^0.18.23, @colyseus/schema@^5.0.42, @colyseus/ws-transport@^0.18.4, react@^19.1.0, react-dom@^19.1.0 (+40 more)

### Community 2 - "GameRoom"
Cohesion: 0.11
Nodes (8): GameRoom, LobbyPlayerState, PropertyState, calculateRent(), describeLanding(), movePosition(), taxForSpace(), normalizePlayerName()

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.07
Nodes (30): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+22 more)

### Community 4 - "GameRoom.test.ts"
Cohesion: 0.12
Nodes (21): @colyseus/schema, createRoomCode(), PrivateObjectiveState, LobbyState, BoardSpace, boardSpaces, colorGroups, properties (+13 more)

### Community 5 - "Regras do jogo"
Cohesion: 0.05
Nodes (34): Base de regras Express, Confirmadas, Decisões do projeto, Detalhes de implementação que ainda serão calibrados, Histórico, Arquitetura confirmada, Experiência, Fases de produção (+26 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "vitest"
Cohesion: 0.14
Nodes (9): @colyseus/sdk@^0.18.8, vitest@^4.0.0, @colyseus/sdk, vitest, resolveRoomServerUrl(), roomClient, SceneScheduler, scheduleSceneLoad() (+1 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.12
Nodes (15): jobs, verify, name, on, pull_request, push, branches, branches (+7 more)

### Community 10 - "BoardScene.tsx"
Cohesion: 0.23
Nodes (10): positionOnBoard(), Board(), BoardScene(), playerColors, PropertyBuilding, ResponsiveCamera(), SpaceLabel(), CameraFraming (+2 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, rootDir (+5 more)

### Community 13 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, prepare, preview, test (+2 more)

### Community 14 - "Instruções do projeto"
Cohesion: 0.25
Nodes (7): Fluxo de trabalho, Fonte da verdade, graphify, Instruções do projeto, Objetivo, Princípios de implementação, Uso obrigatório do Game Studio

### Community 15 - "Como contribuir"
Cohesion: 0.33
Nodes (5): Ativos e coordenação, Como contribuir, Implementação, testes e commits, Preparação, Pull requests

### Community 16 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): Capturas ou vídeo (quando a mudança for visual), Como foi validado?, Impacto em regras, arquitetura ou documentação, O que muda?, Por que?

### Community 17 - "Banco Imobiliário Online"
Cohesion: 0.33
Nodes (5): Banco Imobiliário Online, Desenvolvimento local, Direção visual, Estado atual, Estrutura

### Community 18 - "bug_report.md"
Cohesion: 0.40
Nodes (4): Ambiente, Como reproduzir?, O que aconteceu?, O que deveria acontecer?

### Community 19 - "feature_request.md"
Cohesion: 0.40
Nodes (4): Critérios de aceite, Problema ou necessidade, Regras, telas ou dispositivos afetados, Resultado esperado para quem joga

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameRoom` connect `GameRoom` to `package.json`, `GameRoom.test.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `GameRoom.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `GameRoom.ts`, `package.json`, `BoardScene.tsx`, `GameRoom.test.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.053544494720965306 - nodes in this community are weakly interconnected._
- **Why does `@colyseus/core` connect `package.json` to `GameRoom.test.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `GameRoom` be split into smaller, more focused modules?**
  _Cohesion score 0.10512820512820513 - nodes in this community are weakly interconnected._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._