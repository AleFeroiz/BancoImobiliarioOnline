# Graph Report - BancoImobiliarioOnline  (2026-10-31)

## Corpus Check
- 133 files · ~93,584 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .glb 5, .blend 3, (none) 2)

## Summary
- 939 nodes · 1745 edges · 70 communities (63 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `acb3e0fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lobby.ts
- package.json
- GameRoom.ts
- Validação visual e de navegador
- Board
- graphify.mjs
- compilerOptions
- Andamento do projeto
- compilerOptions
- steps
- BoardSceneCanvas
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
- rouletteFloor.test.ts
- gameAudio.ts
- getLobbyPlayerEntries
- Referências visuais da partida
- CashHud.tsx
- VALIDACAO.md
- boardInteraction.ts
- engines
- App
- BoardScene.tsx
- feedbackQueue.ts
- react
- gameFeedback.ts
- Regras do BANTEC
- snapshotStability.ts
- vite
- graphicsQuality.ts
- boardDecoration.ts
- dicePresentation.ts
- sceneMaterials.ts
- App.tsx
- Câmera por arraste e escolhas visuais
- Cena sem luzes e sombras
- Reforma BANTEC — plano de trabalho
- GameRoom
- vitest
- Bairros em sequência e tema da Sorte
- Plano do jogo
- ANDAMENTO.md
- Medidor de FPS e playtest no Chrome
- Modelos low-poly e pisos diferenciados
- Otimização após relato de 2 FPS
- Otimização de renderização
- Polimento da cena e ferramentas DEV
- Deploy automático do Render
- Seletor de fichas de personagem
- roomClient.ts
- Correção do painel de encerramento — 2026-10-31
- Decisões do projeto
- spaceLabel.ts
- HUD, cartas, dados e roleta
- Zoom da câmera e destaque das fichas
- Painel de compra, inspeção, controles e nitidez — 2026-10-30
- revealCopy.ts
- stepDieValue
- playerEmotes.ts
- canAffordPurchase

## God Nodes (most connected - your core abstractions)
1. `Validação visual e de navegador` - 77 edges
2. `App()` - 76 edges
3. `GameRoom` - 54 edges
4. `vitest` - 44 edges
5. `Andamento do projeto` - 39 edges
6. `Board()` - 18 edges
7. `compilerOptions` - 18 edges
8. `LobbyPlayerState` - 16 edges
9. `boardSpaces` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Zoom da câmera e destaque das fichas — implementação validada (2026-10-29)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/ANDAMENTO.md → src/ui/BoardScene.tsx
- `Fatos verificados` --references--> `AnimatedPawn()`  [INFERRED]
  docs/trabalho/seletor-fichas-personagem.md → src/ui/BoardScene.tsx
- `2026-10-28 — Dinheiro 3D e leitura de casas (em andamento)` --references--> `AnimatedPawn()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/BoardScene.tsx
- `HUD de turno, atalhos e leitura do aluguel — 2026-10-30` --references--> `getBuildingRentLabelPosition()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/modelPlacement.ts
- `Compra depois de carta de avanço e piso sem texto — 2026-10-30` --references--> `SpaceLabel()`  [INFERRED]
  docs/VALIDACAO.md → src/ui/BoardScene.tsx

## Import Cycles
- None detected.

## Communities (70 total, 7 thin omitted)

### Community 0 - "lobby.ts"
Cohesion: 0.15
Nodes (13): CHARACTER_OPTIONS, CharacterType, isCharacterType(), LobbyPlayer, LobbyStatus, isPlayerColor(), PLAYER_COLOR_NAMES, PLAYER_COLORS (+5 more)

### Community 1 - "package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @colyseus/testing@^0.18.6, @colyseus/tools@^0.18.11, husky@^9.1.7, tsx@^4.23.15, @types/node@^24.19.2, @types/react@^19.1.10, @types/react-dom@^19.1.7 (+16 more)

### Community 2 - "GameRoom.ts"
Cohesion: 0.06
Nodes (66): chooseBotAuctionBid(), shouldBotBuyProperty(), createRoomCode(), LobbyState, PropertyState, boardSpaces, cities, City (+58 more)

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.03
Nodes (75): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+67 more)

### Community 4 - "Board"
Cohesion: 0.18
Nodes (19): getAnimationDuration(), positionOnBoard(), AnimatedBuilding(), AnimatedPawn(), Board(), ChanceRoulette(), CornerLandmark(), FatecLandmark() (+11 more)

### Community 5 - "graphify.mjs"
Cohesion: 0.10
Nodes (14): [command, ...args], graphifyBinDir, graphifyExecutable, projectRoot, stylesheet, GAME_BACKGROUND_LIGHT, GAME_BACKGROUND_NIGHT, getGameBackgroundColor() (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "Andamento do projeto"
Cohesion: 0.04
Nodes (47): Aluguéis 3D, opções em tela inteira, emotes e sons de chegada — implementação concluída (2026-10-30), Andamento do projeto, Correção do desempenho baixo — implementação validada localmente (2026-10-29), Correções de casas e interações — concluído (2026-10-29), Correções de compra, prisão e origens 3D — concluído (2026-10-30), Estado observado — 2026-10-28, Frente atual — fichas de veículo no lobby (2026-10-29), Frente atual — sons de dinheiro, ajuda e prazo de turno (2026-10-28) (+39 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.09
Nodes (21): RENDER_DEPLOY_HOOK_URL, jobs, verify, name, on, pull_request, push, workflow_dispatch (+13 more)

### Community 10 - "BoardSceneCanvas"
Cohesion: 0.19
Nodes (9): BoardSceneCanvas(), CameraDragAnywhere(), CameraZoomBounds(), ResponsiveCamera(), CameraDragStart, shouldStartCameraDrag(), getCameraFraming(), CameraZoomLimits (+1 more)

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

### Community 21 - "fpsMeter.ts"
Cohesion: 0.26
Nodes (9): createFrameRateAccumulator(), FPS_IDLE_AFTER_MS, FPS_SAMPLE_WINDOW_MS, FrameRateAccumulator, FrameRateDisplay, FrameRateReading, readFrameRate(), FpsMeter() (+1 more)

### Community 22 - "rouletteFloor.test.ts"
Cohesion: 0.27
Nodes (7): BoardSpace, BoardTileTheme, getBoardTileTheme(), getPolygonArea(), getRouletteFloorSectors(), RoulettePoint, squareBoundaryPoint()

### Community 23 - "gameAudio.ts"
Cohesion: 0.18
Nodes (20): GameAudioEffectStyle, getAudioContext(), getBackgroundMusicFrequency(), getGameAudioEffectStyle(), musicOscillators, musicPhrase, musicScale, playAirplanePass() (+12 more)

### Community 25 - "Referências visuais da partida"
Cohesion: 0.14
Nodes (13): Aplicação e limites, Apresentação por momento, Capturas de referência por estado, Composição, Direção visual para o nosso jogo, Fontes consultadas, Inventário de telas consultadas, Leitura visual das capturas (+5 more)

### Community 26 - "CashHud.tsx"
Cohesion: 0.18
Nodes (17): react@^19.1.0, react, CashHudOverlay, CashHudCamera(), CashHudOverlay, CashHudOverlayScene(), CashHudScene(), CashHudStack() (+9 more)

### Community 27 - "VALIDACAO.md"
Cohesion: 0.18
Nodes (10): 2026-10-30 — Cartões do jogador, lance de leilão e airport GLB, 2026-10-30 — Pop-up de saldo, modo DEV no lobby e aluguel das estações, 2026-10-31 — Dados ainda mais baixos sobre a FATEC, 2026-10-31 — Dados mais baixos sem atravessar a FATEC, 2026-10-31 — Encerramento após dívida sem bens liquidáveis, 2026-10-31 — Ferramentas DEV de teleporte e saldo, 2026-10-31 — Recompra depois do aluguel, 2026-10-31 — Recompra forçada pela interface (+2 more)

### Community 28 - "boardInteraction.ts"
Cohesion: 0.28
Nodes (5): handleSelectSpace(), BoardChoicePhase, BoardSpaceInteraction, getBoardSpaceInteraction(), toggleSelection()

### Community 29 - "engines"
Cohesion: 0.30
Nodes (5): allowScripts, esbuild@0.28.2, engines, node, npm

### Community 30 - "App"
Cohesion: 0.11
Nodes (12): App(), dismissTransientReveal(), handleTransientRevealPointerDown(), stepAuctionBid(), BoardScene, CharacterIcon(), durationLabel(), formatClock() (+4 more)

### Community 31 - "BoardScene.tsx"
Cohesion: 0.13
Nodes (16): BUILDING_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, areScenePropsEqual(), BoardSceneProps, CameraOrbitControls, dicePips, FrameRateProbe(), PlayerToken (+8 more)

### Community 32 - "feedbackQueue.ts"
Cohesion: 0.48
Nodes (5): showGameFeedback(), appendGameFeedback(), GameFeedbackItem, personalizePlayerFeedback(), GameSound

### Community 34 - "gameFeedback.ts"
Cohesion: 0.24
Nodes (12): CashChange, CashChangeToast(), CashChangeToastProps, formatCashDelta(), getCashChangeTone(), getCashToastPlacement(), getGameSound(), getLandingSpecialSound() (+4 more)

### Community 35 - "Regras do BANTEC"
Cohesion: 0.20
Nodes (10): Apresentação e acesso, Ações e negociação, Cantos especiais, Cartas Sorte ou Revés, Compra, construções e rendas, Dívidas e falência, Escopo removido e referências, Regras do BANTEC (+2 more)

### Community 36 - "snapshotStability.ts"
Cohesion: 0.80
Nodes (3): areNumberPairsEqual(), areRecordArraysEqual(), areRecordMapsEqual()

### Community 37 - "vite"
Cohesion: 0.40
Nodes (4): vite@^7.1.3, @vitejs/plugin-react@^5.0.2, vite, @vitejs/plugin-react

### Community 38 - "graphicsQuality.ts"
Cohesion: 0.60
Nodes (3): DEFAULT_GRAPHICS_QUALITY, getGraphicsDprRange(), GraphicsQuality

### Community 39 - "boardDecoration.ts"
Cohesion: 0.48
Nodes (5): BOARD_SURFACE_Y, BoardSpaceDecoration, BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration()

### Community 40 - "dicePresentation.ts"
Cohesion: 0.23
Nodes (11): AnimatedDie(), DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DICE_ROLL_BOUNCE_HEIGHT, DICE_VISUAL_SCALE, DicePosition, DicePresentationPhase, DiceRotation (+3 more)

### Community 41 - "sceneMaterials.ts"
Cohesion: 0.38
Nodes (8): three, applySelectionContrast(), createTokenOutlineMaterial(), createUnlitMaterial(), getOwnerTintOverride(), MaterialWithSurface, originalColors, reduceColorContrast()

### Community 42 - "App.tsx"
Cohesion: 0.15
Nodes (16): AnimationSpeed, MatchDuration, PropertyHolding, Mode, modeDetails, MoneyStepper(), Screen, SyncedPlayer (+8 more)

### Community 43 - "Câmera por arraste e escolhas visuais"
Cohesion: 0.29
Nodes (6): Câmera por arraste e escolhas visuais, Decisões confirmadas, Fatos, Perguntas abertas, Suposições, Validação concluída nesta sessão

### Community 44 - "Cena sem luzes e sombras"
Cohesion: 0.29
Nodes (6): Cena sem luzes e sombras, Decisão confirmada, Fatos, Implementação, Próximo passo, Validação

### Community 45 - "Reforma BANTEC — plano de trabalho"
Cohesion: 0.25
Nodes (7): Decisões e escopo aprovados, Estado atual — 2026-10-31, Linha de implementação, Objetivo, Playtest de compras e aluguel — 2026-10-31, Propostas abertas e pendências, Reforma BANTEC — plano de trabalho

### Community 46 - "GameRoom"
Cohesion: 0.10
Nodes (3): GameRoom, LobbyPlayerState, normalizePlayerName()

### Community 47 - "vitest"
Cohesion: 0.15
Nodes (8): vitest, REGION_DETAILS, CameraFraming, CardRevealPointerEvent, dismissCardRevealOnPointerDown(), HOME_REGION_ROUTE, SceneScheduler, scheduleSceneLoad()

### Community 48 - "Bairros em sequência e tema da Sorte"
Cohesion: 0.40
Nodes (4): Bairros em sequência e tema da Sorte, Fatos verificados — 2026-10-29, Perguntas abertas, Próximo passo

### Community 49 - "Plano do jogo"
Cohesion: 0.22
Nodes (9): Arquitetura confirmada, Experiência, Fases de produção, Limites do MVP, Plano do jogo, Referências de hospedagem, Reforma BANTEC — implementação em andamento, Regras vigentes (+1 more)

### Community 50 - "ANDAMENTO.md"
Cohesion: 0.11
Nodes (15): Altura dos dados na rolagem — concluído (2026-10-31), Auditoria de cartas e dívida — progresso (2026-10-31), Cartões coloridos, avisos identificados e visibilidade das peças — concluído (2026-10-30), Dados mais baixos durante a rolagem — concluído (2026-10-31), Ferramentas DEV para testes de partida — concluído (2026-10-31), Motivo do encerramento explícito no resultado — em validação (2026-10-31), Playtest da Linha 0 — concluído (2026-10-31), Preparação de cartas pelo Modo DEV — implementação concluída; revisão manual parcial (2026-10-31) (+7 more)

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
Cohesion: 0.29
Nodes (6): Comparação de hospedagem — 2026-10-31, Configuração única pendente no painel, Contorno preparado, Deploy automático do Render, Fatos verificados, Segurança

### Community 57 - "Seletor de fichas de personagem"
Cohesion: 0.33
Nodes (5): Decisão de implementação, Fatos verificados, Pedido confirmado, Seletor de fichas de personagem, Validação e continuidade

### Community 58 - "roomClient.ts"
Cohesion: 0.40
Nodes (4): @colyseus/sdk@^0.18.8, @colyseus/sdk, resolveRoomServerUrl(), roomClient

### Community 59 - "Correção do painel de encerramento — 2026-10-31"
Cohesion: 0.25
Nodes (8): 2026-10-31 — Causa exibida no resultado final, 2026-10-31 — Encerramento por tempo no navegador, 2026-10-31 — Ferramenta DEV para preparar cartas, 2026-10-31 — Prazo de seleção após revelar uma carta, 2026-10-31 — Redução adicional da altura dos dados, Correção do painel de encerramento — 2026-10-31, Linha 0 e seleção de alvos no navegador — 2026-10-31, Nome Volta ao Brasil e cartas no navegador — 2026-10-31

### Community 60 - "Decisões do projeto"
Cohesion: 0.33
Nodes (6): Cidades, regiões e cores, Confirmadas e vigentes, Decisões do projeto, Histórico de decisões substituídas, Outras regras econômicas aprovadas, Propostas abertas e validações necessárias

### Community 61 - "spaceLabel.ts"
Cohesion: 0.60
Nodes (4): SpaceKind, fitSpaceLabel(), shouldRenderSpaceLabel(), wrapSpaceLabel()

### Community 62 - "HUD, cartas, dados e roleta"
Cohesion: 0.40
Nodes (4): Decisões confirmadas pelo pedido, Fatos verificados, HUD, cartas, dados e roleta, Implementação e validação

### Community 63 - "Zoom da câmera e destaque das fichas"
Cohesion: 0.40
Nodes (4): Decisão de implementação, Fatos, Validação, Zoom da câmera e destaque das fichas

### Community 65 - "Painel de compra, inspeção, controles e nitidez — 2026-10-30"
Cohesion: 0.33
Nodes (6): Aluguel ampliado, opções em tela cheia, emotes, hotel e sons de cantos — 2026-10-30, Compra depois de carta de avanço e piso sem texto — 2026-10-30, HUD de turno, atalhos e leitura do aluguel — 2026-10-30, Painel de compra, inspeção, controles e nitidez — 2026-10-30, Seleção de propriedades pelo tabuleiro — 2026-10-31, event()

### Community 68 - "playerEmotes.ts"
Cohesion: 0.53
Nodes (4): getPlayerEmoteSymbol(), isPlayerEmote(), PLAYER_EMOTES, PlayerEmote

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Andamento do projeto` connect `Andamento do projeto` to `ANDAMENTO.md`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Should `lobby.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Why does `AnimatedPawn()` connect `Board` to `Validação visual e de navegador`, `playerEmotes.ts`, `Andamento do projeto`, `sceneMaterials.ts`, `gameAudio.ts`, `Seletor de fichas de personagem`, `BoardScene.tsx`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Why does `Validação visual e de navegador` connect `Validação visual e de navegador` to `VALIDACAO.md`, `Andamento do projeto`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `GameRoom.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06190476190476191 - nodes in this community are weakly interconnected._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.02666666666666667 - nodes in this community are weakly interconnected._