# Decisões do projeto

## Confirmadas

| Tema | Decisão |
|---|---|
| Produto | Jogo web casual de Banco Imobiliário para jogar com amigos. |
| Conta | Sem contas; a pessoa escolhe um nome e cria uma sala ou entra com código. |
| Plataforma | Navegador em computador e celular, com partida apresentada em 3D. |
| Jogadores | De 2 a 4 por sala no MVP. |
| Presets | A pessoa anfitriã escolhe Clássico Rápido ou Express ao criar a sala. |
| Clássico Rápido | Partida de 30 minutos, com o conjunto completo de mecânicas clássicas combinado no escopo. |
| Express | Seis rodadas, com fase de 40 segundos para cada pessoa em cada rodada; duração prevista de 8 minutos com duas pessoas e 16 com quatro, mais resolução de dívidas. Oito objetivos digitais originais e vitória por maior saldo ao final. Concluir objetivo não encerra a partida imediatamente. |
| Objetivos Express | Uma carta privada original por jogador, distribuída sem repetição por sala. Progresso e conteúdo só são enviados à pessoa da carta. Cumprir uma vez concede o bônus do objetivo, sem encerrar a partida. Baralho inicial e recompensas autorais estão listados em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md); valores sujeitos a playtest. |
| Pontuação Express | Maior saldo em dinheiro ao fim das seis rodadas. Empate: maior patrimônio avaliando imóveis e construções pelo valor de venda; persistindo, desempate em dois dados de seis lados. |
| Fim do Clássico | Ao fim dos 30 minutos, concluir a ação e os pagamentos em andamento; vence o maior patrimônio após liquidação de bens e construções. Empate resolvido nos dados. |
| Relógios | Clássico: contagem de 30 minutos. Express: 40 segundos por pessoa a cada rodada, seis rodadas; a ação pendente ou dívida é resolvida antes de passar ou encerrar. |
| Compra recusada | Ao cair em propriedade sem dono, a pessoa escolhe comprar pelo preço indicado ou não comprar. Ao recusar, a propriedade permanece sem dono e a vez continua; essa recusa não abre leilão. |
| Leilão voluntário | Em qualquer momento em que não esteja resolvendo uma compra ou dívida, qualquer jogador solvente pode abrir um leilão para vender um título que já possui, mesmo fora da própria vez. O dono escolhe o lance inicial; os demais jogadores fazem lances em incrementos mínimos de R$ 10.000 durante 20 segundos. O lance mais alto vence e o valor fica reservado enquanto o leilão está aberto. Se não houver lance, o título continua com o dono. Para evitar construções sem grupo completo, é preciso vender as casas/hotel do grupo antes de leiloar um título desse grupo. Hipoteca acompanha o título. |
| Economia inicial | Cada pessoa começa com R$ 1.500.000; cruzar a Partida concede R$ 200.000. O aluguel base é 10% do preço do imóvel, dobrado ao completar o grupo de cor. |
| Taxas digitais | As quatro casas de taxa cobram R$ 50.000, R$ 75.000, R$ 100.000 e R$ 125.000, respectivamente. Valores autorais para o ritmo rápido e sujeitos a balanceamento por playtest. |
| Construções | Completar um grupo residencial permite comprar casas equilibradas, no máximo uma casa de diferença entre propriedades. Cada nível custa metade do preço do imóvel; os níveis 1–4 são casas e o nível 5 é hotel. Estações não recebem construções. |
| Hipotecas | Durante a própria vez, o dono recebe 50% do preço de compra ao hipotecar. O título hipotecado não cobra aluguel. O resgate custa o valor recebido mais 10%; casas/hotéis de todo o grupo precisam ser vendidos antes da hipoteca, e grupo hipotecado não pode receber construções. Disponível nos dois modos. |
| Dívidas e falência | Cobranças acima do saldo geram dívida integral sem pagamento parcial. A pessoa pode vender construções pela metade do custo, respeitando a ordem equilibrada, ou hipotecar títulos. Quando puder pagar, quita a dívida integral ao credor ou banco. Se o saldo continuar insuficiente e não houver mais bens liquidáveis, pode declarar falência; bens restantes vão ao credor jogador ou retornam ao banco, e a partida termina quando só restar uma pessoa solvente. |
| Sorte ou Revés | O servidor sorteia, com reposição, uma entre oito cartas digitais autorais: três créditos (+R$ 50.000, +R$ 100.000, +R$ 150.000), três cobranças (-R$ 50.000, -R$ 100.000, -R$ 150.000), avançar três casas ou ir para a prisão. |
| Prisão | Cair em “Vá para a prisão” ou receber a carta leva à casa de visita e encerra a vez. Na vez presa, a pessoa pode pagar R$ 50.000 e rolar ou tentar duplas; falhar encerra a vez. Na terceira tentativa sem duplas, paga o que tiver até o limite da fiança, sai e move com esse resultado. |
| Negociação | Clássico: durante a vez ativa, em janela de 45 segundos. Express: durante as fases cronometradas de 40 segundos. |
| Desconexão | Até 60 segundos para reconectar; depois, pular a ação/vez atual sem tomar decisões automáticas em nome da pessoa. |
| Direção visual | Tabuleiro e peças originais low-poly, câmera inclinada fixa e interface DOM responsiva. A tela de partida mantém o tabuleiro no centro, cartões de jogadores nos cantos com acentos de cor consistentes por participante, relógio/modo na faixa superior e ação contextual compacta na borda inferior. Rótulos de casas usam alto contraste; clicar/tocar em qualquer casa abre um painel DOM legível com nome completo e informações atuais. Compras mostram preço, aluguel inicial e custo de construção; recusar deixa o terreno livre e não abre leilão. Marcadores de propriedade e modelos 3D de casas/hotéis usam a cor do dono. Dados e feedback de turno usam o espaço central; resultado mostra classificação e critério sem apagar a mesa. Materiais claros de papel e feltro combinam com cores de jogo mais vivas; cores, personagens, formas e assets são próprios. *Business Tour* serve como referência de composição, hierarquia e ritmo de cor, não de assets, marca, tabuleiro ou reprodução exata. Fontes e capturas por estado em [REFERENCIAS-VISUAIS.md](REFERENCIAS-VISUAIS.md). |
| Game juice e retorno de jogada | Dados e construções recebem animações curtas; o peão salta entre casas e o espaço de chegada recebe um destaque breve. Eventos de transação usam avisos temporários e sons sintetizados opcionais, controlados pela pessoa jogadora. Durante a partida, uma trilha ambiente procedural original toca junto com os efeitos e usa o mesmo controle de áudio; não depende de arquivos de música ou de terceiros. |
| Acessibilidade de movimento | O controle “Movimento reduzido” desativa animações não essenciais durante a partida. A preferência do sistema operacional é respeitada como valor inicial; as opções de áudio e movimento não persistem fora da sessão. |
| Stack | React + TypeScript + Vite + React Three Fiber/Three.js. Regras desacopladas da cena e validadas por servidor autoritativo Node com Colyseus. |
| Hospedagem planejada | Frontend na Vercel; servidor multiplayer em hospedagem compatível com Node e WebSockets. Validar operação e custo antes do lançamento público. |
| Dados | MVP sem contas e sem progresso persistente; salas e partidas temporárias. |
| Código da sala | Código privado único de 5 caracteres, usado como ID da sala Colyseus. |
| Repositório | `BancoImobiliarioOnline`, remoto privado no GitHub, branch principal `main`. |
| Fluxo Game Studio | Usar o plugin Game Studio em todas as tarefas deste projeto, conforme `AGENTS.md`, incluindo habilidade de roteamento e a habilidade especializada pertinente. |

## Detalhes de implementação que ainda serão calibrados

- Balanço dos alvos e bônus das oito cartas de objetivo Express após playtests.
- Balanço da economia do tabuleiro para sustentar partidas nos tempos definidos; as hipotecas começam em 50% do preço com resgate a 110% do valor recebido.
- Comportamento após o timeout enquanto há dívida pendente, possibilidade de voltar à mesma cadeira após expirar a janela de 60 segundos e saída voluntária durante uma partida.
- Opções visuais de avatares, cores e acessibilidade.
- Escolha final do provedor Node para hospedar o servidor, depois de validar Colyseus com salas reais.
- **Proposta para negociação:** uma oferta pendente por sala; aceitar/rejeitar somente pelo destinatário antes de acabar a janela de 45 segundos do Clássico ou 40 segundos do Express; títulos hipotecados podem ser trocados e permanecem hipotecados, sem cobrança automática ao transferir; construções de todo o grupo de cor precisam ser vendidas antes da troca de um título desse grupo. Ainda não é decisão de produto aprovada.
- **Proposta para timeout de desconexão:** manter a cadeira e os títulos; pular a ação/vez quando os 60 segundos expirarem; cancelar uma compra pendente sem compra automática. A implementação inicial segue essa interpretação de “sem ações automáticas”; validar em playtest. O caso de dívida e a volta à sala após o prazo continuam pendentes.
- **Proposta de cálculo final implementada para playtest:** patrimônio = dinheiro disponível + preço de compra dos imóveis - saldo de hipoteca (50% do preço) + valor de venda das construções (50% do custo por nível). Se jogadores também empatarem nos dados, o servidor escolhe um deles aleatoriamente. Rever após playtests.

## Base de regras Express

A página oficial da Estrela confirma a presença de oito cartas de objetivo e descreve a vitória pelo dinheiro ao fim do tempo, sem publicar o texto das cartas. A referência de seis rodadas de 40 segundos e cerca de oito minutos vem de ficha de distribuição do produto 828100, não de manual público. Os objetivos do jogo digital serão autorais e não apresentados como cópia das cartas físicas. Veja [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md) para fontes e escopo.

## Histórico

- 2026-10-27: preparação do produto, das regras, do repositório e das instruções do projeto.
- 2026-10-27: usuário confirmou as decisões acima, aceitou as sugestões propostas e retirou a vitória instantânea por objetivo.
- 2026-10-27: início da produção com a primeira fatia de interface e tabuleiro 3D; a conexão online será ligada ao servidor Colyseus em etapa seguinte.
- 2026-10-27: definição e implementação inicial de grupos residenciais, casas e hotéis equilibrados; cada nível custa metade do preço do imóvel.
- 2026-10-27: definição do baralho autoral Sorte ou Revés e das tentativas para sair da prisão.
- 2026-10-28: definição e implementação de hipotecas por 50% do preço e resgate por 110% do adiantamento.
- 2026-10-27: refinamento da composição do HUD da partida com participantes nas bordas e ação contextual separada, inspirado na hierarquia de leitura das capturas oficiais de *Business Tour*.
- 2026-10-28: atualização da direção visual após consulta à página Steam e à galeria por estado: mais contraste/saturação na mesa, acentos próprios nos participantes e relógio mais fácil de localizar; o tabuleiro, peças e arte continuam originais.
- 2026-10-27: implementação inicial da negociação sincronizada de dinheiro e títulos; janela de 45 segundos no Clássico e 40 segundos no Express. Limite de uma oferta pendente por sala, tratamento de hipotecas e exigência de vender as construções do grupo foram registrados como propostas, não como decisões aprovadas.
- 2026-10-27: relógio de 30 minutos no Clássico, seis rodadas Express com 40 segundos por jogador e pontuação final ligados ao estado autoritativo. Fórmula patrimonial aplicada como proposta para playtest; os objetivos privados Express continuam pendentes.
- 2026-10-27: objetivos Express implementados como cartas privadas únicas por sala, com progresso e bônus autoritativos. Alvos e recompensas iniciais documentados para playtest.
- 2026-10-28: segundo balanço dos objetivos Express substituiu metas raras de grupo/construção por posse de uma estação e eventos privados de aluguel, carta e passagem pela Partida; os novos alvos e bônus ainda precisam de simulação e playtests humanos.
- 2026-10-28: trilha ambiente procedural leve adicionada à partida, com controle compartilhado com efeitos; movimento reduzido também passou a cobrir animações da interface.
