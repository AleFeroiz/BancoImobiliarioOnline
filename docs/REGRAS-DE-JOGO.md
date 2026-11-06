# Regras do BANTEC

- Após os primeiros 5 segundos da partida, 30 segundos sem interação fazem o bot assumir temporariamente. O primeiro toque ou tecla devolve o controle sem acionar outro comando. Após a mesma tolerância inicial, o servidor tenta recuperar decisões vencidas que permaneçam travadas. Os relógios normais seguem desde o início.

Este documento descreve somente as regras atuais do BANTEC. Referências ao Express, Volta ao Mundo, estações, hipotecas resgatáveis ou regras clássicas abaixo não fazem parte do jogo atual. A base de decisões e a lista de cidades estão em [DECISOES.md](DECISOES.md).

## Sala e partida

- Partidas privadas para 2–6 participantes, sem conta. A anfitriã pode preencher lugares vazios com bots antes de começar; o servidor recusa conexões depois do sexto lugar.
- O lobby oferece um link de convite para a sala. Quem abrir o link informa seu nome e entra diretamente; o código da sala também continua disponível para entrada manual.
- No lobby, cada participante humano confirma que está pronto. Apenas a anfitriã pode iniciar, depois que todas as pessoas estiverem prontas e conectadas; bots contam como prontos automaticamente.
- Há um modo de jogo. A anfitriã escolhe duração e configura saldo inicial, multiplicadores iniciais da Copa e dos festivais, quantidade de festivais, turnos na prisão e prazo de decisões gerais. Padrões: R$ 2.000.000, 2×, 2×, três festivais, três turnos e 15 segundos. A ordem de todos os participantes é sorteada no servidor no início.
- A partida termina imediatamente se alguém completar um Monopólio em Linha, dois Monopólios Regionais ou possuir as quatro companhias. Se o relógio zerar, a resolução já iniciada termina e vence quem tiver maior patrimônio; dívidas continuam até serem quitadas ou levarem à falência.
- Para o desempate pelo tempo, compara-se dinheiro disponível + preço de compra dos títulos ainda possuídos + valor de venda das construções (metade do custo pago por construção). Empates seguem para decisão nos dados; se os resultados continuarem iguais, o servidor escolhe aleatoriamente entre as pessoas empatadas.
- O servidor controla ordem, dados, movimento, compras, pagamentos, cartas, leilões e encerramento. Dados repetidos numa rolagem normal permitem nova jogada depois da resolução; a terceira dupla consecutiva leva diretamente à Prisão sem avançar.
- “Sem tempo” desativa somente o cronômetro total da partida. O relógio de turno continua ativo em todas as opções: 20 segundos para rolar, 20 segundos para escolher alvos de cartas e o prazo configurado para as demais decisões, com resolução automática quando o tempo acaba.
- A tela final informa se a partida encerrou por tempo, falência, Monopólio em Linha, Monopólio Duplo Regional, posse das quatro companhias ou ausência de participantes solventes.

## Tabuleiro e percurso

- O tabuleiro tem 40 casas: 24 cidades brasileiras, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos especiais. Não existem casas de descanso.
- As cidades estão divididas nas cinco regiões e seguem a ordem econômica Norte → Centro-Oeste → Nordeste → Sul → Sudeste. São cinco cidades em cada região, exceto o Sul, com quatro. Na região Sudeste, Rio de Janeiro vem após São Paulo e encerra o percurso antes da Partida.
- As regiões são grupos de monopólio. Completar uma região dobra o aluguel das suas cidades. Completar duas regiões diferentes vence imediatamente. As companhias não pertencem a uma região.
- Cada lado do tabuleiro tem seis cidades e uma companhia. Possuir todos os sete títulos do mesmo lado completa um Monopólio em Linha e vence imediatamente; taxas e Sorte ou Revés não contam.
- A paleta regional dos pisos é Norte turquesa `#00A6A6`, Centro-Oeste dourado `#E6B84B`, Nordeste rosa `#D45087`, Sul verde `#4A9D68` e Sudeste azul `#3B65CC`.
- As fichas ficam juntas na borda interna de cada piso. Quando várias pessoas param na mesma casa, as fichas se empilham verticalmente; nos quatro cantos, a pilha fica no centro do piso.
- Durante a partida, a ficha de maior patrimônio usa uma coroa 3D e a de menor patrimônio usa um chapéu de bobo da corte 3D. O patrimônio usa o mesmo cálculo do desempate por tempo: saldo, preço dos títulos e valor de venda das construções. Os acessórios mudam de ficha quando o patrimônio muda; falidos não participam. Com empate no extremo, a cadeira mais antiga recebe o acessório. Se todos têm o mesmo patrimônio, nenhum acessório aparece.
- Toda casa tem uma função. Os cantos são Partida, Prisão, Copa do Mundo e Volta ao Brasil.

## Compra, construções e rendas

- Ao parar numa cidade livre, a pessoa escolhe comprar ou recusar. Recusada, ela permanece livre.
- A compra e os custos de melhoria seguem uma curva inspirada nas cidades observadas de Business Tour, interpolada pela ordem de preço para as 24 cidades do BANTEC. Cada nível de construção acrescenta ao aluguel o valor específico daquele nível; os valores não são percentuais uniformes do preço. Novas casas só podem ser compradas quando a pessoa voltar ao imóvel. Na primeira volta individual, cada pessoa pode construir até duas casas; a terceira casa e o hotel ficam liberados depois que ela completar uma volta por movimento normal e cruzar a Partida. Teletransportes ou cartas que levem a pessoa através da Partida não contam como volta completa. A tentativa de comprar a terceira casa antes disso é bloqueada com aviso no painel. O hotel exige três casas e visita posterior; seu custo é o valor configurado para a cidade e substitui as três casas.
- Monopólio Regional dobra o aluguel; festival e primeira sede da Copa usam seus multiplicadores configurados. Cada nova escolha de sede na mesma partida soma 0,25 ao multiplicador da Copa. Os multiplicadores se acumulam. A quantidade configurada de cidades aleatórias recebe festivais no início da partida.
- As companhias são AgroBrasil, Aviação Brasil, Energia Brasil e Mineração Brasil. Cada uma custa R$ 500.000. Ao cair numa companhia, o servidor rola um novo D6; o aluguel é R$ 50.000 multiplicados pela quantidade de companhias do dono e pelo resultado do dado. A quantidade máxima é três, pois possuir as quatro encerra a partida com vitória.
- As quatro taxas cobram por imóvel que a pessoa possui: R$ 10.000, R$ 15.000, R$ 20.000 e R$ 25.000. Cidades e companhias contam; construções não. Títulos já vendidos ou devolvidos ao banco não contam.
- Ao cair numa cidade de outra pessoa, primeiro se paga o aluguel normal ao dono. Depois, se ainda houver saldo para pagar 2× o investimento total e ela não tiver hotel, aparece a opção de recompra. O valor integral da recompra vai diretamente ao dono, sem depender da aceitação dele; a posse passa ao comprador. Hotéis e companhias impedem recompra. Se o aluguel entrar em dívida, a opção só aparece depois que a dívida for quitada e se restar saldo suficiente. Após recomprar uma cidade residencial, o novo dono pode pagar para construir nela durante essa mesma chegada, respeitando a primeira volta, os limites do nível e o saldo.
- Efeitos temporários de cartas só podem ficar em propriedades com dono. Se uma cidade voltar ao banco, todos os efeitos ligados a ela são removidos; o Festival é permanente e continua associado à cidade mesmo enquanto estiver livre.

## Dívidas e falência

- Cada participante pode contratar empréstimo a qualquer momento, inclusive fora da própria vez, enquanto não tiver empréstimo ativo e não tiver contratado desde a última passagem válida pela Partida. O valor é escolhido entre R$ 10.000 e 25% do saldo inicial da sala, em múltiplos de R$ 10.000. O primeiro empréstimo paga 100% de juros; cada contratação seguinte aumenta os juros em 50 pontos percentuais. A dívida vence integralmente na próxima passagem válida pela Partida, após receber o bônus normal. Movimento de carta que percorre casas conta; teletransporte não. Sem pagamento antecipado. Se faltar saldo, usa-se a liquidação de dívida normal; novo empréstimo pode cobrir a dívida anterior. No desempate por tempo, o valor pendente é descontado do patrimônio. Vitória imediata por monopólio não é impedida.

- Quando uma cobrança ultrapassa o saldo, registra-se o valor integral da dívida, sem débito parcial. Enquanto não puder pagar, a pessoa pode vender construções por metade do custo de construção ou devolver ao banco uma cidade/companhia por metade do preço de compra.
- Ladrão e Aniversário são exceções: transferem somente o saldo que a pessoa cobrada possui, até o limite da cobrança. Essas cartas não criam dívida nem iniciam liquidação forçada.
- Devolver um título ao banco encerra a posse imediatamente: ele fica livre para ser comprado por qualquer pessoa. Não existe hipoteca, aluguel suspenso por hipoteca ou resgate de título. Construções do grupo precisam ser vendidas antes de devolver um título. Empréstimos são a dívida simples descrita acima e não usam imóveis como garantia.
- Quando houver saldo suficiente, a dívida integral é paga ao credor ou ao banco. Se não restarem ativos liquidáveis e o saldo não cobrir a dívida, a pessoa declara falência: o dinheiro restante e seus títulos passam ao credor jogador; se o credor for o banco, os títulos voltam ao banco sem construções. A partida termina quando sobra uma única pessoa solvente.
- Toda escolha de imóvel durante uma dívida é feita no tabuleiro: opções válidas ficam iluminadas e as inválidas apagadas.
- No painel de dívida aparecem em destaque o total cobrado, o saldo disponível e quanto ainda falta levantar. Apenas durante essa fase, o rótulo de cada imóvel próprio informa também quanto rende liquidar o título ou vender o nível de construção atual. Fora da fase de dívida, o valor de liquidação fica oculto.

## Cantos especiais

- **Partida:** ao passar ou chegar, recebe R$ 300.000. Ao parar exatamente nela, uma cidade própria aleatória sem hotel é selecionada para oferecer uma melhoria de um nível pelo custo normal; aceitar debita o custo ao jogador, recusar não altera o imóvel. Apenas passar pela Partida não ativa essa oferta.
- **Prisão:** pode aguardar um turno, tentar sair com duplas ou pagar R$ 200.000 e lançar no mesmo turno. Uma tentativa sem duplas consome o turno preso; depois da quantidade configurada de turnos, sai automaticamente. Duplas tentadas para sair não concedem uma rolagem extra.
- **Copa do Mundo:** escolhe uma cidade própria para sediar a Copa; companhias não podem ser sede. A primeira sede usa o multiplicador inicial configurado. Cada edição seguinte soma 0,25×, mesmo se a sede anterior mudar ou voltar ao banco. O bônus vale para a cidade-sede até a próxima sede. Sem cidade própria elegível, não há nova sede. A escolha usa o tabuleiro e destaca as opções válidas.
- **Volta ao Brasil:** ao chegar, escolhe no tabuleiro uma propriedade própria, uma propriedade livre ou uma casa especial para visitar; a chegada é resolvida normalmente. A peça percorre as casas sempre para a frente; quando o destino fica atrás, ela completa o restante do circuito e passa pela Partida antes de chegar. O bônus de R$ 300.000 só é pago se o trajeto escolhido passar pela Partida. A carta Volta ao Brasil paga o bônus apenas quando o caminho até o canto cruzar a Partida.

## Cartas Sorte ou Revés

O servidor sorteia com reposição entre estas quinze cartas autorais:

1. **Generoso:** transfira uma cidade sua para outra pessoa à sua escolha.
2. **Aniversário:** receba R$ 50.000 de cada outro participante.
3. **Apagão:** escolha uma cidade de outra pessoa; ela fica sem cobrar aluguel até o dono completar três voltas no tabuleiro. Hotel não pode ser alvo.
4. **Terremoto:** escolha uma cidade de outra pessoa e destrua-a. Hotel não pode ser alvo; a cidade destruída volta ao banco.
5. **Ladrão:** escolha uma pessoa e roube R$ 200.000 dela.
6. **Proteção:** escolha uma cidade sua; até completar três voltas no tabuleiro, nenhum efeito de carta pode afetá-la.
7. **Prisão:** vá para a Prisão e aplique as opções normais desse canto.
8. **Volta ao Brasil:** vá para o canto Volta ao Brasil e escolha um destino válido. Receba R$ 300.000 se o caminho até o canto cruzar a Partida.
9. **Sede da Copa:** vá para a Copa do Mundo e escolha uma propriedade própria elegível.
10. **Troca-troca:** escolha duas pessoas, podendo incluir você; elas trocam de posição sem resolver as casas de chegada.
11. **Cidade-sede:** vá para a cidade que sedia a Copa e resolva a casa de chegada. Sem sede ativa, descarte a carta sem mover.
12. **Início:** vá para a Partida; receba R$ 300.000 somente se o trajeto cruzar a Partida. Parar na Partida também pode oferecer uma melhoria paga de cidade própria.
13. **Aluguel em dobro:** pague duas vezes o próximo aluguel devido, seja de cidade ou companhia.
14. **Desconto no aluguel:** pague metade do próximo aluguel devido, seja de cidade ou companhia.
15. **Comunismo:** escolha duas pessoas solventes, podendo incluir você; a soma dos saldos delas é dividida igualmente. Se a soma for ímpar, a unidade excedente fica com quem tinha menos dinheiro.

Companhias não podem ser alvo de Generoso, Apagão, Terremoto ou Proteção. Cartas que afetam participantes ou o próximo aluguel continuam valendo para o dono e o aluguel de companhias.

Proteção bloqueia qualquer efeito de carta, inclusive Generoso. Apagão e Proteção duram até o dono passar três vezes pela Partida avançando pelo percurso do tabuleiro, inclusive na Volta ao Brasil; jogar uma vez sem cruzá-la não reduz o efeito. Prisão continua contando turnos. As cartas de dobro e desconto se acumulam multiplicativamente e são consumidas juntas no próximo aluguel devido; duas cartas pendentes de efeitos opostos se cancelam. Elas também modificam aluguéis de companhias e incidem sobre o valor final após os demais multiplicadores. Se o relógio expirar durante uma escolha de carta, o servidor sorteia uma das opções válidas; se não houver opção, encerra o efeito. A seleção manual de qualquer propriedade-alvo acontece diretamente no tabuleiro com o padrão de opções iluminadas/apagadas; alvos que sejam pessoas são selecionados pelos controles de participantes.

## Ações durante a partida

- Ao clicar numa cidade, qualquer pessoa pode inspecionar preço, construção, aluguel e dono, inclusive durante o turno de outra pessoa. Clicar no cartão de uma pessoa ilumina suas cidades próprias e escurece os demais espaços; clicar outra vez no mesmo cartão remove o destaque. A lateral não tem botão Bens.
- Durante a partida, cada pessoa pode escolher tomate, ovo, lama ou farinha no controle ao lado do cartão de outro participante para lançar o objeto em sua ficha. O lançamento é cosmético: não altera saldo, turno ou regras; somente o alvo vê o efeito de impacto, que dura três segundos e não bloqueia controles. A sala impõe intervalo de cinco segundos entre lançamentos do mesmo remetente para o mesmo alvo.
- O botão **Leilão** permite selecionar no tabuleiro qualquer imóvel com dono. O dono pode anunciá-lo e a disputa pública começa imediatamente; sem lances em 10 segundos, o imóvel continua com ele. Outra pessoa pode pedir ao dono um leilão com um lance inicial obrigatório: o valor fica reservado no envio, o pedido dura 15 segundos e a partida continua; se o dono aceitar, o solicitante já é o maior ofertante. Recusa ou expiração devolve a reserva, sem venda, e o solicitante aguarda 15 segundos para pedir outro. Há um único pedido ou leilão por sala. Durante a disputa, o relógio da partida e o da vez pausam, enquanto o prazo de lances é de 10 segundos e reinicia a cada lance válido. O vendedor não pode disputar; a pessoa em dívida também não pode pedir imóvel alheio nem dar lance, mas pode anunciar imóvel próprio. O lance sobe no mínimo R$ 10.000; as reservas de quem foi superado são devolvidas. Se o prazo termina com lances, o maior vence, paga o vendedor e recebe o título com construções e efeitos vinculados; a transferência também pode completar monopólio. Sem lances, o dono conserva a propriedade. Cancelamento sem lance é permitido ao vendedor. Ao terminar ou cancelar uma disputa, a sala aguarda 120 segundos antes de outro leilão. Bots avaliam o valor do título e suas construções, mantêm reserva de caixa e só aceitam pedidos que cubram o valor estimado; não iniciam pedidos.
- Cada participante pode fazer uma aposta por volta válida, inclusive fora da própria vez, desde que não esteja em dívida. O valor mínimo é R$ 10.000 e o máximo é 50% do saldo inicial configurado para a sala, limitado ao dinheiro disponível e arredondado para múltiplos de R$ 10.000. A interface apresenta três opções com chances e recebimentos totais diferentes; ao vencer, a aposta é devolvida junto do prêmio anunciado, e ao perder o valor apostado é retirado do saldo. As opções permanecem fixas até a próxima passagem válida pela Partida e não podem ser renovadas fechando o painel ou reconectando. Percursos que cruzam a Partida renovam a aposta; teletransportes não. O retorno médio é ligeiramente desfavorável ao apostador. Bots não apostam. A aposta não pausa relógios nem interrompe a vez ativa.
- A anfitriã pode ativar o modo DEV no lobby. Quando ativo, apenas ela pode forçar os dados durante a rolagem válida; o servidor verifica anfitriã, jogador ativo e valores.
- A velocidade visual compartilhada é 0,5×, 1× ou 2×. O turno dá 20 segundos para rolar, 20 segundos para escolher alvos de cartas e o prazo configurado para as demais decisões. Se alguém não agir, a compra é recusada, a Prisão aguarda, ações obrigatórias são concluídas e a dívida avança pela próxima liquidação disponível.
- Se uma pessoa desconectar ou sair durante a partida, a cadeira e os bens permanecem e um bot passa a controlá-la. O cartão do jogador informa “BOT NO CONTROLE”. Para recuperar o controle, a pessoa entra novamente no mesmo código de sala e usa exatamente o mesmo nome (a comparação distingue maiúsculas de minúsculas); a conexão assume a cadeira existente e preserva o estado da partida.
- Ao reabrir o site no mesmo navegador, o jogo tenta automaticamente a última sala com o token salvo e, se ele não funcionar, com o código e nome guardados. Se a tentativa falhar, os campos ficam preenchidos para correção manual. O botão de sair limpa essa lembrança; links de convite abertos explicitamente têm prioridade.
- Quando uma carta exige escolha de alvo, a revelação tem até 10 segundos para leitura e só o botão OK a fecha antes disso. O relógio de escolha fica separado: após OK ou expiração da revelação, a pessoa da vez recebe 20 segundos para escolher. Se não houver alvo disponível, a carta informa isso e o servidor encerra o efeito assim que a revelação termina, sem abrir a janela de escolha.

## Apresentação e acesso

- O jogo usa React + React Three Fiber no navegador. O tabuleiro é 3D e original; menus, regras, lobby e HUD são interface HTML responsiva.
- As casas selecionáveis no tabuleiro preservam as cores originais quando válidas e ficam apagadas quando inválidas. Construções ficam apoiadas no próprio piso, um pouco mais próximas da borda externa; a faixa central fica livre para os peões. Rótulos de propriedade ficam na frente dos modelos das fichas.
- O lobby oferece 12 cores e 14 fichas cosméticas (peão, carrinho, moto, avião, sapato de salto, trem, cartola, cofrinho, navio, patinho de borracha, cachorro, gato, vaca e pinguim). A escolha visual não afeta as regras.
- A FATEC Itapetininga fica no centro como modelo visual dos três blocos e da torre mostrados nas imagens de referência. Não ocupa casa de jogo. Os dados ficam suspensos pouco acima dos prédios durante a rolagem.
- O modo noturno escurece a home e o lobby. Na partida, altera somente o fundo externo, sem escurecer o tabuleiro. A preferência é local e pode ser alterada durante o jogo.
- Config, Emote e Regras ficam em botões quadrados na lateral. Uma seta 3D animada marca o destino após a rolagem e uma seta menor, na cor da pessoa ativa, aponta para o peão da vez. A interface adapta-se ao celular. Movimento reduzido, áudio e qualidade gráfica são controles locais.
- A câmera gira por mouse/toque na área do tabuleiro e usa a roda/pinça para zoom; botões e painéis interativos não devem iniciar rotação. Um botão acima de Configurações alterna entre orbitar o tabuleiro e orbitar a ficha local; a troca preserva a direção e o zoom atuais e não interfere nas regras da partida.

## Escopo removido e referências

- Express, seus objetivos e suas rodadas foram removidos do produto. Volta ao Mundo, estações, aluguéis por dado e hipotecas resgatáveis foram substituídos pelas regras deste documento.
- *Business Tour* é referência de ritmo econômico e clareza visual, não de nomes, arte, textos ou interface copiados. O nome, as cidades, as cartas, regras e assets do BANTEC são originais.
- Para contexto histórico de regras comerciais, consulte a [página oficial do Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) e o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf). Essas fontes não definem as regras atuais do BANTEC.

## Fluxo visual e avanço da vez

- A pessoa lança os dados pelo botão destacado. Ao cair em uma companhia alheia com aluguel ativo, ela deve acionar um D6 adicional; o servidor sorteia o resultado, mostra o dado durante a cobrança e calcula o aluguel pela regra de companhias abaixo. Se a escolha expirar, o servidor lança automaticamente.
- Após resolver uma chegada sem compra, melhoria, recompra, dívida ou outra escolha disponível, a vez termina automaticamente. Uma cidade própria só abre opções de construção quando há uma melhoria permitida e pagável. Enquanto houver uma decisão opcional válida, a pessoa pode escolhê-la ou encerrar a vez.
- Cartas que exigem escolher participante usam os cartões dos jogadores. Em Troca-troca, selecionam-se dois cartões distintos. Cartões de pessoas falidas ou inelegíveis não podem ser escolhidos. A expiração segue a regra de escolhas expiradas.
- Durante dívida, o painel mostra cobrança integral, saldo disponível e quanto ainda falta. A liquidação permanece autoritativa no servidor.
