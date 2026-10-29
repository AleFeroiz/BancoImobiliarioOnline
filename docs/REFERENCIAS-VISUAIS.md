# Referências visuais da partida

Este documento traduz a hierarquia visual observada em capturas públicas de *Business Tour* para uma direção própria do BancoImobiliarioOnline. A referência é de composição e apresentação; não é autorização para reproduzir sua marca, ilustrações, tabuleiro, peças, textos ou telas.

## Fontes consultadas

- [Página oficial de *Business Tour* na Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/), incluindo capturas oficiais de partida e sala.
- [Galeria da interface de *Business Tour* no Interface In Game](https://interfaceingame.com/games/business-tour/), que organiza capturas por estado, como menu, tabuleiro, rolagem, venda, sala privada, configurações e placar. A galeria é uma referência histórica da interface, não uma garantia de que cada tela corresponda à versão atual.
- [Galeria de capturas indexada pelo SteamDB](https://steamdb.info/app/397900/screenshots/), usada para localizar exemplos públicos adicionais.
- A página oficial da Steam também foi consultada novamente em 2026-10-28 para confirmar a apresentação pública e as capturas atuais da partida. A descrição da loja classifica o jogo como mesa multiplayer casual para partidas rápidas; isso é contexto do produto, enquanto as observações visuais abaixo vêm das capturas.
- Captura enviada pelo usuário nesta conversa, usada somente como referência visual.

## Leitura visual das capturas

As capturas oficiais de partida mostram uma mesa quadrada elevada em perspectiva, com o percurso colorido e construções pequenas ao redor de um centro aberto. A captura atual da página Steam mostra quatro fichas nos cantos, cada uma combinando retrato, nome e saldo. O modo e o relógio ficam no alto; dados grandes, marcador do turno e chamadas breves usam o centro. Os controles de apoio ficam junto às bordas. O tabuleiro permanece visível durante a partida e continua reconhecível em momentos de decisão. A loja descreve o produto como jogo de tabuleiro multiplayer para 2–4 pessoas e enfatiza partidas rápidas e jogo com amigos; isso confirma o enquadramento do produto, enquanto as posições e cores são observações das capturas.

A apresentação é mais saturada e caricata que a direção anterior deste projeto: gramado verde vivo, bordas claras, acentos fortes nas cores das propriedades, retratos expressivos e peças volumosas. O padrão que vale transportar é a leitura rápida e a distribuição espacial da informação. A direção agora aumenta a saturação do tabuleiro e dá um acento próprio a cada participante, mantendo papel, feltro e madeira como materiais e preservando peças, tipografia e arte originais.

## Modelos e pisos do tabuleiro

As fichas de participantes preservam o peão original e oferecem carrinho, moto e avião low-poly como alternativas visuais selecionáveis no lobby. Os modelos autorais foram feitos no Blender 5.2.2 LTS; as fontes estão em `assets/blender/player-tokens.blend` e o GLB com exportação Y-up em `public/assets/player-tokens.glb`. O material `OWNER_TINT` recebe a cor já associada ao dono. A cena acomoda as quatro fichas sem alterar movimento ou regras.

O usuário pediu cinco níveis visuais originais para propriedades: terreno identificado pela pessoa dona, uma casa, duas casas, três casas e hotel. Os modelos foram criados na sessão conectada do Blender 5.2.2 LTS e reunidos em `public/assets/board-models/board-models.glb`; a fonte editável está em `assets/blender/board-models.blend`. Os telhados, a bandeira e os detalhes marcados com o material `OWNER_TINT` recebem a cor atual do dono no jogo. Paredes claras, janelas azul-escuras e bases de pedra mantêm leitura contra os oito grupos de cores.

Os imóveis residenciais usam sua cor de grupo como cor de toda a superfície do piso, não apenas uma tarja, e as três ruas de cada grupo ficam em sequência no tabuleiro. Estações usam azul ardósia. Sorte ou Revés usa piso dourado e uma roleta multicolorida low-poly; taxas usam coral com marca de moeda. Os cantos têm símbolos próprios: Partida, grade da prisão, taça dourada da Copa do Mundo e globo da Volta ao Mundo. O nome completo permanece em texto de alto contraste sobre cada piso. Essas formas e materiais são originais; as imagens anexadas servem apenas para orientar a leitura de construções pequenas e de grupos de cor.

Na revisão de 2026-10-29, a câmera passou a orbitar por arraste direto na mesa. Escolhas da Copa e da Volta destacam os destinos válidos e escurecem os demais, confirmando no próprio tabuleiro ao clicar. O painel de compra usa quatro cards de terreno com zero a três casas, cada um com custo e aluguel; o inspetor da propriedade mostra leilão próprio dentro da ficha do imóvel. Os modelos autorais `assets/blender/special-corners.blend`, `public/assets/world-cup-stadium.glb` e `public/assets/world-tour-airport.glb` substituem os símbolos pequenos nos respectivos cantos.

Nas capturas de rolagem, a ação usa dados grandes no vazio do centro e uma mensagem curta de contexto. No nosso jogo, a animação dos dados termina antes de o peão começar; movimento, inclusive o dos bots, termina antes da resolução da casa. Dados somem quando outro painel ocupa o centro. Nas telas de dívida, a atenção passa para o alvo selecionável e para as opções necessárias para continuar. No placar, o resultado ocupa a frente sem apagar por completo a mesa. Na sala privada, participantes, avatar e estado de preparação são os elementos mais imediatos; controles de configuração ficam agrupados.

### Inventário de telas consultadas

As capturas oficiais da Steam e a galeria histórica permitem observar estados diferentes, não apenas uma tela de partida. A galeria cataloga menu principal, mesa privada, configurações da mesa, tabuleiro ativo, rolagem, escolha de cidade para vender, aviso de dinheiro insuficiente e placar. Isso sugere que a interface deve reaproveitar os mesmos elementos de identidade e posição dos jogadores, mudando o foco conforme a ação atual.

| Estado de referência | Padrão de apresentação observado | Tradução para BancoImobiliarioOnline |
|---|---|---|
| Lobby privado | Assentos e avatares identificáveis, código/contexto da mesa e controles de preparação agrupados | Manter os quatro lugares, anfitrião, modo e código juntos; deixar claro quem ainda está aguardando. |
| Configuração da mesa | Opções de partida aparecem agrupadas numa superfície própria antes do início | Exibir os dois presets e seus parâmetros na criação/lobby, sem misturar regras detalhadas à mesa durante o turno. |
| Partida ativa | Tabuleiro grande e quadrado em perspectiva; nome, avatar e dinheiro de cada participante nos cantos; controle secundário nas bordas | Preservar o centro para o tabuleiro, usar cartões compactos com acentos de cor distintos por participante e evitar transformar a partida em dashboard. |
| Rolagem | Dados em destaque no espaço central e fala curta de turno | Aumentar a leitura dos dados e mostrar quem está jogando e onde vai parar sem cobrir propriedades. |
| Escolha de venda/dívida | Contexto da dívida e bens elegíveis recebem prioridade visual; o tabuleiro segue como referência | Realçar os ativos válidos, mostrar o valor devido e manter as ações disponíveis no mesmo painel contextual. |
| Dinheiro insuficiente | Aviso ligado à ação que falhou, com informação para decidir o próximo passo | Explicar o saldo necessário e oferecer a próxima opção válida, como deixar o terreno livre ou liquidar bens. |
| Placar | Resultado e classificação aparecem à frente enquanto a mesa continua visível | Mostrar vencedor, critério de desempate e valores comparados num cartão sobre a cena. |

As capturas atuais da loja Steam são a base principal para a composição do lobby e do tabuleiro. A galeria categorizada do Interface In Game é de 2017 e serve como repertório de estados e transições, não como comprovação do visual atual. Não foi possível confirmar pelas páginas públicas se todos os controles e estados da galeria antiga permanecem iguais na versão atual. Na revisão de 2026-10-28, consultei também a listagem atual de capturas do SteamDB para localizar material recente; usei-a como índice de imagens da loja, não como fonte de decisões de produto.

### Mapeamento das referências para o nosso produto

| Superfície nossa | Padrão observado | Aplicação visual prevista |
|---|---|---|
| Início e escolha de modo | Menus coloridos e ações principais fáceis de localizar | Manter a entrada sem conta, com nome e criar/entrar em destaque; usar ilustração de mesa original como ambiente, sem painel com aparência administrativa. |
| Lobby | Lugares dos participantes e estado da mesa | Fazer quatro assentos claros, marcar anfitrião/pronto e manter código e modo sempre visíveis. |
| Turno normal | Tabuleiro central e informação dos jogadores nos cantos | Preservar mesa e percurso como foco; dar mais presença aos retratos, saldos e indicador de quem joga. |
| Rolagem e movimento | Dados centrais e chamada curta junto à ação | Mostrar dados apenas durante a rolagem e deixar a sequência terminar antes do movimento do peão; ocultá-los quando outro diálogo abrir. |
| Compra, recusa e aluguel | Casa ou propriedade ligada à decisão e valores destacados | Centralizar o painel, realçar a casa-alvo e mostrar preço, aluguel inicial, pacotes de terreno com zero a três casas e ações de comprar ou deixar livre. |
| Dívida e prisão | Sobreposição focada em poucas escolhas e urgência legível | Usar contraste mais forte no alvo e apresentar dívida, saldo e formas válidas de agir em ordem. |
| Negociação e carteira | Painel de apoio aberto apenas quando necessário | Manter ativos e trocas fora do HUD persistente e preservar visão da mesa enquanto o painel estiver aberto. |
| Resultado | Placar breve sobre a cena da partida | Mostrar vencedor, critério usado, saldo/patrimônio relevante e ação de saída; manter a mesa reconhecível no fundo. |

Estas recomendações são uma proposta de direção visual baseada na leitura das fontes. A decisão já aprovada do projeto permanece: usar composição inspirada na clareza de *Business Tour* com arte, cores, nomes, tabuleiro e componentes próprios; não copiar telas ou assets.

### Capturas de referência por estado

| Estado | Referência | O que observar |
|---|---|---|
| Lobby e sala privada | [Captura de lobby na Steam](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/397900/ss_dda2ba3489344953c2bd7683a92440875153c238.1920x1080.jpg) · [Captura de mesa privada](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-private-table-500x281.png) | Assentos, identidade dos participantes e preparação da mesa são lidos de imediato. A captura Steam é referência recente da apresentação; a galeria é histórica. |
| Partida normal | [Captura de partida na Steam](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/397900/ss_0a4f490446cb091de3e8eef7b239eb3a530937f.1920x1080.jpg) · [Captura do tabuleiro](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-board-500x281.png) | Tabuleiro quadrado em perspectiva inclinada no centro; jogadores nas bordas com avatar e saldo; controles de apoio compactos. O relógio e os dados não devem competir com a leitura das casas. |
| Rolagem | [Dados e mensagem de turno](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-rolling-dice-500x281.png) | Dados grandes no espaço negativo central e fala curta perto do jogador ativo; o evento aparece onde o olhar já está, sem substituir o HUD. |
| Configuração da mesa | [Captura de lobby/configuração na Steam](https://cdn.akamai.steamstatic.com/steam/apps/397900/ss_b2bd565345e0f63170a893040fbe129efa3d4f30.1920x1080.jpg) · [Galeria por estado](https://interfaceingame.com/games/business-tour/) | Opções são agrupadas antes da partida. Para nós, o modo e a duração ficam visíveis junto aos assentos e ao botão de iniciar. |
| Decisão durante dívida | [Escolher propriedade para vender](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-select-a-city-to-sell-500x281.png) | O tabuleiro escurece levemente, a propriedade relevante fica realçada, e um painel contextual explica saldo, dívida e ações disponíveis. |
| Resultado | [Placar final](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-scoreboard-500x281.png) | Cartão de resultado sobre a partida ainda reconhecível, com classificação em tabela e uma ação principal para fechar. |
| Menu e opções | [Menu durante a partida](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-in-game-menu-500x281.png) · [Galeria de estados](https://interfaceingame.com/games/business-tour/) | Pausa, configurações e saída ficam fora do fluxo de decisão do turno, em camadas temporárias. |

As observações acima descrevem as capturas públicas consultadas; não são especificações oficiais do jogo. O padrão de apresentação é consistente: a mesa e a posição dos participantes permanecem legíveis, a vez atual tem um marcador claro e a ação específica aparece junto ao contexto que a motivou.

Na galeria histórica, a interface também está separada por estados de produto — menu principal, mesa privada, partida, rolagem, venda de cidade, dinheiro insuficiente, configurações e placar. Isso reforça que a mesma mesa deve continuar como contexto ao trocar de ação: um cartão ou escurecimento temporário explica a decisão, e depois sai de foco. A galeria foi publicada em 2017; usamos seus estados como repertório de apresentação, e as capturas da Steam como referência recente da composição da partida.

## Direção visual para o nosso jogo

### Composição

- Manter o tabuleiro 3D como foco e reservar espaço negativo no centro para dados, animações e mensagens breves.
- Distribuir os cartões dos participantes pelas bordas/cantos em desktop, com nome, saldo e estado da vez visíveis sem abrir painéis.
- Destacar quem está na vez com contorno, cor de acento e rótulo curto; não depender apenas da cor para comunicar o estado.
- Usar cores de identificação consistentes entre avatar, ficha e peça no tabuleiro; reservar um realce mais forte para a pessoa da vez.
- Manter saturação suficiente nas cores de propriedades e nos marcadores para que a mesa pareça um jogo de tabuleiro vivo, preservando superfícies claras e materiais originais.
- Deixar a ação principal em um painel contextual compacto na borda inferior. Mostrar nele apenas a decisão atual, como lançar, comprar, ofertar ou pagar.
- Apresentar o modo e o relógio numa cápsula curta na faixa superior. A carteira, regras longas e negociação ficam em painéis que abrem sob demanda.
- Em ações com alvo no tabuleiro, marcar a propriedade ou casa envolvida e mostrar motivo, valor e opções no mesmo cartão; usar um escurecimento leve apenas enquanto a decisão estiver aberta.
- Para dados e mudanças de vez, levar o feedback visual ao espaço central ou ao jogador ativo e manter uma legenda de texto acessível no HUD.
- No resultado, manter a cena ao fundo com contraste reduzido e exibir uma classificação concisa; mostrar o critério da vitória, o saldo e o patrimônio quando forem relevantes para o modo.
- Em telas estreitas, reduzir o tamanho dos cartões e organizá-los em duas colunas no topo; manter o tabuleiro visível e a ação alcançável sem rolagem horizontal.

### Linguagem visual própria

- Usar uma paleta de papel marfim, feltro verde e madeira clara, com acentos por participante e cores de grupo nos títulos.
- Criar arte low-poly original para casas, hotéis, peões, dados e espaços especiais. Os nomes, preços e ícones do tabuleiro são do projeto.
- Preferir superfícies claras levemente translúcidas, bordas suaves e sombras discretas para separar o HUD da cena sem transformar a partida num painel administrativo.
- Usar animação curta para rolagem, deslocamento do peão, mudança de vez, compra e resultado de carta. Estados importantes também precisam de rótulos e contraste estáticos.
- Manter botões e textos de ação em HTML/DOM, sincronizados ao estado da sala; a cena 3D apenas representa esse estado.

## Apresentação por momento

| Momento | Informação em primeiro plano | Tratamento |
|---|---|---|
| Espera e turno normal | Jogador ativo, saldo, modo/tempo e comando principal | HUD compacto nas bordas; centro livre |
| Rolagem e movimento | Resultado dos dados e destino do peão | Animação sequencial e lenta; rolagem de 1,8 s e 0,42 s por casa percorrida |
| Compra ou recusa | Imóvel, preço, aluguel e escolha entre comprar ou deixar livre | Painel central com decisão clara e pacote de construção selecionável |
| Aluguel, taxa ou carta | Valor transferido e motivo | Aviso breve perto do tabuleiro; saldo atualizado no cartão |
| Dívida ou falência | Valor devido e formas válidas de liquidar | Painel contextual mais forte, com ações disponíveis explícitas |
| Negociação | O que cada lado oferece e pede, relógio e aceite | Painel modal compacto; tabuleiro e cartões continuam reconhecíveis |
| Resultado final | Vencedor, critério e patrimônio/saldo final | Cartão de resultado claro sobre a cena, sem esconder a causa da vitória |

## Aplicação e limites

O HUD atual já segue parte da composição principal: jogadores nas bordas, modo/relógio no topo, painel de ação compacto e painéis de imóveis, objetivo e negociação sob demanda. A sala também mostra os lugares e o código. A entrada usa o tabuleiro 3D como imagem de fundo; os presets agora são escolhas em cartões destacados, e a camada sobre a cena é mais transparente para deixar as casas e as peças aparecerem. A implementação ainda usa iniciais como avatares; retratos ou peões visuais originais seguem como oportunidade de refinamento, sem bloquear o loop.

A leitura dos dados aparece no espaço central apenas durante a rolagem; qualquer diálogo aberto oculta os dados. Inspetores, compras, cartas, dívida, leilão, troca e carteira usam o centro e um fundo escurecido enquanto estão abertos. A casa da compra ou recusa recebe um contorno dourado baixo no próprio tabuleiro. Durante uma dívida, abrir a carteira destaca com a mesma marca apenas os títulos hipotecáveis e as construções que podem ser vendidas; o painel mantém o valor devido, o saldo e a explicação do realce. O placar final destaca o vencedor, apresenta a métrica decisiva e a métrica complementar, e lista a classificação com o critério de desempate. Os rótulos do tabuleiro quebram nomes longos em linhas e usam contorno de alto contraste; cada casa também abre um inspetor DOM ao clicar ou tocar, para preservar leitura mesmo quando a perspectiva reduz os textos 3D distantes. Em celular em pé, a câmera alinha as bordas do tabuleiro à tela sem cortar a mesa. Validar em Chrome e Firefox, nos tamanhos desktop e celular, com capturas em turno normal, rolagem, compra/recusa, inspeção de casa, dívida e resultado. Se um estado ainda não estiver acessível pela interface de teste, registrar isso como limite de validação.

A tela inicial também deve compartilhar o clima do jogo: fundo claro de feltro, superfícies cor de papel, cores de acento por ação e uma chamada visual para a mesa, evitando uma estética escura de produto editorial que destoe da partida. A marca, a tipografia, os textos e os elementos 3D continuam próprios.

Usar as capturas acima apenas como referência visual durante design e revisão. Não salvá-las no pacote do jogo, nem reutilizar logotipo, nomes, ilustrações, formas de peças, tipografia ou organização exata dos painéis de *Business Tour*.

## Limites da referência

As capturas mostram uma apresentação de partida, mas não definem todos os estados, regras de acessibilidade ou comportamento móvel. Os detalhes acima são a direção visual do nosso produto e devem ser validados em Chrome e Firefox, em desktop e celular. Não reutilizar imagens encontradas na pesquisa como assets do projeto.
