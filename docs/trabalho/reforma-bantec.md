# Reforma BANTEC — plano de trabalho

## Objetivo

Atualizar o jogo para um tabuleiro inspirado nas economias das cinco regiões brasileiras, modernizar sua apresentação e usar um modelo estilizado dos prédios da FATEC Itapetininga como peça central visual.

## Decisões e escopo aprovados

- Tabuleiro com 40 casas: 24 cidades (cinco no Norte, Centro-Oeste, Nordeste e Sudeste; quatro no Sul), quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos especiais.
- Percurso do menor ao maior PIB regional total: Norte → Centro-Oeste → Nordeste → Sul → Sudeste. Cidades seguem do menor ao maior PIB municipal dentro de cada região; São Paulo encerra a volta antes da Partida.
- Cores de piso por região e preços das 24 cidades conforme `docs/DECISOES.md`.
- Vitórias imediatas por Monopólio em Linha (seis cidades e companhia do lado), Monopólio Duplo Regional (duas regiões completas) ou posse das quatro companhias.
- Taxas proporcionais ao número de cidades e companhias do jogador; títulos entregues ao banco deixam de ser seus. Recompra custa 1,5× o investimento no imóvel, paga diretamente ao dono e não pode tomar imóvel com hotel. A sequência aprovada em 2026-10-31 cobra primeiro o aluguel e só depois oferece recompra se restar saldo suficiente.
- Durante dívida insuficiente, devolver um título ao banco paga 50% do preço e o libera para venda; não há título hipotecado ou resgate.
- Doze cartas autorais descritas em `docs/REGRAS-DE-JOGO.md`; Apagão e Proteção duram três turnos do dono. Terremoto devolve imóvel sem hotel ao banco livre de construções e sem compensação. Troca de posição não resolve as casas de chegada.
- Volta ao Brasil concede R$ 200.000 na chegada. Lobby com tempos de 15, 30 ou 60 minutos; Express removido.
- Nova identidade do jogo: BANTEC. Refazer a página inicial.
- No centro do tabuleiro, modelar **somente os prédios da FATEC Itapetininga** mostrados nas duas referências aéreas do usuário. O modelo deve ser low-poly, reconhecível e compacto; não precisa reproduzir o terreno, árvores, ruas, estacionamento ou veículos da foto. A arquitetura não cria uma casa jogável nem bloqueia o percurso.

## Propostas abertas e pendências

- Saldo inicial de R$ 2.000.000 foi aprovado pelo usuário como base atual do jogo; trata-se de um parâmetro que pode mudar após playtests de balanceamento.
- Proteção contra qualquer efeito de carta, inclusive Generoso, e descarte sem movimento da Cidade-sede quando não existe sede de Copa foram confirmados pelo usuário. Os quatro nomes atuais de companhias também foram mantidos a pedido do usuário.
- A identidade BANTEC, página inicial e tabuleiro da partida foram revisados em viewport móvel e desktop. Em 2026-10-31, a dívida foi liquidada pela interface, as quatro companhias e as duas vitórias por monopólio exibiram o painel final, e o fim por tempo e por insolvência foram vistos, incluindo a causa da falência. A recompra forçada foi confirmada pela interface, sem aceite do dono e com transferência do pagamento. As 12 cartas foram percorridas visualmente: além dos quatro efeitos iniciais, confirmei Sede da Copa, Cidade-sede, Proteção em Fortaleza (três turnos), Ladrão (R$ 200.000 pagos após a dívida) e Troca-troca sem resolver as casas de chegada; Prisão, Volta ao Brasil e Vá para o início já estavam registrados em validações anteriores.
- O usuário escolheu Render em 2026-10-31 por simplicidade. O serviço existente está documentado como Free e vinculado ao repositório, mas é necessário confirmar o estado atual no painel e configurar o deploy após CI; o plano Free pode dormir e não é indicado para produção. Não houve autorização para upgrade pago; custo e nível de serviço devem ser confirmados antes de uso contínuo. Instruções e fontes estão em `docs/DECISOES.md` e `docs/trabalho/render-auto-deploy.md`.
- Para a revisão manual, o Modo DEV permite preparar a próxima carta. Generoso transferiu Manaus para Bot 1; Aniversário transferiu R$ 50.000; Apagão suspendeu o aluguel por três turnos e uma chegada posterior não cobrou aluguel; Terremoto devolveu Manaus ao banco. A revisão visual das 12 cartas foi concluída e consolidada em `docs/VALIDACAO.md`.

## Linha de implementação

1. **Ficha de regras e dados:** estrutura regional, 24 cidades, ordem do tabuleiro, companhias, aluguéis, taxas, vitórias, duração, devolução, recompra e doze cartas estão definidos.
2. **Motor de regras e servidor:** os sistemas aprovados estão implementados e têm cobertura automatizada; a recompra, devolução, compra, pagamentos e efeitos de cartas/vitórias têm testes de integração. A dívida, as três condições de vitória, o fim por tempo e um painel após insolvência foram verificados na interface. O servidor agora informa a causa de encerramento ao placar final; revisar o novo texto na interface após cada causa.
3. **Prédios centrais:** modelo low-poly da FATEC Itapetininga criado no Blender 5.2.2 LTS e integrado como GLB; a captura desktop mostra a peça no centro sem ocupar o perímetro.
4. **Tabuleiro e HUD:** cidades, regiões, pisos, cartas, taxas, cantos, escada de aluguel, construção e corredor estão implementados. Tabuleiro e home foram revisados em desktop; carteira/inspetor em móvel; a seleção de imóveis e a venda de construções durante uma dívida foram verificadas em partida real.
5. **Página inicial:** identidade BANTEC, criação/entrada por sala, escolha de duração e visual brasileiro implementados. Revisão móvel e desktop feita após correção do cabeçalho de marca.
6. **Validação e publicação:** home, lobby, tabuleiro, compra, carteira, dívida, todas as vitórias imediatas, encerramentos por tempo/falência, recompra forçada, teleporte DEV para qualquer casa e as 12 cartas foram vistos no navegador; a posição dos dados acima da FATEC também foi confirmada. A recompra de Manaus com três casas custou R$ 2.437.500 (1,5× R$ 1.625.000) e transferiu o dinheiro diretamente ao dono anterior. A causa do fim por falência foi inferida do único título com aluguel ativo e do saldo zerado do bot; a tela final não explica o motivo. Permanecem os playtests humanos de equilíbrio/ritmo e a decisão de hospedagem.

## Playtest de compras e aluguel — 2026-10-31

- Em uma nova sala local de 30 minutos, o anfitrião começou com R$ 2.000.000, comprou Belém por R$ 350.000 e viu aluguel de R$ 35.000. O bot caiu no imóvel e pagou esse valor.
- O anfitrião recebeu R$ 200.000 ao passar pela Partida e comprou Manaus por R$ 650.000, terminando o trecho com R$ 1.200.000. O bot comprou Aviação Brasil e Recife com uma casa; após parar em Rio Verde, seu saldo foi exibido como R$ 1.437.500, mas a posse do título não foi inspecionada.
- A sessão confirmou compra pela interface, prévia de aluguel, pagamento e bônus da Partida; não chegou a uma vitória.
- Próxima tentativa: começar uma sala nova e concluir uma condição de vitória pela interface. Monopólio Duplo Regional, falência e cartas restantes continuam pendentes de revisão visual.

## Estado atual — 2026-10-31

- Implementado em código: dados regionais do tabuleiro e cores, preços e fórmula de aluguel das cidades, taxas por quantidade de títulos, vitórias imediatas, seleção do tempo no lobby, escolha de cor, bônus de Volta ao Brasil e recompra forçada por 1,5×. A devolução de um título durante dívida já o libera para o banco.
- Asset criado no Blender 5.2.2 LTS e integrado: `assets/blender/fatec-itapetininga-buildings.blend` e `public/assets/fatec-itapetininga-buildings.glb`. O modelo usa somente três blocos e a torre central mostrados na segunda referência; não inclui terreno nem paisagismo. Sua escala e leitura foram revisadas no tabuleiro pelo navegador.
- A tela de bens foi aprimorada para exibir tipo, nível construído, preço e aluguel; a venda de hotel usa o valor correto. O usuário pode abrir a carteira por ação rápida e acessar o inspetor de cada imóvel. No playtest móvel, a carteira mostrou Rio Verde com duas casas e aluguel de R$ 90.000; o inspetor mostrou os níveis e bloqueou leilão de grupo construído.
- A dívida foi liquidada em partida real; a vitória pelas quatro companhias também abriu o painel final. As três vitórias por monopólio, falência e fim do relógio têm testes de integração. A Cidade-sede sem sede e a Proteção contra Generoso também estão cobertas por teste automatizado.
- O hook de pré-commit passou em 2026-10-31 com 236 testes em 46 arquivos e os builds do frontend e servidor; a publicação está documentada em `docs/VALIDACAO.md`. O chunk de cena 3D acima de 500 KB continua como aviso conhecido.
- Graphify local foi consultado e atualizado por `npm run graphify --`; rodar `npm run graphify -- update .` depois das mudanças de código.
- Próximo passo: revisar visualmente as cartas restantes. O teleporte DEV escolhe diretamente qualquer casa das 40, sem percorrer as casas intermediárias nem receber bônus por passar pela Partida; ao chegar, resolve o efeito normal daquele destino. A recompra forçada já foi exercida pela interface. Se for necessária evidência explícita da causa da falência, repetir o cenário capturando o aviso de insolvência antes do painel final.
- Preservar alterações locais dos assets `special-corners.blend` e `special-corners.blend1` fora do escopo.
