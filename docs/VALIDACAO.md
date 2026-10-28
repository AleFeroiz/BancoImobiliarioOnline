# Validação visual e de navegador

## 2026-10-28 — Referências de Business Tour e entrada da mesa

- Consultei a [página oficial da Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/), a [galeria Interface In Game](https://interfaceingame.com/games/business-tour/) e a [listagem de capturas do SteamDB](https://steamdb.info/app/397900/screenshots/). A página e a galeria mostram a variedade de estados: mesa privada, tabuleiro, rolagem, venda de propriedade, falta de dinheiro e placar. A galeria é histórica; usei-a para mapear apresentações, e as capturas da Steam para comparar a mesa pública atual.
- A tela de entrada estava com a cena 3D muito apagada e os modos apresentados como abas sublinhadas. Aumentei a presença e a saturação do tabuleiro ao fundo e transformei os modos em cartões selecionáveis, mantendo texto e controles próprios.
- Revisei capturas no Google Chrome headless em 1440 × 900 e 390 × 844. A mesa e os peões ficaram mais visíveis no desktop; em celular, o formulário e os dois modos couberam na largura da tela sem corte horizontal aparente.
- Capturas revisadas: `/tmp/banco-visual-audit-before.png`, `/tmp/banco-visual-audit-after-desktop.png` e `/tmp/banco-visual-audit-after-mobile.png`. O Chrome usou renderização WebGL por software neste ambiente.
- A validação cobre a tela de entrada; lobby e estados da partida não foram alterados nesta revisão.

## 2026-10-28 — Segundo balanço dos objetivos Express

- A simulação anterior de 80 partidas indicou baixa ocorrência para completar grupos, construir e possuir duas estações. Substituí essas metas por quatro propriedades, uma estação, receber/pagar aluguel, tirar uma carta e cruzar a Partida; as duas metas mais simples de posse foram mantidas.
- Os testes de integração confirmam que cruzar a Partida conta junto do bônus de passagem, cartas e aluguéis atualizam somente a carta privada correspondente, e um aluguel em dívida só progride após a quitação integral.
- Os objetivos permanecem no servidor fora do estado público da sala e continuam pagando uma única vez. A suíte direcionada passou: `shared/objectives.test.ts` e `server/test/GameRoom.test.ts` (38 testes no total).
- Ainda falta repetir a simulação Monte Carlo com o novo baralho e fazer playtests humanos direcionados antes de considerar os bônus calibrados.

## 2026-10-28 — Dados no centro da partida

- Abri uma partida Clássico com duas sessões Chrome headless conectadas ao mesmo servidor Colyseus. A pessoa anfitriã lançou os dados e ambos os clientes receberam o mesmo resultado e o mesmo imóvel alcançado.
- O resultado dos dados aparece no espaço central da mesa, enquanto preço e ações continuam no cartão inferior; removi a repetição dos dados pequenos nesse cartão. O painel do turno e os dados permaneceram legíveis em 1440 × 900.
- A segunda sessão foi iniciada em viewport móvel de 390 × 844 antes de entrar na sala. O tabuleiro coube no enquadramento, os cartões dos dois jogadores ficaram no topo, o resultado permaneceu central e não houve overflow horizontal (`scrollWidth === innerWidth`).
- Capturas revisadas: `/tmp/banco-ui-game-desktop.png` e `/tmp/banco-ui-game-mobile.png`. A revisão visual foi feita com Chrome headless e WebGL por software; avisos de fallback do renderer são esperados nesse ambiente. Esta passagem não incluiu Firefox.

## 2026-10-28 — Estrutura do tabuleiro e balanço Express

- Os testes de regressão falharam antes da correção: só havia 19 nomes residenciais únicos para 24 casas, as propriedades repetiam nomes e as cores formavam grupos desiguais; o objetivo de grupo tinha alvo 2 em vez de apontar para um grupo residencial de custo mínimo.
- Corrigi o mapeamento para 24 ruas únicas distribuídas em oito grupos de três e fiz o objetivo de grupo acompanhar o grupo com menor custo total. Os testes locais do tabuleiro e dos objetivos passaram depois da mudança.
- Rodei 80 partidas completas pelo servidor autoritativo: 40 com duas pessoas e 40 com quatro, total de 240 cartas de objetivo distribuídas e sem falências. Os clientes simulados compraram ruas até manter R$ 200.000 de reserva, construíram quando o grupo estava completo e não negociaram.
- A conclusão observada foi: primeira propriedade 24/24 (100%); três propriedades 18/27 (67%); cinco propriedades 3/35 (9%); duas estações 2/30 (7%); grupo mais barato 0/28; construir um nível 0/37; três níveis 0/32; hotel 0/27. A média de caixa final foi R$ 744.396, mediana R$ 745.000 e ninguém faliu.
- Depois da correção, repeti o playtest visual de quatro clientes Chrome: os quatro chegaram à rodada 2/6 sincronizados. Revisei o tabuleiro atualizado em 1280 × 720 e 390 × 844; as ruas agora exibem títulos distintos e o documento móvel continua sem overflow. Capturas revisadas: `/tmp/banco-four-player-desktop.png` e `/tmp/banco-four-player-mobile.png`.
- A simulação confirma a integridade do fluxo, mas mostra que cinco objetivos continuam raros sob uma estratégia simples sem negociações. Não considero os bônus calibrados: falta avaliar objetivos com pessoas jogando intencionalmente para cumpri-los.

## 2026-10-28 — Partida Express com quatro jogadores

- Abri uma sala Express com quatro clientes Chrome headless (via Chrome DevTools Protocol), em viewport desktop de 1280 × 720. Os quatro nomes apareceram no lobby e a anfitriã iniciou a partida.
- Concluí o primeiro ciclo com ações reais dos quatro participantes. Cada cliente recebeu os quatro cartões, o mesmo jogador ativo e a mesma indicação de rodada 2/6; nenhum documento excedeu 1280 × 720.
- Em 390 × 844, os quatro cartões ficaram em duas colunas dentro do viewport (x=9–381, y=98–201), a mesa inteira permaneceu visível e a página continuou sem rolagem horizontal ou vertical.
- Capturas revisadas: `/tmp/banco-four-player-desktop.png` e `/tmp/banco-four-player-mobile.png`. A validação é headless e confirma o layout/render da cena, mas não substitui um teste manual em Chrome gráfico ou em aparelhos físicos.

## 2026-10-28 — Pesquisa visual e tela inicial

- Pesquisei a página oficial de *Business Tour* na Steam e a galeria Interface In Game, que cataloga menu principal, mesa privada, tabuleiro, rolagem, venda de cidade, dinheiro insuficiente e placar final. As imagens da galeria são históricas (2017); usei-as para entender a apresentação por estado e a página da Steam para conferir a composição pública atual da partida.
- A comparação mostrou que a tela de entrada deste projeto ainda tinha fundo azul-marinho e cartão escuro, enquanto lobby e partida já usavam superfícies claras. Apliquei à entrada uma paleta de feltro verde claro e papel marfim, acentos verde/ouro, campos claros e botão principal verde. Marca, textos, tipografia e arte continuam próprios.
- Inspecionei a tela inicial no navegador integrado em viewport móvel de 434 × 800. A mudança ficou legível e coerente com o lobby; não observei corte horizontal. O conteúdo da entrada é mais alto que esse viewport, portanto há rolagem vertical normal para alcançar o rodapé.
- O uso de capturas ficou restrito à pesquisa e documentação; nenhuma imagem da referência foi adicionada ao produto.

## 2026-10-27 — Lobby de sala

- Captura antes do ajuste: cartão de sala e coluna decorativa excediam a altura útil da janela; a coluna usava avatares fixos sem relação com os jogadores conectados.
- Captura depois do ajuste no navegador integrado do Codex, em viewport de aproximadamente 784 × 800: cartão centralizado, sem rolagem vertical visível, paleta clara inspirada em papel e feltro, e lugares ocupados ligados aos nomes reais da sala.
- Firefox não estava disponível entre os navegadores conectados à ferramenta nesta sessão. A captura é do navegador integrado e não deve ser tratada como validação específica do Firefox.
- Na captura inicial desta sessão, a automação visual pelo navegador integrado não concluiu o clique para iniciar; depois o mesmo fluxo foi exercitado no Chrome em dois clientes, conforme a seção abaixo.

## 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra

- O Chrome do sistema não apareceu na ponte visual do Codex. Para validar o navegador solicitado, foi aberta uma sessão local do Google Chrome headless em 1280 × 900 e controlada pelo Chrome DevTools Protocol.
- O cliente criou a sala, um segundo cliente entrou pelo código e a sala exibiu 2/4 jogadores. A partida iniciou nos dois clientes e ambos mostraram o saldo inicial de R$ 1.500.000.
- A primeira rolagem chegou a uma propriedade; a ação de compra debitou R$ 140.000 do jogador ativo e ambos os clientes permaneceram sincronizados. A captura da sala e a captura após compra foram inspecionadas visualmente.
- A janela do lobby ficou contida no viewport e apresentou código, assentos e nomes de jogador reais. A tela da partida exibiu tabuleiro 3D, HUD dos dois jogadores, valores e painel de turno sem erro visível.
- A validação foi headless; não substitui a inspeção manual do Chrome gráfico do usuário nem valida outros tamanhos de viewport. Os testes de integração automatizados também cobrem a recusa da compra e o leilão.

## 2026-10-27 — Chrome: estado de construções

- Após adicionar os níveis de construção ao estado sincronizado, criei uma sala com dois clientes Chrome, iniciei a partida e confirmei os saldos dos dois jogadores e ausência de exceções JavaScript.
- Renderizei no Chrome uma cena 3D temporária com três casas e um hotel para revisar a escala e leitura sobre o tabuleiro; a cena mostrou as construções sem encobrir as peças. Os arquivos temporários de QA foram removidos.
- A suíte automatizada agora cobre grupo completo, equilíbrio de níveis, saldo para construir, limite de hotel, estações sem construção e validação autoritativa do servidor.

## 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão

- Usei o Google Chrome do sistema em sessão headless via Chrome DevTools Protocol, com dois clientes conectados à mesma sala Colyseus, no viewport de 1280 × 900.
- Avancei a partida até sair uma carta de crédito; o título, a descrição e o novo saldo apareceram para os dois clientes sem exceções JavaScript. Depois, avancei até a prisão e conferi o estado preso no HUD.
- Na vez da pessoa presa, confirmei que “Tentar duplas” e “Pagar fiança” ficam ativos apenas para o cliente da vez. Cliquei para pagar a fiança: ambos os clientes mostraram o jogador fora da prisão, com saldo reduzido em R$ 50.000, e a ação “Lançar dados” disponível.
- A captura da tela de prisão e dos controles após pagar a fiança foi revisada. A validação cobre a renderização no Chrome e a sincronização básica dessas ações; a geração aleatória foi coberta pela suíte de regras e integração, não forçada por automação de interface.

## 2026-10-27 — Chrome: hipoteca, resgate e carteira

- No Chrome headless do sistema, em 1280 × 900, dois clientes criaram e entraram na mesma sala, iniciaram a partida, compraram Colina Verde por R$ 200.000, hipotecaram por R$ 100.000 e resgataram por R$ 110.000.
- O segundo cliente viu o marcador visual aparecer sobre o título hipotecado e desaparecer após o resgate; os saldos e a descrição da ação também foram sincronizados. O painel de carteira é recolhido por padrão, legível e não cobre o centro do tabuleiro.
- A inspeção encontrou um erro de arredondamento no resgate de R$ 121.001 para um título de R$ 220.000. O cálculo foi alterado para aritmética inteira; o teste de regressão agora exige R$ 121.000. A suíte cobre ainda autorização do dono/vez, cobrança, resgate, ausência de aluguel e bloqueio por construções no grupo.

## 2026-10-27 — Chrome: dívida, sala e layout responsivo

- O Google Chrome headless foi controlado por Chrome DevTools Protocol porque a ponte do Codex lista apenas o navegador interno. Duas abas criaram e ocuparam a mesma sala, iniciaram a partida e executaram compra, hipoteca e resgate com estado sincronizado; não houve erros de console.
- Revisei capturas da sala e da partida em 1280 × 900. Ajustei a transparência do tabuleiro atrás da sala e do HUD, aumentei a leitura dos textos e troquei a faixa diagonal sem função no centro do tabuleiro por um pequeno jardim circular.
- Em viewport móvel de 390 × 844, a partida não apresentou rolagem horizontal nem conteúdo maior que a tela.
- Os testes automatizados cobrem dívida acima do saldo sem cobrança parcial, liquidação por hipoteca, falência com transferência de saldo e título hipotecado, fim de partida com uma pessoa solvente e bloqueio de construção em grupo hipotecado.

## 2026-10-27 — Referência visual e HUD da partida

- Revisei a página oficial de *Business Tour* na [Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/) e a captura oficial da galeria: tabuleiro inclinado no centro, informações dos quatro jogadores nos cantos, saldo em destaque, cores por grupo de propriedades e ação contextual próxima da área de jogo.
- Adaptei a hierarquia com identidade própria: cartões de jogadores nas bordas, estado e ação em painel separado, casas com nome e preço, cores e materiais próprios. Nenhuma marca, arte ou tela foi copiada.
- No Google Chrome, criei uma sala com dois clientes, iniciei a partida e inspecionei a composição em 1280 × 900. Corrigi a colisão dos cartões do HUD com a marca superior.
- No Chrome, revisei a partida em 390 × 844: cartões em duas colunas, tabuleiro mais enquadrado e nenhuma rolagem horizontal ou vertical.
- A primeira execução dentro do sandbox bloqueou o bind local do teste Colyseus na porta 2568 (`EPERM`). Reexecutei `npm run verify` com rede local autorizada: 27 testes passaram, e os builds web e do servidor terminaram com sucesso.
- O build ainda informa que o bundle principal supera 500 kB minificados; o aviso não impediu a compilação e já era uma limitação do pacote 3D.

## 2026-10-27 — Negociação entre participantes

- No Chrome, em 1280 × 900, dois clientes entraram na mesma sala. Depois de compras reais, a pessoa da vez ofereceu R$ 50.000 por um imóvel da outra pessoa; o destinatário aceitou. No teste final, os saldos passaram de R$ 1.360.000 para R$ 1.310.000 e de R$ 1.300.000 para R$ 1.350.000; a quantidade de imóveis passou de 1/1 para 2/0.
- A captura `/tmp/banco-chrome-trade.png` foi revisada após a troca: os dois jogadores, os saldos e a mensagem de aceite aparecem sem erro de console.
- Em 390 × 844, o formulário de proposta ficou dentro do viewport (x=10, largura=370, y=468, altura=332); o documento continuou em 390 × 844, sem rolagem.
- `npm run verify`: 31 testes passaram em 3 arquivos; build web e build do servidor passaram. Testes cobrem as janelas de 45/40 segundos, troca simultânea de saldo e títulos, hipotecas preservadas, expiração, saldo insuficiente ao aceitar, uma oferta por sala, autorização do destinatário, títulos sem dono e construções no título ou no grupo.
- O build mantém o aviso conhecido de bundle principal acima de 500 kB minificados.

## 2026-10-27 — Relógios e encerramento no Chrome

- Em dois clientes Chrome conectados à mesma sala, o relógio Express foi de 40 para 37 segundos nos dois clientes, e o Clássico foi de 30:00 para 29:57 sem divergência visível.
- Inspecionei a tela da partida em 1280 × 900 e 390 × 844. No celular, o documento permaneceu em 390 × 844 sem rolagem horizontal. Não houve erros de console.
- Capturas: `/tmp/banco-chrome-express-clock.png`, `/tmp/banco-chrome-classic-clock.png` e `/tmp/banco-chrome-classic-clock-mobile.png`.
- Os testes de sala cobrem expiração de turno, seis rodadas, resolução de dívida após o relógio Clássico, pontuação individual por patrimônio, precedência de saldo no Express e desempate por patrimônio. Naquela validação, a tela de resultado ainda aguardava inspeção visual; ver seção “Encerramento Express e placar final”.

## 2026-10-27 — Objetivos privados Express

- Em uma sessão Chrome com dois clientes na mesma sala Express, cada jogador recebeu uma carta diferente. Abrir a carta em um cliente não mostrou o objetivo do outro; o conteúdo não aparece no estado compartilhado da sala.
- O progresso inicial, título, descrição e bônus foram legíveis na partida. No Chrome em 1280 × 900 e 390 × 844, o painel ficou sobre a borda inferior da cena; em 390 × 844, o documento permaneceu em 390 × 844, sem rolagem horizontal. Não houve erros de console.
- Capturas inspecionadas: `/tmp/banco-chrome-objective-desktop.png` e `/tmp/banco-chrome-objective-mobile.png`.
- Testes de integração cobrem distribuição privada sem repetição, ausência dos objetivos no schema público, bônus único e progresso após compra. A validação visual confirma a apresentação e privacidade entre clientes; a conclusão de cada tipo de objetivo ainda é coberta pelos testes de regra.
- A primeira captura indicou baixo contraste no feltro. Ajustei o verde central e a iluminação da cena; a captura revisada mostra melhor separação entre a área de jogo e as casas, mantendo a paleta leve. Os nomes/preços nas casas ainda são pequenos quando o tabuleiro inteiro está enquadrado e devem ser refinados numa próxima revisão de legibilidade.

## 2026-10-27 — Referências de interface e leitura das casas

- Consultei a [página oficial de *Business Tour* na Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/) e a [galeria Interface In Game](https://interfaceingame.com/games/business-tour/), que separa capturas de tabuleiro, rolagem, mesa privada e placar final. A pesquisa confirma o tabuleiro como foco, jogadores e saldos nas bordas, feedback breve perto da ação e resultado em painel sobre a mesa; a direção própria do projeto está registrada em `docs/REFERENCIAS-VISUAIS.md`.
- A inspeção no navegador integrado usou uma prévia isolada do componente 3D em 1280 × 900 e 390 × 844. Aumentei o texto das casas de 82 para 112 px, os preços de 70 para 92 px e reduzi o nevoeiro distante para manter os nomes e valores mais nítidos. A leitura melhorou em ambos os enquadramentos; as casas ainda ficam pequenas no celular por causa da perspectiva e do tabuleiro inteiro caber na tela.
- A ponte desta sessão expôs apenas o navegador integrado do Codex; Chrome e Firefox não apareceram para inspeção. Esta validação não cobre a partida completa, o placar final, nem esses dois navegadores externos.

## 2026-10-27 — Encerramento Express e placar final

- No navegador integrado, criei uma sala Express com duas abas e avancei até o fim da sexta rodada. As duas pessoas viram a mesma classificação; Playtest A venceu com saldo de R$ 540.000 e patrimônio de R$ 1.300.000, contra R$ 50.000 de saldo de Playtest B.
- Inspecionei a tela final em 1280 × 720: tabuleiro e cartões de jogador continuam visíveis atrás do resultado, vencedor e valores estão destacados, e o botão para voltar ao início cabe no painel. Os dois clientes não registraram erros de console e o documento não teve rolagem além do viewport.
- A captura mostrou que “Saldo final · empate por patrimônio e dados” podia ser lido como se a partida tivesse terminado empatada. Troquei por uma descrição explícita do critério e acrescentei teste de regressão em `src/ui/scoreCriteria.test.ts`.
- O viewport integrado não aceitou a alteração para dimensões móveis; portanto, esta inspeção não comprova o layout móvel do placar nem a validação específica em Chrome ou Firefox.

## 2026-10-28 — Partida cruzada Chrome–Firefox e enquadramento móvel

- Uma partida Express real foi criada no Chrome (1280 × 720) e concluída com uma pessoa no Chrome e outra no Firefox (1366 × 682). Os dois navegadores exibiram a mesma vencedora, saldo, classificação e critério no fim da sexta rodada.
- A captura do placar foi inspecionada nos dois clientes. O tabuleiro e as duas peças continuam visíveis atrás do resultado; o painel, os saldos e o botão final cabem no desktop.
- A revisão móvel da mesma partida em Chrome (390 × 844) encontrou a mesa cortada e com baixo contraste. Ajustei a distância e orientação da câmera e escalei o nevoeiro junto com ela. Na captura revisada, as quatro bordas do tabuleiro cabem na largura móvel, e a cena permanece legível atrás do placar. O painel final ocupa x=10–380 e y=534–800; o documento permanece em 390 × 844, sem rolagem.
- A partida revelou dois defeitos: o estado do mapa de jogadores pode chegar vazio na primeira renderização do Firefox, e a compra continuava ativa quando o saldo era menor que o preço. Protegi a leitura inicial com teste de regressão e agora desabilito “Comprar” sem saldo, explicando que ainda é possível iniciar o leilão. A partida seguinte acionou “Leilão” nesse caso.
- Capturas inspecionadas: `/tmp/banco-chrome-firefox-match.png`, `/tmp/banco-firefox-final.png` e `/tmp/banco-chrome-firefox-mobile.png`.
- A automação headless emitiu avisos de fallback para renderização WebGL por software e atraso de GPU; não houve divergência de estado entre os clientes. Esses avisos descrevem o renderer de teste e não uma falha de JavaScript da partida.

## 2026-10-28 — Destaque da propriedade em compra

- No Chrome headless, dois jogadores entraram na mesma sala Clássica e iniciaram uma partida. Ao chegar a uma propriedade sem dono, o contorno dourado apareceu sobre a casa indicada no cartão de compra; os nomes e os dados permaneceram legíveis e a mesa continuou como foco.
- Em 1440 × 813, o marcador ficou visível junto à peça no canto do tabuleiro. Em viewport de celular de 390 × 844, as quatro bordas do tabuleiro couberam na largura e `document.documentElement.scrollWidth` permaneceu igual a `innerWidth` (sem rolagem horizontal). O segundo cliente viu o estado de compra sincronizado, com as ações desabilitadas quando não era sua vez.
- Capturas inspecionadas: `/tmp/banco-game-review.png` e `/tmp/banco-game-mobile-review.png`.
- `vitest`: 72 testes passaram em 10 arquivos; build do cliente e build do servidor passaram. O Chrome headless emitiu os avisos conhecidos de WebGL por software/GPU.

## 2026-10-28 — Destaques dos bens durante dívida

- O Chrome percorreu uma partida real de dois jogadores até uma dívida de R$ 125.000 com saldo de R$ 37.000. Ao abrir “Ver bens para liquidar”, a carteira mostrou seis títulos hipotecáveis e seis aros dourados nas mesmas casas; nenhum bem do adversário foi realçado. Não houve exceções JavaScript.
- Em 1440 × 813, o tabuleiro permaneceu visível ao lado do painel de liquidação. Em 390 × 844, o painel ocupou a borda inferior e deixou a parte superior do tabuleiro visível; o documento não teve rolagem horizontal.
- Capturas inspecionadas: `/tmp/banco-debt-desktop-recheck.png` e `/tmp/banco-debt-auto-mobile.png`.
- Testes unitários verificam construções vendáveis em ordem equilibrada, estações hipotecáveis, bens do adversário e títulos já hipotecados. A suíte completa passou com 74 testes, e os builds do cliente e do servidor passaram.

## 2026-10-28 — Placar final com métricas e classificação

- Concluí uma partida Express real com duas abas Chrome na mesma sala e percorri as seis rodadas. O placar mostrou o vencedor, saldo como critério principal, patrimônio complementar, posições numeradas e a regra de desempate.
- Em 1440 × 900, o painel ficou centralizado sem rolagem e deixou a mesa visível atrás. Em 390 × 844, o painel coube inteiro, o documento permaneceu sem rolagem horizontal e as duas métricas e posições continuaram legíveis.
- Capturas inspecionadas: `/tmp/banco-chrome-final-desktop.png` e `/tmp/banco-chrome-final-mobile.png`.
- `npm run verify`: 79 testes passaram; builds do cliente e servidor passaram. A tentativa inicial dentro do sandbox bloqueou o bind local do teste de sala; a repetição com permissão de rede local concluiu normalmente. O build ainda mostra o aviso conhecido de bundle cliente acima de 500 kB.
- Esta revisão visual cobre Chrome; não repeti o fluxo final no Firefox nesta mudança.

## 2026-10-28 — Legibilidade dos nomes e preços das casas

- Aumentei os nomes e preços nas texturas 3D, ampliei a área de rótulo dentro de cada casa e passei a quebrar nomes longos em palavras, sem truncá-los. Testes unitários verificam quebra, normalização e preservação do texto.
- Em uma sala Express Chrome com duas pessoas, conferi a mesa em 1440 × 900 e 390 × 844. No desktop, nomes de duas linhas e preços ficaram mais fáceis de distinguir. No celular, a mesa inteira continua enquadrada e não há rolagem horizontal; a perspectiva ainda reduz os nomes pequenos, enquanto a casa ativa e o preço aparecem por extenso no painel DOM do turno.
- Capturas inspecionadas: `/tmp/banco-labels-desktop.png` e `/tmp/banco-labels-mobile.png`. A primeira captura desktop após resize foi feita antes de o WebGL headless concluir o próximo frame; aguardei o render e confirmei a cena na captura registrada.
- `npm run verify`: 82 testes passaram; builds do cliente e servidor passaram. A suíte precisa da permissão de loopback para o servidor de testes. O build mantém o aviso conhecido do bundle cliente acima de 500 kB.

## 2026-10-28 — Enquadramento móvel do tabuleiro

- Em uma sala Express com dois clientes Chrome, alinhei a câmera em retrato para projetar as quatro bordas do tabuleiro paralelas aos limites da tela. A câmera ainda olha de cima em perspectiva; no desktop a vista diagonal permanece igual.
- Em 390 × 844, o tabuleiro coube na largura, a borda mais próxima e seus nomes/preços ficaram mais legíveis, e `document.documentElement.scrollWidth` permaneceu em 390. As casas no lado oposto continuam menores por causa da perspectiva; o cartão da jogada mostra nome e preço da casa ativa em texto DOM.
- Captura inspecionada: `/tmp/banco-labels-mobile.png`.
- A suíte inclui testes para enquadramentos móvel, desktop e janela estreita. `npm run verify` passou com 85 testes e builds do cliente e servidor.

## 2026-10-28 — Referências de apresentação e estado de reconexão

- Consultei novamente a [página oficial de Business Tour na Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/) e a [galeria de telas por estado](https://interfaceingame.com/games/business-tour/). A leitura visual reforça tabuleiro quadrado central, participantes nos cantos com nome e saldo, modo/relógio no topo, dados no espaço central e mensagens de ação breves.
- Ajustei o contraste da cena, o relógio e as fichas de participantes com acentos de cor consistentes. Em Chrome headless, iniciei uma partida real com dois clientes e revisei capturas em 1440 × 900 e 390 × 844; as duas mantiveram os jogadores, o estado da vez e o tabuleiro visíveis, sem rolagem horizontal no celular.
- Capturas inspecionadas: `/tmp/banco-labels-desktop.png` e `/tmp/banco-labels-mobile.png`.
- O teste de integração Colyseus simula queda, sincroniza o estado offline, bloqueia o início da sala, reconecta o cliente e confirma que a partida pode começar. A regra após expirar os 60 segundos ainda diverge do documento: o `onLeave` remove a pessoa e interrompe a partida; essa pendência está registrada em [PLANO.md](PLANO.md).
- `npm run verify`: 86 testes passaram; build web e build do servidor passaram. O build mantém o aviso conhecido de bundle cliente acima de 500 kB. O Chrome headless emitiu avisos de fallback WebGL por software durante a captura.

## 2026-10-28 — Timeout e avanço de turno após desconexão

- O servidor preserva a cadeira e os títulos da pessoa depois que a reconexão expira, continua os relógios e pula o turno já expirado. Uma compra pendente é cancelada sem abrir leilão; um leilão ativo termina sem atribuir a propriedade.
- O teste de regressão usa o SDK real para derrubar uma conexão e simula o vencimento da janela no servidor; verifica partida em andamento, propriedade preservada, turno atual pulado e relógio Clássico ativo. Outros casos verificam turno futuro expirado pulado e compra cancelada sem venda automática. O timeout completo de 60 segundos também foi exercitado em Chrome com dois clientes: o cliente ativo recebeu a vez, enquanto a ficha desconectada passou de “Reconectando” para “Offline”.
- Revisei a partida após o timeout em 1440 × 900 e 390 × 844; a mesa, a pessoa ativa e a mensagem de turno ficaram visíveis sem rolagem horizontal. Capturas: `/tmp/banco-reconnect-expired-desktop.png` e `/tmp/banco-reconnect-expired-mobile.png`.
- O tratamento de desconexão durante dívida permanece sem regra aprovada: atualmente a dívida fica aberta e a partida aguarda. Foi solicitada decisão sobre preservar a dívida com retorno à mesma cadeira, manter a dívida sem retorno ou declarar falência ao vencer o prazo.
- `npm run verify`: 89 testes passaram; builds web e de servidor passaram. O build mantém o aviso conhecido de bundle cliente acima de 500 kB.
