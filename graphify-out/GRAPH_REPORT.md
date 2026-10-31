# Graph Report - BancoImobiliarioOnline  (2026-10-31)

## Corpus Check
- 131 files · ~90,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .glb 5, .blend 3, (none) 2)

## Summary
- 889 nodes · 1651 edges · 63 communities (59 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `391e8bf9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- package.json
- GameRoom.ts
- Validação visual e de navegador
- Board
- graphify.mjs
- compilerOptions
- Andamento do projeto
- compilerOptions
- steps
- getCameraFraming
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
- feedbackQueue.ts
- rouletteFloor.test.ts
- stepDieValue
- engines
- Regras do jogo
- CashHud.tsx
- gameAudio.ts
- App
- boardInteraction.ts
- turnActivity.ts
- BoardScene.tsx
- gameFeedback.ts
- snapshotStability.ts
- VALIDACAO.md
- vite
- boardDecoration.ts
- dicePresentation.ts
- VALIDACAO.md
- scoreCriteria.ts
- Câmera por arraste e escolhas visuais
- Cena sem luzes e sombras
- Reforma BANTEC — plano de trabalho
- GameRoom
- App.tsx
- auctionActions.ts
- BoardSceneCanvas
- ANDAMENTO.md
- Medidor de FPS e playtest no Chrome
- Modelos low-poly e pisos diferenciados
- Otimização após relato de 2 FPS
- Otimização de renderização
- Polimento da cena e ferramentas DEV
- Deploy automático do Render
- Seletor de fichas de personagem
- roomClient.ts
- fpsMeter.ts
- Bairros em sequência e tema da Sorte
- Zoom da câmera e destaque das fichas
- vitest
- AnimatedPawn
- main.tsx
- sceneLoading.ts

## God Nodes (most connected - your core abstractions)
1. `App()` - 75 edges
2. `Validação visual e de navegador` - 66 edges
3. `GameRoom` - 48 edges
4. `vitest` - 43 edges
5. `Andamento do projeto` - 37 edges
6. `Board()` - 18 edges
7. `compilerOptions` - 18 edges
8. `boardSpaces` - 15 edges
9. `compilerOptions` - 15 edges
10. `AnimatedPawn()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Fatos verificados` --references--> `AnimatedPawn()`  [INFERRED]
  docs/trabalho/seletor-fichas-personagem.md → src/ui/BoardScene.tsx
- `HUD de turno, atalhos e leitura do aluguel — 2026-10-30` --references--> `getBuildingRentLabelPosition()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/modelPlacement.ts
- `Zoom da câmera e destaque das fichas — implementação validada (2026-10-29)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/ANDAMENTO.md → src/ui/BoardScene.tsx
- `2026-10-28 — Dinheiro 3D e leitura de casas (em andamento)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/BoardScene.tsx
- `Frente concluída — sequência de animações, diálogos e compra de construções (2026-10-28)` --references--> `BoardScene()`  [INFERRED]
  docs/ANDAMENTO.md → src/ui/BoardScene.tsx

## Import Cycles
- None detected.

## Communities (63 total, 4 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.16
Nodes (12): chooseBotAuctionBid(), shouldBotBuyProperty(), CHARACTER_OPTIONS, CharacterType, GameMode, isCharacterType(), LobbyPlayer, LobbyStatus (+4 more)

### Community 1 - "package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @colyseus/testing@^0.18.6, @colyseus/tools@^0.18.11, husky@^9.1.7, tsx@^4.23.15, @types/node@^24.19.2, @types/react@^19.1.10, @types/react-dom@^19.1.7 (+16 more)

### Community 2 - "GameRoom.ts"
Cohesion: 0.07
Nodes (62): createRoomCode(), LobbyState, PropertyState, boardSpaces, cities, City, cityIds, companyIds (+54 more)

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.03
Nodes (63): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+55 more)

### Community 4 - "Board"
Cohesion: 0.22
Nodes (14): AnimatedBuilding(), AnimatedDie(), Board(), CornerLandmark(), FatecLandmark(), getTileTrimGeometry(), LandingPulse(), makeSceneMaterialsUnlit() (+6 more)

### Community 5 - "graphify.mjs"
Cohesion: 0.12
Nodes (12): [command, ...args], graphifyBinDir, graphifyExecutable, projectRoot, stylesheet, GAME_BACKGROUND_LIGHT, GAME_BACKGROUND_NIGHT, getGameBackgroundColor() (+4 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "Andamento do projeto"
Cohesion: 0.05
Nodes (44): Aluguéis 3D, opções em tela inteira, emotes e sons de chegada — implementação concluída (2026-10-30), Andamento do projeto, Correção do desempenho baixo — implementação validada localmente (2026-10-29), Correções de casas e interações — concluído (2026-10-29), Correções de compra, prisão e origens 3D — concluído (2026-10-30), Estado observado — 2026-10-28, Frente atual — fichas de veículo no lobby (2026-10-29), Frente atual — sons de dinheiro, ajuda e prazo de turno (2026-10-28) (+36 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.09
Nodes (21): RENDER_DEPLOY_HOOK_URL, jobs, verify, name, on, pull_request, push, workflow_dispatch (+13 more)

### Community 10 - "getCameraFraming"
Cohesion: 0.28
Nodes (5): CameraZoomBounds(), CameraFraming, getCameraFraming(), CameraZoomLimits, getCameraZoomLimits()

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, rootDir (+5 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @colyseus/core@^0.18.23, @colyseus/schema@^5.0.42, @colyseus/ws-transport@^0.18.4, @react-three/drei@^10.5.1, @react-three/fiber@^9.3.0, three@^0.179.1, @colyseus/core (+5 more)

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
Cohesion: 0.18
Nodes (10): Abrir a partida local no navegador, Abrir o Blender e os assets, Atualizar o projeto pelo GitHub, BANTEC, Desenvolvimento local, Direção visual, Estado atual, Estrutura (+2 more)

### Community 18 - "bug_report.md"
Cohesion: 0.40
Nodes (4): Ambiente, Como reproduzir?, O que aconteceu?, O que deveria acontecer?

### Community 19 - "feature_request.md"
Cohesion: 0.40
Nodes (4): Critérios de aceite, Problema ou necessidade, Regras, telas ou dispositivos afetados, Resultado esperado para quem joga

### Community 21 - "feedbackQueue.ts"
Cohesion: 0.48
Nodes (5): showGameFeedback(), appendGameFeedback(), GameFeedbackItem, personalizePlayerFeedback(), GameSound

### Community 22 - "rouletteFloor.test.ts"
Cohesion: 0.22
Nodes (9): Fatos verificados, BoardSpace, ChanceRoulette(), BoardTileTheme, getBoardTileTheme(), getPolygonArea(), getRouletteFloorSectors(), RoulettePoint (+1 more)

### Community 24 - "engines"
Cohesion: 0.30
Nodes (5): allowScripts, esbuild@0.28.2, engines, node, npm

### Community 25 - "Regras do jogo"
Cohesion: 0.04
Nodes (44): Base de regras Express, Confirmadas, Decisões do projeto, Detalhes de implementação que ainda serão calibrados, Histórico, Propostas abertas, Reforma do tabuleiro aprovada — implementação parcial, Arquitetura confirmada (+36 more)

### Community 26 - "CashHud.tsx"
Cohesion: 0.13
Nodes (25): react@^19.1.0, react, three, CashHudOverlay, CashHudCamera(), CashHudOverlay, CashHudOverlayScene(), CashHudScene() (+17 more)

### Community 28 - "gameAudio.ts"
Cohesion: 0.18
Nodes (20): GameAudioEffectStyle, getAudioContext(), getBackgroundMusicFrequency(), getGameAudioEffectStyle(), musicOscillators, musicPhrase, musicScale, playAirplanePass() (+12 more)

### Community 30 - "App"
Cohesion: 0.11
Nodes (11): App(), dismissTransientReveal(), handleTransientRevealPointerDown(), BoardScene, CharacterIcon(), durationLabel(), formatClock(), getLocalStorage() (+3 more)

### Community 31 - "boardInteraction.ts"
Cohesion: 0.28
Nodes (5): handleSelectSpace(), BoardChoicePhase, BoardSpaceInteraction, getBoardSpaceInteraction(), toggleSelection()

### Community 32 - "turnActivity.ts"
Cohesion: 0.48
Nodes (5): ActivityPhase, getTurnActivityLabel(), shouldShowTurnCard(), shouldSuppressTurnCardForFeedback(), shouldSuppressTurnCardForSpaceSelection()

### Community 33 - "BoardScene.tsx"
Cohesion: 0.14
Nodes (16): AnimationSpeed, BUILDING_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, areScenePropsEqual(), BoardSceneProps, CameraOrbitControls, dicePips, FrameRateProbe() (+8 more)

### Community 34 - "gameFeedback.ts"
Cohesion: 0.24
Nodes (12): CashChange, CashChangeToast(), CashChangeToastProps, formatCashDelta(), getCashChangeTone(), getCashToastPlacement(), getGameSound(), getLandingSpecialSound() (+4 more)

### Community 36 - "snapshotStability.ts"
Cohesion: 0.80
Nodes (3): areNumberPairsEqual(), areRecordArraysEqual(), areRecordMapsEqual()

### Community 37 - "VALIDACAO.md"
Cohesion: 0.21
Nodes (11): Aluguel ampliado, opções em tela cheia, emotes, hotel e sons de cantos — 2026-10-30, Compra depois de carta de avanço e piso sem texto — 2026-10-30, HUD de turno, atalhos e leitura do aluguel — 2026-10-30, Painel de compra, inspeção, controles e nitidez — 2026-10-30, Seleção de propriedades pelo tabuleiro — 2026-10-31, SpaceKind, SpaceLabel(), event() (+3 more)

### Community 38 - "vite"
Cohesion: 0.40
Nodes (4): vite@^7.1.3, @vitejs/plugin-react@^5.0.2, vite, @vitejs/plugin-react

### Community 39 - "boardDecoration.ts"
Cohesion: 0.48
Nodes (5): BOARD_SURFACE_Y, BoardSpaceDecoration, BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration()

### Community 40 - "dicePresentation.ts"
Cohesion: 0.33
Nodes (7): DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DicePosition, DicePresentationPhase, DiceRotation, getDiceRollRotation(), shouldShowRolledDice()

### Community 41 - "VALIDACAO.md"
Cohesion: 0.33
Nodes (5): 2026-10-30 — Cartões do jogador, lance de leilão e airport GLB, 2026-10-30 — Pop-up de saldo, modo DEV no lobby e aluguel das estações, Correção do painel de encerramento — 2026-10-31, Nome Volta ao Brasil e cartas no navegador — 2026-10-31, Perfil, propostas, sons e rolagem de aluguel — 2026-10-30

### Community 42 - "scoreCriteria.ts"
Cohesion: 0.53
Nodes (4): finalScoreMetrics(), FinalScorePlayer, rankFinalScore(), scoreCriteria()

### Community 43 - "Câmera por arraste e escolhas visuais"
Cohesion: 0.29
Nodes (6): Câmera por arraste e escolhas visuais, Decisões confirmadas, Fatos, Perguntas abertas, Suposições, Validação concluída nesta sessão

### Community 44 - "Cena sem luzes e sombras"
Cohesion: 0.29
Nodes (6): Cena sem luzes e sombras, Decisão confirmada, Fatos, Implementação, Próximo passo, Validação

### Community 45 - "Reforma BANTEC — plano de trabalho"
Cohesion: 0.29
Nodes (6): Decisões e escopo aprovados, Estado atual — 2026-10-31, Linha de implementação, Objetivo, Propostas abertas e pendências, Reforma BANTEC — plano de trabalho

### Community 46 - "GameRoom"
Cohesion: 0.10
Nodes (4): GameRoom, LobbyPlayerState, getAnimationDuration(), normalizePlayerName()

### Community 47 - "App.tsx"
Cohesion: 0.16
Nodes (14): MatchDuration, PropertyHolding, getPlayerEmoteSymbol(), isPlayerEmote(), PLAYER_EMOTES, PlayerEmote, Mode, modeDetails (+6 more)

### Community 48 - "auctionActions.ts"
Cohesion: 0.60
Nodes (3): stepAuctionBid(), adjustAuctionStartingBid(), normalizeAuctionBidInput()

### Community 49 - "BoardSceneCanvas"
Cohesion: 0.21
Nodes (8): BoardSceneCanvas(), CameraDragAnywhere(), ResponsiveCamera(), CameraDragStart, shouldStartCameraDrag(), DEFAULT_GRAPHICS_QUALITY, getGraphicsDprRange(), GraphicsQuality

### Community 50 - "ANDAMENTO.md"
Cohesion: 0.20
Nodes (6): Cartões coloridos, avisos identificados e visibilidade das peças — concluído (2026-10-30), Decisões confirmadas pelo pedido, HUD, cartas, dados e roleta, Implementação e validação, Sequência de jogada, janelas centrais e casas, Sequência visual, economia e câmera

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
Cohesion: 0.33
Nodes (5): Configuração única pendente no painel, Contorno preparado, Deploy automático do Render, Fatos verificados, Segurança

### Community 57 - "Seletor de fichas de personagem"
Cohesion: 0.33
Nodes (5): Decisão de implementação, Fatos verificados, Pedido confirmado, Seletor de fichas de personagem, Validação e continuidade

### Community 58 - "roomClient.ts"
Cohesion: 0.40
Nodes (4): @colyseus/sdk@^0.18.8, @colyseus/sdk, resolveRoomServerUrl(), roomClient

### Community 60 - "fpsMeter.ts"
Cohesion: 0.26
Nodes (9): createFrameRateAccumulator(), FPS_IDLE_AFTER_MS, FPS_SAMPLE_WINDOW_MS, FrameRateAccumulator, FrameRateDisplay, FrameRateReading, readFrameRate(), FpsMeter() (+1 more)

### Community 61 - "Bairros em sequência e tema da Sorte"
Cohesion: 0.40
Nodes (4): Bairros em sequência e tema da Sorte, Fatos verificados — 2026-10-29, Perguntas abertas, Próximo passo

### Community 63 - "Zoom da câmera e destaque das fichas"
Cohesion: 0.40
Nodes (4): Decisão de implementação, Fatos, Validação, Zoom da câmera e destaque das fichas

### Community 64 - "vitest"
Cohesion: 0.18
Nodes (6): vitest, getLobbyPlayerEntries(), canAffordPurchase(), getRevealKicker(), RevealKind, styles

### Community 65 - "AnimatedPawn"
Cohesion: 0.33
Nodes (5): Zoom da câmera e destaque das fichas — implementação validada (2026-10-29), 2026-10-28 — Dinheiro 3D e leitura de casas (em andamento), AnimatedPawn(), TokenHighlight(), getPawnStepPath()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AnimatedPawn()` connect `AnimatedPawn` to `BoardScene.tsx`, `GameRoom.ts`, `Board`, `GameRoom`, `App.tsx`, `Seletor de fichas de personagem`, `CashHud.tsx`, `gameAudio.ts`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Why does `Validação visual e de navegador` connect `Validação visual e de navegador` to `AnimatedPawn`, `VALIDACAO.md`, `Andamento do projeto`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Should `GameRoom.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06582278481012659 - nodes in this community are weakly interconnected._
- **Why does `Andamento do projeto` connect `Andamento do projeto` to `AnimatedPawn`, `ANDAMENTO.md`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.031746031746031744 - nodes in this community are weakly interconnected._
- **Should `graphify.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._