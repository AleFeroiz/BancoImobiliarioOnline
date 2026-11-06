# Apostas — plano detalhado de implementação

Estado: implementação concluída na versão web em 2026-11-06. Escopo: React/Colyseus com tabuleiro React Three Fiber. Referências: `../REGRAS-DE-JOGO.md`, `../DECISOES.md` e `emprestimo-banco.md`.

## 1. Regras confirmadas

- Dinheiro exclusivamente da partida. Uma aposta por jogador entre duas passagens válidas pela Partida; pode apostar na primeira volta.
- Valor mínimo de R$ 10.000. Teto de 50% do saldo inicial configurado da sala, limitado também ao dinheiro disponível. Com saldo inicial de R$ 2.000.000, o teto é R$ 1.000.000.
- Seletor com incrementos e decrementos de R$ 10.000 e R$ 100.000. Valores em múltiplos de R$ 10.000.
- O jogador escolhe o valor e vê três opções com probabilidades e prêmios diferentes. As combinações variam entre voltas; a opção escolhida resolve a aposta imediatamente no servidor.
- Retorno médio ligeiramente desfavorável. Vitória devolve a quantia apostada mais o lucro anunciado; derrota perde integralmente a quantia apostada.
- As três opções ficam fixas durante a volta. Fechar/reabrir o painel, alterar o valor, atualizar a página ou reconectar não sorteia novas condições.
- Pode apostar fora da própria vez. Aposta bloqueada enquanto o próprio jogador estiver em dívida. Os relógios da partida e do turno continuam normalmente.
- Botão APOSTAS abre painel compacto. Bots, inclusive controles automáticos por inatividade ou desconexão, não iniciam apostas nesta versão.
- Uma passagem por movimento que percorre o tabuleiro renova a disponibilidade; movimentos de carta que percorrem casas também contam. Teletransportes como Troca-Troca não contam.

## 2. Parâmetros técnicos do plano

Estas escolhas tornam as regras implementáveis sem acrescentar configurações ao lobby:

- Teto efetivo: `floor(min(saldoInicial × 0,50, saldoDisponivel) / 10.000) × 10.000`. Se for menor que R$ 10.000, desabilitar a ação e explicar o motivo. Valores reservados por outros sistemas não podem ser gastos novamente.
- Prisão e empréstimo ativo não impedem aposta por si só; a existência de dívida pendente do jogador impede. Dinheiro recebido de empréstimo integra o saldo disponível normal.
- A aposta só é consumida quando uma escolha válida é aceita. Abrir, consultar ou cancelar o painel não consome a oportunidade.
- O botão de cada opção confirma a aposta, sem uma segunda janela. Deve anunciar explicitamente o valor que será arriscado antes do clique.
- Durante o processamento, bloquear novos cliques. A resolução financeira é imediata; a apresentação do resultado é apenas visual, sem bloquear a vez de todos.
- Não aceitar novas apostas depois de esgotado o tempo da partida, mesmo se o servidor ainda estiver terminando uma resolução anterior. Falidos, espectadores e conexões sem participante válido também não podem apostar.
- Em modo DEV, a aposta continua exigindo saldo real suficiente e debitando dinheiro real da partida. Não aplicar gasto gratuito do modo dinheiro infinito a esta ação.
- Sem dependências, contas, persistência externa ou novos assets 3D.

## 3. Economia e geração das opções

### 3.1 Termos e fórmula

Guardar a chance em pontos-base inteiros: 6.000 representa 60%. Guardar o multiplicador do recebimento total como fração inteira, evitando arredondamentos de porcentagens com ponto flutuante.

`recebimentoTotal = floor(valorApostado × numerador / denominador)`

`lucroSeVencer = recebimentoTotal − valorApostado`

`variacaoLiquida = venceu ? lucroSeVencer : −valorApostado`

O servidor debita o valor da aposta e credita o recebimento total somente em caso de vitória, numa mesma execução síncrona. Não cobrar o valor novamente na apresentação do resultado.

### 3.2 Catálogo inicial proposto pelo plano

Cada linha é um perfil aprovado tecnicamente para sorteio. Sortear um perfil de cada faixa, sem alterar livremente chance e prêmio de maneira independente.

| Faixa | Chance | Recebimento total | Retorno médio | Lucro numa aposta de R$ 100 mil |
| --- | --- | --- | --- | --- |
| Maior chance | 60% | 1,50× | 90% | R$ 50 mil |
| Maior chance | 65% | 1,40× | 91% | R$ 40 mil |
| Maior chance | 70% | 1,30× | 91% | R$ 30 mil |
| Intermediária | 35% | 2,50× | 87,5% | R$ 150 mil |
| Intermediária | 40% | 2,25× | 90% | R$ 125 mil |
| Intermediária | 45% | 2,00× | 90% | R$ 100 mil |
| Menor chance | 10% | 9,00× | 90% | R$ 800 mil |
| Menor chance | 15% | 6,00× | 90% | R$ 500 mil |
| Menor chance | 20% | 4,50× | 90% | R$ 350 mil |

Retorno médio significa a média matemática do total recebido sobre o valor apostado, não uma garantia por partida. Nestes perfis, a perda média é de 9% a 12,5% do valor apostado. O teto de 50% permite grande oscilação; manter os números centralizados para futura calibração documentada, sem ajustar dinamicamente conforme saldo ou posição no ranking.

Sortear uniformemente um perfil de cada faixa por jogador/volta no servidor. Exibir sempre da maior para a menor chance. A repetição casual de um perfil entre voltas é permitida; não prometer três combinações inéditas em toda renovação.

### 3.3 Sorteio do resultado

- Usar `randomInt(0, 10_000)` de `node:crypto`, já utilizado pelo servidor para outros sorteios.
- Vitória quando `resultado < chanceEmPontosBase`. Não usar `<=`.
- Nunca receber chance, multiplicador, prêmio ou resultado enviados pelo navegador como autoridade.
- Injetar a fonte de sorteio no módulo de regras para testes determinísticos. A produção sempre usa a fonte do servidor.
- Validar, antes do débito, que um eventual prêmio cabe no limite de saldo do schema. Rejeitar a ação com explicação se não couber; não truncar silenciosamente o prêmio.

## 4. Interface e fluxo do jogador

1. Botão APOSTAS na área de ações rápidas. Painel fechado ao entrar na partida; indicador discreto quando a aposta da volta já foi usada.
2. Abrir solicita as condições atuais ao servidor. Durante carregamento, não apresentar opções inventadas nem permitir confirmar.
3. Mostrar valor selecionado, controles ±10 mil/±100 mil, teto efetivo e aviso de uma aposta por volta.
4. Exibir três opções: chance de vencer, lucro líquido se vencer, total recebido se vencer e perda se perder. Evitar chamar o recebimento total de lucro.
5. Exemplo de opção: “60% de chance · lucro R$ 50.000 · recebe R$ 150.000 no total · se perder, perde R$ 100.000”. Botão: “Apostar R$ 100.000”.
6. Ao confirmar, manter o painel aberto e os controles bloqueados até chegar a resposta ou ser consultado o estado sincronizado. Não repetir automaticamente uma requisição com identidade nova.
7. Vitória: “Você ganhou! Lucro de R$ X”. Derrota: “Você perdeu R$ X”. Mostrar valor apostado e resultado, sem depender exclusivamente de cor.
8. Após resolver, mostrar “Aposta desta volta utilizada. Disponível novamente ao passar pela Partida”. Resultado pode ser fechado e consultado novamente durante a mesma volta.
9. Se o saldo mudar enquanto o painel está aberto, atualizar o teto e reduzir a seleção se necessário. A validação final sempre acontece no servidor.
10. Se a volta mudar enquanto o painel estiver aberto, invalidar as opções anteriores e carregar as novas. Não enviar automaticamente a seleção antiga.

Desktop: painel na lateral, afastado das decisões centrais. Mobile: painel inferior rolável, três opções empilhadas, sem transbordamento horizontal; manter acesso ao fechamento e aos valores. Não movimentar a câmera ao tocar, rolar ou arrastar o painel. Fechar com Escape, retornar foco ao botão de abertura, rótulos acessíveis e resultado com `aria-live`. Animação breve e opcional, respeitando redução de movimento; não usar roleta 3D nesta etapa.

## 5. Estado, contratos e autoridade

### 5.1 Estado por participante

- `betLapRevision`: versão da disponibilidade; começa na partida e avança em passagem válida.
- `betUsedThisLap`: indica consumo da oportunidade atual.
- Conjunto atual de três ofertas: identificador, versão da volta, ids de opções, chances e frações de multiplicadores.
- Recibo da última aposta: identificador da solicitação, id do conjunto, valor, opção, venceu/perdeu, recebimento e variação líquida.
- Guardar ofertas e recibos em estado de servidor ligado à identidade durável do participante, preservando reconexão. A conexão atual identifica quem pode acessá-los; o cliente não escolhe livremente o participante.

Preferir sincronizar no schema os campos pequenos de disponibilidade e manter ofertas/recibo na sala, enviados ao próprio jogador por mensagens. Documentar tipos compartilhados. O saldo continua público como já é no jogo; não há necessidade de transmitir ofertas individuais a todos. Não usar estado exclusivamente React para guardar consumo ou resultado.

### 5.2 Mensagens propostas

- `requestBetOffers`: solicita condições vigentes e eventual recibo atual. Não sorteia de novo se já existirem.
- `bet:offers`: retorna revisão, id do conjunto, três opções e disponibilidade/motivo de bloqueio.
- `placeBet`: recebe somente `requestId`, `offerSetId`, `optionId` e `amount`.
- `bet:result`: retorna recibo autoritativo para renderizar o resultado.
- Reutilizar `room:error` ou resposta tipada correlacionada para rejeições; o painel deve saber qual pedido falhou sem fechar outra decisão do jogo.

Limitar comprimento dos identificadores e aceitar somente tipos e inteiros válidos. Manter no máximo um conjunto por jogador/volta e um recibo recente por jogador; não criar histórico de tamanho ilimitado.

### 5.3 Ordem atômica de aceitação

1. Resolver identidade e validar partida em andamento, prazo, conexão/controlador e elegibilidade.
2. Reconhecer duplicata da última solicitação antes de rejeitar por oportunidade usada: reenviar o mesmo recibo, sem sortear ou alterar dinheiro novamente. O mesmo id com conteúdo diferente é inválido.
3. Validar conjunto/revisão atual e opção pertencente ao conjunto; rejeitar conjunto de volta anterior.
4. Validar valor inteiro seguro, múltiplo de R$ 10 mil, mínimo, teto da sala, dinheiro disponível e capacidade de creditar o prêmio.
5. Marcar a aposta como usada, sortear uma vez, debitar/creditar e registrar recibo sem `await` entre essas operações.
6. Emitir resposta. Se a conexão cair após o débito, reconexão recupera o recibo; não reembolsa nem sorteia novamente.

Não mudar `activePlayerSessionId`, `turnPhase`, relógios, propriedade pendente ou descrição da chegada de outra pessoa para apresentar uma aposta. Compras, lances e apostas concorrentes são serializados pelo servidor e cada mensagem valida o saldo atual. Nunca gastar a oferta reservada de um leilão novamente.

## 6. Integração da passagem pela Partida

Inspeção inicial encontrou caminhos distintos em `GameRoom.ts`: `movePlayer`, `chooseWorldTour`, `startCardTeleport` e resolução de cartas. Não copiar diretamente as alterações de `loanUsedThisLap`: a implementação atual possui comportamentos distintos entre esses caminhos, inclusive em teletransporte. Isso exige auditoria antes de conectar a nova disponibilidade.

Criar um ponto explícito de renovação de aposta chamado somente quando um percurso válido realmente cruza a Partida. Se o movimento já atualiza a posição antes da animação, renovar nessa transição autoritativa uma única vez; a animação não renova novamente. Identificar o movimento/revisão para evitar dupla chamada.

- Movimento normal sem cruzamento: conserva disponibilidade e ofertas.
- Movimento normal que cruza ou termina na Partida: renova.
- Carta que percorre casas e cruza: renova.
- Teletransporte, inclusive para a Partida: não renova.
- Voltar para uma posição anterior sem cruzamento válido: não renova.
- Prisão ou passagem de turnos sem movimento: não renova.
- A renovação da aposta não deve modificar efeitos, construções ou regras de empréstimo incidentalmente.

Se a auditoria confirmar divergências preexistentes do empréstimo em relação às regras aprovadas, documentar e corrigir com regressão numa mudança separada antes de compartilhar um helper. Não perpetuar a divergência nas apostas nem ampliar silenciosamente esta etapa.

## 7. Arquivos e divisão do trabalho

| Arquivo | Mudança planejada |
| --- | --- |
| `shared/betting.ts` (novo) | Constantes, catálogo, tipos, teto, prêmio e elegibilidade econômica pura |
| `shared/betting.test.ts` (novo) | Limites, matemática e invariantes do catálogo |
| `server/src/rooms/schema/LobbyState.ts` | Disponibilidade e revisão por jogador |
| `server/src/rooms/GameRoom.ts` | Ofertas, mensagens, sorteio, recibos, passagem e reconexão |
| `server/test/GameRoom.test.ts` | Regressões e integração multiplayer das apostas |
| `src/ui/BettingPanel.tsx` (novo) | Painel de valor, opções, processamento, resultado e bloqueios |
| `src/ui/App.tsx` | Botão, estado sincronizado, mensagens e integração com HUD |
| `src/ui/styles.css` | Layout desktop/mobile, foco e redução de movimento |
| `docs/REGRAS-DE-JOGO.md` e `docs/DECISOES.md` | Regras aprovadas e parâmetros usados, ao implementar |
| `docs/ANDAMENTO.md` e `docs/VALIDACAO.md` | Estado da frente e evidências reais |

Os nomes novos são propostas de organização. Preservar a engine e a cena 3D atuais; não adicionar código Unity. Reutilizar formatação monetária, controles visuais e avisos de saldo existentes quando adequado.

## 8. Sequência de implementação com entregas

1. **Auditar integração:** atualizar/consultar Graphify, localizar todos os movimentos, identidade de reconexão, reserva de leilão, relógio expirado e helpers de saldo. Entrega: mapa dos pontos que renovam a aposta e dos que não renovam.
2. **Consolidar regras:** incorporar decisões confirmadas nos documentos oficiais, incluindo teto de 50%, uma por volta, perfil desfavorável e ausência de aposta automática pelos bots.
3. **Criar módulo econômico:** implementar catálogo e funções puras com inteiros. Entrega: cálculos sem rede ou renderização e testes nos limites.
4. **Criar estado e ofertas:** inicializar a primeira revisão, gerar três perfis no servidor e preservar o conjunto por volta/reconexão. Entrega: consultar repetidamente retorna as mesmas condições.
5. **Implementar transação:** validar pedido e saldo, resolver uma vez, registrar recibo e responder. Entrega: duplicação, fraude de payload e corrida por saldo não alteram a economia indevidamente.
6. **Integrar passagem:** renovar somente por percurso válido e invalidar pedidos antigos. Entrega: regressões por cada caminho de movimento, incluindo cartas.
7. **Integrar painel:** construir desktop e mobile com opções numéricas, carregamento, erros e resultado recuperável. Entrega: apostar sem interromper o turno alheio ou a câmera.
8. **Cobrir ciclo da sala:** testar fim por tempo, falência, desconexão/inatividade, reconexão e partidas novas sem reaproveitar estado anterior.
9. **Validar e publicar:** suíte completa, builds, playtest real desktop/mobile, logs, atualização do grafo e documentação, revisão do diff, hook ativo, commit e push em `main` somente do escopo relacionado.

## 9. Testes e critérios de aceite

### Regras puras

- Teto de 50% arredondado para baixo; mínimo exato; saldo baixo; teto não múltiplo; sala sem valor suficiente para apostar o mínimo.
- Rejeitar zero, negativo, fração, `NaN`, infinito, string, objeto, inteiro inseguro e valor acima do teto/saldo.
- Conferir recebimento bruto e lucro líquido em cada perfil e em valores mínimos/máximos.
- Todos os perfis têm chance válida, multiplicador maior que 1 e retorno médio entre 87,5% e 91%; as três faixas têm chances distintas.
- Sorteio determinístico: imediatamente antes, no ponto e depois do limiar; nenhum erro de uma unidade na probabilidade.

### Integração Colyseus

- Jogador aposta fora da vez; outro recebe o saldo atualizado e mantém sua fase e decisão.
- Vitória e derrota com sorteio controlado alteram saldo exatamente uma vez.
- Duplo clique e reenvio idêntico retornam o recibo original; outro pedido na mesma volta é recusado.
- Trocar valor, reabrir e reconectar não altera condições; conjunto falso, opção falsa ou revisão antiga não passa.
- Novo cruzamento válido libera exatamente uma aposta; teletransporte não libera; cartas percorrem os caminhos corretos.
- Dívida própria impede; dívida alheia não impede um jogador elegível. Empréstimo ativo e prisão, isoladamente, permitem.
- Compra, leilão ou cobrança entre consulta e confirmação exigem revalidação de saldo; sem saldo negativo nem uso duplicado de reserva.
- Desconectar após resolver preserva o resultado. Controle automático não aposta. Reconexão recupera oportunidade e recibo corretos.
- Prazo de partida esgotado impede nova aposta; um resultado já aplicado não muda depois do encerramento.
- Limite do schema não trunca prêmio; DEV não fornece aposta gratuita.
- Novo jogo inicializa estado limpo; mensagens com identidade de terceiros não movem seu dinheiro.

### Revisão real no navegador

- Partida com pelo menos duas conexões: abrir, selecionar, confirmar e conferir saldo/resultado sincronizados sem travar a vez de outra pessoa.
- Desktop e 390 × 844; verificar também 320 px de largura e rolagem com as três opções visíveis por navegação.
- Conferir botão no HUD, fechamento, teclado, foco, legibilidade de porcentagens/valores, toque e câmera.
- Atualizar/reconectar após aposta e confirmar que não reaparece uma oportunidade já usada.
- Observar uma passagem real pela Partida e um teletransporte; conferir renovação somente no caso válido.
- Ler logs do navegador e servidor. Usar uma sessão de cada servidor, identificar portas ocupadas, encerrar somente os processos de teste próprios e restaurar viewport ao terminar.

## 10. Encerramento e evidência exigida

Pronto para uso quando servidor e UI aplicarem as regras acima, os testes de integração cobrirem resolução e renovação por movimento real do servidor, o playtest confirmar sincronização e responsividade, e `npm run verify` e o hook passarem. Atualizar Graphify após mudar código. Registrar em `docs/VALIDACAO.md` comandos, resultados, tamanhos revisados e limitações reais. Confirmar push de `main`; não tratar commit local como publicação.

## 11. Implementação e validação

Implementação: `shared/betting.ts`, `server/src/rooms/GameRoom.ts`, `server/src/rooms/schema/LobbyState.ts`, `src/ui/BettingPanel.tsx`, `src/ui/App.tsx` e `src/ui/styles.css`. Regras documentadas em `docs/REGRAS-DE-JOGO.md`; testes puros em `shared/betting.test.ts` e teste de sala em `server/test/GameRoom.test.ts`.

`npm run verify` passou com 393 testes em 68 arquivos, build Vite e build do servidor. No playtest conectado com anfitrião e bot, as três opções foram recebidas; uma aposta de R$ 10.000 com opção de 60% foi perdida, saldo mudou de R$ 2.000.000 para R$ 1.990.000 e a UI marcou a aposta como usada. Em 390 × 844, o painel mediu 366 × 184 px, permaneceu dentro da viewport e a largura do documento foi 390 px. Teste Colyseus cobre opções estáveis, cobrança única diante de mensagem repetida, teleporte sem renovação e renovação ao cruzar a Partida. O hook de commit também executará a verificação completa. Aviso restante do build: bundle principal acima de 500 KB, como já ocorria antes.

Os perfis econômicos refletem a calibração inicial aprovada nesta tarefa. Ajustes futuros devem ser registrados sem alterar silenciosamente partidas em andamento.
