# Plano do jogo

## Visão

Um jogo de tabuleiro para abrir no navegador e jogar com amigos, sem cadastro. Cada pessoa informa um nome e cria uma sala ou entra pelo código recebido. A partida combina um tabuleiro 3D original com interface acessível e regras executadas pelo servidor.

## Experiência

- Tela inicial para escolher nome e criar/entrar em sala.
- Ao criar, anfitrião escolhe Clássico Rápido ou Express; quem entra vê o modo antes de confirmar.
- Lobby lista até quatro participantes, anfitrião e estado de preparação; anfitrião inicia.
- Tabuleiro 3D de câmera inclinada, espaços legíveis, peças e dados; HUD em HTML responsivo para desktop e celular.
- Ações disponíveis e resultados da jogada ficam claros em cada turno.
- Partidas temporárias, sem conta ou progresso persistente.

## Regras acordadas

- **Clássico Rápido:** 30 minutos, com compra, leilão, grupos, casas/hotéis, hipoteca, negociação, cartas, prisão, dívidas e falência. Quando o tempo acaba, termina-se a ação/pagamento corrente e vence o maior patrimônio após liquidação de bens e construções.
- **Express:** seis rodadas de 40 segundos e cerca de 8 minutos de duração total. Cada pessoa recebe um objetivo privado entre oito objetivos digitais autorais. Cumprir um objetivo paga bônus; não encerra a partida. Ao final vence o maior saldo em dinheiro; empate é decidido pelo patrimônio e depois pelos dados.
- **Leilão:** propriedade recusada vai a leilão público de 20 segundos.
- **Negociação:** janela de 45 segundos na vez ativa do Clássico; no Express, nas fases de 40 segundos.
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
2. **Salas online:** servidor Colyseus, código privado de cinco caracteres, lobby sincronizado, anfitrião e reconexão. Implementado; lobby revisado visualmente no navegador integrado. Falta repetir a checagem no Firefox e revisar hospedagem.
3. **Ciclo de partida:** relógios de 30 minutos no Clássico e seis rodadas de 40 segundos por jogador no Express, contagem sincronizada e encerramento por tempo implementados no servidor. O fluxo de seis rodadas leva aproximadamente 8 minutos com duas pessoas e até 16 com quatro, sem contar leilões ou liquidação de dívidas. Objetivos privados e bônus Express ainda faltam.
4. **Economia e interação:** em andamento. Compra, aluguel, taxas, leilão, construções residenciais equilibradas, venda de construções, hipotecas, dívidas, falência e uma primeira versão da negociação de dinheiro e títulos estão implementadas. A janela sincronizada de negociação é de 45 segundos no Clássico e 40 segundos no Express. Os detalhes de uma oferta pendente por sala e de títulos hipotecados transferidos permanecem propostas, aguardando playtest e decisão de produto.
5. **Presets:** limites de tempo, critérios de vitória e cálculo inicial de patrimônio implementados; objetivos e bônus Express ainda faltam.
6. **Acabamento:** acessibilidade, layout móvel, efeitos visuais, desempenho, publicação e validação com um grupo.

## Limites do MVP

- Sem login, contas, matchmaking público, ranking ou chat de voz.
- Sem assets, marcas, textos ou layout copiados de *Business Tour*; criar identidade visual própria.
- Suportar computador e celular desde o começo; medir WebGL e controles em aparelhos móveis modestos.

## Referências de hospedagem

A decisão de usar Vercel para o frontend e um serviço Node para o multiplayer está aprovada. A validação do provedor do servidor permanece uma escolha operacional. Documentação consultada: [WebSockets na Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment) e [reconexão Colyseus](https://docs.colyseus.io/room/reconnection).
