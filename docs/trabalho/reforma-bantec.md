# Reforma BANTEC — plano de trabalho

## Objetivo

Atualizar o jogo para um tabuleiro inspirado nas economias das cinco regiões brasileiras, modernizar sua apresentação e usar um modelo estilizado dos prédios da FATEC Itapetininga como peça central visual.

## Decisões e escopo aprovados

- Tabuleiro com 40 casas: 24 cidades (cinco no Norte, Centro-Oeste, Nordeste e Sudeste; quatro no Sul), quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos especiais.
- Percurso do menor ao maior PIB regional total: Norte → Centro-Oeste → Nordeste → Sul → Sudeste. Cidades seguem do menor ao maior PIB municipal dentro de cada região; São Paulo encerra a volta antes da Partida.
- Cores de piso por região e preços das 24 cidades conforme `docs/DECISOES.md`.
- Vitórias imediatas por Monopólio em Linha (seis cidades e companhia do lado), Monopólio Duplo Regional (duas regiões completas) ou posse das quatro companhias.
- Taxas proporcionais ao número de cidades e companhias do jogador; títulos entregues ao banco deixam de ser seus. Recompra custa 1,5× o investimento no imóvel, paga diretamente ao dono e não pode tomar imóvel com hotel.
- Durante dívida insuficiente, devolver um título ao banco paga 50% do preço e o libera para venda; não há título hipotecado ou resgate.
- Doze cartas autorais descritas em `docs/REGRAS-DE-JOGO.md`; Apagão e Proteção duram três turnos do dono. Terremoto devolve imóvel sem hotel ao banco livre de construções e sem compensação. Troca de posição não resolve as casas de chegada.
- O canto Volta ao Mundo passa a Volta ao Brasil e concede R$ 200.000 na chegada. Lobby com tempos de 15, 30 ou 60 minutos; Express removido.
- Nova identidade do jogo: BANTEC. Refazer a página inicial.
- No centro do tabuleiro, modelar **somente os prédios da FATEC Itapetininga** mostrados nas duas referências aéreas do usuário. O modelo deve ser low-poly, reconhecível e compacto; não precisa reproduzir o terreno, árvores, ruas, estacionamento ou veículos da foto. A arquitetura não cria uma casa jogável nem bloqueia o percurso.

## Propostas abertas e pendências

- Saldo inicial de R$ 2.000.000 foi aprovado pelo usuário como base atual do jogo; trata-se de um parâmetro que pode mudar após playtests de balanceamento.
- Proteção contra qualquer efeito de carta, inclusive Generoso, e descarte sem movimento da Cidade-sede quando não existe sede de Copa foram confirmados pelo usuário. Os quatro nomes atuais de companhias também foram mantidos a pedido do usuário.
- A identidade BANTEC, página inicial e tabuleiro da partida foram revisados em viewport móvel e desktop. Falta conferir venda de nível/devolução ao banco durante uma dívida real e completar a validação manual das cartas e condições de vitória.

## Linha de implementação

1. **Ficha de regras e dados:** estrutura regional, 24 cidades, ordem do tabuleiro, companhias, aluguéis, taxas, vitórias, duração, devolução, recompra e doze cartas estão definidos.
2. **Motor de regras e servidor:** os sistemas aprovados estão implementados e têm cobertura automatizada; a recompra, devolução, compra, pagamentos e efeitos de cartas/vitórias têm testes de integração. Falta percorrer esses fluxos pela interface durante uma partida manual.
3. **Prédios centrais:** modelo low-poly da FATEC Itapetininga criado no Blender 5.2.2 LTS e integrado como GLB; a captura desktop mostra a peça no centro sem ocupar o perímetro.
4. **Tabuleiro e HUD:** cidades, regiões, pisos, cartas, taxas, cantos, escada de aluguel, construção e corredor estão implementados. Tabuleiro e home foram revisados em desktop; carteira/inspetor em móvel; falta verificar ações de dívida.
5. **Página inicial:** identidade BANTEC, criação/entrada por sala, escolha de duração e visual brasileiro implementados. Revisão móvel e desktop feita após correção do cabeçalho de marca.
6. **Validação e publicação:** home, lobby, tabuleiro, compra e carteira foram revisados no navegador; a posição dos dados acima da FATEC também foi confirmada. A verificação automatizada final e a publicação desta rodada serão registradas em `docs/VALIDACAO.md`. Ainda falta o playtest manual de dívida e a conferência das cartas/vitórias pela interface.

## Estado atual — 2026-10-31

- Implementado em código: dados regionais do tabuleiro e cores, preços e fórmula de aluguel das cidades, taxas por quantidade de títulos, vitórias imediatas, seleção do tempo no lobby, escolha de cor, bônus de Volta ao Brasil e recompra forçada por 1,5×. A devolução de um título durante dívida já o libera para o banco.
- Asset criado no Blender 5.2.2 LTS e integrado: `assets/blender/fatec-itapetininga-buildings.blend` e `public/assets/fatec-itapetininga-buildings.glb`. O modelo usa somente três blocos e a torre central mostrados na segunda referência; não inclui terreno nem paisagismo. Sua escala e leitura foram revisadas no tabuleiro pelo navegador.
- A tela de bens foi aprimorada para exibir tipo, nível construído, preço e aluguel; a venda de hotel usa o valor correto. O usuário pode abrir a carteira por ação rápida e acessar o inspetor de cada imóvel. No playtest móvel, a carteira mostrou Rio Verde com duas casas e aluguel de R$ 90.000; o inspetor mostrou os níveis e bloqueou leilão de grupo construído.
- Falta testar visualmente as ações de venda/devolução em uma dívida real e percorrer as cartas e condições de vitória pela interface. A Cidade-sede sem sede e a Proteção contra Generoso estão aprovadas e cobertas por teste automatizado.
- `npm run verify` passou em 2026-10-31 com 228 testes em 44 arquivos, build frontend e build do servidor. A suíte Colyseus foi executada com loopback permitido; Vitest usou `.tmp` do repositório após erro EPERM no diretório temporário isolado do Windows. `npm run graphify -- update .` atualizou as fontes locais do grafo.
- Graphify local foi consultado e atualizado por `npm run graphify --`; rodar `npm run graphify -- update .` depois das mudanças de código.
- Preservar alterações locais dos assets `special-corners.blend` e `special-corners.blend1` fora do escopo.
