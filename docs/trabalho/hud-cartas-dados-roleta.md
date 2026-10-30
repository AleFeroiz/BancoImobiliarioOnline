# HUD, cartas, dados e roleta

## Fatos verificados

- Pedido de 2026-10-29: cobrir todo o piso das casas Sorte com a roleta; trocar o painel genérico de rolagem por um botão simples; deixar resultado e dados nivelados visíveis durante o movimento do peão e então ocultá-los; apresentar cartas temporárias que fecham ao clique ou em até 15 segundos; revisar controles/seletores excessivos; mover dinheiro 3D do tabuleiro para perto dos cartões dos participantes na HUD.
- Estado inicial: `main` limpa e alinhada a `origin/main` no commit `07646a4`.
- `ChanceRoulette` hoje desenha um disco pequeno em uma quina sobre o piso dourado liso.
- O dado animado usa inclinações finais diferentes de zero, e os meshes só aparecem quando `turnPhase === 'rolling'`.
- A rolagem abre o cartão central de turno; os dados e a ação de lançar aparecem dentro dele.
- Cartas de Sorte usam `activeCardTitle`; a fase `resolve` termina pela ação `finishTurn` ou pelo prazo autoritativo de 15 segundos. Copa/Volta têm fases separadas e a escolha continua no tabuleiro.
- Os modelos de cédulas/prata/ouro hoje são vitrines de cena em quatro posições no centro da mesa, não elementos ao lado dos cartões DOM dos jogadores.
- Graphify `graph.json` existe, mas o MCP está ligado somente a `GustavoGLD/Hospital`; a consulta para `AleFeroiz/BancoImobiliarioOnline` falhou e o CLI `graphify` não está instalado.

## Decisões confirmadas pelo pedido

- Não alterar regras, temporização autoritativa ou resultado de jogadas no servidor.
- Cartas informativas podem ser dispensadas pelo clique/toque em qualquer ponto ou ao completar 15 segundos; dispensar uma carta de evento confirma a etapa `resolve`, e dispensar a apresentação da Copa/Volta deixa a escolha do tabuleiro ativa.
- O dinheiro 3D deve ficar junto dos cartões de jogador na camada de interface, mantendo seu vínculo ao saldo individual.
- A direção segue a mesa original low-poly, feltro verde, papel marfim e acentos por participante; as imagens são referência de hierarquia e apresentação.

## Implementação e validação

- `src/ui/rouletteFloor.ts` cobre o quadrado completo com oito setores; testes verificam área, limites e as quatro casas Sorte.
- `src/ui/dicePresentation.ts` limita a exibição à rolagem/movimento e nivela os três eixos. A cena exibe o total acima dos dados durante a caminhada.
- Cartões de revelação aceitam pointer/touch e teclado, fecham em 15 segundos; fechar evento de turno envia `finishTurn`, e Copa/Volta mantêm a escolha.
- Modelos GLB de ouro, prata e notas são ajustados para o cartão e anexados pela HUD; a camada usa orientação frontal para moedas/notas. Ícones facetados complementam os modelos para manter a leitura do saldo em cartões desktop e mobile.
- Seletores de parceiro, ritmo e imóveis deram lugar a botões; a seleção de vários imóveis continua múltipla por necessidade da negociação.
- `npm run verify` passou: 165 testes em 29 arquivos; builds do cliente e servidor passaram. `git diff --check` passou.
- Playtest no navegador local: partida real com três bots; botão e dados durante o movimento revisados em 690×880; cartões e moedas/notas/ouro, tabuleiro e botão revisados em 390×844. Os dados foram removidos depois da caminhada. Carta e Copa/Volta ainda precisam ser alcançadas para revisão visual; Graphify CLI não instalado e MCP apontando para repositório diferente.
