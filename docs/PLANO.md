# Plano do jogo

## Visão

Um jogo de tabuleiro para abrir no navegador e jogar com amigos, sem cadastro. Cada pessoa informa um nome e cria uma sala ou entra pelo código recebido. A partida combina um tabuleiro 3D original com interface acessível e regras executadas pelo servidor.

## Experiência

- Tela inicial para escolher nome e criar/entrar em sala.
- Ao criar, anfitrião escolhe Clássico Rápido ou Express; quem entra vê o modo antes de confirmar.
- Lobby lista até quatro participantes, anfitrião e estado de preparação; anfitrião inicia.
- Tabuleiro 3D com inclinação inicial discreta e câmera orbitável pelo arraste do mouse ou toque, zoom pela roda do mouse e pinça no celular, preservando os quatro cantos no enquadramento inicial; as fichas têm leve aumento de escala e aro contrastante na base. A partida usa toda a janela, sem o cabeçalho geral. Partida, Prisão (três turnos), Copa do Mundo (aluguel 3× na propriedade escolhida e estádio 3D) e Volta ao Mundo (teletransporte para casa própria, livre ou especial e aeroporto com avião) são os quatro cantos. Espaços legíveis, peças e dados; cada pessoa escolhe no lobby peão, carrinho, moto ou avião como ficha visual colorida por dono; cada jogada mostra os dados, depois o percurso da ficha e por fim a ação de chegada; o anfitrião controla a velocidade das animações (0,5×, 1× ou 2×), e observadores acompanham as fases por balão junto à ficha; HUD em HTML responsivo para desktop e celular.
- Ações disponíveis e resultados da jogada ficam claros em cada turno.
- O botão “?” abre um guia rápido. A pessoa tem 20 segundos para rolar e 10 segundos para uma decisão; expiração recusa compras, conclui automaticamente o turno de prisão, escolhe destinos padrão para os cantos novos e avança a liquidação de dívidas.
- Partidas temporárias, sem conta ou progresso persistente.

## Regras acordadas

- **Clássico Rápido:** 30 minutos, com compra de terreno e até três casas num pacote, compra de casas adicionais ao revisitar um imóvel próprio, hotel disponível em visita posterior depois de três casas, hipoteca para quitar dívida sem saldo suficiente, negociação, leilão voluntário de títulos próprios durante o turno de quem vende, cartas, prisão, dívidas e falência. Não há leilão durante dívida. Recusar uma propriedade deixa o imóvel livre e não inicia leilão. Quando o tempo acaba, termina-se a ação/pagamento corrente e vence o maior patrimônio após liquidação de bens e construções.
- **Express:** seis rodadas de 40 segundos e cerca de 8 minutos de duração total. Cada pessoa recebe um objetivo privado entre oito objetivos digitais autorais, sem repetição dentro da sala. Cumprir um objetivo paga bônus; não encerra a partida. Ao final vence o maior saldo em dinheiro; empate é decidido pelo patrimônio e depois pelos dados.
- **Tempo de ação:** ambos os modos dão 20 segundos para rolar os dados e 10 segundos para cada decisão posterior. No Express, as ações ainda precisam caber no limite de 40 segundos da fase.
- **Negociação:** janela de 45 segundos na vez ativa do Clássico; no Express, nas fases de 40 segundos. Leilões voluntários só podem ser iniciados no turno de quem vende, fora de compra ou dívida, e duram 20 segundos.
- **Desconexão:** 60 segundos para reconectar; passado o prazo, pula-se a ação/vez atual sem ações automáticas.
- **Sala:** 2–4 pessoas.

As decisões detalhadas estão em [DECISOES.md](DECISOES.md) e as fontes de regras em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md).

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

1. **Fatia visual inicial:** tela inicial, escolha de modo e primeira cena 3D responsiva com tabuleiro e peças próprias. Implementada como prévia visual.
2. **Salas online:** servidor Colyseus, código privado de cinco caracteres, lobby sincronizado, anfitrião, bots de lobby e reconexão. O anfitrião pode preencher lugares vagos com bots; durante a partida, o bot assume imediatamente uma pessoa desconectada, inclusive compra ou dívida pendente, e devolve o controle na reconexão (janela de até 24 horas). Inclui teste de partida Express completa com quatro bots. Lobby e partida também foram exercitados no Chrome e numa partida cruzada Chrome–Firefox. Revisão da hospedagem permanece pendente.
3. **Ciclo de partida:** relógios de 30 minutos no Clássico e seis rodadas de 40 segundos por jogador no Express, contagem sincronizada e encerramento por tempo implementados no servidor. O fluxo de seis rodadas leva aproximadamente 8 minutos com duas pessoas e até 16 com quatro, sem contar a liquidação de dívidas. Objetivos privados Express, progresso reservado ao dono e bônus de conclusão implementados. O baralho foi recalibrado após a primeira simulação; uma nova simulação de 80 partidas completas não encontrou objetivos impossíveis nem falhas de conclusão. Playtests com pessoas ainda são necessários para avaliar estratégia, frequência real de conclusão e equilíbrio dos bônus.
4. **Economia e interação:** em andamento. Compra, aluguel, taxas, construções residenciais (até três casas e hotel em visita posterior), venda de construções, hipotecas, dívidas, falência e uma primeira versão da negociação de dinheiro e títulos estão implementadas. Ao recusar uma propriedade, ela permanece livre e a vez continua, sem abrir leilão. Leilões voluntários de títulos próprios podem ser iniciados somente no turno de quem vende, fora de compra ou dívida, com lances reservados por 20 segundos; a pessoa dona escolhe o lance inicial. Hipotecas só podem ser usadas para pagar uma dívida com saldo insuficiente; não há leilão enquanto uma dívida estiver aberta. A janela sincronizada de negociação é de 45 segundos no Clássico e 40 segundos no Express. Os detalhes de uma oferta pendente por sala e de títulos hipotecados transferidos permanecem propostas, aguardando playtest e decisão de produto.
5. **Presets:** limites de tempo, critérios de vitória, cálculo inicial de patrimônio e objetivos Express implementados; validar o balanço dos objetivos em partidas com pessoas. A primeira simulação de 80 partidas está registrada em [VALIDACAO.md](VALIDACAO.md); os bônus permanecem como valores iniciais de playtest.
6. **Acabamento:** em andamento. A interface mostra informações legíveis ao tocar nas casas e permite recusar compras. Compra de terreno oferece até quatro pacotes visuais com custo total e aluguel; Copa e Volta permitem escolher clicando nas casas iluminadas do mapa. Construções representam terreno sem construções, uma, duas e três casas, e hotel com modelos low-poly originais do Blender, com partes do modelo recoloridas pela cor do dono. Estádio e aeroporto com avião compõem os cantos da Copa e Volta. Os modelos existentes de cédulas e maços de ouro/prata aparecem junto ao tabuleiro e acompanham o saldo de cada participante. A câmera orbita por arraste no tabuleiro; o HUD protege interações de modal. A cena não usa neblina nem camada translúcida sobre o tabuleiro. O lobby permite escolher peão, carrinho, moto ou avião como ficha apenas visual; os modelos de veículo têm cor do dono, sem alterar movimento ou regras. Cada piso residencial usa a cor completa do grupo; cantos, estações, sorte, taxas, praça e prisão têm cores e marcas próprias. O peão, os dados e as construções têm movimento curto; avisos de pagamento e eventos entram numa fila visível em sequência e pausam os painéis de decisão até terminar. Controles da partida permitem desligar o som e reduzir movimento; a preferência do sistema operacional informa o valor inicial. Opções não persistem entre sessões. Continuam necessários playtests com pessoas para avaliar ritmo, avisos no fluxo real, acessibilidade e desempenho em aparelhos móveis modestos.

## Limites do MVP

- Sem login, contas, matchmaking público, ranking ou chat de voz.
- Sem assets, marcas, textos ou layout copiados de *Business Tour*; criar identidade visual própria.
- Suportar computador e celular desde o começo; medir WebGL e controles em aparelhos móveis modestos.

## Referências de hospedagem

A decisão de usar Vercel para o frontend e um serviço Node para o multiplayer está aprovada. A validação do provedor do servidor permanece uma escolha operacional. Documentação consultada: [WebSockets na Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment) e [reconexão Colyseus](https://docs.colyseus.io/room/reconnection).
