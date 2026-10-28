# Regras do jogo

## Referência Express

A página oficial da Estrela para o [Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) confirma oito cartas de objetivo, Sorte ou Revés, casas, dados, ampulheta e partidas para 2–4 pessoas. A descrição diz que os objetivos ajudam a acumular dinheiro e que vence quem tiver mais dinheiro ao fim do tempo; ela não publica o texto do manual nem das cartas.

Uma [ficha de distribuidor do produto 828100](https://www.brokercorporativo.com.br/farol/brokercorp/produto/banco-imobiliario-express-estrela/1570102/) anuncia aproximadamente 8 minutos e seis rodadas de 40 segundos. Essa duração é referência comercial, não transcrição do manual.

Como referência de regras clássicas e jogo curto, o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf) descreve liquidação de bens no final e desempate nos dados. O jogo digital é uma variante própria, combinando mecânicas clássicas com o ritmo do Express.

## Tabuleiro implementado

- O percurso tem 40 casas: 24 ruas residenciais únicas em oito grupos de três, três estações e as casas de Partida, Sorte ou Revés, taxas, descanso e prisão.
- O objetivo Express de grupo usa o grupo residencial com menor custo total de compra. Os grupos podem receber construções apenas quando todos os seus títulos pertencem à mesma pessoa.

## Clássico Rápido — 30 minutos

- Jogo por turnos em tabuleiro fechado. Rola-se dado e move-se a peça; casas e cartas resolvem seus efeitos.
- Uma propriedade livre pode ser comprada. Se a compra for recusada, abre-se leilão público de 20 segundos.
- Ao parar em propriedade de outra pessoa, paga-se aluguel conforme títulos e construções. Companhias usam a regra indicada no título.
- Completar grupo de cor sem hipotecas permite construir casas e hotéis. Construções seguem a regra de equilíbrio definida para o tabuleiro.
- Jogadores podem negociar dinheiro e títulos durante a vez ativa, em janela de 45 segundos. Construções devem ser vendidas antes da transferência do título.
- Durante a própria vez, o dono pode hipotecar qualquer título sem construções no grupo e receber 50% do preço de compra. Um título hipotecado não cobra aluguel. Resgatá-lo custa 110% do valor recebido; enquanto qualquer título do grupo estiver hipotecado, não se pode construir casas ou hotéis naquele grupo. A regra vale nos dois modos.
- Sorte ou Revés tem oito cartas digitais autorais, sorteadas com reposição pelo servidor: três créditos, três cobranças, avançar três casas e ir para a prisão. Créditos e cobranças variam entre R$ 50.000 e R$ 150.000.
- Cair em “Vá para a prisão” ou receber a carta leva à casa de visita e encerra a vez. Na vez presa, pode-se pagar R$ 50.000 e rolar ou tentar duplas; falhar encerra a vez. Após três tentativas sem duplas, paga-se até R$ 50.000 do saldo, sai da prisão e move pelo resultado da terceira rolagem.
- Se aluguel, taxa ou cobrança de carta exceder o saldo, registra-se a dívida integral sem debitar dinheiro parcialmente. Durante essa fase, a pessoa pode vender construções respeitando a ordem equilibrada e receber metade do custo de construção, ou hipotecar títulos elegíveis. Quando o saldo cobrir a dívida, paga-se o valor integral ao credor ou ao banco e a vez continua.
- A falência só pode ser declarada quando o saldo continuar abaixo da dívida e não restarem construções vendáveis nem títulos que possam ser hipotecados. O dinheiro e os títulos restantes passam ao credor jogador; se a dívida for com o banco, os títulos voltam ao banco sem construções e sem hipoteca. A partida termina quando restar apenas uma pessoa solvente.
- Ao completar 30 minutos, resolve-se a ação e os pagamentos em andamento. Compara-se patrimônio após liquidar bens e construções; empate vai aos dados.
- A partida também pode terminar antes se restar apenas um jogador solvente.

## Express — cerca de 8 a 16 minutos

- São seis rodadas. Cada pessoa recebe uma fase de 40 segundos por rodada; são cerca de 8 minutos com duas pessoas e 16 com quatro, mais o tempo para resolver leilões ou dívidas pendentes.
- Cada jogador recebe em segredo uma carta dentre oito objetivos digitais originais, distribuídas sem repetição na mesma sala. O progresso e o conteúdo da carta são enviados somente para a pessoa que a recebeu.
- Cumprir o objetivo uma vez paga o bônus indicado; o cartão fica marcado como cumprido mesmo que os bens mudem depois. O objetivo não encerra a partida: a vitória continua sendo decidida ao fim das seis rodadas.
- Baralho autoral atual para playtest: ter 1 propriedade (+R$ 50.000), ter 3 propriedades (+R$ 100.000), ter 4 propriedades (+R$ 150.000), ter 1 estação (+R$ 75.000), receber aluguel uma vez (+R$ 100.000), pagar aluguel uma vez (+R$ 75.000), comprar uma carta Sorte ou Revés (+R$ 75.000) ou passar pela Partida uma vez (+R$ 75.000). Propriedade inclui rua ou estação. Atividades contam apenas quando o servidor confirma o evento; aluguel em dívida só progride depois da quitação integral. Os objetivos continuam privados, distribuídos sem repetição na sala e concedem o bônus uma única vez.
- A negociação só ocorre durante as fases de 40 segundos.
- Ao fim das seis rodadas, vence quem tiver maior saldo em dinheiro. Empate: compara-se patrimônio incluindo valor de liquidação de imóveis e construções; persistindo, decide-se nos dados.
- Os alvos, bônus e textos são autorais. Este segundo balanço substitui o primeiro depois de uma simulação que mostrou baixa ocorrência para grupos, construções e duas estações. Os valores continuam iniciais e devem ser revistos após playtests com pessoas.

## Regras compartilhadas

- Salas de 2–4 jogadores, sem conta.
- Desconexão: janela de 60 segundos para reconectar; após isso, pula-se a ação/vez atual sem jogar ou negociar automaticamente pela pessoa.
- O servidor será a autoridade para ordem de turno, resultados de dados, movimento, compras, cobranças, leilões, trocas e demais alterações compartilhadas.
- Nomes, valores, efeitos de cartas e economia serão originais, sem alegar reproduzir uma edição física específica.

## Ciclo básico implementado

- A primeira pessoa a entrar na sala começa. O servidor rola dois dados de seis lados e move a peça pelo percurso de 40 casas; todas as pessoas recebem o mesmo estado.
- Depois da exibição da casa alcançada, a pessoa da vez confirma para passar o turno à próxima pessoa. O servidor rejeita rolagens e confirmações fora da vez.
- O servidor resolve compras, aluguel, taxas, hipotecas, venda de construções, dívidas, falência, cartas Sorte ou Revés e movimento para a prisão.
- O relógio do Clássico começa em 30 minutos. Quando zera, a partida encerra ao concluir o estado atual; uma compra já aberta pode ser decidida, um leilão termina e uma dívida permanece ativa até ser paga ou levar à falência.
- No Express, cada fase tem 40 segundos. Se o tempo termina sem ação pendente, a vez passa automaticamente. Se houver uma compra sem resposta, abre-se o leilão de 20 segundos; se houver dívida, ela precisa ser resolvida antes de passar a vez. A rodada avança depois que todos os jogadores solventes tiverem sua fase.
- Ao terminar o Clássico, compara-se dinheiro disponível + preço de compra dos imóveis - saldo hipotecado + valor de venda das construções. Ao terminar o Express, compara-se primeiro o dinheiro; em empate, usa-se o mesmo patrimônio e, persistindo, dois dados de seis lados. Empate nos próprios dados é resolvido aleatoriamente pelo servidor.
- A fórmula de patrimônio e o desempate aleatório após dados iguais são detalhes iniciais de implementação e serão conferidos em playtests.

## Economia inicial implementada

- Cada pessoa começa com R$ 1.500.000. Ao cruzar a Partida, recebe R$ 200.000.
- Ao parar em propriedade livre, a pessoa da vez pode comprar pelo preço impresso no espaço ou recusar e abrir leilão público de 20 segundos. O leilão começa em R$ 10.000, sobe em incrementos mínimos de R$ 10.000 e termina quando todos os demais passam ou o tempo acaba.
- O aluguel base corresponde a 10% do preço da propriedade, com mínimo de R$ 10.000; completar o grupo de cor dobra esse valor. Quando o saldo não cobre aluguel ou taxa, a partida entra na fase de dívida descrita acima.
- Ao possuir todas as propriedades residenciais de uma cor, o dono pode construir. Cada casa ou hotel custa metade do preço do imóvel e soma 10% desse preço ao aluguel; o bônus de grupo continua valendo. Os níveis 1–4 são casas e o nível 5 substitui as casas por um hotel. A construção deve ficar equilibrada: o nível de um imóvel não pode ultrapassar em mais de um o nível mais baixo do grupo. Estações não recebem casas ou hotéis.
- Hipotecar rende metade do preço do título; resgatar custa 110% desse adiantamento. O título hipotecado não gera aluguel. Não se hipoteca um grupo que ainda tenha casas ou hotel; nenhum título de um grupo hipotecado recebe construção.
- As taxas digitais custam R$ 50.000, R$ 75.000, R$ 100.000 e R$ 125.000 nas casas 4, 18, 28 e 38. Os valores são autorais e serão ajustados com playtests.
- Construções residenciais, equilíbrio de grupo e hotéis são validados no servidor. A cena 3D mostra casas e hotéis quando o estado sincronizado muda.

## Fora do que está especificado

Os textos e efeitos das cartas Express ainda serão escritos como regras autorais. Não temos o texto público dessas cartas. As regras de dívidas e falência acima são a primeira versão funcional e serão calibradas em playtests.
