# Graph Report - BancoImobiliario  (2026-10-28)

## Corpus Check
- 51 files · ~31,633 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 409 nodes · 678 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67fd2abb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- devDependencies
- GameRoom
- Validação visual e de navegador
- GameRoom.test.ts
- Regras do jogo
- compilerOptions
- package.json
- compilerOptions
- steps
- BoardScene.tsx
- compilerOptions
- dependencies
- scripts
- Instruções do projeto
- Como contribuir
- PULL_REQUEST_TEMPLATE.md
- Banco Imobiliário Online
- bug_report.md
- feature_request.md
- tsconfig.json
- app.config.ts
- react
- vite
- engines

## God Nodes (most connected - your core abstractions)
1. `GameRoom` - 35 edges
2. `Validação visual e de navegador` - 32 edges
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

## Communities (25 total, 1 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (27): @colyseus/sdk@^0.18.8, @colyseus/sdk, vitest, PropertyHolding, GameMode, LobbyPlayer, LobbyStatus, App() (+19 more)

### Community 1 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, @colyseus/testing@^0.18.6, @colyseus/tools@^0.18.11, husky@^9.1.7, tsx@^4.23.15, @types/node@^24.19.2, @types/react@^19.1.10, typescript@~5.8.3 (+8 more)

### Community 2 - "GameRoom"
Cohesion: 0.11
Nodes (5): createRoomCode(), GameRoom, LobbyPlayerState, isGameMode(), normalizePlayerName()

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.06
Nodes (32): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+24 more)

### Community 4 - "GameRoom.test.ts"
Cohesion: 0.08
Nodes (47): PrivateObjectiveState, LobbyState, PropertyState, boardSpaces, colorGroups, properties, specialSpaces, applyCardCashEffect() (+39 more)

### Community 5 - "Regras do jogo"
Cohesion: 0.05
Nodes (34): Base de regras Express, Confirmadas, Decisões do projeto, Detalhes de implementação que ainda serão calibrados, Histórico, Arquitetura confirmada, Experiência, Fases de produção (+26 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "package.json"
Cohesion: 0.18
Nodes (10): allowScripts, esbuild@0.28.2, @types/react-dom@^19.1.7, @types/three@^0.179.0, name, private, type, version (+2 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.12
Nodes (15): jobs, verify, name, on, pull_request, push, branches, branches (+7 more)

### Community 10 - "BoardScene.tsx"
Cohesion: 0.16
Nodes (14): BoardSpace, SpaceKind, formatMoney(), positionOnBoard(), BoardScene, Board(), BoardScene(), playerColors (+6 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, rootDir (+5 more)

### Community 12 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, @colyseus/schema@^5.0.42, @react-three/drei@^10.5.1, @react-three/fiber@^9.3.0, three@^0.179.1, @colyseus/schema, @react-three/drei, @react-three/fiber (+1 more)

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

### Community 21 - "app.config.ts"
Cohesion: 0.33
Nodes (5): @colyseus/core@^0.18.23, @colyseus/ws-transport@^0.18.4, @colyseus/core, @colyseus/ws-transport, server

### Community 22 - "react"
Cohesion: 0.33
Nodes (4): react@^19.1.0, react-dom@^19.1.0, react, react-dom

### Community 23 - "vite"
Cohesion: 0.40
Nodes (4): vite@^7.1.3, @vitejs/plugin-react@^5.0.2, vite, @vitejs/plugin-react

### Community 24 - "engines"
Cohesion: 0.67
Nodes (3): engines, node, npm

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameRoom` connect `GameRoom` to `GameRoom.test.ts`, `app.config.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07342995169082125 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `App.tsx` to `devDependencies`, `BoardScene.tsx`, `GameRoom.test.ts`, `package.json`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `@colyseus/core` connect `app.config.ts` to `GameRoom.test.ts`, `package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `GameRoom` be split into smaller, more focused modules?**
  _Cohesion score 0.11379800853485064 - nodes in this community are weakly interconnected._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._