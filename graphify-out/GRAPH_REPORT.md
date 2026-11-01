# Graph Report - BancoImobiliarioOnline  (2026-11-01)

## Corpus Check
- 142 files · ~109,314 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: .glb 6, .blend 4, (none) 2)

## Summary
- 1051 nodes · 1962 edges · 68 communities (62 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `66d55915`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- devDependencies
- app.config.ts
- Validação visual e de navegador
- Board
- graphify.mjs
- compilerOptions
- Andamento do projeto
- compilerOptions
- steps
- sceneLoading.ts
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
- fpsMeter.ts
- sceneRenderWake.ts
- gameAudio.ts
- package.json
- Referências visuais da partida
- CashHud.tsx
- GameRoom.ts
- vitest
- BoardSceneCanvas
- App
- BoardScene.tsx
- feedbackQueue.ts
- Regras do BANTEC
- gameFeedback.ts
- VALIDACAO.md
- canAffordPurchase
- throwables.ts
- lobby.ts
- boardDecoration.ts
- dicePresentation.ts
- playerEmotes.ts
- snapshotStability.ts
- Câmera por arraste e escolhas visuais
- Cena sem luzes e sombras
- Reforma BANTEC — plano de trabalho
- GameRoom
- @types/react-dom@^19.1.7
- Bairros em sequência e tema da Sorte
- auctionActions.ts
- ANDAMENTO.md
- Medidor de FPS e playtest no Chrome
- Modelos low-poly e pisos diferenciados
- Otimização após relato de 2 FPS
- Otimização de renderização
- Polimento da cena e ferramentas DEV
- Deploy automático do Render
- AnimatedPawn
- Playtests humanos de equilíbrio do BANTEC
- shared/board.ts
- typescript@~5.8.3
- getCameraFraming
- ANDAMENTO.md
- Zoom da câmera e destaque das fichas
- boardInteraction.ts
- dismissCardRevealOnPointerDown
- festivalBanner.ts
- Reforma econômica inspirada em Business Tour — implementada (2026-11-01)

## God Nodes (most connected - your core abstractions)
1. `App()` - 82 edges
2. `2026-10-31 — Dados mais baixos sobre a FATEC` - 77 edges
3. `GameRoom` - 55 edges
4. `vitest` - 48 edges
5. `Andamento do projeto` - 39 edges
6. `Board()` - 21 edges
7. `compilerOptions` - 18 edges
8. `LobbyPlayerState` - 16 edges
9. `boardSpaces` - 15 edges
10. `playGameSound()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `HUD de turno, atalhos e leitura do aluguel — 2026-10-30` --references--> `getBuildingRentLabelPosition()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/modelPlacement.ts
- `Zoom da câmera e destaque das fichas — implementação validada (2026-10-29)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/ANDAMENTO.md → src/ui/BoardScene.tsx
- `Fatos verificados` --references--> `AnimatedPawn()`  [INFERRED]
  docs/trabalho/seletor-fichas-personagem.md → src/ui/BoardScene.tsx
- `2026-10-28 — Dinheiro 3D e leitura de casas (em andamento)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/BoardScene.tsx
- `Frente concluída — sequência de animações, diálogos e compra de construções (2026-10-28)` --references--> `BoardScene()`  [INFERRED]
  docs/ANDAMENTO.md → src/ui/BoardScene.tsx

## Import Cycles
- None detected.

## Communities (68 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.33
Nodes (4): react@^19.1.0, react-dom@^19.1.0, react, react-dom

### Community 1 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, @colyseus/tools@^0.18.11, husky@^9.1.7, tsx@^4.23.15, @types/node@^24.19.2, @types/react@^19.1.10, vite@^7.1.3, @vitejs/plugin-react@^5.0.2 (+8 more)

### Community 2 - "app.config.ts"
Cohesion: 0.33
Nodes (5): @colyseus/core@^0.18.23, @colyseus/ws-transport@^0.18.4, @colyseus/core, @colyseus/ws-transport, server

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.03
Nodes (74): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+66 more)

### Community 4 - "Board"
Cohesion: 0.22
Nodes (16): positionOnBoard(), AnimatedBuilding(), Board(), CornerLandmark(), EarthquakeCollapse(), FatecLandmark(), FestivalBanner(), getTileTrimGeometry() (+8 more)

### Community 5 - "graphify.mjs"
Cohesion: 0.11
Nodes (13): [command, ...args], graphifyBinDir, graphifyExecutable, projectRoot, GAME_BACKGROUND_LIGHT, GAME_BACKGROUND_NIGHT, getGameBackgroundColor(), NIGHT_MODE_STORAGE_KEY (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "Andamento do projeto"
Cohesion: 0.04
Nodes (46): Aluguéis 3D, opções em tela inteira, emotes e sons de chegada — implementação concluída (2026-10-30), Andamento do projeto, Correção do desempenho baixo — implementação validada localmente (2026-10-29), Correções de casas e interações — concluído (2026-10-29), Correções de compra, prisão e origens 3D — concluído (2026-10-30), Estado observado — 2026-10-28, Frente atual — fichas de veículo no lobby (2026-10-29), Frente atual — sons de dinheiro, ajuda e prazo de turno (2026-10-28) (+38 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.09
Nodes (21): RENDER_DEPLOY_HOOK_URL, jobs, verify, name, on, pull_request, push, workflow_dispatch (+13 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, rootDir (+5 more)

### Community 12 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @colyseus/schema@^5.0.42, @colyseus/sdk@^0.18.8, @react-three/drei@^10.5.1, @react-three/fiber@^9.3.0, three@^0.179.1, @colyseus/schema, @colyseus/sdk (+2 more)

### Community 13 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, build:server, dev, dev:server, graphify, prepare, preview (+3 more)

### Community 14 - "Instruções do projeto"
Cohesion: 0.17
Nodes (11): Autorização e bloqueios de validação, Blender para assets do jogo, Contexto durável e memória de trabalho, Fluxo de trabalho, Fonte da verdade, graphify, Instruções do projeto, Objetivo (+3 more)

### Community 15 - "Como contribuir"
Cohesion: 0.33
Nodes (5): Ativos e coordenação, Como contribuir, Implementação, testes e commits, Preparação, Pull requests

### Community 16 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): Capturas ou vídeo (quando a mudança for visual), Como foi validado?, Impacto em regras, arquitetura ou documentação, O que muda?, Por que?

### Community 17 - "Banco Imobiliário Online"
Cohesion: 0.17
Nodes (11): Abrir a partida local no navegador, Abrir o Blender e os assets, Atualizar o projeto pelo GitHub, BANTEC, Desenvolvimento local, Direção visual, Economia atual, Estado atual (+3 more)

### Community 18 - "bug_report.md"
Cohesion: 0.40
Nodes (4): Ambiente, Como reproduzir?, O que aconteceu?, O que deveria acontecer?

### Community 19 - "feature_request.md"
Cohesion: 0.40
Nodes (4): Critérios de aceite, Problema ou necessidade, Regras, telas ou dispositivos afetados, Resultado esperado para quem joga

### Community 21 - "fpsMeter.ts"
Cohesion: 0.26
Nodes (9): createFrameRateAccumulator(), FPS_IDLE_AFTER_MS, FPS_SAMPLE_WINDOW_MS, FrameRateAccumulator, FrameRateDisplay, FrameRateReading, readFrameRate(), FpsMeter() (+1 more)

### Community 22 - "sceneRenderWake.ts"
Cohesion: 0.20
Nodes (12): SceneRenderWake(), CancelDelay, CancelFrame, ContextEventTarget, InvalidateScene, SceneWakeTarget, ScheduleDelay, ScheduleFrame (+4 more)

### Community 23 - "gameAudio.ts"
Cohesion: 0.17
Nodes (21): GameAudioEffectStyle, getAudioContext(), getBackgroundMusicFrequency(), getGameAudioEffectStyle(), musicOscillators, musicPhrase, musicScale, playAirplanePass() (+13 more)

### Community 24 - "package.json"
Cohesion: 0.14
Nodes (13): allowScripts, esbuild@0.28.2, @colyseus/testing@^0.18.6, @types/three@^0.179.0, engines, node, npm, name (+5 more)

### Community 25 - "Referências visuais da partida"
Cohesion: 0.14
Nodes (13): Aplicação e limites, Apresentação por momento, Capturas de referência por estado, Composição, Direção visual para o nosso jogo, Fontes consultadas, Inventário de telas consultadas, Leitura visual das capturas (+5 more)

### Community 26 - "CashHud.tsx"
Cohesion: 0.14
Nodes (23): three, CashHudOverlay, CashHudCamera(), CashHudOverlay, CashHudOverlayScene(), CashHudScene(), CashHudStack(), cashModelNames (+15 more)

### Community 27 - "GameRoom.ts"
Cohesion: 0.07
Nodes (66): chooseBotAuctionBid(), shouldBotBuyProperty(), createRoomCode(), LobbyState, PropertyState, boardSpaces, getLineTitleIds(), EVENT_CARDS (+58 more)

### Community 28 - "vitest"
Cohesion: 0.15
Nodes (8): vitest, stylesheet, stepDieValue(), getLobbyPlayerEntries(), getRevealKicker(), RevealKind, resolveRoomServerUrl(), roomClient

### Community 29 - "BoardSceneCanvas"
Cohesion: 0.21
Nodes (8): BoardSceneCanvas(), CameraDragAnywhere(), ResponsiveCamera(), CameraDragStart, shouldStartCameraDrag(), DEFAULT_GRAPHICS_QUALITY, getGraphicsDprRange(), GraphicsQuality

### Community 30 - "App"
Cohesion: 0.11
Nodes (16): App(), dismissTransientReveal(), handleTransientRevealPointerDown(), BoardScene, CharacterIcon(), durationLabel(), formatClock(), getLocalStorage() (+8 more)

### Community 31 - "BoardScene.tsx"
Cohesion: 0.12
Nodes (21): areScenePropsEqual(), BoardSceneProps, CameraOrbitControls, dicePips, EarthquakeEvent, FrameRateProbe(), PlayerToken, PropertyBuilding (+13 more)

### Community 32 - "feedbackQueue.ts"
Cohesion: 0.48
Nodes (5): showGameFeedback(), appendGameFeedback(), GameFeedbackItem, personalizePlayerFeedback(), GameSound

### Community 33 - "Regras do BANTEC"
Cohesion: 0.07
Nodes (25): Cidades, regiões e cores, Confirmadas e vigentes, Decisões do projeto, Histórico de decisões substituídas, Outras regras econômicas aprovadas, Propostas abertas e validações necessárias, Arquitetura confirmada, Experiência (+17 more)

### Community 34 - "gameFeedback.ts"
Cohesion: 0.24
Nodes (12): CashChange, CashChangeToast(), CashChangeToastProps, formatCashDelta(), getCashChangeTone(), getCashToastPlacement(), getGameSound(), getLandingSpecialSound() (+4 more)

### Community 35 - "VALIDACAO.md"
Cohesion: 0.04
Nodes (45): 2026-10-30 — Cartões do jogador, lance de leilão e airport GLB, 2026-10-30 — Pop-up de saldo, modo DEV no lobby e aluguel das estações, 2026-10-31 — Cartas Ladrão, Volta ao Brasil e Apagão, 2026-10-31 — Causa exibida no resultado final, 2026-10-31 — Conclusão da revisão manual das 12 cartas, 2026-10-31 — Confirmação visual da altura mais baixa dos dados, 2026-10-31 — Dados ainda mais baixos sobre a FATEC, 2026-10-31 — Dados mais baixos sem atravessar a FATEC (+37 more)

### Community 37 - "throwables.ts"
Cohesion: 0.15
Nodes (18): getThrowableLabel(), getThrowableSymbol(), isThrowableObject(), THROW_COOLDOWN_MS, THROW_IMPACT_DURATION_MS, THROW_PROJECTILE_DURATION_MS, ThrowableObject, THROWABLES (+10 more)

### Community 38 - "lobby.ts"
Cohesion: 0.15
Nodes (13): CHARACTER_OPTIONS, CharacterType, isCharacterType(), LobbyPlayer, LobbyStatus, isPlayerColor(), PLAYER_COLOR_NAMES, PLAYER_COLORS (+5 more)

### Community 39 - "boardDecoration.ts"
Cohesion: 0.48
Nodes (5): BOARD_SURFACE_Y, BoardSpaceDecoration, BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration()

### Community 40 - "dicePresentation.ts"
Cohesion: 0.22
Nodes (13): AnimatedDie(), DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_ROLL_BOUNCE_COUNT, DICE_ROLL_BOUNCE_HEIGHT, DICE_VISUAL_SCALE, DicePosition, DicePresentationPhase (+5 more)

### Community 41 - "playerEmotes.ts"
Cohesion: 0.53
Nodes (4): getPlayerEmoteSymbol(), isPlayerEmote(), PLAYER_EMOTES, PlayerEmote

### Community 42 - "snapshotStability.ts"
Cohesion: 0.80
Nodes (3): areNumberPairsEqual(), areRecordArraysEqual(), areRecordMapsEqual()

### Community 43 - "Câmera por arraste e escolhas visuais"
Cohesion: 0.29
Nodes (6): Câmera por arraste e escolhas visuais, Decisões confirmadas, Fatos, Perguntas abertas, Suposições, Validação concluída nesta sessão

### Community 44 - "Cena sem luzes e sombras"
Cohesion: 0.29
Nodes (6): Cena sem luzes e sombras, Decisão confirmada, Fatos, Implementação, Próximo passo, Validação

### Community 45 - "Reforma BANTEC — plano de trabalho"
Cohesion: 0.25
Nodes (7): Decisões e escopo aprovados, Estado atual — 2026-11-01, Linha de implementação, Objetivo, Playtest de compras e aluguel — 2026-10-31, Propostas abertas e pendências, Reforma BANTEC — plano de trabalho

### Community 46 - "GameRoom"
Cohesion: 0.09
Nodes (7): GameRoom, LobbyPlayerState, canReturnPropertyToBank(), canSellBuilding(), getAnimationDuration(), liquidatablePropertyIds(), normalizePlayerName()

### Community 48 - "Bairros em sequência e tema da Sorte"
Cohesion: 0.40
Nodes (4): Bairros em sequência e tema da Sorte, Fatos verificados — 2026-10-29, Perguntas abertas, Próximo passo

### Community 49 - "auctionActions.ts"
Cohesion: 0.47
Nodes (4): AUCTION_MIN_BID_INCREMENT, stepAuctionBid(), adjustAuctionStartingBid(), normalizeAuctionBidInput()

### Community 50 - "ANDAMENTO.md"
Cohesion: 0.14
Nodes (14): Altura dos dados durante a rolagem — concluído (2026-10-31), Altura dos dados na rolagem — concluído (2026-10-31), Auditoria de cartas e dívida — progresso (2026-10-31), Cartões coloridos, avisos identificados e visibilidade das peças — concluído (2026-10-30), Dados mais baixos durante a rolagem — concluído (2026-10-31), Ferramentas DEV para testes de partida — concluído (2026-10-31), Motivo do encerramento explícito no resultado — em validação (2026-10-31), Playtest da Linha 0 — concluído (2026-10-31) (+6 more)

### Community 51 - "Medidor de FPS e playtest no Chrome"
Cohesion: 0.33
Nodes (5): Decisões desta implementação, Fatos verificados, Medidor de FPS e playtest no Chrome, Próximo passo, Validação

### Community 52 - "Modelos low-poly e pisos diferenciados"
Cohesion: 0.33
Nodes (5): Decisões confirmadas pelo usuário, Fatos, Implementação, Modelos low-poly e pisos diferenciados, Validação e publicação

### Community 53 - "Otimização após relato de 2 FPS"
Cohesion: 0.33
Nodes (5): Fatos, Implementação, Otimização após relato de 2 FPS, Próximo passo, Validação concluída localmente; Chrome standalone pendente

### Community 54 - "Otimização de renderização"
Cohesion: 0.33
Nodes (5): Fatos verificados, Implementação concluída, Limites conhecidos e próximo passo, Otimização de renderização, Validação concluída

### Community 55 - "Polimento da cena e ferramentas DEV"
Cohesion: 0.33
Nodes (5): Decisões de implementação, Fatos verificados, Pedido confirmado, Polimento da cena e ferramentas DEV, Validação e continuidade

### Community 56 - "Deploy automático do Render"
Cohesion: 0.25
Nodes (7): Comparação de hospedagem — 2026-10-31, Contorno preparado, Deploy automático do Render, Estado atualizado — 2026-10-31, Fatos verificados, Procedimento e estado atual, Segurança

### Community 57 - "AnimatedPawn"
Cohesion: 0.17
Nodes (10): Zoom da câmera e destaque das fichas — implementação validada (2026-10-29), Decisão de implementação, Fatos verificados, Pedido confirmado, Seletor de fichas de personagem, Validação e continuidade, 2026-10-28 — Dinheiro 3D e leitura de casas (em andamento), AnimatedPawn() (+2 more)

### Community 58 - "Playtests humanos de equilíbrio do BANTEC"
Cohesion: 0.33
Nodes (5): Como executar, Estado, Objetivo, Playtests humanos de equilíbrio do BANTEC, Registro por sessão

### Community 59 - "shared/board.ts"
Cohesion: 0.06
Nodes (34): 2026-10-31 — Ajuste adicional de altura dos dados, Decisões confirmadas pelo pedido, Fatos verificados, HUD, cartas, dados e roleta, Implementação e validação, BoardSpace, businessTourCityCurve, cities (+26 more)

### Community 61 - "getCameraFraming"
Cohesion: 0.28
Nodes (5): CameraZoomBounds(), CameraFraming, getCameraFraming(), CameraZoomLimits, getCameraZoomLimits()

### Community 62 - "ANDAMENTO.md"
Cohesion: 0.10
Nodes (17): Ajustes de regras, liquidação e apresentação — implementado (2026-11-01), Altura dos dados — novo ajuste solicitado (2026-10-31), Auditoria da reforma BANTEC — 2026-11-01, Bandeira de festival e rolagem dos dados — concluídas (2026-11-01), Continuação após resolver cartas com alvo — concluída (2026-11-01), Correção visual de propriedades e indicador de liquidação — implementada (2026-11-01), Dados ainda mais baixos durante a rolagem — ajuste implementado (2026-10-31), Lançamento cosmético de objetos — concluído (2026-10-31) (+9 more)

### Community 63 - "Zoom da câmera e destaque das fichas"
Cohesion: 0.40
Nodes (4): Decisão de implementação, Fatos, Validação, Zoom da câmera e destaque das fichas

### Community 65 - "boardInteraction.ts"
Cohesion: 0.28
Nodes (5): handleSelectSpace(), BoardChoicePhase, BoardSpaceInteraction, getBoardSpaceInteraction(), toggleSelection()

### Community 67 - "festivalBanner.ts"
Cohesion: 0.60
Nodes (4): FESTIVAL_BANNER_HEIGHT, FESTIVAL_BANNER_PENNANT_COUNT, FESTIVAL_BANNER_STAKE_SPACING, getFestivalBannerPlacement()

### Community 68 - "Reforma econômica inspirada em Business Tour — implementada (2026-11-01)"
Cohesion: 0.67
Nodes (3): Primeira volta e velocidade de animação — corrigidas (2026-11-01), Reforma econômica inspirada em Business Tour — implementada (2026-11-01), Restrições de primeira volta e cartas de aluguel — em implementação (2026-11-01)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Andamento do projeto` connect `Andamento do projeto` to `AnimatedPawn`, `ANDAMENTO.md`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `AnimatedPawn()` connect `AnimatedPawn` to `Board`, `playerEmotes.ts`, `GameRoom`, `gameAudio.ts`, `CashHud.tsx`, `BoardScene.tsx`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Why does `2026-10-31 — Dados mais baixos sobre a FATEC` connect `Validação visual e de navegador` to `AnimatedPawn`, `VALIDACAO.md`, `Andamento do projeto`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `graphify.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._