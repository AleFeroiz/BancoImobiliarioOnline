# Referências visuais da partida

Este documento traduz a hierarquia visual observada em capturas públicas de *Business Tour* para uma direção própria do BancoImobiliarioOnline. A referência é de composição e apresentação; não é autorização para reproduzir sua marca, ilustrações, tabuleiro, peças, textos ou telas.

## Fontes consultadas

- [Página oficial de *Business Tour* na Steam](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/), incluindo as imagens de gameplay da galeria.
- [Galeria de capturas indexada pelo SteamDB](https://steamdb.info/app/397900/screenshots/), usada para localizar outras imagens públicas da partida.
- Captura enviada pelo usuário nesta conversa, usada somente como referência visual.

As imagens mostram uma partida com tabuleiro quadrado em perspectiva inclinada, casas residenciais distribuídas pelo perímetro, área central livre para dados e feedback, e jogadores organizados ao redor do tabuleiro. O saldo é visível nos cartões dos jogadores; a vez e a situação atual recebem destaque; dados e mensagens curtas aparecem próximos à área central. Essa leitura é uma análise das imagens, não uma especificação oficial da interface.

## Direção visual para o nosso jogo

### Composição

- Manter o tabuleiro 3D como foco e reservar espaço negativo no centro para dados, animações e mensagens breves.
- Distribuir os cartões dos participantes pelas bordas/cantos em desktop, com nome, saldo e estado da vez visíveis sem abrir painéis.
- Destacar quem está na vez com contorno, cor de acento e rótulo curto; não depender apenas da cor para comunicar o estado.
- Deixar a ação principal em um painel contextual compacto na borda inferior. Mostrar nele apenas a decisão atual, como lançar, comprar, ofertar ou pagar.
- Apresentar o modo e o relógio numa cápsula curta na faixa superior. A carteira, regras longas e negociação ficam em painéis que abrem sob demanda.
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

## Limites da referência

As capturas mostram uma apresentação de partida, mas não definem todos os estados, regras de acessibilidade ou comportamento móvel. Os detalhes acima são a direção visual do nosso produto e devem ser validados em Chrome e Firefox, em desktop e celular. Não reutilizar imagens encontradas na pesquisa como assets do projeto.
