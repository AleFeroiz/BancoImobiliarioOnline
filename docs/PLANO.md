# Plano do jogo

## Visão

Um jogo de tabuleiro para abrir no navegador e jogar com amigos, sem cadastro. Cada pessoa informa um nome e cria uma sala ou entra pelo código recebido. A partida combina um tabuleiro 3D original com interface acessível e regras executadas pelo servidor.

## Experiência

- Tela inicial para escolher nome e criar/entrar em sala.
- Ao criar, anfitrião escolhe duração de 15, 30 ou 60 minutos; há uma modalidade de partida.
- Lobby lista até quatro participantes, anfitrião e estado de preparação; anfitrião inicia.
- Tabuleiro 3D com inclinação inicial discreta e câmera orbitável pelo arraste do mouse ou toque, zoom pela roda do mouse e pinça no celular, preservando os quatro cantos no enquadramento inicial; as fichas têm leve aumento de escala e aro contrastante na base. A partida usa toda a janela, sem o cabeçalho geral. Partida, Prisão (três turnos), Copa do Mundo (aluguel 3× numa propriedade própria escolhida, se houver, e estádio 3D) e Volta ao Mundo (teletransporte para casa própria, livre ou especial e aeroporto com avião) são os quatro cantos. Espaços legíveis, peças e dados; cada pessoa escolhe no lobby peão, carrinho, moto ou avião como ficha visual colorida por dono; cada jogada mostra os dados, depois o percurso da ficha e por fim a ação de chegada; o anfitrião controla a velocidade das animações (0,5×, 1× ou 2×, padrão 1×), e observadores acompanham as fases por balão junto à ficha; câmera livre durante movimento e inspeção de casas fora do turno; valores de aluguel em texto 3D sobre cada propriedade, voltados à câmera; no lobby, a anfitriã pode habilitar ferramentas de dados, com o estado visível a todas as pessoas; HUD em HTML responsivo para desktop e celular.
- Ações disponíveis e resultados da jogada ficam claros em cada turno.
- O botão “?” abre um guia rápido. A pessoa tem 20 segundos para rolar e 15 segundos para uma decisão; expiração recusa compras, conclui automaticamente o turno de prisão, escolhe destinos padrão para os cantos novos e avança a liquidação de dívidas.
- Partidas temporárias, sem conta ou progresso persistente.
- Durante a partida, as opções locais abrem em tela sobreposta sem pausar o estado sincronizado; incluem qualidade gráfica, FPS, áudio e movimento reduzido. Emotes curtos são transmitidos a todos e os cantos Aeroporto, Prisão e Copa têm sons de chegada próprios.

## Regras vigentes

- **Partida:** uma modalidade com tempo escolhido no lobby (15, 30 ou 60 minutos), saldo inicial de R$ 2.000.000 para playtest e resultado por patrimônio quando o relógio termina. Vencer por Monopólio em Linha, Monopólio Duplo Regional ou pelas quatro companhias encerra imediatamente.
- **Economia:** aluguel cresce com cada construção (10%, 20%, 40%, 70%, 100% do preço); completar uma região dobra o aluguel e a Copa triplica. As taxas cobram R$ 10.000, R$ 15.000, R$ 20.000 ou R$ 25.000 por cidade/companhia possuída.
- **Devolução ao banco:** durante dívida insuficiente, devolver uma cidade paga metade do preço e libera o título. Construções do grupo precisam ser vendidas antes; não há imóvel hipotecado ou resgate.
- **Recompra:** ao cair em imóvel de outra pessoa, é possível tomá-lo sem consentimento por 1,5× o investimento, exceto se tiver hotel; o pagamento vai ao dono.
- **Turno e negociação:** 20 segundos para rolar e 15 para cada decisão. Propostas de troca podem ser enviadas pelo perfil. Leilões voluntários só podem ser iniciados no turno do vendedor, fora de compra ou dívida. Ao recusar terreno livre, ele fica sem dono.
- **Negociação:** propostas podem ser enviadas a partir do perfil de um participante em qualquer momento da partida. Uma oferta fica pendente até resposta do destinatário ou cancelamento de quem enviou. Leilões voluntários só podem ser iniciados no turno de quem vende, fora de compra ou dívida, e duram 20 segundos.
- **Desconexão:** 60 segundos para reconectar; passado o prazo, pula-se a ação/vez atual sem ações automáticas.
- **Sala:** 2–4 pessoas.

### Reforma regional BANTEC — implementação em andamento

O tabuleiro regional já está no código: 24 cidades brasileiras, cinco regiões, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos. Aluguéis, impostos, vitórias por Monopólio em Linha/Duplo Regional/quatro companhias, seletor de 15/30/60 minutos, cor do jogador, bônus ao cair em Volta ao Brasil, recompra por 1,5× e o baralho de 12 cartas estão implementados no servidor. Duplas concedem nova rolagem; a terceira consecutiva envia à Prisão. O modo noturno escurece a home e o lobby e, durante a partida, somente o fundo externo. Os dados rolam lado a lado logo acima da FATEC Itapetininga. Bens, Config, Emote e Regras ficam em uma coluna de botões quadrados na lateral direita, adaptada para celular. Toda seleção de casas agora usa o tabuleiro, iluminando opções válidas e apagando as inválidas; isso cobre cartas, liquidação de dívida, trocas e carteira. Falta revisar liquidação de dívida em partida real e concluir o playtest manual das cartas e vitórias.

`npm run verify` passou com 228 testes em 44 arquivos e builds de frontend e servidor. O Express e seus objetivos ficaram como referência histórica. As decisões detalhadas estão em [DECISOES.md](DECISOES.md) e as fontes de regras em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md).

## Arquitetura confirmada

| Parte | Decisão | Responsabilidade |
|---|---|---|
| Aplicação | React + TypeScript + Vite | Lobby, navegação, HUD e integração com a sala. |
| Cena | React Three Fiber + Three.js | Representar tabuleiro, peças, dados e animações. |
| Regras | Módulo TypeScript sem dependência de renderização | Estado determinístico e transições do jogo. |
| Multiplayer | Node + Colyseus autoritativo | Criar/entrar em sala, validar ações e sincronizar estado. |
| Frontend publicado | Vercel | Servir a aplicação web. |
| Servidor publicado | Hospedagem Node com WebSockets | Manter salas multiplayer ativas. O provedor será escolhido após validar a sala e o custo. |
| Persistência | Nenhuma no MVP | Salas temporárias; sem contas e histórico. |

## Fases de produção

1. **Fatia visual inicial:** tela inicial, escolha de duração e cena 3D responsiva com tabuleiro e peças próprias estão implementadas. A identidade foi repaginada para BANTEC; a revisão da página inicial foi feita em viewport móvel e desktop.
2. **Salas online:** servidor Colyseus, código privado de cinco caracteres, lobby sincronizado, anfitrião, bots de lobby e reconexão. O anfitrião pode preencher lugares vagos com bots; durante a partida, o bot assume imediatamente uma pessoa desconectada, inclusive compra ou dívida pendente, e devolve o controle na reconexão (janela de até 24 horas). O suporte ao modo Express citado nos testes históricos deixou de ser parte do produto. Revisão da hospedagem permanece pendente.
3. **Ciclo de partida:** a única modalidade permite escolher 15, 30 ou 60 minutos; o servidor sincroniza a contagem e encerra por patrimônio ao fim do tempo. O modo Express e seus objetivos privados foram retirados. As condições de vitória imediata por monopólio são autoritativas no servidor. Ainda são necessários playtests humanos para avaliar estratégia e equilíbrio.
4. **Economia e interação:** em andamento. Na reforma BANTEC, a hipoteca foi substituída pela devolução do título ao banco por 50% do preço durante dívida, liberando o imóvel. A carteira lista preço de compra, nível construído e aluguel atual; o inspetor detalha os níveis e permite gerenciar o título. Leilões voluntários de títulos próprios podem ser iniciados somente no turno de quem vende, fora de compra ou dívida, com lances reservados por 20 segundos. Participantes abrem o perfil e a carteira de qualquer jogador pelo cartão; propostas enviadas ali ficam pendentes até resposta ou cancelamento, sem janela de turno. A partida já foi revisada em viewport desktop; falta percorrer liquidação numa dívida real.
5. **Presets:** durações de partida, critérios de vitória e quatro companhias aprovadas pelo usuário implementados. O balanço geral deve ser avaliado em partidas com pessoas.
6. **Acabamento:** em andamento. A interface mostra informações das casas, permite recusar compras e inspecionar imóveis. A compra oferece até quatro opções de terreno/construção com preço e aluguel; a inspeção destaca o nível atual. Construções low-poly ficam na faixa interna dos pisos, preservando o nome das cidades e o corredor; as regiões têm cores próprias. Copa do Mundo e Volta ao Brasil usam estádio e aeroporto com avião originais. Os modelos de dinheiro acompanham os saldos. O modelo da FATEC Itapetininga ocupa apenas o centro visual. Lobby e HUD têm controles responsivos, cor do jogador, duração, qualidade gráfica, áudio, movimento e emotes. A carteira mostra preço, construções e aluguel; a partida já foi revisada em desktop e celular, mas falta conferir as ações de liquidação num estado real de dívida.

## Limites do MVP

- Sem login, contas, matchmaking público, ranking ou chat de voz.
- Sem assets, marcas, textos ou layout copiados de *Business Tour*; criar identidade visual própria.
- Suportar computador e celular desde o começo; medir WebGL e controles em aparelhos móveis modestos.

## Referências de hospedagem

A decisão de usar Vercel para o frontend e um serviço Node para o multiplayer está aprovada. A validação do provedor do servidor permanece uma escolha operacional. Documentação consultada: [WebSockets na Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment) e [reconexão Colyseus](https://docs.colyseus.io/room/reconnection).
