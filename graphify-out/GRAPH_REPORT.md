# Graph Report - BancoImobiliarioOnline  (2026-10-31)

## Corpus Check
- 129 files · ~87,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .glb 5, .blend 3, (none) 2)

## Summary
- 878 nodes · 1639 edges · 69 communities (64 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55712d4b`
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
- lobby.ts
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
- vitest
- Referências visuais da partida
- engines
- Regras do jogo
- CashHud.tsx
- BoardSceneCanvas
- gameAudio.ts
- Plano do jogo
- App
- boardInteraction.ts
- modelPlacement.ts
- BoardScene.tsx
- gameFeedback.ts
- cameraDrag.ts
- snapshotStability.ts
- VALIDACAO.md
- graphicsQuality.ts
- boardDecoration.ts
- dicePresentation.ts
- VALIDACAO.md
- scoreCriteria.ts
- Câmera por arraste e escolhas visuais
- Cena sem luzes e sombras
- Reforma BANTEC — plano de trabalho
- GameRoom
- playerEmotes.ts
- vite
- turnActivity.ts
- ANDAMENTO.md
- Medidor de FPS e playtest no Chrome
- Modelos low-poly e pisos diferenciados
- Otimização após relato de 2 FPS
- Otimização de renderização
- Polimento da cena e ferramentas DEV
- Deploy automático do Render
- Seletor de fichas de personagem
- roomClient.ts
- Decisões do projeto
- fpsMeter.ts
- Bairros em sequência e tema da Sorte
- dismissCardRevealOnPointerDown
- Zoom da câmera e destaque das fichas
- sceneLoading.ts
- getPawnStepPath
- app.config.ts
- Tabuleiro regional aprovado — implementação em andamento
- getLobbyPlayerEntries

## God Nodes (most connected - your core abstractions)
1. `App()` - 77 edges
2. `Validação visual e de navegador` - 64 edges
3. `GameRoom` - 48 edges
4. `vitest` - 42 edges
5. `Andamento do projeto` - 36 edges
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

## Communities (69 total, 5 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (13): MatchDuration, PropertyHolding, Mode, modeDetails, MoneyStepper(), Screen, SyncedPlayer, TradeOfferView (+5 more)

### Community 1 - "package.json"
Cohesion: 0.11
Nodes (24): devDependencies, @colyseus/testing@^0.18.6, @colyseus/tools@^0.18.11, husky@^9.1.7, tsx@^4.23.15, @types/node@^24.19.2, @types/react@^19.1.10, @types/react-dom@^19.1.7 (+16 more)

### Community 2 - "GameRoom.ts"
Cohesion: 0.08
Nodes (49): chooseBotAuctionBid(), shouldBotBuyProperty(), createRoomCode(), LobbyState, PropertyState, getLineTitleIds(), EVENT_CARDS, EventCard (+41 more)

### Community 3 - "Validação visual e de navegador"
Cohesion: 0.03
Nodes (61): 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão, 2026-10-27 — Chrome: dívida, sala e layout responsivo, 2026-10-27 — Chrome: estado de construções, 2026-10-27 — Chrome: hipoteca, resgate e carteira, 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra, 2026-10-27 — Encerramento Express e placar final, 2026-10-27 — Lobby de sala, 2026-10-27 — Negociação entre participantes (+53 more)

### Community 4 - "Board"
Cohesion: 0.16
Nodes (15): Zoom da câmera e destaque das fichas — implementação validada (2026-10-29), Fatos verificados, 2026-10-28 — Dinheiro 3D e leitura de casas (em andamento), positionOnBoard(), AnimatedDie(), AnimatedPawn(), Board(), ChanceRoulette() (+7 more)

### Community 5 - "graphify.mjs"
Cohesion: 0.11
Nodes (13): [command, ...args], graphifyBinDir, graphifyExecutable, projectRoot, stylesheet, GAME_BACKGROUND_LIGHT, GAME_BACKGROUND_NIGHT, getGameBackgroundColor() (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 7 - "Andamento do projeto"
Cohesion: 0.05
Nodes (43): Aluguéis 3D, opções em tela inteira, emotes e sons de chegada — implementação concluída (2026-10-30), Andamento do projeto, Correção do desempenho baixo — implementação validada localmente (2026-10-29), Correções de casas e interações — concluído (2026-10-29), Correções de compra, prisão e origens 3D — concluído (2026-10-30), Estado observado — 2026-10-28, Frente atual — fichas de veículo no lobby (2026-10-29), Frente atual — sons de dinheiro, ajuda e prazo de turno (2026-10-28) (+35 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "steps"
Cohesion: 0.09
Nodes (21): RENDER_DEPLOY_HOOK_URL, jobs, verify, name, on, pull_request, push, workflow_dispatch (+13 more)

### Community 10 - "lobby.ts"
Cohesion: 0.21
Nodes (9): CHARACTER_OPTIONS, CharacterType, isCharacterType(), LobbyPlayer, LobbyStatus, isPlayerColor(), PLAYER_COLOR_NAMES, PLAYER_COLORS (+1 more)

### Community 11 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, rootDir (+5 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (12): dependencies, @colyseus/schema@^5.0.42, react@^19.1.0, react-dom@^19.1.0, @react-three/drei@^10.5.1, @react-three/fiber@^9.3.0, three@^0.179.1, @colyseus/schema (+4 more)

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

### Community 22 - "vitest"
Cohesion: 0.10
Nodes (27): vitest, BoardSpace, boardSpaces, cities, City, cityIds, companyIds, companySpaces (+19 more)

### Community 23 - "Referências visuais da partida"
Cohesion: 0.15
Nodes (13): Aplicação e limites, Apresentação por momento, Capturas de referência por estado, Composição, Direção visual para o nosso jogo, Fontes consultadas, Inventário de telas consultadas, Leitura visual das capturas (+5 more)

### Community 24 - "engines"
Cohesion: 0.30
Nodes (5): allowScripts, esbuild@0.28.2, engines, node, npm

### Community 25 - "Regras do jogo"
Cohesion: 0.18
Nodes (11): Baralho Sorte ou Revés da reforma, Ciclo básico implementado, Clássico Rápido — 30 minutos, Economia inicial implementada, Express — cerca de 8 a 16 minutos, Fora do que está especificado, Referência histórica: Express, Regras anteriores em retirada (+3 more)

### Community 26 - "CashHud.tsx"
Cohesion: 0.14
Nodes (23): three, CashHudOverlay, CashHudCamera(), CashHudOverlay, CashHudOverlayScene(), CashHudScene(), CashHudStack(), cashModelNames (+15 more)

### Community 27 - "BoardSceneCanvas"
Cohesion: 0.21
Nodes (8): BoardSceneCanvas(), CameraZoomBounds(), FrameRateProbe(), ResponsiveCamera(), CameraFraming, getCameraFraming(), CameraZoomLimits, getCameraZoomLimits()

### Community 28 - "gameAudio.ts"
Cohesion: 0.18
Nodes (20): GameAudioEffectStyle, getAudioContext(), getBackgroundMusicFrequency(), getGameAudioEffectStyle(), musicOscillators, musicPhrase, musicScale, playAirplanePass() (+12 more)

### Community 29 - "Plano do jogo"
Cohesion: 0.22
Nodes (9): Arquitetura confirmada, Experiência, Fases de produção, Limites do MVP, Plano do jogo, Referências de hospedagem, Reforma regional BANTEC — implementação em andamento, Regras vigentes (+1 more)

### Community 30 - "App"
Cohesion: 0.11
Nodes (12): App(), dismissTransientReveal(), handleTransientRevealPointerDown(), stepAuctionBid(), BoardScene, CharacterIcon(), durationLabel(), formatClock() (+4 more)

### Community 31 - "boardInteraction.ts"
Cohesion: 0.40
Nodes (4): handleSelectSpace(), BoardChoicePhase, BoardSpaceInteraction, getBoardSpaceInteraction()

### Community 32 - "modelPlacement.ts"
Cohesion: 0.50
Nodes (6): AnimatedBuilding(), Bounds3, getBuildingInnerEdgeOffset(), getBuildingRentLabelPosition(), getCenteredModelPlacement(), getModelFootprintDepth()

### Community 33 - "BoardScene.tsx"
Cohesion: 0.15
Nodes (14): AnimationSpeed, BUILDING_ANIMATION_DURATION_MS, LANDING_PULSE_DURATION_MS, areScenePropsEqual(), BoardSceneProps, CameraOrbitControls, dicePips, PlayerToken (+6 more)

### Community 34 - "gameFeedback.ts"
Cohesion: 0.24
Nodes (12): CashChange, CashChangeToast(), CashChangeToastProps, formatCashDelta(), getCashChangeTone(), getCashToastPlacement(), getGameSound(), getLandingSpecialSound() (+4 more)

### Community 35 - "cameraDrag.ts"
Cohesion: 0.50
Nodes (3): CameraDragAnywhere(), CameraDragStart, shouldStartCameraDrag()

### Community 36 - "snapshotStability.ts"
Cohesion: 0.80
Nodes (3): areNumberPairsEqual(), areRecordArraysEqual(), areRecordMapsEqual()

### Community 37 - "VALIDACAO.md"
Cohesion: 0.33
Nodes (6): Aluguel ampliado, opções em tela cheia, emotes, hotel e sons de cantos — 2026-10-30, Compra depois de carta de avanço e piso sem texto — 2026-10-30, HUD de turno, atalhos e leitura do aluguel — 2026-10-30, Painel de compra, inspeção, controles e nitidez — 2026-10-30, SpaceLabel(), event()

### Community 38 - "graphicsQuality.ts"
Cohesion: 0.60
Nodes (3): DEFAULT_GRAPHICS_QUALITY, getGraphicsDprRange(), GraphicsQuality

### Community 39 - "boardDecoration.ts"
Cohesion: 0.48
Nodes (5): BOARD_SURFACE_Y, BoardSpaceDecoration, BUILDING_GROUP_Y, BUILDING_MODEL_Y_OFFSET, getBoardSpaceDecoration()

### Community 40 - "dicePresentation.ts"
Cohesion: 0.33
Nodes (7): DICE_PRESENTATION_POSITIONS, DICE_RESULT_BADGE_POSITION, DicePosition, DicePresentationPhase, DiceRotation, getDiceRollRotation(), shouldShowRolledDice()

### Community 41 - "VALIDACAO.md"
Cohesion: 0.29
Nodes (3): 2026-10-30 — Cartões do jogador, lance de leilão e airport GLB, 2026-10-30 — Pop-up de saldo, modo DEV no lobby e aluguel das estações, Perfil, propostas, sons e rolagem de aluguel — 2026-10-30

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

### Community 47 - "playerEmotes.ts"
Cohesion: 0.53
Nodes (4): getPlayerEmoteSymbol(), isPlayerEmote(), PLAYER_EMOTES, PlayerEmote

### Community 48 - "vite"
Cohesion: 0.40
Nodes (4): vite@^7.1.3, @vitejs/plugin-react@^5.0.2, vite, @vitejs/plugin-react

### Community 49 - "turnActivity.ts"
Cohesion: 0.48
Nodes (5): ActivityPhase, getTurnActivityLabel(), shouldShowTurnCard(), shouldSuppressTurnCardForFeedback(), shouldSuppressTurnCardForSpaceSelection()

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

### Community 59 - "Decisões do projeto"
Cohesion: 0.29
Nodes (7): Base de regras Express, Confirmadas, Decisões do projeto, Detalhes de implementação que ainda serão calibrados, Histórico, Propostas abertas, Reforma do tabuleiro aprovada — implementação parcial

### Community 60 - "fpsMeter.ts"
Cohesion: 0.24
Nodes (10): createFrameRateAccumulator(), FPS_IDLE_AFTER_MS, FPS_SAMPLE_WINDOW_MS, FrameRateAccumulator, FrameRateDisplay, FrameRateReading, readFrameRate(), recordRenderedFrame() (+2 more)

### Community 61 - "Bairros em sequência e tema da Sorte"
Cohesion: 0.40
Nodes (4): Bairros em sequência e tema da Sorte, Fatos verificados — 2026-10-29, Perguntas abertas, Próximo passo

### Community 63 - "Zoom da câmera e destaque das fichas"
Cohesion: 0.40
Nodes (4): Decisão de implementação, Fatos, Validação, Zoom da câmera e destaque das fichas

### Community 66 - "app.config.ts"
Cohesion: 0.33
Nodes (5): @colyseus/core@^0.18.23, @colyseus/ws-transport@^0.18.4, @colyseus/core, @colyseus/ws-transport, server

### Community 67 - "Tabuleiro regional aprovado — implementação em andamento"
Cohesion: 0.67
Nodes (3): Composição vigente do tabuleiro, Rolagem de dados, Tabuleiro regional aprovado — implementação em andamento

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AnimatedPawn()` connect `Board` to `modelPlacement.ts`, `BoardScene.tsx`, `getPawnStepPath`, `GameRoom`, `playerEmotes.ts`, `Seletor de fichas de personagem`, `CashHud.tsx`, `gameAudio.ts`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Why does `Andamento do projeto` connect `Andamento do projeto` to `ANDAMENTO.md`, `Board`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Why does `Validação visual e de navegador` connect `Validação visual e de navegador` to `VALIDACAO.md`, `Board`, `Andamento do projeto`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Should `GameRoom.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08283730158730158 - nodes in this community are weakly interconnected._
- **Should `Validação visual e de navegador` be split into smaller, more focused modules?**
  _Cohesion score 0.03278688524590164 - nodes in this community are weakly interconnected._