# Relatório — leilão compartilhado

Data: 2026-11-06
Estado: implementado no jogo web React/Colyseus.

## Entrega

- Leilão de imóvel próprio inicia diretamente a disputa pública. O vendedor pode cancelar enquanto ninguém tiver dado lance; sem lance ao fim do prazo, a propriedade não é vendida.
- Pedido de leilão de imóvel alheio reserva de imediato o lance inicial do solicitante. O dono tem 15 segundos para aceitar ou recusar; expiração e recusa devolvem a reserva. Há um pedido pendente por sala e 15 segundos de espera individual após recusa/expiração.
- Aceitar converte o lance reservado em maior lance da disputa. Os demais jogadores podem superar em pelo menos R$ 10 mil; o vendedor não pode dar lance. O leilão dura 10 segundos desde o lance válido mais recente.
- Durante a disputa, os relógios da partida e da vez pausam. Ações que alteram turno, saldo ou propriedade ficam suspensas, exceto os lances. Ao terminar, o sistema restaura a fase e o tempo que ainda restavam, preservando dívida e pagamentos aplicáveis.
- Ao terminar uma disputa, inclusive sem venda, a sala recebe intervalo global de 120 segundos. A UI mostra a propriedade, vendedor, maior lance, prazo, controles de valor e indisponibilidade compartilhada.
- Construções e efeitos continuam vinculados à propriedade transferida. O servidor reavalia monopólio/vitória e mantém a política de liquidação da dívida.
- Bots avaliam valor, construções, proximidade de conjuntos, bloqueio estratégico, caixa disponível e risco de entregar uma vitória imediata. Também avaliam pedidos recebidos; não iniciam pedidos espontaneamente.

## Arquivos principais

- `server/src/rooms/GameRoom.ts`: validação autoritativa, reservas, prazos, pausa/retomada, transferência e fluxo de bots.
- `server/src/rooms/schema/LobbyState.ts` e `shared/game.ts`: estado sincronizado e prazos do leilão.
- `server/src/rooms/botStrategy.ts`: critérios de lance e de resposta a pedido.
- `src/ui/App.tsx`, `src/ui/auctionActions.ts` e `src/ui/styles.css`: seleção da propriedade, pedido/anúncio, painel compartilhado e incrementos de lance.
- `server/test/GameRoom.test.ts`, `server/test/botStrategy.test.ts` e `src/ui/auctionActions.test.ts`: regressões de regras, estratégia e valores da interface.
- `docs/REGRAS-DE-JOGO.md`, `docs/DECISOES.md`, `docs/ANDAMENTO.md`, `docs/VALIDACAO.md` e o plano nesta pasta.

## Validação

- `npm run verify`: passou — 400 testes em 68 arquivos; build TypeScript/Vite e build do servidor passaram. O Vite registrou o aviso já existente de bundle principal acima de 500 KB (1.479,83 kB; gzip 422,88 kB).
- Playtest de navegador com duas pessoas na mesma sala: imóvel comprado, escolha de anúncio, disputa visível nas duas sessões, lance de R$ 280 mil sincronizado, saldo transferido, relógio de turno retomado e cooldown global exibido.
- O playtest encontrou que um preço de tabela de R$ 275 mil não era múltiplo do incremento permitido. A interface agora arredonda o valor inicial para R$ 280 mil.
- Os testes automatizados cobrem anúncio direto, fronteira segura durante animação, reserva/aceite/recusa/expiração, transferência sem concorrência, retorno de reserva, cooldown e estratégia do bot.
- Não houve revisão visual do painel de leilão em viewport mobile nesta sessão; essa validação continua pendente.

## Limitações conhecidas

- O intervalo global e a disputa são autoritativos no servidor e replicados; o resultado depende da conexão com a sala enquanto a partida está ativa.
- O playtest manual confirmou o anúncio e lance competitivo, mas os fluxos de solicitação aceita/recusada/expirada e a resposta de bot foram verificados pela suíte automatizada, não repetidos manualmente no navegador.
- Um serviço legado já ocupava a porta 2567. Foi preservado; o teste manual usou Colyseus em 2568 e Vite em 5173.
