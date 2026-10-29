# Plano do jogo

## Visão

Um jogo de tabuleiro para abrir no navegador e jogar com amigos, sem cadastro. Cada pessoa informa um nome e cria uma sala ou entra pelo código recebido. A partida combina um tabuleiro 3D original com interface acessível e regras executadas pelo servidor.

## Experiência

- Tela inicial para escolher nome e criar/entrar em sala.
- Ao criar, anfitrião escolhe Clássico Rápido ou Express; quem entra vê o modo antes de confirmar.
- Lobby lista até quatro participantes, anfitrião e estado de preparação; anfitrião inicia.
- Tabuleiro 3D de câmera inclinada alta, espaços legíveis, peças e dados; cada jogada mostra os dados, depois o percurso do peão e por fim a ação de chegada; HUD em HTML responsivo para desktop e celular.
- Ações disponíveis e resultados da jogada ficam claros em cada turno.
- Partidas temporárias, sem conta ou progresso persistente.

## Regras acordadas

- **Clássico Rápido:** 30 minutos, com compra, grupos, casas/hotéis, hipoteca para quitar dívida sem saldo suficiente, negociação, leilão voluntário de títulos próprios durante o turno de quem vende, cartas, prisão, dívidas e falência. Não há leilão durante dívida. Recusar uma propriedade deixa o imóvel livre e não inicia leilão. Quando o tempo acaba, termina-se a ação/pagamento corrente e vence o maior patrimônio após liquidação de bens e construções.
- **Express:** seis rodadas de 40 segundos e cerca de 8 minutos de duração total. Cada pessoa recebe um objetivo privado entre oito objetivos digitais autorais, sem repetição dentro da sala. Cumprir um objetivo paga bônus; não encerra a partida. Ao final vence o maior saldo em dinheiro; empate é decidido pelo patrimônio e depois pelos dados.
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
4. **Economia e interação:** em andamento. Compra, aluguel, taxas, construções residenciais equilibradas, venda de construções, hipotecas, dívidas, falência e uma primeira versão da negociação de dinheiro e títulos estão implementadas. Ao recusar uma propriedade, ela permanece livre e a vez continua, sem abrir leilão. Leilões voluntários de títulos próprios podem ser iniciados somente no turno de quem vende, fora de compra ou dívida, com lances reservados por 20 segundos; a pessoa dona escolhe o lance inicial. Hipotecas só podem ser usadas para pagar uma dívida com saldo insuficiente; não há leilão enquanto uma dívida estiver aberta. A janela sincronizada de negociação é de 45 segundos no Clássico e 40 segundos no Express. Os detalhes de uma oferta pendente por sala e de títulos hipotecados transferidos permanecem propostas, aguardando playtest e decisão de produto.
5. **Presets:** limites de tempo, critérios de vitória, cálculo inicial de patrimônio e objetivos Express implementados; validar o balanço dos objetivos em partidas com pessoas. A primeira simulação de 80 partidas está registrada em [VALIDACAO.md](VALIDACAO.md); os bônus permanecem como valores iniciais de playtest.
6. **Acabamento:** em andamento. A interface mostra informações legíveis ao tocar nas casas, permite recusar compras e identifica construções pela cor de quem é dono. O peão, os dados e as novas construções têm movimento curto; a chegada à casa recebe um pulso, e pagamentos e eventos aparecem em avisos temporários com sons opcionais. Controles da partida permitem desligar o som e reduzir movimento; a preferência do sistema operacional informa o valor inicial. Opções não persistem entre sessões. Continuam necessários playtests com pessoas para avaliar ritmo, avisos no fluxo real, acessibilidade e desempenho em aparelhos móveis modestos.

## Limites do MVP

- Sem login, contas, matchmaking público, ranking ou chat de voz.
- Sem assets, marcas, textos ou layout copiados de *Business Tour*; criar identidade visual própria.
- Suportar computador e celular desde o começo; medir WebGL e controles em aparelhos móveis modestos.

## Referências de hospedagem

A decisão de usar Vercel para o frontend e um serviço Node para o multiplayer está aprovada. A validação do provedor do servidor permanece uma escolha operacional. Documentação consultada: [WebSockets na Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment) e [reconexão Colyseus](https://docs.colyseus.io/room/reconnection).
