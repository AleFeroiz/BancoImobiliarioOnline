# Leilão compartilhado — plano de implementação

Estado: planejamento consolidado em 2026-11-06, pronto para implementação. Escopo: jogo web React/Colyseus com cena React Three Fiber. As regras abaixo descrevem a reforma aprovada; o comportamento do código atual só será substituído na implementação.

## 1. Regras já confirmadas

- Botão LEILÃO na interface durante a partida. Seleção da propriedade clicando na casa 3D; em seguida, seleção do preço inicial.
- O proprietário pode anunciar seu imóvel. Outra pessoa pode pedir que o dono leiloe um imóvel dele, oferecendo um valor inicial.
- Pedido não é compra direta: se A pedir o imóvel de B por R$ 600 mil e B aceitar, começa um leilão público em que A já deu um lance de R$ 600 mil. Se ninguém superar, A recebe o imóvel e B recebe esse valor.
- O dono pode recusar o pedido; nesse caso, não há leilão nem transferência.
- Durante o leilão, todos veem o imóvel destacado e podem disputar, exceto seu vendedor. O fluxo normal do jogo fica pausado.
- Construções acompanham o imóvel. A transferência pode completar monopólio e produzir a vitória normal.
- Há apenas um leilão ativo na sala. Depois de terminar, começa um intervalo global de dois minutos até o próximo; o intervalo afeta todos os jogadores.

## 2. Decisões confirmadas nesta etapa

Respostas do usuário incorporadas ao plano:

1. Anúncio de imóvel próprio abre diretamente a disputa; retirar a etapa antiga de alguém aceitar participar. Sem lance, não vende.
2. Pedido ao dono expira em 15 s e não pausa o jogo. Leilão ativo pausa relógios da partida e do turno; cada lance válido renova 10 s de disputa. Leilão terminado sem lances também inicia o intervalo global.
3. Reservar o valor do solicitante no envio do pedido; não permitir retirada. Devolver em recusa/expiração. Um pedido pendente por sala e intervalo individual de 15 s após recusa/expiração.
4. Durante disputa, somente lances como ações financeiras. Quem tem dívida pode anunciar seu imóvel; não pode pedir imóvel alheio nem dar lance. Retomar a dívida após concluir.
5. Bots dão lances quando houver vantagem econômica ou estratégica, com inteligência mínima. Mantêm avaliação de pedidos recebidos e não iniciam pedidos nesta versão, conforme o fluxo proposto. Os critérios técnicos estão na seção 9.

Não restam dúvidas de produto bloqueando este plano. Na implementação, atualizar `docs/REGRAS-DE-JOGO.md` e `docs/DECISOES.md` junto da substituição do comportamento antigo.

## 3. Implementação existente a aproveitar

Inspeção em `server/src/rooms/GameRoom.ts` identificou `auctionStart`, `auctionAccept`, `auctionBid`, `auctionCancel`, `startAuctionClock`, `clearAuction` e `finishAuction`. Hoje o anúncio abre a fase `interest`; aceite abre `bidding`; o lance reserva dinheiro e devolve o lance anterior ao ser superado. A troca de dono conserva construções e demais campos da propriedade e verifica vitória por monopólio.

O relógio da partida e o relógio do turno rodam separadamente. A cena também tem callbacks de apresentação/movimento e supervisão de inatividade/turnos; pausar apenas os dois contadores não basta para parar a partida. A UI existente usa estado de leilão no `App.tsx`, controles de preço e abertura automática do painel.

Preservar a engine, o schema Colyseus e os contratos compatíveis quando possível. Não adicionar infraestrutura, dependências ou assets novos. Antes da implementação, atualizar o grafo e confirmar os pontos em código; o grafo atual também contém mudanças locais de outras frentes.

## 4. Fluxos de implementação

### 4.1 Imóvel próprio

1. LEILÃO ativa modo de seleção e destaca propriedades elegíveis que têm dono.
2. Clicar em imóvel próprio abre preço inicial, com nome, proprietário e construções visíveis.
3. Exibir “Anunciar leilão”, valor inicial e explicação de que sem lances não há venda.
4. O servidor valida a propriedade, disponibilidade global e identidade. Começa a disputa na próxima transição segura.
5. Primeiro lance cobre ao menos o preço inicial. Os seguintes sobem no mínimo R$ 10 mil.
6. Sem lances ao expirar: encerrar, manter posse e iniciar intervalo global.

### 4.2 Imóvel alheio

1. Clicar num imóvel de outra pessoa abre “Pedir leilão” com dono, construções e lance inicial.
2. Explicar antes de enviar: “Se o dono aceitar, este valor será seu lance obrigatório. Se ninguém superar, você compra o imóvel”.
3. Validar saldo e reservar o valor proposto no servidor. O solicitante não pode retirar o pedido; recusa ou expiração devolve a reserva.
4. O dono recebe pedido com nome do solicitante, imóvel, valor e prazo; Aceitar e Recusar. O jogo continua nessa fase.
5. Recusa, expiração ou invalidação: devolver reserva exatamente uma vez e fechar pedido, sem iniciar intervalo global de leilão.
6. Aceite válido: converter o pedido em leilão, conservando a reserva; o solicitante começa como maior ofertante. O vendedor não pode desistir de um leilão que já tem lance.
7. Qualquer outro participante elegível pode superar. Se o solicitante for superado, devolver sua reserva como já ocorre com qualquer maior ofertante anterior.

### 4.3 Disputa compartilhada

- Painel abre automaticamente para todos; título destacado e demais casas escurecidas. Mostrar vendedor, maior ofertante, valor atual, próximo mínimo e contagem regressiva.
- Exibir Passar/Não aumentar e controles de lance. Passar não cria uma oferta nem obriga a comprar; proposta do plano: permite voltar a disputar enquanto o prazo não tiver terminado.
- Aumento mínimo R$ 10 mil; controles ±R$ 10 mil e ±R$ 100 mil, com máximo conforme saldo disponível mais a própria reserva atual.
- Anúncio próprio pode ser cancelado pelo vendedor enquanto não tiver lance, preservando a regra atual. Depois do primeiro lance não há cancelamento voluntário. Proposta: cancelamento de leilão já iniciado também inicia o intervalo global.
- Comprador recebe imóvel e construções, vendedor recebe o valor reservado, reserva é consumida e vitória é verificada antes de retomar a partida.
- Sem vitória, restaurar a decisão/turno suspenso e seu tempo restante. Resultado aparece brevemente; não acrescentar uma segunda pausa longa.

## 5. Preços, efeitos e elegibilidade

Propostas técnicas para a implementação:

- Valores inteiros seguros, mínimo R$ 10 mil, em múltiplos de R$ 10 mil. Não impor teto pelo preço de tabela; respeitar saldo real e limite numérico do schema.
- Permitir cidades e companhias possuídas, inclusive hotéis. Não confundir leilão consentido com restrições de recompra forçada.
- Preço inicial sugerido pela UI: valor de tabela, arredondado para a seleção; o jogador pode alterar.
- Casas, hotel e efeitos vinculados ao imóvel continuam nele: conservar sede da Copa e duração restante de Apagão/Proteção, conforme modelo existente. Não reiniciar efeitos ao trocar dono.
- Falido não vende nem compra. Vendedor não dá lance no próprio imóvel. Somente o controlador atual e autorizado pode agir em nome do participante.
- Pedido precisa revalidar posse, solicitante, reserva e capacidade do vendedor de receber o dinheiro no aceite. Mudança de dono, retorno ao banco ou fim da partida invalida o pedido.
- Reservas são dinheiro indisponível: empréstimo, aposta, aluguel ou outra compra não podem gastar a mesma quantia. Quando o modelo atual subtrai a reserva do saldo, não subtrair uma segunda vez em cálculos de disponibilidade.
- Dinheiro infinito DEV precisa de comportamento explícito nos testes; não usar essa opção para contornar a reserva de um solicitante humano.

## 6. Pausa e retomada

Adicionar estado de pausa do leilão independente de `turnPhase`. Não substituir permanentemente a fase normal por uma fase genérica que perca compra, dívida, carta ou destino pendente.

1. Registrar a fase/decisão atual e o tempo restante, sem restaurar saldos ou donos antigos ao sair da pausa.
2. Impedir novas ações normais que alterem dinheiro, propriedade ou turno durante disputa, inclusive apostas e empréstimos; somente lances ficam disponíveis como ações financeiras.
3. Suspender decremento dos relógios da partida e do turno; o relógio do leilão continua.
4. Suspender decisões automáticas dos bots, watchdog do turno e callbacks que avançam o fluxo normal.
5. Se o pedido de início chegar durante dados/movimento/revelação, aguardar uma fronteira segura antes de entrar na disputa. Revalidar o imóvel nessa fronteira. Não interromper o peão no meio do trajeto nem executar chegada duas vezes.
6. Inatividade durante a pausa não pode fazer um bot executar uma decisão normal escondida. Preservar a detecção de desconexão e a capacidade de reconectar; reconciliar inatividade ao retomar.
7. Ao terminar, verificar vencedor; em seguida restaurar apenas a decisão ainda válida. Recalcular opções que dependam de saldo/posse, pois o leilão pode tê-los alterado.
8. Se o vendedor estava em dívida e agora puder quitar, usar o pagamento existente e continuar sua resolução uma única vez, sem cobrar novamente o leilão.

Pedido ainda aguardando dono não pausa a partida. Caso o turno avance, o pedido acompanha o imóvel e seus participantes, sem se tornar uma decisão do novo jogador ativo.

## 7. Estado e mensagens

Campos propostos no estado da sala:

- Pedido: id/revisão, propriedade, vendedor, solicitante, valor reservado e prazo autoritativo.
- Leilão: reutilizar id, propriedade, vendedor, lance atual, ofertante e fase; acrescentar origem do leilão, solicitante inicial e estado de pausa quando necessário.
- Intervalo global: instante limite autoritativo, com contador derivado para a UI. Não confiar em relógio local para validar disponibilidade.
- Intervalo individual de 15 segundos após pedido recusado/expirado: um limite por participante, sem histórico ilimitado.

Mensagens propostas: anunciar imóvel próprio; solicitar leilão; aceitar/recusar pedido com id; dar lance com id do leilão; cancelar anúncio sem lances. Pedido enviado não tem cancelamento voluntário. Tipos compartilhados devem distinguir pedido pendente de leilão ativo.

Cada mutação valida jogador/controlador, partida, fase, id e saldo. Recusa/aceite duplicado e clique duplo não podem produzir dois leilões nem dois reembolsos. Pedido velho nunca altera pedido novo. Transição aceite → reserva vinculada → disputa deve ser síncrona, sem `await` intermediário que permita gastar a reserva.

## 8. Intervalo global e conflitos

- Contar 120 segundos a partir da finalização efetiva de cada leilão iniciado. Não contar desde o pedido ou anúncio.
- Mostrar LEILÃO · 1:42 e motivo de indisponibilidade para todos. O servidor rejeita início antecipado mesmo se o navegador adulterar o contador.
- Na expiração exata, permitir nova solicitação. Só uma vence se duas mensagens chegarem juntas; a outra recebe resposta de indisponibilidade.
- Recusa de pedido não ativa intervalo global. A restrição individual de 15 segundos limita repetição sem bloquear a sala inteira.
- Proposta: durante intervalo global, bloquear tanto anúncio próprio quanto envio de pedido; não acumular uma fila de pedidos para começar imediatamente depois.
- Se um leilão iniciado for invalidado por estado excepcional, devolver a reserva uma vez, encerrar pausa e iniciar o intervalo global. Ao terminar a própria partida, apenas limpar reservas/estado e exibir resultado final.

## 9. Bots, desconexão e reconexão

Reutilizar e aprimorar a estratégia de lances do servidor. Durante a disputa, suspender ações normais dos bots. A estratégia deve ser explicável, limitar gastos e avaliar o estado público da partida, sem acessar resultado futuro de dados/cartas nem condições privadas de apostas.

### 9.1 Decidir dar lance

- Calcular valor-base pelo investimento do imóvel: terreno e construções atuais, usando os helpers existentes. Considerar companhia, hotel, sede da Copa e efeitos temporários sem tratar um efeito que expira como renda permanente.
- Elevar a disposição a pagar se o título completa região ou linha do próprio bot, aproxima um grupo já possuído ou bloqueia uma vitória imediata de outro participante. Reduzir se o título não combina com sua carteira ou se o preço já consome uma reserva necessária.
- Calcular um teto estratégico e um teto financeiro, usando o menor dos dois. Reservar dinheiro para cobranças previsíveis; não apostar todo o caixa em um imóvel sem vantagem relevante.
- Uma vitória imediata pode justificar consumir a reserva financeira, mas nunca permite gastar além do saldo realmente disponível mais a própria reserva de lance.
- Não disputar o próprio imóvel, não superar seu próprio lance e não tentar lance sem dinheiro, em dívida ou quando o próximo mínimo superar o teto.
- Ao decidir participar, oferecer o menor lance válido, sem saltos artificiais para inflacionar preço. Reavaliar a cada mudança de maior ofertante ou valor, com atraso curto de reação do servidor; não gerar mensagens a cada frame.

### 9.2 Responder a um pedido como vendedor

- Comparar o lance inicial obrigatório com o valor-base e a importância do título na carteira do bot. Como ninguém mais é obrigado a dar lance, avaliar o preço inicial como valor mínimo garantido da venda.
- Recusar oferta muito abaixo do valor ou que desfaça um grupo valioso sem compensação. Não aceitar R$ 10 mil por uma propriedade cara apenas porque existe um pedido.
- Recusar pedido cujo lance inicial já permite ao solicitante vencer imediatamente por monopólio. Dar maior peso a levantar caixa quando o bot está em dívida e a oferta realmente ajuda a resolver a cobrança.
- Aceitar quando a oferta compensa a perda do título e a venda faz sentido para a posição do bot. Não anunciar nem pedir imóveis espontaneamente nesta versão.

### 9.3 Calibração e testes da estratégia

Separar avaliação e decisão em funções puras de `botStrategy.ts`. Centralizar pesos e reserva de caixa; seus valores são parâmetros técnicos de calibração, não novas regras para humanos. A implementação deve escolher valores explícitos e documentá-los, permitindo ajustar depois sem reescrever o fluxo.

Cobrir cenários com resultados esperados: compra vantajosa, preço excessivo, falta de saldo, reserva de caixa, grupo quase completo, vitória imediata, bloqueio de vitória adversária, bot já como maior ofertante, pedido baixo recusado e oferta vantajosa aceita. Testar também que o bot vendedor não entrega vitória ao solicitante ao aceitar uma oferta inicial. Avaliar situações em que não dar lance é a decisão correta, para evitar bots que disputam tudo.

Proposta: desconexão não cancela lance já dado nem compra obrigatória; a reserva protege a conclusão. O bot substituto pode responder conforme a política aprovada. Pedido para proprietário sem controlador humano segue política de bot; não fica pendurado para sempre. Reconectar recupera fase, reservas, imóvel destacado, prazo e intervalo global sem reiniciar nenhum contador.

## 10. Interface desktop e mobile

- Botão LEILÃO nas ações rápidas, sem painel permanente cobrindo o tabuleiro.
- Modo de seleção com instrução curta e Cancelar. Selecionar imóvel alheio muda a ação para Pedir leilão; imóvel próprio mostra Anunciar.
- Pedido para o dono em painel distinto, identificando claramente que o aceite inicia disputa pública com lance já válido do solicitante.
- Leilão ativo em painel compartilhado e imóvel destacado na cena; reusar a iluminação/apagamento do tabuleiro.
- Desktop: preservar visibilidade da propriedade e dos participantes. Mobile: painel inferior rolável, valor e contador sempre legíveis, sem transbordamento a 320/390 px.
- Não depender só de cores para indicar vendedor/maior lance. Rótulos acessíveis, foco previsível, Escape fecha somente painéis locais canceláveis, sem desistir de lance válido.
- Toque e rolagem nos controles não movem a câmera. Fechar painel local não cancela o leilão global; manter controle visível para reabrir.

## 11. Arquivos e etapas

1. **Consolidar respostas:** atualizar este plano e registrar regras aprovadas. Manter o comportamento antigo documentado até a implementação substituí-lo.
2. **Mapear o fluxo atual:** `GameRoom.ts`, `LobbyState.ts`, `botStrategy.ts`, `shared/game.ts`, `App.tsx`, helpers de preço/painel e seleção em `BoardScene.tsx`.
3. **Extrair contratos/helpers:** tipos de pedido, elegibilidade, mínimo de lance e constantes de prazos/intervalos num módulo compartilhado, sem dependências novas.
4. **Criar pedido e reserva:** envio, resposta, expiração, revalidação e reembolso idempotente. Testar antes de ligar à UI.
5. **Adaptar início de disputa:** anúncio próprio conforme resposta; aceite de pedido entra com maior lance do solicitante e sua reserva existente.
6. **Integrar pausa:** auditar relógios, apresentações, bot, inatividade e watchdog. Testar decisões suspensas e transições seguras.
7. **Finalizar disputa e intervalo:** troca atômica, construções/efeitos, monopólio, dívida, falhas e intervalo global de 120 s.
8. **Integrar interface:** botão, seleção 3D, preço, pedido ao dono, painel público, foco e responsividade.
9. **Bots e reconexão:** estratégia aprovada e recuperação de pedido/leilão/contadores na mesma cadeira.
10. **Validar e publicar:** testes de regressão e integração, `npm run verify`, playtest real desktop/mobile com clientes e bots, logs e Graphify atualizado. Registrar evidências, revisar somente escopo, hook ativo, commit e push em `main`.

## 12. Critérios de aceite e testes

- Imóvel próprio e alheio selecionáveis corretamente; imóvel do banco não pode ser pedido. Imóvel destacado na disputa é o mesmo em todos os clientes.
- A pede a B por R$ 600 mil, B aceita, ninguém supera: propriedade e construções vão para A e R$ 600 mil para B, uma única vez.
- C supera A: A recebe reserva de volta; C passa a ter seu lance reservado e compra se vencer.
- Recusa/expiração devolve dinheiro e não vende nem pausa. Pedido inválido, repetido ou de controlador antigo não altera estado.
- Dinheiro reservado não pode ser usado em aposta, aluguel ou compra paralela. Aceite revalida posse e participantes se o estado mudou durante o pedido.
- Relógios da partida e turno conservam exatamente o restante durante disputa; relógio do leilão termina normalmente. Callback de movimento/carta não escapa da pausa.
- Depois do leilão, compra, destino, prisão, dívida e duplas continuam corretamente; nenhuma decisão normal é executada duas vezes.
- Sem lances, cancelamento permitido e encerramento excepcional seguem regras aprovadas para intervalo. Nova abertura antes de 120 s é recusada; no limite é aceita.
- Testar duas aberturas simultâneas, dois aceites, dois lances concorrentes, recusa atrasada e pedido de id antigo.
- Transferir companhias/hotel, manter efeitos e detectar monopólio imediatamente. Falência, retorno ao banco e fim por tempo não deixam reserva retida.
- Reconectar vendedor, maior ofertante e observador preserva estado; bot não executa jogada normal durante pausa.
- Playtest com pelo menos dois clientes: pedido aceito, recusado, lance superado, compra sem concorrência e retomada do turno. Revisar desktop, 390 × 844 e largura 320 px, inclusive solicitação e painel de lance.

Plano pronto para execução. Nesta etapa houve somente consolidação documental; não há implementação do novo leilão nem validação de código da reforma. Os detalhes técnicos identificados como propostas podem ser resolvidos durante implementação dentro das regras confirmadas, registrando escolhas e evidências.
