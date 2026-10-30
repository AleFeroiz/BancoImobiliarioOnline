# Regras do jogo

## Referência Express

A página oficial da Estrela para o [Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) confirma oito cartas de objetivo, Sorte ou Revés, casas, dados, ampulheta e partidas para 2–4 pessoas. A descrição diz que os objetivos ajudam a acumular dinheiro e que vence quem tiver mais dinheiro ao fim do tempo; ela não publica o texto do manual nem das cartas.

Uma [ficha de distribuidor do produto 828100](https://www.brokercorporativo.com.br/farol/brokercorp/produto/banco-imobiliario-express-estrela/1570102/) anuncia aproximadamente 8 minutos e seis rodadas de 40 segundos. Essa duração é referência comercial, não transcrição do manual.

Como referência de regras clássicas e jogo curto, o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf) descreve liquidação de bens no final e desempate nos dados. O jogo digital é uma variante própria, combinando mecânicas clássicas com o ritmo do Express.

## Tabuleiro implementado

- O percurso tem 40 casas: 24 ruas residenciais únicas em oito grupos de três, três estações e quatro cantos com ações próprias: Partida, Prisão, Copa do Mundo e Volta ao Mundo. As demais casas incluem Sorte ou Revés, taxas e descanso.
- As ruas de cada grupo ocupam três casas consecutivas. Cada trecho entre cantos reúne dois grupos; espaços especiais ficam entre eles. Completar um grupo continua dobrando o aluguel base de suas ruas.
- O objetivo Express de grupo usa o grupo residencial com menor custo total de compra. Construções podem ser compradas em qualquer terreno residencial próprio e não hipotecado, mesmo sem completar o grupo.

## Clássico Rápido — 30 minutos

- Jogo por turnos em tabuleiro fechado. Rola-se dado e move-se a peça; casas e cartas resolvem seus efeitos.
- Ao cair em uma propriedade livre, a pessoa da vez escolhe entre comprar pelo preço indicado ou não comprar. Ao recusar, a propriedade permanece sem dono e a jogada continua; não há leilão.
- Separadamente, a pessoa da vez pode iniciar, durante o próprio turno e fora da resolução de uma compra ou dívida, um leilão voluntário para vender uma propriedade que já possui. Não se pode abrir nem disputar um leilão durante uma dívida, rolagem ou movimento do peão. O dono define o lance inicial e os demais jogadores podem ofertar durante 20 segundos; cada novo lance deve superar o anterior em pelo menos R$ 10.000. O valor do maior lance fica reservado enquanto o leilão está aberto. Sem ofertas, o título continua com o dono; com ofertas, o maior lance paga ao vendedor e recebe o título. Hipoteca acompanha o título. Antes de vender um título de grupo com casas ou hotel, é necessário vender as construções do grupo.
- Ao parar em propriedade residencial de outra pessoa, paga-se aluguel conforme títulos e construções. Nas três estações (incluindo o aeroporto), a pessoa que caiu rola um dado; o resultado multiplicado por R$ 50.000 é pago ao dono. Se a estação estiver hipotecada, não há aluguel.
- Ao cair na casa Prisão (canto 2), a pessoa pode escolher entre aguardar um turno preso, tentar duplas rolando dois dados ou pagar R$ 200.000 para sair e lançar os dados no mesmo turno. Duplas libertam a pessoa e ela avança a soma dos dados. Uma tentativa sem duplas consome um turno preso. Depois do terceiro turno preso, a pessoa sai automaticamente. A carta de prisão também a envia para esse canto e aplica as mesmas opções.
- Ao cair na Copa do Mundo (canto 3), escolha uma propriedade sua para sediar o evento. Ela cobra três vezes o aluguel calculado normalmente, incluindo grupo e construções, até outra sede ser escolhida. Se você ainda não possui propriedades, não há sede disponível e a Copa não altera a sede atual.
- Ao cair na Volta ao Mundo (canto 4), escolha uma propriedade própria, uma propriedade livre ou qualquer casa especial. A viagem teletransporta a peça e resolve normalmente a casa de destino; não concede bônus por passar pela Partida. Propriedades de outra pessoa não podem ser escolhidas.
- Casas só podem ser construídas em terrenos residenciais próprios e não hipotecados. Não é preciso completar o grupo de cor nem equilibrar níveis entre terrenos. Terreno livre pode ser comprado com até três casas num único pagamento; novos níveis exigem outra visita ao terreno próprio. Hotel exige três casas e uma visita posterior.
- Jogadores podem negociar dinheiro e títulos durante a vez ativa, em janela de 45 segundos. Construções devem ser vendidas antes da transferência do título.
- Durante uma dívida cujo valor exceda o saldo atual, o dono pode hipotecar qualquer título sem construções no grupo e receber 50% do preço de compra para completar o pagamento. Não é permitido hipotecar durante um turno normal, nem quando o saldo já cobre a dívida. Um título hipotecado não cobra aluguel. Resgatá-lo custa 110% do valor recebido; enquanto qualquer título do grupo estiver hipotecado, não se pode construir casas ou hotéis naquele grupo. A regra vale nos dois modos.
- Sorte ou Revés tem oito cartas digitais autorais, sorteadas com reposição pelo servidor: três créditos, três cobranças, avançar três casas e ir para a prisão. Créditos e cobranças variam entre R$ 50.000 e R$ 150.000.
- Se aluguel, taxa ou cobrança de carta exceder o saldo, registra-se a dívida integral sem debitar dinheiro parcialmente. Durante essa fase, a pessoa pode vender construções de imóveis próprios e receber metade do custo da construção, ou hipotecar títulos elegíveis; leilão voluntário fica bloqueado. Essas liquidações só podem ser feitas enquanto o saldo for insuficiente. Quando o saldo cobrir a dívida, paga-se o valor integral ao credor ou ao banco e a vez continua.
- A falência só pode ser declarada quando o saldo continuar abaixo da dívida e não restarem construções vendáveis nem títulos que possam ser hipotecados. O dinheiro e os títulos restantes passam ao credor jogador; se a dívida for com o banco, os títulos voltam ao banco sem construções e sem hipoteca. A partida termina quando restar apenas uma pessoa solvente.
- Ao completar 30 minutos, resolve-se a ação e os pagamentos em andamento. Compara-se patrimônio após liquidar bens e construções; empate vai aos dados.
- A partida também pode terminar antes se restar apenas um jogador solvente.

## Express — cerca de 8 a 16 minutos

- São seis rodadas. Cada pessoa recebe uma fase de 40 segundos por rodada; são cerca de 8 minutos com duas pessoas e 16 com quatro, mais o tempo para resolver dívidas pendentes.
- Cada jogador recebe em segredo uma carta dentre oito objetivos digitais originais, distribuídas sem repetição na mesma sala. O progresso e o conteúdo da carta são enviados somente para a pessoa que a recebeu.
- Cumprir o objetivo uma vez paga o bônus indicado; o cartão fica marcado como cumprido mesmo que os bens mudem depois. O objetivo não encerra a partida: a vitória continua sendo decidida ao fim das seis rodadas.
- Baralho autoral atual para playtest: ter 1 propriedade (+R$ 50.000), ter 3 propriedades (+R$ 100.000), ter 4 propriedades (+R$ 150.000), ter 1 estação (+R$ 75.000), receber aluguel uma vez (+R$ 100.000), pagar aluguel uma vez (+R$ 75.000), comprar uma carta Sorte ou Revés (+R$ 75.000) ou passar pela Partida uma vez (+R$ 75.000). Propriedade inclui rua ou estação. Atividades contam apenas quando o servidor confirma o evento; aluguel em dívida só progride depois da quitação integral. Os objetivos continuam privados, distribuídos sem repetição na sala e concedem o bônus uma única vez.
- A negociação só ocorre durante as fases de 40 segundos.
- Ao fim das seis rodadas, vence quem tiver maior saldo em dinheiro. Empate: compara-se patrimônio incluindo valor de liquidação de imóveis e construções; persistindo, decide-se nos dados.
- Os alvos, bônus e textos são autorais. Este segundo balanço substitui o primeiro depois de uma simulação que mostrou baixa ocorrência para grupos, construções e duas estações. Os valores continuam iniciais e devem ser revistos após playtests com pessoas.

## Regras compartilhadas

- Salas de 2–4 participantes, sem conta; a anfitriã pode adicionar bots aos lugares livres antes do início.
- Para iniciar, a sala precisa de pelo menos duas cadeiras ocupadas, combinando pessoas e bots.
- Desconexão durante a partida: o bot assume imediatamente a mesma cadeira, incluindo a vez e qualquer compra ou dívida em andamento. Ao reconectar em até 24 horas, a pessoa reassume o controle. Patrimônio e posição são preservados.
- A anfitriã controla a velocidade visual da sala entre 0,5×, 1× e 2×, iniciando em 1×. A seleção sincronizada altera as animações seguintes e não muda uma animação que já começou. Para as outras pessoas, a atividade do jogador da vez aparece em um balão junto ao peão; as janelas centrais de ação são reservadas à pessoa da vez. A câmera permanece livre e todas as pessoas podem inspecionar casas durante uma jogada alheia, sem executar ações de turno.
- No lobby, a anfitriã pode habilitar ou desabilitar o modo DEV; esse estado sincronizado fica visível para todas as pessoas antes de iniciar. Com a ferramenta habilitada, só a anfitriã pode forçar dados na vez ativa. O servidor valida configuração, anfitriã, etapa de rolagem, jogador ativo e valores de 1 a 6.
- Os bots lançam dados e decidem no servidor, usando as mesmas validações das ações humanas. Eles podem comprar propriedades com uma reserva de caixa, construir até três casas no imóvel em que caem, comprar hotel numa visita posterior, pagar fiança ou tentar duplas, liquidar bens para quitar dívidas e responder a leilões. No MVP, recusam ofertas de troca e não abrem leilões voluntários. Cada bot aguarda a conclusão da rolagem, do movimento e da resolução antes de agir novamente.
- O servidor será a autoridade para ordem de turno, resultados de dados, movimento, compras, cobranças, trocas e demais alterações compartilhadas.
- Nomes, valores, efeitos de cartas e economia serão originais, sem alegar reproduzir uma edição física específica.

## Ciclo básico implementado

- A primeira pessoa a entrar na sala começa. O servidor rola dois dados de seis lados e move a peça pelo percurso de 40 casas; todas as pessoas recebem o mesmo estado.
- Depois da exibição da casa alcançada, a pessoa da vez confirma para passar o turno à próxima pessoa. O servidor rejeita rolagens e confirmações fora da vez.
- A pessoa tem até 20 segundos para lançar os dados; se não agir, o servidor lança automaticamente. Cada decisão posterior tem até 15 segundos: compra sem resposta é recusada e a propriedade permanece livre; efeitos de chegada já resolvidos pelo servidor são confirmados automaticamente ao fim da janela. Na prisão, a ação automática é aguardar um turno preso. Uma dívida mantém a liquidação obrigatória ativa: a cada janela sem ação, o servidor executa o próximo passo de liquidação disponível.
- O servidor resolve compras, aluguel, taxas, hipotecas, venda de construções, dívidas, falência, cartas Sorte ou Revés e movimento para a prisão.
- O relógio do Clássico começa em 30 minutos. Quando zera, a partida encerra ao concluir o estado atual; uma compra já aberta pode ser decidida e uma dívida permanece ativa até ser paga ou levar à falência.
- No Express, cada fase tem 40 segundos. Se o tempo termina sem ação pendente, a vez passa automaticamente. Uma compra sem resposta é recusada e o imóvel continua livre; uma dívida precisa ser resolvida antes de passar a vez. A rodada avança depois que todos os jogadores solventes tiverem sua fase.
- Ao terminar o Clássico, compara-se dinheiro disponível + preço de compra dos imóveis - saldo hipotecado + valor de venda das construções. Ao terminar o Express, compara-se primeiro o dinheiro; em empate, usa-se o mesmo patrimônio e, persistindo, dois dados de seis lados. Empate nos próprios dados é resolvido aleatoriamente pelo servidor.
- A fórmula de patrimônio e o desempate aleatório após dados iguais são detalhes iniciais de implementação e serão conferidos em playtests.

## Economia inicial implementada

- Cada pessoa começa com R$ 1.500.000. Ao cruzar a Partida, recebe R$ 200.000.
- Ao parar em propriedade livre, a pessoa da vez escolhe comprar pelo preço impresso no espaço ou recusar. Se recusar, o imóvel permanece livre; ninguém compra por ela e a vez segue para a próxima ação.
- Leilões voluntários são uma ação separada da compra por aterrissagem. Só a pessoa da vez pode iniciar um leilão de título próprio, durante seu turno e fora de uma compra, dívida, rolagem ou movimento. Recusar uma propriedade livre não a coloca em leilão.
- O aluguel base corresponde a 10% do preço da propriedade, com mínimo de R$ 10.000; completar o grupo de cor dobra esse valor. Quando o saldo não cobre aluguel ou taxa, a partida entra na fase de dívida descrita acima.
- Ao comprar um terreno residencial livre, a pessoa pode selecionar terreno sem casas, ou terreno com uma, duas ou três casas e pagar o total numa única compra. A pessoa precisa ter saldo para todo o pacote. Não é preciso possuir o grupo de cor completo para incluir as casas.
- Depois da compra, novas casas podem ser compradas ao cair no próprio imóvel; pode-se escolher a quantidade necessária para chegar a até três casas, pagando cada casa adicional por metade do preço do terreno. Comprar três casas não libera hotel nessa mesma visita. Numa visita posterior ao mesmo imóvel, já com três casas, a pessoa pode comprar um hotel por três vezes o custo de uma casa; ele substitui as três casas. Cada nível de construção soma 10% do preço do imóvel ao aluguel; o bônus de grupo continua valendo.
- Estações não recebem casas ou hotéis. Uma dívida pode ser quitada vendendo construções de qualquer imóvel próprio: casas são vendidas pela metade do custo e hotel deixa três casas no terreno e rende metade do custo do hotel. Hipoteca continua bloqueada se houver construção em qualquer imóvel do grupo.
- Hipotecar rende metade do preço do título; resgatar custa 110% desse adiantamento. O título hipotecado não gera aluguel. Não se hipoteca um grupo que ainda tenha casas ou hotel; nenhum título de um grupo hipotecado recebe construção.
- As taxas digitais custam R$ 50.000, R$ 75.000, R$ 100.000 e R$ 125.000 nas casas 4, 18, 28 e 38. Os valores são autorais e serão ajustados com playtests.
- Construções residenciais e hotéis são validados no servidor. A cena 3D mostra casas e hotéis quando o estado sincronizado muda. Toda jogada usa a ordem autoritativa dados → movimento do peão → resolução da casa; os bots aguardam as mesmas fases.

## Fora do que está especificado

Os textos e efeitos das cartas Express ainda serão escritos como regras autorais. Não temos o texto público dessas cartas. As regras de dívidas e falência acima são a primeira versão funcional e serão calibradas em playtests.
