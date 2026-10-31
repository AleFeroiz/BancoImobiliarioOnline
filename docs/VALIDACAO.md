# 2026-10-31 — Smoke test público da sala e da partida BANTEC

- O status Vercel do commit `4547e14` confirmou “Deployment has completed”. Abri `https://banco-imobiliario-online.vercel.app`, criei uma sala temporária, adicionei Bot 1 e iniciei uma partida de 15 minutos.
- A partida abriu com o relógio em 15:00 e os dois saldos em R$ 2.000.000. A primeira rolagem foi 9; o servidor resolveu a chegada em Rio Verde e a interface mostrou oferta de R$ 225.000 e aluguel de R$ 22.500 sem construção, R$ 45.000 com uma casa, R$ 90.000 com duas e R$ 157.500 com três. Inspecionei uma captura do tabuleiro e da oferta.
- Isso confirma o acesso ao frontend publicado, a conexão multiplayer em tempo real e a resolução da primeira jogada usando o servidor de salas. O hook de deploy do Render também confirmou que aceitou o pedido para o push. Não confirma qual SHA está ativo no serviço Render nem a configuração de Auto-Deploy, que ainda dependem do painel.
- Saí da sala e fechei a aba temporária. Os logs de console consultados não retornaram erros ou avisos durante o smoke test.

## 2026-10-31 — Dados ainda mais baixos sobre a FATEC

- Baixei a posição-base dos dados de Y=1,18 para Y=1,12, reduzi a escala de 0,82 para 0,68 e reposicionei o indicador do resultado para Y=1,62.
- A rolagem real no navegador confirmou os dados suspensos mais próximos dos telhados e sem entrar nos prédios nem na torre. O teste geométrico calcula folga mínima de aproximadamente 0,016 sobre o telhado em qualquer orientação e confirma que a torre fica fora do volume dos dados.
- O teste focado passou com 3 casos. `npm run verify` passou com 246 testes em 46 arquivos e builds do frontend e servidor; permanece o aviso conhecido do chunk 3D acima de 500 kB.

## 2026-10-31 — Dados mais baixos sem atravessar a FATEC

- Em uma partida local de teste com modo DEV, iniciei uma rolagem real após baixar a posição-base dos dados para Y=1,23 e afastá-los lateralmente da torre. A captura mostra os dois próximos aos telhados, sem atravessar as construções centrais.
- A regressão geométrica verifica a caixa dos dados em qualquer orientação, folga mínima de 0,02 sobre os telhados e afastamento horizontal do volume da torre. O teste focalizado passou com 3 casos.

## 2026-10-31 — Recompra depois do aluguel

- No jogo local, o teleporte DEV levou o anfitrião a Parauapebas, do Bot 1. A interface exibiu primeiro “Aluguel: R$ 192.500 pagos a Bot 1” e, na mesma resolução, ofereceu a recompra por R$ 1.031.250. “Continuar sem recomprar” aparece como opção de recusa, sem cobrar o aluguel novamente.
- Aceitei a recompra: o anfitrião passou de R$ 1.607.500 (após o aluguel) para R$ 576.250; Bot 1 recebeu R$ 1.031.250 e passou de R$ 1.505.000 para R$ 2.536.250. A descrição confirmou pagamento integral ao antigo proprietário e a posse mudou para o anfitrião.
- Testes de servidor cobrem saldo insuficiente após aluguel, hotel sem recompra e recompra depois de quitar aluguel em dívida. `npm run verify`: 240 testes em 46 arquivos passaram; builds frontend e servidor passaram. `graphify update .` atualizou o grafo. O aviso conhecido de chunk 3D acima de 500 KB permanece.

## 2026-10-31 — Vitórias por Monopólio Duplo Regional e em Linha

- Em sala DEV local, comprei as cinco cidades do Norte e as cinco do Centro-Oeste. A compra de Brasília completou o segundo monopólio regional e abriu imediatamente “PARTIDA ENCERRADA”; o painel mostrou Codex QA como vencedor, patrimônio final de R$ 3.875.000, saldo R$ 0 e classificação.
- Em outra sala, adquiri Canaã dos Carajás, Porto Velho, AgroBrasil, Parauapebas, Belém, Manaus e Rio Verde. A compra de Rio Verde completou os sete títulos do lado 0 e encerrou a partida por Monopólio em Linha. O painel mostrou Codex Linha como vencedor, patrimônio final de R$ 2.550.000, saldo R$ 100.000 e classificação.
- Inspecionei capturas desktop dos dois painéis finais. A partida terminou sem aguardar o relógio; os controles de compra e DEV não ficaram sobre a tela final.

## 2026-10-31 — Encerramento após dívida sem bens liquidáveis

- Em sala DEV, o anfitrião possuía apenas São Paulo, com três casas e aluguel de R$ 665.000. Bot 1 estava sem saldo e sem imóveis liquidáveis; mantive esses valores antes dos turnos do bot. Após uma jogada do bot, a sala exibiu “PARTIDA ENCERRADA”, com o anfitrião vencedor e Bot 1 em R$ 0; ainda restavam 23:45 no relógio da partida.
- A tela final não informa o motivo do encerramento. Como São Paulo era o único título possuído, não havia outro pagamento ou condição de monopólio que explicasse o fim; a falência por aluguel é a causa compatível com o estado observado. A captura confirma o painel final, embora o motivo continue sendo inferido pela sequência e pelo estado.

## 2026-10-31 — Recompra forçada pela interface

- Bot 1 comprou Manaus com três casas; o investimento total foi de R$ 1.625.000 e não havia hotel. Pelo teleporte DEV, levei o anfitrião diretamente à casa. A interface ofereceu “Recomprar por R$ 2.437.500” ou “Pagar aluguel”, sem solicitar aceite do proprietário.
- Ao confirmar, o saldo do anfitrião caiu de R$ 2.545.000 para R$ 107.500 e o do bot subiu de R$ 377.500 para R$ 2.815.000. O aviso confirmou o pagamento direto ao antigo dono e a propriedade mudou para o anfitrião.
- Capturei e inspecionei a tela com os saldos atualizados e a confirmação da transferência.

## 2026-10-31 — Ferramentas DEV de teleporte e saldo

- O anfitrião ativou o Modo DEV no lobby, iniciou uma sala local com um bot e escolheu Canaã dos Carajás na lista de 40 casas. O peão apareceu diretamente na cidade e o painel normal de compra foi aberto; o saldo não recebeu bônus por casas puladas. Comprei o terreno por R$ 200.000.
- No turno seguinte do anfitrião, defini manualmente o saldo para R$ 1.230.000 e confirmei a atualização no cartão do jogador. A caixa de dinheiro infinito foi habilitada e permaneceu marcada.
- O teste de integração em `server/test/GameRoom.test.ts` confirma validação de anfitrião, Modo DEV, destino e saldo; aterrissagem que abre compra; construção e aluguel sem descontar o saldo infinito, enquanto o dono recebe o aluguel. A suíte focada passou.
- `npm run verify`: 237 testes em 46 arquivos passaram; builds frontend e servidor passaram. `npm run graphify -- update .` foi concluído. O chunk de cena 3D continua acima de 500 KB. `git diff --check` passou.
- Revisão visual na partida local: painel DEV com dados, destino, jogador, saldo e dinheiro infinito visível. A sala temporária e os servidores locais foram encerrados depois da captura.

## 2026-10-30 — Pop-up de saldo, modo DEV no lobby e aluguel das estações

- `npm run verify`: 207 testes passaram; builds frontend e servidor passaram. O chunk 3D conhecido permanece em 956,28 KB (259,73 KB gzip). `git diff --check` passou.
- Playtest na aba local: criei uma sala Clássica, habilitei Modo DEV no lobby, confirmei o estado ativado, adicionei um bot e iniciei a partida. O painel para escolher os dois dados e forçar o resultado apareceu no turno do anfitrião; a velocidade 1× estava selecionada. A captura da partida confirma o painel do DEV e o layout dos cartões. Logs do navegador sem erros.
- Testes Colyseus confirmam que o convidado não pode habilitar a opção, a anfitriã pode configurá-la no lobby e a rolagem forçada funciona no servidor de produção quando a opção foi habilitada. O teste das estações verifica pagamento ao dono com rolagem válida e múltiplos de R$ 50.000. O pop-up de saldo e a classificação verde/vermelho têm lógica unitária; a animação não foi vista com uma mudança de saldo real no playtest desta rodada.
- Graphify update não executou porque a CLI `graphify` não está instalada neste ambiente.

## 2026-10-30 — Cartões do jogador, lance de leilão e airport GLB

- `npm run verify`: 204 testes passaram; builds de frontend e servidor passaram. O chunk 3D conhecido permanece em 956,28 KB (259,73 KB gzip). `git diff --check` passou.
- Playtest em aba local nova, partida Clássica com quatro lugares preenchidos: os cartões exibiram somente nome e saldo em destaque, fundo sólido na cor de cada jogador e os ícones 3D de dinheiro no alto à direita. A árvore de acessibilidade também expôs apenas nome e saldo para esses cartões.
- O Blender conectado estava em 5.2.2 LTS, addon 1.8. O airport GLB anterior ainda colocava a peça fora do tabuleiro; a cena corrigida do usuário continha 38 meshes. Exportei apenas esses meshes em GLB Y-up, sem salvar por cima do `.blend` local. Em uma partida local nova, o aeroporto carregou dentro da casa Volta ao Mundo.
- Os controles +/− usam botões de pelo menos 42 px com `touch-action: manipulation`; a lógica dos passos de R$ 10.000 e do lance mínimo tem testes de regressão; um teste de materiais verifica a silhueta traseira escura das fichas. Não percorri manualmente a abertura do painel de leilão nesta rodada; a revisão de toast foi coberta pelo teste unitário de personalização, e a imagem de jogo confirma a disposição dos cartões.
- Graphify update não executou porque a CLI `graphify` não está instalada neste ambiente.
# Validação visual e de navegador

## 2026-10-31 — Dados mais baixos sem entrar na FATEC

- Novo ajuste: posição-base Y=1,065 e escala 0,55. O limite inferior do volume da caixa durante o giro preserva pelo menos 0,01 unidade sobre o telhado principal (Y=0,845); a posição horizontal continua fora da torre.
- Em rolagem real na sala local F6BG5, os dados apareceram baixos junto aos prédios, sem atravessar o volume da FATEC.

## 2026-10-31 — Cartas Ladrão, Volta ao Brasil e Apagão

- Em uma sala local de 30 minutos com Modo DEV, confirmei Ladrão: saldo de BANTEC QA subiu de R$ 1.675.000 para R$ 1.875.000; saldo de Bot 1 caiu de R$ 6.562.500 para R$ 6.362.500.
- A carta Volta ao Brasil destacou destinos válidos no tabuleiro; escolhi Cuiabá. O servidor informou chegada sem bônus por passagem pela Partida e abriu a construção normal do imóvel próprio.
- Apagão destacou Manaus, de Bot 1, e apagou as casas inválidas. A interação expirou antes de registrar o clique do alvo, portanto não confirma a suspensão de aluguel. Os testes de integração cobrem esse efeito e sua duração; a confirmação visual permanece pendente.

# 2026-10-31 — Dados mais baixos sobre a FATEC

- Posição-base reduzida para Y=1,10, escala para 0,63 e indicador para Y=1,57. O teste geométrico calcula o envelope do dado girando e confirma margem mínima de 0,01 sobre os telhados, sem interseção com a torre.
- `src/ui/dicePresentation.test.ts` passou (3 testes). `npm run verify` passou com 247 testes em 46 arquivos e builds frontend/servidor. `npm run graphify -- update .` atualizou o grafo para 943 nós e 1.752 arestas. A rolagem não foi revista visualmente: a sala local já aberta estava no turno de outra pessoa e o controle DEV não permitiu iniciar uma rolagem do anfitrião.

## 2026-10-31 — Seleção de propriedade durante Apagão

- Em uma sala com Bot 1, a revelação de Apagão foi fechada automaticamente pelo prazo. O tabuleiro mostrou casas válidas e inválidas com contraste, mas um segundo cartão central de turno ainda cobria parte das casas. A seleção expirou antes de confirmar o clique; não prova aplicação nem falha do efeito.
- Em uma sala de teste nova, apliquei a correção também ao percurso de Volta ao Brasil: após fechar a carta, o cartão central sumiu, os destinos válidos ficaram iluminados e escolhi São Paulo diretamente pelo tabuleiro; a interface abriu a compra de São Paulo.
- Os testes focados de turnActivity e boardInteraction passaram; `npm run verify` passou com 247 testes em 46 arquivos e builds web/servidor. Falta repetir a seleção de uma propriedade-alvo de carta como Apagão e confirmar a suspensão de aluguel numa visita posterior.

## 2026-10-31 — Redução adicional da altura dos dados

- Em sala local BANTEC com Modo DEV, iniciei uma rolagem real e capturei a cena no centro da FATEC. Com posição-base Y=2,18, escala 0,9 e salto de 0,10, os dados ficaram mais baixos e não apresentaram interseção visual com os prédios ou a torre.
- O teste `src/ui/dicePresentation.test.ts` usa o raio geométrico do dado (0,381 unidade) multiplicado pela escala visual e valida uma folga mínima de 0,02 acima do topo da torre (Y≈1,81), inclusive sob rotação. A folga calculada é aproximadamente 0,027; o indicador do resultado foi reposicionado para Y=2,82.
- O teste específico passou com 3 casos. `npm run verify` passou com 240 testes em 46 arquivos e builds de frontend e servidor; a primeira execução isolada do teste bateu no erro conhecido de `EPERM` no temporário do sandbox, e a repetição usando `.tmp` passou.

## 2026-10-31 — Redução anterior da altura dos dados

- A rolagem agora usa posição-base Y=2,3 e salto vertical de 0,16 (antes 2,45 e 0,48). O total acompanha a mudança e fica em Y=3,05. A rotação dos dados ainda mantém margem sobre o topo da torre da FATEC (Y≈1,81).
- Teste de regressão verifica o envelope vertical dos dados enquanto giram e saltam, para mantê-los visíveis sem atravessar a torre. Numa sala local nova de 15 minutos, com um bot e DEV, vi os dados durante o movimento do peão: ficaram suspensos sobre a FATEC, baixos e sem interseção visível com os prédios. Encerrei a sala temporária e deixei a aba na página inicial.

## 2026-10-31 — Seleção de cartas Terremoto e Generoso

- Em partida local com DEV, Terremoto abriu o modo de seleção no tabuleiro. As casas inválidas ficaram apagadas e uma propriedade elegível de Bot 1 ficou destacada. A tentativa de selecionar Manaus aconteceu com poucos segundos restantes; o alvo expirou e o clique posterior abriu o inspetor, sem aplicar o efeito.
- Uma tentativa seguinte revelou Generoso e mostrou o prompt para escolher uma propriedade própria e depois o destinatário. O alvo também expirou antes da confirmação. Essas tentativas não validam os efeitos nem indicam falha da mecânica; seleção concluída, destruição/transferência e efeitos de Apagão seguem pendentes de revisão manual.

## 2026-10-31 — Cartas Ladrão e Apagão

- Em uma partida local, a seleção do Ladrão mostrou o alvo Bot 1; após confirmar, Codex Cartas recebeu R$ 200.000 (R$ 2.250.000 → R$ 2.450.000) e Bot 1 perdeu R$ 200.000 (R$ 435.000 → R$ 235.000).
- Para Apagão, as casas inválidas ficaram apagadas e as propriedades válidas de Bot 1 iluminadas. A tentativa de clicar em Belém ocorreu no fim da contagem e abriu o inspetor; não confirmou o alvo. Uma chegada posterior cobrou R$ 245.000, mas a carta havia expirado sem a seleção confirmada, então isso não é evidência de falha do efeito. A seleção dentro do prazo, o bloqueio do aluguel e a expiração após três turnos continuam pendentes de revisão visual.

## 2026-10-31 — Dados mais baixos acima da FATEC

- Reduzi a posição-base dos dados de Y=4,2 para Y=2,45 e o indicador do total de Y=5,2 para Y=3,55. A altura máxima da torre na cena, após a escala do GLB, é aproximadamente Y=1,81; a base dos dados em repouso mantém cerca de 0,43 unidade de distância e a animação salta para cima.
- Na partida local, revisei os dados lado a lado durante o movimento. Agora ficam visualmente próximos dos prédios da FATEC, e ambos permanecem acima da torre, sem sobreposição.
- O teste `src/ui/dicePresentation.test.ts` passou com 3 casos. `npm run graphify -- update .` concluiu. `npm run verify` passou com 240 testes em 46 arquivos e builds do frontend e servidor após repetir com loopback local autorizado; a primeira tentativa falhou com `fetch failed` nos testes Colyseus por bloqueio de loopback.

## 2026-10-31 — Compras e aluguel em sala BANTEC

- Em sala local de 30 minutos com um bot e modo DEV para direcionar dados, o anfitrião começou com R$ 2.000.000, comprou Belém por R$ 350.000 e viu aluguel de R$ 35.000 na prévia. O bot caiu em Belém e pagou esse aluguel.
- O anfitrião recebeu R$ 200.000 ao passar pela Partida e comprou Manaus por R$ 650.000; a carteira mostrou saldo de R$ 1.200.000. O bot comprou Aviação Brasil por R$ 500.000 e Recife com uma casa por R$ 712.500. Após parar em Rio Verde, seu saldo foi exibido como R$ 1.437.500; não inspecionei a posse.
- O playtest confirma compra, prévia de aluguel, pagamento ao proprietário e bônus da Partida. A partida não chegou à vitória por Monopólio em Linha. O resultado final e a recompra forçada ficam pendentes de nova sessão.
- As portas padrão 5173/2567 retornaram `EADDRINUSE` sem listener identificável. A revisão ocorreu em sessão temporária nas portas 5181/2568, encerrada ao fim do teste.

## 2026-10-31 — Precisão do aluguel na compra

- Em uma sala BANTEC com modo DEV, forcei a chegada em Belém e observei o pacote de compra: terreno R$ 350.000, uma casa R$ 525.000, duas casas R$ 700.000 e três casas R$ 875.000. O aluguel para três casas apareceu como R$ 244.999, expondo perda de R$ 1 pelo piso da multiplicação decimal.
- O teste de regressão reproduziu R$ 244.999 antes da correção. Depois da troca para arredondamento ao real mais próximo, passou a retornar R$ 245.000; repeti o playtest no navegador e confirmei esse mesmo valor no painel de compra.
- `npm run verify`: 235 testes em 46 arquivos passaram; builds do frontend e servidor passaram. Para os testes Colyseus, foi necessário repetir com loopback autorizado após o sandbox padrão retornar `fetch failed`. `npm run graphify -- update .` concluiu.
- A sala confirmou a conexão, o turno do anfitrião, o modo DEV, a rolagem forçada e a compra. Em seguida, num playtest separado de dois participantes, o anfitrião comprou as quatro companhias e venceu. O painel final mostrou nome, vitória, patrimônio, saldo e classificação sobre o tabuleiro; revisão visual aprovada. Patrimônio final: R$ 2.400.000 para o anfitrião e R$ 1.550.000 para o bot.
- O estado terminal foi alcançado pela regra de vitória por quatro companhias, não pelo relógio ou falência. A dívida foi validada pela interface em uma sessão posterior. Fim por tempo/falência e as cartas restantes seguem pendentes de revisão visual; testes de integração cobrem as três vitórias imediatas e as transições do servidor.

## 2026-10-31 — Seleção no tabuleiro e liquidação de dívida

- Em uma sala DEV com anfitrião e Bot 1, o anfitrião chegou a Rio Verde e pagou R$ 157.500 de aluguel, ficando com R$ 92.500. Depois, chegou a Maceió, de propriedade do bot com três casas, e abriu dívida de R$ 210.000.
- A tela indicou a dívida, o credor e instruiu a escolher um imóvel iluminado no tabuleiro. Selecionei Joinville e Belém pelo piso; cada seleção vendeu um nível de construção e mostrou o reembolso (R$ 112.500 e R$ 87.500). Com saldo de R$ 292.500, o botão de pagamento foi habilitado.
- Paguei os R$ 210.000 ao bot. O anfitrião terminou com R$ 82.500; Belém e Joinville permaneceram seus, com os níveis vendidos removidos. A captura confirmou as casas válidas destacadas durante a escolha.
- A mesma partida confirmou visualmente a carta Aniversário: o anfitrião recebeu R$ 50.000 do bot, refletido nos saldos dos dois jogadores.
- Monopólio em Linha, Monopólio Duplo Regional, encerramento por tempo/falência e as cartas restantes continuam pendentes de playtest manual.

## 2026-10-31 — Auditoria de cartas e dívida

- Conferi a cobertura de `server/test/GameRoom.test.ts` contra as doze cartas vigentes: os efeitos, escolhas de alvo, movimento e efeitos financeiros têm testes de integração; também estão cobertos dívida de Ladrão, falência e resolução do tempo.
- Acrescentei teste de regressão para os hotéis não poderem receber Apagão nem Terremoto. Ambos são rejeitados pelo servidor sem alterar propriedade ou construção.
- `npm run verify`: 234 testes em 46 arquivos passaram; builds frontend e servidor passaram. `npm run graphify -- update .` passou. A dívida foi depois validada visualmente numa partida real; detalhes constam na seção “Seleção no tabuleiro e liquidação de dívida”.

## 2026-10-31 — Rota regional na home BANTEC

- A home agora exibe o percurso visual Norte → Centro-Oeste → Nordeste → Sul → Sudeste com as cinco cores usadas no tabuleiro, além de informar 24 cidades, 40 casas e quatro companhias. Removi o marcador “01/03”, que sugeria telas inexistentes.
- Revisão visual no navegador local em 964×883, 390×844 e 320×568. No celular de 320 px, encontrei uma barra horizontal causada pelo `min-width: 320px` do `body` junto à barra vertical do navegador; removi o piso e confirmei que a barra horizontal desapareceu. Em 390 px, a rota coube numa linha e a rolagem levou ao formulário completo. Desktop mantém título, percurso e duração ao lado do formulário principal.
- `npm run verify`: 233 testes em 46 arquivos passaram; builds do frontend e servidor passaram. O aviso conhecido de chunk 3D acima de 500 KB permanece. `git diff --check` passou.
- A home foi revisada sem serviço de salas; a inicialização Colyseus retornou `EADDRINUSE` na porta 2567 e nenhuma entrada apareceu em `Get-NetTCPConnection` ou `netstat`, portanto não encerrei processo desconhecido. A porta 5173 serviu a home normalmente.

## 2026-10-31 — Posição dos dados, tema noturno e partida BANTEC

- `npm run verify`: 225 testes em 44 arquivos passaram; builds do frontend e servidor passaram. O build mantém o aviso conhecido de chunk de cena 3D com 956,45 KB (259,83 KB gzip). `git diff --check` passou.
- Após o ajuste de altura de 6 para 4,2 unidades, a captura da partida mostra os dados lado a lado flutuando logo acima da FATEC Itapetininga, com o total acima deles; o modelo permanece visível e os dados não ficam isolados no alto da tela. O tabuleiro mantém as cores das regiões enquanto o fundo externo fica escuro.
- Na home e no lobby, os seletores de duração foram revisados em modo noturno depois de ajustar seus fundos e bordas para manter contraste. A partida real também confirmou compra da companhia Aviação Brasil por R$ 500.000, saldo atualizado para R$ 1.500.000 e o imóvel disponível na carteira com preço e aluguel.
- Testes de integração cobrem vitória imediata por Monopólio em Linha, Monopólio Duplo Regional e quatro companhias, três turnos de Apagão e liberação de imóvel após Terremoto. A liquidação real de dívida e a vitória pelas quatro companhias foram confirmadas no navegador; faltam revisão visual das cartas restantes e do fim por tempo/falência.

## 2026-10-31 — Atalhos da HUD na lateral direita

- Reorganizei Bens, Config, Emote e Regras numa coluna fixa à direita. Os quatro alvos são quadrados iguais (56 px no desktop; 48 px em telas estreitas), e o seletor de emotes abre para dentro da tela.
- Revisei a composição em 1280×720 e 390×844: a coluna permanece alinhada à lateral em ambos os tamanhos, com os quatro rótulos e ícones visíveis. O seletor de emotes também abre à esquerda do botão sem sair da viewport.
- A regressão CSS verifica posição, dimensões iguais e ajuste responsivo; `npm run verify` passou com 225 testes em 44 arquivos e builds de cliente/servidor.

## 2026-10-31 — Marca, carteira, construção e Proteção

- A home foi revisada no navegador interno em viewport móvel e no Chrome headless isolado em 1440×1000. Cabeçalho e status agora dizem BANTEC / “MESA ONLINE”, sem a antiga marca Banco Imobiliário. O formulário de criar/entrar, escolha de duração e fundo do tabuleiro mantêm contraste no desktop e no celular.
- Partida real com quatro lugares (anfitrião + três bots), duração de 15 minutos e saldo de R$ 2.000.000 por jogador. O anfitrião comprou Manaus com três casas por R$ 1.625.000; o resumo mostrou aluguel de R$ 455.000 por parada. A compra exibe os quatro níveis de preço/aluguel.
- Captura da partida desktop em 1440×1000 confirmou os quatro cartões de jogador, ações compactas, contorno do tabuleiro, cores das regiões, rótulos e o modelo da FATEC no centro sem ocupar o perímetro. A revisão usou sessão headless isolada; a aba pessoal do Chrome permaneceu intacta.
- No viewport móvel, carteira e inspetor exibiram Rio Verde com duas casas, aluguel de R$ 90.000 e preço de compra de R$ 225.000; o inspetor apresentou a escada de aluguel e bloqueou leilão enquanto o grupo tem construções. Uma sessão desktop posterior revisou a partida e abriu a tela de liquidação de dívida; os detalhes estão na seção “Seleção no tabuleiro e liquidação de dívida”.
- Após a confirmação do usuário de que Proteção impede qualquer efeito de carta, inclusive Generoso, acrescentei ao teste Colyseus a rejeição de transferência protegida e confirmei que o imóvel continua com o dono. `server/test/GameRoom.test.ts`: 44 testes passaram.
- `npm run graphify -- update .` atualizou o grafo local (863 nós, 1.602 relações). `npm run verify` passou com 215 testes em 43 arquivos, builds do frontend e servidor; o aviso conhecido do chunk `sceneMaterials` acima de 500 KB permanece.

## 2026-10-31 — Carteira BANTEC e validação do Graphify local

- Segui o `AGENTS.md` atualizado: a consulta e a atualização passaram por `npm run graphify -- ...`, usando `scripts/graphify.mjs` e `graphify-out/graph.json` deste repositório. O grafo local foi reextraído após as mudanças; a topologia não teve alterações adicionais.
- No jogo local, a carteira abriu no viewport móvel e listou Rio Verde, duas casas, aluguel atual de R$ 90.000 e compra de R$ 225.000. O inspetor mostrou os níveis de aluguel e custo e bloqueou o leilão porque o grupo tem construções. A imagem também confirmou que a carteira permanece sobre o tabuleiro e cabe no viewport.
- `npm run verify`: 215 testes em 43 arquivos passaram; builds frontend e servidor passaram. Vitest usou `.tmp` no repositório e os testes Colyseus rodaram com loopback local. `git diff --check` passou antes das últimas atualizações documentais.
- Revisão desktop não realizada: ao conectar ao Chrome aberto, a ferramenta Computer Use encerrou a sessão por não conseguir identificar com confiança a URL atual. Não foi feita tentativa de assumir ou navegar a aba pessoal existente. Também falta percorrer uma dívida real para revisar venda de nível e devolução ao banco na interface.

## 2026-10-31 — Reforma BANTEC em andamento

- Graphify local foi executado por `npm run graphify -- query ...` antes da navegação pelo código, conforme o `AGENTS.md` atualizado.
- `npm run build` e `npm run build:server` passaram após adicionar a fase de recompra. `shared/game.test.ts`: 13 testes passaram. A suíte Colyseus foi rodada com loopback permitido; a integração de recompra forçada passou, mas a suíte completa ainda teve 20 falhas em expectativas antigas do Express, saldo inicial e outras regras anteriores.
- Playtest no navegador interno em viewport móvel: a tela inicial BANTEC exibiu seletor de 15/30/60 min e criação de sala. No lobby, duração e cores estavam disponíveis e a cor ocupada foi bloqueada. Iniciei uma partida com um bot, comprei a companhia AgroBrasil por R$ 500.000 e confirmei o saldo de R$ 1.500.000. O tabuleiro manteve a circulação dos peões no perímetro.
- A primeira captura encontrou o GLB da FATEC preto. A causa era a falta de conversão para material sem iluminação numa cena que não usa luzes; o componente passou a clonar a cena e criar materiais unlit, como os demais GLBs. Após o ajuste, os três blocos e a torre ficaram visíveis no centro. O modelo não toca as casas jogáveis. A revisão desktop e móvel foi feita no navegador; o enquadramento móvel mostrou o centro com leitura adequada, e no desktop o edifício ficou compacto sobre o gramado.
- Logs do navegador: sem erros; permaneceu um aviso do listener `game:started` dos testes/cliente Colyseus, sem falha de partida.
- Ainda não foi feita a revisão final após a conclusão das 12 cartas e da tela de bens. O build deve ser repetido depois da correção de materiais e a suíte completa continua pendente.

## 2026-10-30 — Pop-ups posicionados, seletores DEV, Copa e aluguel 3D

- `npm run verify`: 213 testes passaram; builds do frontend e servidor passaram. O chunk conhecido `sceneMaterials` ficou em 956,43 KB (259,81 KB gzip). `git diff --check` passou.
- Testes de regressão cobrem os pop-ups abaixo dos cartões superiores/acima dos inferiores, os botões de dados com incremento/decremento e retorno entre 1 e 6, a Copa sem opções quando não há imóveis próprios, a rejeição de imóvel livre/de outro jogador e os valores de aluguel base, grupo/construções, hipoteca e estação.
- A revisão visual no navegador não foi concluída: iniciar o servidor local retornou `EADDRINUSE` na porta 2567 e as consultas de listener não identificaram o processo ocupando a porta. Não capturei screenshot nem confirmei visualmente o billboard nesta rodada.
- `graphify update .` foi tentado, mas a CLI `graphify` não está instalada.

## 2026-10-30 — Compra, prisão e origem dos modelos

- `npm run verify`: 200 testes passaram; os builds de frontend e servidor passaram. Os testes Colyseus exigiram loopback local aprovado; a primeira execução sem ele recebeu `fetch failed`.
- Playtest no navegador interno: partida Clássica com anfitrião e dois bots; velocidade 1× apareceu selecionada, MODO DEV mostrou controles para os dois dados. Forcei uma rolagem até Jardim das Flores, comprei a propriedade com uma casa e confirmei o painel com aluguel por parada, custo total, conclusão da compra e saldo atualizado.
- A roda do mouse alterou o zoom do tabuleiro. A revisão visual mostrou a construção na área interna; a função de posicionamento tem teste geométrico nos quatro lados com profundidades diferentes. Revisão manual em aparelho com pinça não foi feita.
- A integração Colyseus confirmou que o pagamento de R$ 200.000 tira a pessoa da prisão, mantém sua vez e permite rolar; saldo inferior mantém o estado preso. A regra de duplas usa o helper compartilhado testado por igualdade dos dados.
- Não houve erros de runtime no navegador; ficou apenas o aviso do cliente Colyseus de que o listener `game:started` é registrado depois do evento inicial da sala de teste.

## 2026-10-29 — Correções de casas, aeroporto, cartas e testes DEV

- `npm run verify`: 194 testes em 38 arquivos passaram; build do frontend e do servidor passaram. O aviso já conhecido do chunk 3D permanece em 956,20 KB (259,70 KB gzip). `git diff --check` passou.
- Playtest local em sala Clássica com anfitrião e dois bots: 1× estava ativo por padrão; o botão MODO DEV e o painel para escolher os dois dados ficaram visíveis; o painel de compra mostrou a janela de 15 segundos. Comprei Rua das Palmeiras com uma casa e confirmei que o modelo apareceu no alinhamento interno do piso.
- Girei a câmera para inspecionar o percurso e os rótulos nos quatro lados. Os testes de regressão cobrem as rotações compostas dos textos, a orientação das fachadas, o alinhamento e a altura da base das construções, o recentramento/apoio do aeroporto, a cor da borda de pedra e a captura de clique da carta.
- A pinça não foi simulada em hardware touch. O fechamento global da carta foi verificado por teste de evento e não por uma carta alcançada no playtest. O avião foi recentrado e reduzido no renderer; nenhum arquivo Blender foi alterado.
- `graphify update .` não executou: a CLI não está instalada, e o Graphify MCP disponível aponta para outro repositório.

## 2026-10-29 — Casas, inspeção durante jogadas e modo DEV

- `npm run verify` passou: 187 testes em 36 arquivos; builds frontend e servidor passaram. O aviso existente de chunk 3D continua em 956,10 KB (259,64 KB gzip). `git diff --check` passou.
- Playtest local com um bot em viewport integrado 690×865: velocidade 1× selecionada ao iniciar; anfitrião ativou DEV, forçou 3+4 e a mesa mostrou total 7. Na vez do bot, o controle DEV continuou disponível ao anfitrião.
- Durante a animação do peão do bot, cliquei em Praça Central e o inspetor abriu com preço/aluguel, enquanto o movimento continuou. A cena mostrou os rótulos ao redor do tabuleiro e o aeroporto reposicionado no canto Volta ao Mundo.
- Zoom pela pinça não foi simulado em dispositivo touch nesta sessão. Blender MCP estava indisponível; o ajuste do aeroporto foi feito no renderer sem alterar o asset.
- `graphify update .` não rodou porque a CLI não está instalada; o MCP Graphify conectado aponta para outro repositório.

## 2026-10-29 — Zoom da câmera e destaque das fichas

- `npm run verify` passou: 183 testes em 35 arquivos; builds frontend e servidor passaram. O aviso existente de chunk 3D continua em 956,10 KB (259,64 KB gzip). `git diff --check` passou.
- Playtest em sala Clássica com três bots, navegador integrado em 690×900: scroll aproximou o tabuleiro e scroll inverso restaurou o enquadramento. A partida seguiu até uma decisão real de compra e as fichas permaneceram no tabuleiro com aro contrastante.
- A pinça é atendida pelo zoom nativo de OrbitControls, mas não foi simulada em dispositivo touch nesta sessão. A revisão estreita foi feita no viewport disponível, sem emulação de hardware móvel.
- `graphify update .` não rodou: a CLI não está instalada; Graphify MCP disponível aponta para outro repositório.

## 2026-10-29 — Travamento da HUD de dinheiro no Chrome

- Comparação controlada em Chrome 156 com GTX 970, 1365×900 e DPR 1: durante o mesmo arrasto da câmera, `07646a4` registrou ~97 FPS e `2def5f6` ~7 FPS, com intervalos de quadro de até 146,7 ms. No A/B da cópia temporária, desligar o overlay grande não resolveu; remover os efeitos CSS de filtro/perspectiva/3D/recorte dos símbolos de dinheiro restaurou ~99 FPS, e desligar a roleta não mudou o resultado.
- Depois da correção, iniciei uma sala Colyseus local com um bot e arrastei a câmera na partida em Chrome 156: 74,8 FPS em 2,5 s, mediana de 13,3 ms, nenhum intervalo acima de 50 ms (monitor de 75 Hz). Captura da partida: `%TEMP%\banco-chrome-fixed-main.png`.
- Teste de regressão em `src/ui/cashHudSymbols.test.ts` mantém os seletores `.cash-*` livres de filtro, perspectiva, transformação, recorte e sombra CSS. `npm run verify` passou com 181 testes em 34 arquivos e builds frontend/servidor; `git diff --check` passou.
- `graphify update .` foi tentado e falhou porque a CLI não está instalada; o MCP Graphify disponível aponta para outro repositório.

## 2026-10-29 — Cena sem luzes e sombras

- `npm run verify`: 180 testes em 33 arquivos passaram; builds frontend e servidor passaram. `git diff --check` passou. O chunk GLTF continua grande (956,03 KB / 259,61 KB gzip).
- Auditoria de `src/ui`: nenhuma luz Three/R3F, mapa/passe de sombra, `ContactShadows`, material Standard/Lambert ou flag de cast/receive shadow permaneceu no tabuleiro ou no HUD 3D do dinheiro. Os GLBs da cena também são convertidos para materiais sem iluminação, mantendo cor, mapa, transparência e alpha.
- Playtest local em sala Clássica com três bots: tabuleiro e HUD ficaram visíveis, com cores de imóveis, tokens, roletas, dinheiro na interface e ação de dados depois de remover as luzes; o arraste continuou girando a câmera. A imagem mostrou cores mais planas/pálidas, como esperado sem luz, sem placas ou sombras sobre o tabuleiro.
- Durante o arraste automatizado do navegador integrado, o medidor leu 7 FPS / 141,7 ms. O gerador de ponteiro do CUA limita essa amostra e não é evidência suficiente do FPS real do Chrome; a leitura deve ser repetida na máquina do usuário/Chrome. A tentativa de selecionar o Chrome standalone foi encerrada pela proteção que não identificou a URL da janela com confiança.
- Não alcancei manualmente Copa/Volta ou outra seleção de destino nesta partida. Testes unitários verificam a conversão para material sem iluminação, a redução de 80% no contraste, o escurecimento e a restauração após a seleção.
- `graphify update .` não pôde ser executado: CLI indisponível, e o Graphify MCP disponível aponta para `GustavoGLD/Hospital`, não para este repositório.

## 2026-10-29 — Correção após relato de 2 FPS

- `npm run verify`: 176 testes em 32 arquivos passaram; builds frontend e servidor passaram. O aviso do chunk GLTF permanece (955,20 KB / 259,21 KB gzip). `git diff --check` passou.
- Em uma partida local Colyseus com três bots, ativei o medidor e arrastei a câmera pelo gramado. A leitura indicou 77 FPS / 13,0 ms e depois 75 FPS / 13,3 ms. O tabuleiro continuou visível e os textos permaneceram legíveis no ângulo girado; o FPS voltou a “ocioso” quando a cena parou e o botão desligou a sobreposição.
- A validação visual aconteceu no navegador integrado com a cena de desenvolvimento local, não no Chrome standalone. A sessão CUA não disponibilizou uma conexão Chrome controlável; não contornei a proteção que impede selecionar a janela ativa.
- Otimizações cobertas por esta revisão: sem shadow map direcional dinâmico, só o piso das casas participa do raycast, filete de borda unido numa geometria, rótulos 512×256, antialiasing nativo desligado e Lambert nas faces dos pisos.
- `graphify update .` não rodou: a CLI não está instalada e o MCP Graphify disponível aponta para outro repositório.

## 2026-10-29 — Medidor opcional de FPS

- `npm run verify`: 175 testes em 32 arquivos passaram; builds frontend e servidor passaram. O build mantém o aviso conhecido do GLTF acima de 500 KB (955,19 KB / 259,21 KB gzip). `git diff --check` passou.
- O medidor usa `useFrame` da cena React Three Fiber sob demanda, não um contador RAF independente. Quando ativo, mostra FPS e tempo por quadro; após 1 segundo sem quadros indica ociosidade. O probe não é montado quando desligado. Testes cobrem 60 FPS, pausa, retomada e timestamps inválidos.
- Playtest no Chrome ficou pendente: a chamada CUA para selecionar a janela do Chrome foi encerrada por não conseguir determinar a URL atual com confiança suficiente. Não usei outro meio para contornar essa proteção.
- `graphify update .` não rodou porque a CLI não está instalada; o MCP Graphify disponível aponta para outro repositório.

## 2026-10-29 — Otimização de renderização e gesto global de câmera

- `npm run verify`: 171 testes em 31 arquivos passaram; builds frontend e servidor passaram. `git diff --check` passou. O build mantém aviso de chunk GLTF acima de 500 KB: 955,19 KB (259,21 KB gzip), carregado quando a partida abre.
- A implementação anterior de `ContactShadows` no Drei tinha `frames=Infinity`; a cena era capturada e o mapa desfocado a cada frame. Agora a captura ocorre uma vez em 256 px sem desfoque duplicado. O mapa de sombra direcional passou de 1024² para 512²; DPR máximo caiu de 1,6 para 1,25. Os dois canvases deixaram de animar continuamente em repouso.
- A cena de 3D não é reconciliada a cada tick do relógio quando os valores visuais não mudam. O módulo principal caiu de 1.419,60 KB (405,36 KB gzip) para 458,01 KB (143,60 KB gzip); o HUD 3D do dinheiro agora carrega sob demanda quando uma partida abre. Os 40 rótulos usam 768×384 em vez de 1024×512, reduzindo seu volume nominal de textura em 43,75%.
- Em partida Clássica local com três bots, observei rolagem, movimento do peão, chegada a propriedade e carta Sorte em viewport 690×880. A cena animou com renderização sob demanda. Um arraste pelo cartão de jogador sem controle girou a mesa; o botão “Não comprar” confirmou a ação sem efeito colateral de câmera.
- Os handlers usam Pointer Events e o mesmo caminho para toque e mouse; o teste automatizado confirma que áreas interativas não iniciam a rotação. Não foi possível revisar aparelho físico nem viewport de 390×844 nesta sessão.
- `graphify update .` foi tentado após as alterações, mas a CLI não está instalada; o MCP disponível continua apontando para outro repositório.

## 2026-10-29 — Dinheiro na HUD, roleta, cartas e dados

- `npm run verify`: 165 testes em 29 arquivos passaram; builds web e de servidor passaram. `git diff --check` passou. O aviso de bundle acima de 500 kB permanece conhecido.
- Em uma partida Colyseus local com três bots, conferi os quatro saldos ligados a modelos/ícones de barras de ouro, moedas de prata e cédulas junto aos cartões. Em viewport de 690×880, as peças ficaram acima dos cartões; em 390×844, ficaram dentro do canto superior de cada cartão, sem rolagem horizontal e sem cobrir o tabuleiro.
- A partida mostrou “Girar dados” e os dados com total 11 durante a resolução/movimento; depois que o peão parou, os dados desapareceram. Em ambas as viewports o botão inferior permaneceu alcançável e o tabuleiro coube na tela.
- Os quatro pisos Sorte agora usam setores radiais cobrindo o quadrado inteiro; testes cobrem área total e limites. A partida de revisão não alcançou uma carta nem Copa/Volta, então os cartões temporários, temporizador e fechamento dessas escolhas não foram inspecionados visualmente nesta rodada.
- `graphify update .` não rodou: o CLI não está instalado. O MCP Graphify disponível aponta para `GustavoGLD/Hospital`, não para este repositório.

## 2026-10-29 — Órbita e escolhas visuais da partida

- Blender 5.2.2 LTS conectado pelo MCP: criei e revisei os modelos autorais do estádio e do conjunto aeroporto/avião. Fontes editáveis em `assets/blender/special-corners.blend`; modelos exportados em `public/assets/world-cup-stadium.glb` e `public/assets/world-tour-airport.glb`.
- No navegador interno em 1440 × 900, iniciei uma partida Clássica real com três bots. O canvas carregou; arrastei a mesa para girar e inclinar. A primeira revisão encontrou rolagem indesejada; fixei o eixo vertical da câmera e confirmei que novo arraste orienta a mesa sem cortar as bordas.
- Na mesma partida, observei uma compra real de Alameda Azul: as quatro opções de terreno/níveis de casa exibiram os aluguéis e custos, junto do aluguel selecionado. O prazo expirou e a recusa automática manteve o espaço sem dono. A inspeção contextual de imóveis ocupados e os fluxos Copa/Volta não foram alcançados manualmente nesta sessão; a lógica de seleção direta de casas válidas tem testes unitários.
- `npm run verify`: 158 testes em 26 arquivos passaram; builds web e servidor passaram. Um teste de regressão mantém o eixo vertical fixo nos seis azimutes revisados. O chunk `BoardScene` ficou em 1.004,84 kB (274,75 kB gzip), acima do aviso de 500 kB. `git diff --check` passou após a correção de câmera.
- Não revisei viewport móvel nem capturei visualmente as casas especiais no jogo nesta sessão. A geometria dos modelos foi conferida no Blender; a validação visual no tabuleiro desses dois assets permanece pendente.

> As entradas anteriores registram testes da versão existente naquele dia. A escolha ao cair em uma propriedade livre continua sendo **comprar ou não comprar**; leilão é uma ação voluntária separada para vender um título que o jogador já possui.

## 2026-10-29 — Seletor de fichas visuais

- `npm run verify`: 150 testes em 24 arquivos passaram; builds do frontend e servidor passaram. O build web mantém o aviso conhecido do chunk 3D acima de 500 kB.
- Testes novos cobrem as quatro opções válidas, rejeição de identificadores desconhecidos, escolha por jogador sincronizada antes do início, persistência durante a partida e bloqueio de mudanças após começar. Bots continuam com peão por padrão.
- Blender 5.2.2 LTS MCP: os três modelos autorais foram inspecionados em três quartos e o GLB final foi reimportado na cena; raízes `Token_Car`, `Token_Motorcycle` e `Token_Airplane`, 26 malhas, material `OWNER_TINT`. Fonte em `assets/blender/player-tokens.blend`; GLB Y-up em `public/assets/player-tokens.glb`.
- Playtest visual no Chrome não foi concluído: a ferramenta CUA bloqueou a leitura do navegador no Windows porque não conseguiu determinar a URL da janela ativa e encerrou o controle de navegador para esta rodada. O navegador integrado segue desativado. A sala Colyseus e o Vite locais chegaram a iniciar; as sessões foram encerradas após a tentativa.
- Pendente: validar visualmente os quatro estados de ficha e a cor dos donos em Chrome ou navegador interno quando o controle de navegador estiver disponível. Não há captura de navegador para esta mudança.

## 2026-10-29 — Bairros em sequência e casas de Sorte

- `npm run verify`: 145 testes em 22 arquivos passaram; build web e build do servidor passaram. O build web mantém o aviso conhecido do chunk 3D acima de 500 kB.
- Testes cobrem os oito grupos residenciais com três IDs consecutivos por grupo, dois grupos por lado, a localização das quatro casas Sorte e o tema dourado distinto. O bônus de aluguel por grupo completo continua coberto pela suíte de regras.
- A revisão foi concluída no Chrome 156 headless usando um perfil temporário isolado e DevTools restrito a loopback; o navegador integrado continua desativado nas configurações de Work. Em uma partida Clássica local com três bots, a mesa avançou até o turno 9 e mostrou as roletas douradas nos quatro espaços de Sorte. Observei um bot anunciar “Girando os dados” e depois “Movendo o peão”; havia no máximo um balão de atividade visível.
- Em desktop (1280×900) e celular simulado (390×844), o canvas e o documento couberam na viewport sem overflow horizontal. O tabuleiro inteiro permaneceu visível nos dois tamanhos. Capturas temporárias: `.tmp/browser-test-desktop.png` e `.tmp/browser-test-mobile.png`.
- Os processos locais do Vite e Colyseus permaneceram sem erros nos logs durante a validação. Esta revisão não cobriu Firefox nem aparelho físico.
- `git diff --check` passou.

## 2026-10-29 — Velocidade e observação de jogadas

- `npm run verify`: 143 testes em 22 arquivos passaram; build web e build do servidor passaram. O build web continua registrando o aviso conhecido do chunk 3D acima de 500 kB.
- Em uma partida Clássica no navegador local, com três bots, o controle do anfitrião apareceu em 0,5× e aceitou 2×. Os dados 3D ficaram visíveis na área central enquanto rolavam, sem o cartão de ação encobrindo a cena.
- Após a jogada humana, o turno do Bot 1 manteve o cartão central oculto. A bolha sobre o peão anunciou “Movendo o peão”; a cena mostrou os dados durante a rolagem do bot e o percurso sem caixa modal.
- A validação foi feita na viewport apresentada pelo navegador integrado (690 × 880). Não foi feita nesta sessão uma verificação em aparelho físico ou Firefox.
- A captura indicou que o balão ainda ficava pequeno; aumentei sua escala 3D (`distanceFactor` 8→12) e a fonte desktop (11→13 px; móvel 9→11 px). A revisão visual após esse ajuste foi bloqueada porque o CUA retornou `Local browser use is disabled in Work settings`; confirmei também que este projeto não tem Playwright instalado. O tamanho final precisa de conferência no próximo playtest autorizado.
- `git diff --check` passou.

## 2026-10-28 — Sequência de jogada, liquidação e câmera alta

- A partida agora publica uma sequência de dados autoritativa que anima também rolagens repetidas com o mesmo resultado. O cliente segura o peão durante a animação dos dados; depois da rolagem, anima os passos e só então libera a ação da casa.
- O servidor valida que o vendedor está na vez ao abrir leilão, bloqueia início e lances durante dívida, e só permite vender construções/hipotecar durante dívida enquanto o saldo continuar insuficiente. Testes de integração cobrem essas restrições.
- Revisei a partida em Chrome headless com WebGL por software em desktop (1440 × 900) e celular (390 × 844). O tabuleiro coube nos dois viewports sem rolagem horizontal; no celular a mesa inteira permaneceu visível. A cena ainda fica pequena em celular, mas o enquadramento deixa o tabuleiro completo legível como conjunto.
- Em uma partida local real, acompanhei três lançamentos: cada um mostrou “Rolando os dados…” antes de “Peão em movimento…”, e as ações da casa só apareceram depois do movimento. No terceiro lançamento, a janela “Comprar Costa Branca” apareceu após o peão parar, com as opções de compra e recusa habilitadas.
- Capturas inspecionadas: `.codex-tmp/review-desktop-initial.png`, `.codex-tmp/review-mobile-initial.png` e `.codex-tmp/review-purchase.png`. Os arquivos são temporários e não fazem parte do repositório.
- `npm run verify`: 116 testes passaram; build web e build do servidor passaram. `git diff --check` passou. O build mantém o aviso conhecido de chunk da cena 3D acima de 500 kB.

## 2026-10-28 — Leilão voluntário entre jogadores

- Em uma sala local com dois clientes no Chromium integrado, comprei Rua das Palmeiras por R$ 120.000 e abri a carteira. O dono escolheu R$ 120.000 como lance inicial e iniciou o leilão mesmo com outro jogador fora da vez.
- O segundo cliente viu o nome do vendedor, o imóvel, o preço inicial, o contador e o campo de lance. Deu o lance mínimo; o valor foi reservado do saldo durante os segundos restantes e, ao terminar, a propriedade passou para o licitante e o vendedor recebeu o valor.
- A carteira mostra os controles de hipoteca e lance inicial sem esconder o tabuleiro. O painel de disputa cabe no viewport, usa a mesma identidade visual leve da HUD e é recolhível.
- A suíte completa valida também lance superado com devolução do valor reservado, permanência da hipoteca no título transferido, lance proibido do vendedor, início fora da vez e bloqueio de imóvel livre ou com construções no grupo.

## 2026-10-28 — Recusa de compra e leitura das casas

- No navegador interno, abri uma sala local com duas conexões, iniciei uma partida Clássico e caí em Lago Sereno. A tela apresentou preço, aluguel inicial, custo por nível e as ações “Comprar” e “Não comprar”. Recusei: o imóvel continuou livre, o texto confirmou a escolha e “Concluir vez” ficou disponível.
- Cliquei numa casa distante no tabuleiro. O inspetor DOM mostrou o nome completo, dono, preço, aluguel e custo de construção; em um imóvel livre, o aluguel exibido corresponde à renda base.
- Aumentei o tamanho e o contraste dos nomes impressos no tabuleiro, removi os preços redundantes e apliquei filtragem anisotrópica para reduzir o borrão em perspectiva. A revisão foi no Chromium integrado em 1280 × 720; Chrome do sistema, Firefox, celular, casas coloridas após compra e construções 3D ainda precisam de revisão visual dedicada.
- Testes automatizados da regra de recusa e do caminho de animação são executados pela suíte completa; o build também valida o componente da cena 3D.

## 2026-10-28 — Referências de Business Tour e entrada da mesa

- Consultei a [página oficial da Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/), a [galeria Interface In Game](https://interfaceingame.com/games/business-tour/) e a [listagem de capturas do SteamDB](https://steamdb.info/app/397900/screenshots/). A página e a galeria mostram a variedade de estados: mesa privada, tabuleiro, rolagem, venda de propriedade, falta de dinheiro e placar. A galeria é histórica; usei-a para mapear apresentações, e as capturas da Steam para comparar a mesa pública atual.
- A tela de entrada estava com a cena 3D muito apagada e os modos apresentados como abas sublinhadas. Aumentei a presença e a saturação do tabuleiro ao fundo e transformei os modos em cartões selecionáveis, mantendo texto e controles próprios.
- Revisei capturas no Google Chrome headless em 1440 × 900 e 390 × 844. A mesa e os peões ficaram mais visíveis no desktop; em celular, o formulário e os dois modos couberam na largura da tela sem corte horizontal aparente.
- Capturas revisadas: `/tmp/banco-visual-audit-before.png`, `/tmp/banco-visual-audit-after-desktop.png` e `/tmp/banco-visual-audit-after-mobile.png`. O Chrome usou renderização WebGL por software neste ambiente.
- A validação cobre a tela de entrada; lobby e estados da partida não foram alterados nesta revisão.

## 2026-10-28 — Prisão com saldo abaixo da fiança

- Abri uma sala com duas sessões Chrome numa cópia temporária da sala de jogo, inicializando a anfitriã presa com R$ 49.999. A cópia e o servidor de teste foram removidos após a revisão.
- Em 1440 × 900 e 390 × 844, o cartão informa que a fiança é R$ 50.000, orienta tentar duplas e mantém “Pagar fiança” desativado. A mensagem é clara, o cartão cabe nas duas telas e `scrollWidth` corresponde à largura do viewport (1440 e 390).
- Revisei a mesa 3D e os dois cartões de participantes em ambas as resoluções. No Chrome headless, precisei redimensionar a janela uma vez para o primeiro quadro WebGL aparecer; após isso a cena permaneceu visível.
- Capturas revisadas: `/tmp/banco-jail-insufficient-desktop-after-resize.png` e `/tmp/banco-jail-insufficient-mobile.png`.

## 2026-10-28 — Segundo balanço dos objetivos Express

- A simulação anterior de 80 partidas indicou baixa ocorrência para completar grupos, construir e possuir duas estações. Substituí essas metas por quatro propriedades, uma estação, receber/pagar aluguel, tirar uma carta e cruzar a Partida; as duas metas mais simples de posse foram mantidas.
- Os testes de integração confirmam que cruzar a Partida conta junto do bônus de passagem, cartas e aluguéis atualizam somente a carta privada correspondente, e um aluguel em dívida só progride após a quitação integral.
- Os objetivos permanecem no servidor fora do estado público da sala e continuam pagando uma única vez. A suíte direcionada passou: `shared/objectives.test.ts` e `server/test/GameRoom.test.ts` (38 testes no total).
- A simulação atualizada está registrada na seção abaixo. Ainda faltam playtests humanos direcionados antes de considerar os bônus calibrados.

## 2026-10-28 — Simulação do baralho Express recalibrado

- Executei 80 partidas completas pelo servidor Colyseus autoritativo: 40 com duas pessoas e 40 com quatro. Todas terminaram sem falhas e distribuíram 240 cartas de objetivo sem repetição dentro de cada sala.
- Estratégia simulada: comprar um imóvel quando a compra deixa pelo menos R$ 200.000 em caixa; caso contrário, recusar e passar no leilão. A simulação tenta duplas na prisão e liquida dívidas pagando, vendendo construções ou hipotecando bens disponíveis. Não constrói e não negocia, portanto mede uma estratégia simples, não o limite de jogo intencional.
- Conclusões entre as cartas distribuídas: primeira propriedade 16/17 (94%); três propriedades 23/33 (70%); quatro propriedades 13/30 (43%); uma estação 14/33 (42%); receber aluguel 14/30 (47%); pagar aluguel 13/30 (43%); tirar carta 13/34 (38%); cruzar a Partida 23/33 (70%).
- Nenhum objetivo ficou sem possibilidade observada de conclusão, e todas as partidas simuladas terminaram. As amostras por objetivo variam de 17 a 34 cartas; isso serve como verificação de alcance, não como prova de equilíbrio dos bônus. Playtests humanos ainda são necessários.
- Roteiro usado: `/tmp/banco-express-balance-sim-current.mts`; o limite aumentado de passos corrige interrupções prematuras do roteiro anterior, sem modificar o servidor do jogo.

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

## 2026-10-28 — Placar móvel e repetição Chrome–Firefox

- Repeti uma partida Express real entre Chrome (1280 × 720) e Firefox (1366 × 682). Os dois clientes encerraram após a sexta rodada com a mesma classificação e critério; o cliente Chrome não reportou alertas de erro.
- Na revisão em Chrome móvel (390 × 844), o placar central cobria a área mais legível do tabuleiro. Posicionei o cartão final abaixo da área principal em telas estreitas. Na nova captura, o cartão ocupa x=10–380 e y=459–788, deixando a parte superior da mesa visível; `scrollWidth` permaneceu em 390.
- Após encerrar a mesma partida, redimensionei os dois navegadores para 390 × 844. Chrome e Firefox mantiveram o cartão em x=10–380 e y=459–788; em ambos, `scrollWidth` ficou em 390 e a cena WebGL permaneceu visível acima do resultado.
- Adicionei um teste de regressão para manter a regra de posição no breakpoint móvel e conferi o resultado visual na captura real, pois o teste de CSS não mede a cena WebGL.
- Capturas inspecionadas: `/tmp/banco-chrome-firefox-match.png`, `/tmp/banco-firefox-final.png`, `/tmp/banco-chrome-firefox-mobile.png` e `/tmp/banco-firefox-mobile-final.png`.
- Chrome e Firefox headless usaram renderização WebGL por software. A tela carregou e os dois estados finais coincidiram; o Firefox exibiu avisos do backend gráfico por falta de acesso ao dispositivo GPU.
- `npm run verify`: 91 testes passaram; build web e build do servidor passaram. O bundle cliente continua acima do limite de 500 kB.

## 2026-10-28 — Carregamento adiado da cena 3D

- O grafo Graphify apontou a ligação direta `App() → BoardScene()`. A cena agora é um chunk dinâmico e só começa a montar depois da primeira tela, em tempo ocioso; ao entrar na partida, ela é habilitada imediatamente. O fallback de 1,8 s cobre navegadores sem `requestIdleCallback`.
- Build de produção: chunk inicial de 428,50 kB (134,16 kB gzip); cena de 892,77 kB (241,03 kB gzip). O HTML inicial referencia apenas o chunk principal. A cena continua acima do aviso de 500 kB, mas sai do caminho de carregamento da entrada.
- No navegador interno, revisei a tela inicial em viewport estreito e confirmei o tabuleiro aparecendo após a carga adiada. No Chrome headless, com SwiftShader/WebGL habilitado e espera de 6 s, o canvas montou e a cena ficou visível atrás da interface. A captura correspondente está em `/tmp/banco-lazy-load-chrome.png`.
- O Firefox headless capturou a tela antes do timer da cena; não há perfil Firefox conectado ao controlador visual desta sessão para aguardar o carregamento e confirmar a cena pós-idle. Portanto, a validação visual desta mudança no Firefox segue pendente.
- Testes cobrem o agendamento em tempo ocioso, fallback por timer e execução única; `npm run test`: 93 testes passaram. O build web passou. O primeiro teste no sandbox não conseguiu abrir o socket local do Colyseus; a repetição com acesso a loopback passou.

## 2026-10-28 — Limite de participantes da sala

- A sala já declara `maxClients = 4`; acrescentei um teste de integração com quatro conexões reais e uma quinta tentativa. As quatro primeiras entram, a quinta é rejeitada e os quatro jogadores continuam no estado sincronizado.
- `server/test/GameRoom.test.ts`: 35 testes passaram, incluindo o novo caso de capacidade.
- No navegador, quatro clientes ocuparam os lugares, o anfitrião iniciou a partida, a tela mostrou os quatro participantes nos cantos e o tabuleiro no centro. Após rolar e comprar Lago Sereno por R$ 180.000, o saldo do anfitrião caiu para R$ 1.320.000 e a vez avançou para a segunda pessoa. Inspecionei a captura no navegador interno a 1265 × 711.

## 2026-10-28 — Sala cheia em viewport móvel

- Em Chrome headless com WebGL por SwiftShader, abri uma sala Clássica com quatro conexões Colyseus reais em 390 × 844. O lobby exibiu 4/4 lugares e o botão de início; no jogo, os cartões dos quatro participantes ficaram em grade 2 × 2, o tabuleiro permaneceu visível e a ação do turno coube abaixo dele.
- A viewport e o `documentElement.scrollWidth` ficaram em 390 px tanto no lobby quanto na partida. Os cartões ocuparam x=9–381 px e y=97–201 px na partida, sem rolagem horizontal.
- Capturas: `/tmp/banco-four-player-mobile-lobby.png` e `/tmp/banco-four-player-mobile-game.png`.

## 2026-10-28 — Partida completa no Firefox

- No Firefox 156.0.1 headless, criei uma sala Clássica, conectei quatro clientes Colyseus, iniciei a partida e confirmei que os quatro cartões e o tabuleiro 3D apareceram. A viewport e o canvas ficaram em 1366 × 682; `scrollWidth` permaneceu igual a `clientWidth`, sem rolagem horizontal.
- Lancei os dados (5 + 4), comprei Porto Dourado por R$ 160.000 e confirmei o saldo sincronizado de R$ 1.340.000. Ao concluir a vez, o estado mudou para turno 2 de Teste Bia; os outros três saldos permaneceram em R$ 1.500.000.
- Uma primeira tentativa de usar a quarta vaga numa sala de teste foi recusada porque uma conexão anterior havia encerrado sem sair e ainda ocupava a janela de reconexão de 60 segundos. Em uma sala nova, os quatro clientes entraram e iniciaram normalmente.
- Capturas inspecionadas: `/tmp/banco-firefox-four-player-game.png` e `/tmp/banco-firefox-four-player-synced.png`. O Firefox usou WebGL por software e registrou aviso do backend gráfico, mas a cena carregou e as ações foram aplicadas.

## 2026-10-28 — HUD do modo Express no Firefox

- No Firefox headless, criei uma sala Express e iniciei uma partida real com duas conexões. O lobby apresentou “6 rodadas • objetivos valem bônus”; a partida abriu em Rodada 1/6 com fase de 40 segundos e tabuleiro 3D carregado.
- Abri o cartão privado da anfitriã: “Primeira escritura”, progresso 0/1 e bônus de R$ 50.000. O elemento de progresso expôs corretamente o valor acessível `aria-valuenow=0` e alvo 1. O documento permaneceu sem rolagem horizontal em 1366 px.
- Ao expirar a fase de 40 segundos sem ação, o turno avançou automaticamente para a segunda pessoa e o contador reiniciou. A inspeção do cartão consumiu a fase da anfitriã; por isso, esta sessão não validou compra nem conclusão de objetivo no navegador. Esses comportamentos continuam cobertos pelos testes de integração do servidor.
- Captura inspecionada: `/tmp/banco-firefox-express-objective.png`. A renderização WebGL por software exibiu a cena; a validação do placar após seis rodadas não foi feita nesta sessão.

## 2026-10-28 — Cartão de jogada compacto

- Reduzi a largura máxima do cartão de jogada desktop de 390 para 350 px e o espaçamento interno de 15 × 17 para 12 × 15 px; a regra móvel mantém a largura quase completa da viewport.
- No Firefox headless em 1366 × 682, o cartão ficou em 350 × 143 px, a cena 3D permaneceu visível e não houve rolagem horizontal. Em uma segunda captura, o viewport informado pelo Firefox foi 500 × 758 apesar da solicitação de 390 × 844; o cartão móvel ocupou 480 px e o documento continuou sem overflow.
- Capturas inspecionadas: `/tmp/banco-firefox-compact-turn-card.png` e `/tmp/banco-firefox-compact-turn-card-mobile.png`. A versão móvel preservou a largura fluida; o viewport limitado do Firefox não substitui a validação móvel anterior em Chrome 390 × 844.

## 2026-10-28 — Game juice, avisos e acessibilidade

- Acrescentei rolagem animada dos dados, pulso na casa alcançada, surgimento curto para casas/hotel e opção de movimento reduzido que também respeita `prefers-reduced-motion`. Sons sintetizados de dados, compra, dinheiro, leilão e objetivo podem ser desligados; eventos mostram um aviso breve com a variação do saldo local.
- O navegador integrado criou uma sala Clássica com dois clientes, iniciou a partida, lançou 6 + 3 e comprou Porto Dourado. O HUD mostrou o resultado dos dados, o saldo de R$ 1.340.000 e um aviso de compra com `−R$ 160.000`. Testei por teclado os controles de som e movimento reduzido; o atributo de acessibilidade mudou para `true` e a largura do documento permaneceu igual à viewport estreita de 503 px.
- A integração do servidor concluiu seis rodadas Express com quatro clientes reais e verificou encerramento, classificação por saldo/patrimônio e definição de vencedor.
- `npm run verify`: 107 testes passaram; builds web e de servidor passaram. O build ainda informa o chunk da cena 3D acima de 500 kB. A revisão visual desta mudança foi feita no navegador integrado; não repeti a captura em Firefox nem em um aparelho móvel físico.

## 2026-10-28 — Modelos low-poly e pisos coloridos

- Usei Blender 5.2.2 LTS pelo MCP conectado. A prévia corrigida mostrou o terreno com bandeira, uma casa, duas casas, três casas e o hotel. A primeira tentativa ficou deitada por usar Y como altura em Blender, que usa Z-up; refiz a geometria com Z-up e exportei GLB com Y-up. O GLB tem cinco raízes estáveis e material OWNER_TINT para receber a cor do dono. O add-on Blender MCP informou protocolo 14 frente ao 15 esperado, mas criação, inspeção e exportação funcionaram.
- No navegador interno, abri uma sala Clássica com três bots, iniciei a partida e joguei até cair em Jardins do Norte. Comprei por R$ 280.000; o HUD confirmou saldo de R$ 1.220.000 e um imóvel. O canvas mostrou os pisos residenciais com a cor do grupo em toda a superfície, e paletas diferentes em cantos, estações, Sorte ou Revés, taxas, praça e prisão. Marcas geométricas identificam moedas, cartas, barras e cantos.
- Captura visual inspecionada diretamente na aba IAB do jogo, na viewport disponível de 877 × 877. Nesse enquadramento quadrado, a borda inferior do tabuleiro encosta no painel de ação. A captura confirmou o terreno recém-comprado; os níveis de casa e hotel foram inspecionados na prévia do Blender, não em uma partida construída. A revisão em viewport móvel e no Firefox continua pendente.
- Corrigi o playtest local depois de confirmar que processos iniciados sob sandbox sem loopback ficam inalcançáveis mesmo exibindo “ready/listening”. A correção foi iniciar cada servidor uma vez com permissão de loopback e abrir uma aba nova na URL explícita. Uma tentativa de servidor duplicado registrou EADDRINUSE na porta 2567; a instrução agora exige conferir e encerrar uma instância antiga antes de iniciar outra.
- `npm run verify`: 119 testes em 20 arquivos passaram; build do cliente e build do servidor passaram. Os três testes novos cobrem cor integral dos 24 imóveis residenciais, distinção das categorias especiais e os quatro pisos de canto. O build mantém o aviso de chunk da cena acima de 500 kB (974,19 kB).

## 2026-10-28 — Dinheiro 3D e leitura de casas (em andamento)

- No Blender conectado 5.2.2 LTS, criei `Cash_NoteStack`, `Cash_SilverStack` e `Cash_GoldBar` e exportei `public/assets/money-models/money-models.glb`; a fonte editável foi salva em `assets/blender/board-models.blend`. A prévia do Blender confirmou as formas low-poly, os materiais verde, prata e ouro e as três raízes GLB.
- A representação proposta e implementada no helper é exata: barra de ouro = R$ 500.000, pilha de prata = R$ 50.000, maço de notas = R$ 10.000; sobras abaixo de R$ 10.000 viram uma nota proporcional. Os testes direcionados verificaram decomposição exata, valores de partida e saldos não finitos (18 testes passaram).
- A captura inicial no browser mostrou três barras sobrepostas. Separei as peças por denominação em grades e adicionei nomes e valores pequenos às bases. Também reduzi a área/fonte dos rótulos das casas, aumentei os modelos para 116% e alinhei suas bases à superfície; uma moldura recebe a cor do dono.
- Na primeira execução, o build reportou alterações concorrentes em `App.tsx` (incluindo `buildOptions` não definido e símbolos não usados), e o console do browser registrou mudança no tamanho da lista de dependências de um efeito de `AnimatedPawn`. A verificação completa foi repetida em 2026-10-28 e passou; o playtest visual completo continua pendente.
- A sala de browser com duas pessoas chegou a iniciar e exibiu R$ 1.500.000 para cada pessoa. A conexão caiu durante a atualização concorrente do Vite; não consegui revisar a segunda disposição das barras nem ver construções em uma partida antes do encerramento.
## 2026-10-28 — Sons de dinheiro, ajuda e prazo de turno

- `npm run verify`: 134 testes em 21 arquivos passaram; build web e build do servidor passaram. O build web mantém o aviso conhecido do chunk `BoardScene` (977,37 kB).
- `git diff --check` passou.
- Playtest visual pendente. O servidor de desenvolvimento Colyseus encontrou `EADDRINUSE` em 2567; a porta alternou entre ocupada e livre, sem processo persistente identificável. Não foi iniciada outra instância enquanto a porta estava ocupada.
- Casos automatizados desta frente cobrem rolagem automática e recusa de compra após a janela de decisão; os testes de regra foram atualizados para as regras de construção já implementadas.

## 2026-10-28 — Jogadas lentas e serializadas, janelas centrais e construções

- `npm run verify`: 135 testes em 21 arquivos passaram; builds web e do servidor passaram. O bundle de cena continua acima do aviso de 500 kB. `git diff --check` passou.
- No navegador integrado, iniciei uma partida Clássica com três bots e observei a progressão em turnos reais. A rolagem e o movimento do bot aparecem como fases distintas, sem dados visíveis durante o movimento ou janela de decisão; a janela de turno fica no centro. A compra apresenta terreno e níveis de zero a três casas.
- Viewports revisadas: desktop 1280 × 720 e móvel responsiva 390 × 844. A largura do documento permaneceu dentro da viewport e a ação ficou centralizada. Não foi usado dispositivo móvel físico nem Firefox.
- Testes de servidor cobrem que outros bots não avançam durante a rolagem/movimento do bot ativo, compra inicial com três casas e hotel somente depois de outra visita. Também cobrem movimento sem reposicionamento antes da animação.
- A pedido do usuário, a rolagem foi alongada de 1,8 s para 2,8 s e cada casa de 0,42 s para 0,75 s; teleporte e construção também foram desacelerados. A suíte completa é repetida pelo hook de commit após essa alteração de temporização.

## 2026-10-29 — Prévia do dinheiro 3D no navegador

- Iniciei uma partida Clássica local com uma pessoa e três bots. Os quatro cartões mostraram R$ 1.500.000; a mesa 3D carregou e a interação percorreu rolagem, movimento e painel de compra de Alameda Azul.
- A cena visível confirmou que a mesa e os indicadores carregaram no cliente após a integração dos modelos de dinheiro. O painel central permaneceu sobre o tabuleiro e o enquadramento não permitiu distinguir com segurança as malhas de nota, prata e ouro; a aparência dessas peças com saldos diferentes continua pendente de revisão dedicada.
- Portas usadas nesta sessão: Colyseus `2568` e Vite `5175`, com `VITE_ROOM_SERVER_URL` apontado ao servidor local. As portas usuais `2567` e `5173` não estavam acessíveis.
- A cobertura automatizada de decomposição do saldo e a suíte completa estão registradas na frente que publicou a implementação (`135` testes, builds web e servidor).

## 2026-10-29 — Cantos novos e controle horizontal da câmera

- `npm run verify`: 153 testes em 25 arquivos passaram; build web e build do servidor passaram. O build web mantém o aviso conhecido do chunk 3D acima de 500 kB. `git diff --check` passou.
- Em uma partida local no navegador integrado (1280 × 720), testei inclinação de 0°, 16° e 75° e giros horizontais de 0°, 45° e 90°. O tabuleiro completo permaneceu no enquadramento e o slider horizontal foi reposicionado para liberar a área das casas no ângulo padrão.
- A integração do servidor valida os três turnos completos na prisão, o aluguel triplicado na propriedade escolhida pela Copa, a rejeição de propriedade rival na Volta ao Mundo e o teletransporte para Partida sem bônus.
# Perfil, propostas, sons e rolagem de aluguel — 2026-10-30

- `npm run verify`: 214 testes em 40 arquivos passaram; builds frontend e servidor passaram. O build ainda apresenta o aviso conhecido de chunk de cena 3D em 956,43 KB (259,81 KB gzip).
- `git diff --check` passou. Testes de regressão cobrem proposta que permanece ativa ao trocar a vez, envio fora da vez e revalidação no aceite; rolagem autoritativa da estação e apresentação de apenas um dado 3D; mapeamento de sons para caixa, perda distorcida, dados, construção e silêncio.
- Playtest visual não concluído: `npm run dev:server` retornou `EADDRINUSE` na porta 2567. `Get-NetTCPConnection`, `netstat -ano` e enumeração de processos disponíveis não identificaram o listener para encerrar com segurança; sem servidor Colyseus não foi possível abrir a sala nem capturar o perfil ou a estação no navegador.
- `graphify update .` não executou: o comando `graphify` não está instalado neste ambiente.
# Painel de compra, inspeção, controles e nitidez — 2026-10-30

- `npm run verify`: 218 testes em 42 arquivos passaram; builds frontend e servidor passaram. O chunk de cena 3D mantém o aviso conhecido (956,43 KB / 259,81 KB gzip).
- `git diff --check` passou. Testes cobrem a decisão de compra mesmo com casa inspecionada anteriormente, labels de aluguel apenas com proprietário, steppers com limites de saldo, estilo de som de passo e faixas de DPR com qualidade alta padrão.
- Revisão visual pendente: a porta 2567 aparentou livre na enumeração, mas o servidor terminou com `EADDRINUSE`; não foi possível identificar um processo/listener para encerrar. Sem a sala Colyseus, não capturei a inspeção ou as opções gráficas no navegador.
- `graphify update .` não executou porque a CLI `graphify` não está instalada.

## Aluguel ampliado, opções em tela cheia, emotes, hotel e sons de cantos — 2026-10-30

- `npm run verify`: 224 testes em 44 arquivos passaram; builds frontend e servidor passaram. O aviso conhecido de chunk de cena continua em 956,45 KB (259,83 KB gzip).
- Regressões: broadcast e validação de emote no Colyseus, símbolos dos seis emotes, som ligado aos cantos Aeroporto/Prisão/Copa e tintura da fachada azul do hotel com preservação do material dos vidros.
- Playtest de navegador não concluído: `npm run dev:server` retornou `EADDRINUSE` na porta 2567 mesmo sem listener listado; a sessão recém-iniciada foi encerrada, e não foi encerrado nenhum processo desconhecido. Não capturei screenshot das novas opções, do balão de emote ou do aluguel ampliado.
- Graphify query foi tentado, mas o único repositório consultável era `GustavoGLD/Hospital`, sem relação com este jogo; a CLI e ferramenta de atualização do grafo deste checkout não estão disponíveis.

## HUD de turno, atalhos e leitura do aluguel — 2026-10-30

- `npm run verify`: 225 testes em 44 arquivos passaram; builds frontend e servidor passaram. O aviso existente sobre o chunk 3D maior que 500 KB continua. `git diff --check` passou.
- Regressão adicionada: `getBuildingRentLabelPosition` mantém o rótulo acima do topo e na mesma faixa lateral da construção para os lados do tabuleiro.
- Revisão visual local pendente: as portas 5173/2567 pareciam livres, mas o servidor Colyseus retornou `EADDRINUSE` na porta 2567. Encerrei a sessão recém-iniciada; nenhum processo desconhecido foi encerrado. Assim, a organização desktop/celular e a leitura da inspeção ainda não foram capturadas no navegador.
- Graphify MCP não tem índice deste repositório e `graphify update .` falhou porque a CLI não está instalada.

## Compra depois de carta de avanço e piso sem texto — 2026-10-30

- Regressão do servidor: ao concluir o movimento de três casas iniciado por uma carta, a resolução de destino limpa o título/descrição da carta antes de publicar a fase da casa. Se o destino estiver livre, continua em `purchase` com o `pendingPropertyId` correto; isso permite que o cliente volte a renderizar o painel de compra.
- Regressão visual: as casas `event` não renderizam `SpaceLabel`; a roleta de setores permanece no piso. Os demais espaços mantêm seus nomes.
- `npm run verify`: 227 testes em 44 arquivos passaram; builds do frontend e servidor passaram. `git diff --check` passou. O aviso já conhecido de chunk 3D acima de 500 KB permanece.
- Playtest visual indisponível: as portas 5173/2567 pareciam livres, mas o servidor Colyseus retornou `EADDRINUSE` na 2567. Encerrei a sessão recém-iniciada sem interromper processos desconhecidos.
- `graphify update .` não executou porque a CLI `graphify` não está instalada; o índice MCP disponível pertence a outro repositório.

## Seleção de propriedades pelo tabuleiro — 2026-10-31

- Unifiquei a interação de seleção no tabuleiro para alvos de carta, propriedades liquidáveis durante dívida, títulos que entram em uma troca e inspeção de imóveis pela carteira. A cena existente ilumina as opções válidas, reduz o contraste das demais e só aceita cliques nas válidas; a seleção de jogadores continua nos controles de jogadores.
- Em partida local com três participantes, comprei Parauapebas por R$ 275.000, abri Bens e ativei “Escolher imóvel no tabuleiro”. O screenshot confirmou Parauapebas iluminada com aro dourado, casas não selecionáveis apagadas e o tabuleiro clicável. Ao clicar na casa, abriu o inspetor de Parauapebas com preço, aluguel e níveis. Nenhum erro de interação foi observado.
- `npm run graphify -- update .` atualizou o grafo para 882 nós e 1.640 relações. `git diff --check` passou. `npm run verify`: 228 testes em 44 arquivos passaram; builds frontend e servidor passaram. O chunk 3D mantém o aviso existente acima de 500 KB.
# Correção do painel de encerramento — 2026-10-31

- Investigação: a tela final era bloqueada quando havia título de carta ativo ou avisos transitórios na fila. Uma animação local pendente também podia substituir o nome do vencedor e a mensagem do resultado.
- Implementação: prioridade explícita para resultado encerrado; reset de animação, feedback e painéis locais ao entrar na fase final. Ajuda e configurações deixam de renderizar sobre o resultado no mesmo ciclo de atualização.
- Regressão automatizada focada: `src/ui/turnActivity.test.ts` cobre a prioridade diante de carta, animação e feedback pendentes.
- `npm run verify`: 229 testes em 44 arquivos passaram; builds frontend e servidor passaram. Para os testes Colyseus, o loopback local foi liberado após `fetch failed` no sandbox. O aviso conhecido de chunk de cena 3D acima de 500 KB permanece. Graphify atualizado.
- Limite: o estado final não foi alcançado manualmente na interface nesta sessão; testes de integração existentes verificam o encerramento autoritativo do servidor e a regressão exercita a decisão de visibilidade do cartão.

## 2026-10-31 — Encerramento por tempo no navegador

- Em uma sala local com duas pessoas, deixei o relógio da partida chegar a zero. A interface mudou para “PARTIDA ENCERRADA”, mostrou o vencedor e a classificação com patrimônio/saldo, e manteve o botão “Voltar ao início” funcional. O painel não ficou preso na carta ou em outra etapa.
- Essa observação confirma o fluxo visual de encerramento por tempo; a falência ainda precisa de uma observação manual pela interface. Os testes de integração existentes cobrem o encerramento autoritativo por falência.

## Nome Volta ao Brasil e cartas no navegador — 2026-10-31

- Em partida local com DEV ativo, forcei uma dupla até Sorte ou Revés. O baralho apresentou Troca-troca; escolhi os dois participantes e o servidor confirmou a troca sem resolver as casas de chegada.
- Outra carta levou a pessoa à Volta ao Brasil. O tabuleiro iluminou os destinos disponíveis; escolhi São Paulo e a partida abriu a compra por R$ 950.000, com saldo acrescido do bônus de R$ 200.000 por chegar ao canto. A seleção e a chegada funcionaram, mas a revelação ainda mostrava “VOLTA AO MUNDO”.
- A carta Prisão foi testada em seguida: a ficha chegou ao canto, na vez posterior apareceram “Tentar duplas”, “Pagar R$ 200.000 e sair” e “Aguardar este turno preso”; aguardar consumiu o turno e passou a vez ao bot.
- Corrigi o nome antigo no cartão de revelação, no aviso sincronizado do servidor e na descrição vigente do plano. Regressões unitárias e de servidor cobrem os nomes atualizados.
- Ainda pendem a inspeção visual pós-correção da revelação Volta ao Brasil, as demais cartas, uma liquidação real de dívida e as condições de vitória pela interface.

## Linha 0 e seleção de alvos no navegador — 2026-10-31

- Em sala de uma hora com dois participantes, forcei apenas os dados pelo painel DEV e comprei Porto Velho, Parauapebas, Rio Verde, AgroBrasil, Manaus e Canaã dos Carajás. O saldo final desse trecho foi R$ 375.000 após o bônus de Partida e a taxa de R$ 125.000 por seis títulos.
- Bot 1 comprou Belém e depois construiu até três casas. A carteira confirmou que não há hotel. A recompra forçada calculada sobre R$ 875.000 de investimento custará R$ 1.312.500; a regra da Linha 0 ainda não foi concluída.
- Na seleção da sede da Copa, a captura mostrou aro dourado nas propriedades válidas do anfitrião e os demais pisos apagados. A carta Generoso abriu o prompt de escolha no tabuleiro; não registrei a transferência porque a seleção não foi concluída antes de expirar.
- Próxima validação: acumular recursos na mesma regra de jogo, recomprar Belém (sem hotel) e observar o encerramento pela Linha 0.

## 2026-10-31 — Redução adicional da altura dos dados

- A pedido do usuário, baixei a posição-base dos dados para Y=2,165, reduzi o salto animado para 0,065 e aproximei o indicador do total para Y=2,72.
- O teste geométrico específico passou e exige 0,01 unidade de folga mínima sobre o topo da torre da FATEC, mesmo considerando a caixa girando; a folga calculada fica em aproximadamente 0,012. Na partida local, os dados ficaram visivelmente suspensos acima dos prédios centrais, sem interseção com o modelo. `npm run verify` passou com 240 testes em 46 arquivos e builds de frontend e servidor. O build mantém o aviso conhecido de chunk 3D acima de 500 kB.

## 2026-10-31 — Confirmação visual da altura mais baixa dos dados

- Em partida local BANTEC, observei uma rolagem real de dados com a câmera inclinada. Eles ficam próximos do telhado da FATEC e continuam suspensos; a caixa girando mantém a folga geométrica mínima coberta pelo teste de regressão, sem atravessar o modelo. A sala temporária foi usada apenas para esta revisão visual.

## 2026-10-31 — Prazo de seleção após revelar uma carta

- Uma sessão local com Modo DEV mostrou a carta Terremoto. Fechei o aviso com 14 segundos restantes; a carta saiu da tela, o painel de escolha apareceu e o relógio voltou a 15 segundos. Como nenhum outro participante possuía imóvel, a interface informou corretamente que não havia alvo elegível.
- A regressão do servidor confirmou a pausa da contagem durante a leitura, a reinicialização dos 15 segundos depois da dispensa e o descarte automático ao fim da seleção. Ainda falta repetir com um imóvel adversário elegível e verificar manualmente a suspensão do aluguel por Apagão.

## 2026-10-31 — Ferramenta DEV para preparar cartas

- O teste de integração prepara Apagão pelo protocolo DEV, confirma que somente a anfitriã pode armar uma carta válida durante a fase de rolagem e que a carta é consumida uma única vez. Depois da seleção de Parauapebas, o servidor aplicou três turnos de suspensão de aluguel.
- No navegador, a anfitriã armou Apagão e o sorteio abriu a tela de escolha. Com Bot 1 proprietário de Parauapebas, a propriedade elegível ficou iluminada com aro dourado e as demais casas ficaram apagadas. O clique no alvo não foi confirmado antes do prazo, então a conclusão visual do alvo e a suspensão de aluguel permanecem pendentes.
- Não foi feita revisão visual das outras cartas. `npm run graphify -- update .` atualizou o grafo para 934 nós e 1.732 arestas. `npm run verify`: 243 testes em 46 arquivos passaram; builds do frontend e servidor passaram. `git diff --check` passou. O build mantém o aviso já conhecido de chunk de cena 3D acima de 500 kB.

## 2026-10-31 — Revisão manual de cartas no BANTEC

- Em sala FHNFW com anfitrião, Bot 1 e Modo DEV, comprei Manaus por R$ 650.000 e usei Generoso para transferi-la ao bot. Aniversário creditou R$ 50.000 ao anfitrião e debitou R$ 50.000 do Bot 1.
- Apagão permitiu escolher Manaus do Bot 1 com o padrão de alvos válidos iluminados; o servidor informou suspensão do aluguel pelos próximos três turnos do dono. Ao teletransportar o anfitrião para Manaus antes do fim do efeito, a mensagem confirmou que o imóvel não cobrava aluguel e restavam dois turnos do dono; os saldos não mudaram nessa chegada.
- Terremoto aceitou Manaus sem hotel e confirmou que o imóvel foi destruído e voltou ao banco. Essas observações confirmam Generoso, Aniversário, Apagão e Terremoto na interface.
- Permanecem a revisão visual das demais cartas, playtests humanos de equilíbrio para 15/30/60 minutos e decisão de hospedagem; esta sala não substitui os playtests humanos.

## 2026-10-31 — Conclusão da revisão manual das 12 cartas

- Em RZMAQ, Cidade-sede foi descartada sem movimento porque não havia sede ativa. Sede da Copa permitiu escolher Joinville; o inspetor mostrou R$ 135.000 de aluguel, três vezes o valor-base de R$ 45.000.
- Em P28D9, Proteção iluminou Fortaleza como alvo elegível e confirmou imunidade a cartas pelos próximos três turnos do dono. Ladrão exibiu a escolha de Bot 1; após a seleção, o servidor abriu a liquidação da dívida e registrou o pagamento de R$ 200.000 ao anfitrião. Troca-troca confirmou: “BANTEC QA Restante e Bot 1 trocaram de lugar sem resolver as casas de chegada.”
- Com as evidências anteriores de Generoso, Aniversário, Apagão, Terremoto, Prisão, Volta ao Brasil e Vá para o início, todas as 12 cartas autorais estão confirmadas visualmente. Volta ao Brasil e Vá para o início creditam R$ 200.000 conforme os registros de validação anteriores.
- Sala descartável fechada depois da revisão. Ainda faltam playtests humanos de equilíbrio e ritmo nas durações de 15/30/60 minutos e a decisão de hospedagem; essas etapas não foram substituídas por partidas com bot.

## 2026-10-31 — Causa exibida no resultado final

- O estado autoritativo agora sincroniza uma causa para tempo, falência, ausência de participantes solventes e cada vitória imediata. A tela final mostra um resumo correspondente; a condição de monopólio é identificada na origem do servidor.
- Testes de integração verificam causas por tempo, falência, Monopólio em Linha, Monopólio Duplo Regional e quatro companhias. Testes unitários cobrem os textos do resultado.
- Em sala local com Modo DEV, Bot 1 possuía AgroBrasil e Aviação Brasil. Com saldo zero e sem imóveis, o anfitrião foi teleportado para AgroBrasil, registrou dívida de aluguel de R$ 250.000 e declarou falência. A captura confirmou o painel “PARTIDA ENCERRADA”, Bot 1 vencedor, a mensagem “Vitória após a falência do último adversário solvente.” e a classificação com patrimônio/saldo.
- `npm run graphify -- update .` atualizou o grafo para 939 nós e 1.745 arestas. `npm run verify`: 246 testes em 46 arquivos passaram; builds do frontend e servidor passaram. O chunk 3D mantém o aviso conhecido acima de 500 kB.
