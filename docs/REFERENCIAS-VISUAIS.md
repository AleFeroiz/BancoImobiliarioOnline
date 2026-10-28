# Referências visuais da partida

Este documento traduz a hierarquia visual observada em capturas públicas de *Business Tour* para uma direção própria do BancoImobiliarioOnline. A referência é de composição e apresentação; não é autorização para reproduzir sua marca, ilustrações, tabuleiro, peças, textos ou telas.

## Fontes consultadas

- [Página oficial de *Business Tour* na Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/), incluindo capturas oficiais da partida.
- [Galeria da interface de *Business Tour* no Interface In Game](https://interfaceingame.com/games/business-tour/), que organiza capturas por estado, como tabuleiro, rolagem, venda, sala privada e placar.
- [Galeria de capturas indexada pelo SteamDB](https://steamdb.info/app/397900/screenshots/), usada para localizar exemplos públicos adicionais.
- Captura enviada pelo usuário nesta conversa, usada somente como referência visual.

### Capturas de referência por estado

| Estado | Referência | O que observar |
|---|---|---|
| Partida normal | [Captura oficial na Steam](https://cdn.cloudflare.steamstatic.com/steam/apps/397900/ss_0a4f490446cb091de93e8eef7b239eb3a530937f.1920x1080.jpg) · [Captura do tabuleiro](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-board-500x281.png) | Tabuleiro quadrado em perspectiva inclinada no centro; quatro cartões de jogador nos cantos com avatar e saldo; relógio sobre a área do tabuleiro; controles secundários em uma coluna curta na lateral. |
| Rolagem | [Dados e mensagem de turno](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-rolling-dice-500x281.png) | Dados grandes no espaço negativo central e fala curta perto do jogador ativo; o evento aparece onde o olhar já está, sem substituir o HUD. |
| Decisão durante dívida | [Escolher propriedade para vender](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-select-a-city-to-sell-500x281.png) | O tabuleiro escurece levemente, a propriedade relevante fica realçada, e um painel central explica saldo, dívida e ações disponíveis. |
| Resultado | [Placar final](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-scoreboard-500x281.png) | Cartão de resultado sobre a partida ainda reconhecível, com classificação em tabela e uma ação principal para fechar. |
| Sala privada | [Captura de sala](https://interfaceingame.com/wp-content/uploads/business-tour/business-tour-private-table-500x281.png) | A preparação da partida continua usando os mesmos retratos, cores e linguagem de mesa vistos na partida. |

As observações acima descrevem as capturas públicas consultadas; não são especificações oficiais do jogo. O padrão de apresentação é consistente: a mesa e a posição dos participantes permanecem legíveis, a vez atual tem um marcador claro e a ação específica aparece junto ao contexto que a motivou.

## Direção visual para o nosso jogo

### Composição

- Manter o tabuleiro 3D como foco e reservar espaço negativo no centro para dados, animações e mensagens breves.
- Distribuir os cartões dos participantes pelas bordas/cantos em desktop, com nome, saldo e estado da vez visíveis sem abrir painéis.
- Destacar quem está na vez com contorno, cor de acento e rótulo curto; não depender apenas da cor para comunicar o estado.
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
| Rolagem e movimento | Resultado dos dados e destino do peão | Animação breve no tabuleiro e mensagem curta |
| Compra ou leilão | Imóvel, preço/maior lance e ações possíveis | Cartão contextual inferior com decisão clara |
| Aluguel, taxa ou carta | Valor transferido e motivo | Aviso breve perto do tabuleiro; saldo atualizado no cartão |
| Dívida ou falência | Valor devido e formas válidas de liquidar | Painel contextual mais forte, com ações disponíveis explícitas |
| Negociação | O que cada lado oferece e pede, relógio e aceite | Painel modal compacto; tabuleiro e cartões continuam reconhecíveis |
| Resultado final | Vencedor, critério e patrimônio/saldo final | Cartão de resultado claro sobre a cena, sem esconder a causa da vitória |

## Aplicação e limites

O HUD atual já segue a composição principal: jogadores nas bordas, modo/relógio no topo e ação no rodapé. A próxima revisão visual deve concentrar-se em estados contextuais: ligar avisos e dados à casa/jogador que os provocou, destacar o espaço selecionado durante compra/leilão/dívida e apresentar um placar final com o critério de vitória. Esses ajustes devem ser verificados em captura de tela, com tabuleiro visível, em desktop e celular.

Usar as capturas acima apenas como referência visual durante design e revisão. Não salvá-las no pacote do jogo, nem reutilizar logotipo, nomes, ilustrações, formas de peças, tipografia ou organização exata dos painéis de *Business Tour*.

## Limites da referência

As capturas mostram uma apresentação de partida, mas não definem todos os estados, regras de acessibilidade ou comportamento móvel. Os detalhes acima são a direção visual do nosso produto e devem ser validados em Chrome e Firefox, em desktop e celular. Não reutilizar imagens encontradas na pesquisa como assets do projeto.
