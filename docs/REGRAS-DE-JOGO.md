# Regras do jogo

## Referência Express

A página oficial da Estrela para o [Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) confirma oito cartas de objetivo, Sorte ou Revés, casas, dados, ampulheta e partidas para 2–4 pessoas. A descrição diz que os objetivos ajudam a acumular dinheiro e que vence quem tiver mais dinheiro ao fim do tempo; ela não publica o texto do manual nem das cartas.

Uma [ficha de distribuidor do produto 828100](https://www.brokercorporativo.com.br/farol/brokercorp/produto/banco-imobiliario-express-estrela/1570102/) anuncia aproximadamente 8 minutos e seis rodadas de 40 segundos. Essa duração é referência comercial, não transcrição do manual.

Como referência de regras clássicas e jogo curto, o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf) descreve liquidação de bens no final e desempate nos dados. O jogo digital é uma variante própria, combinando mecânicas clássicas com o ritmo do Express.

## Clássico Rápido — 30 minutos

- Jogo por turnos em tabuleiro fechado. Rola-se dado e move-se a peça; casas e cartas resolvem seus efeitos.
- Uma propriedade livre pode ser comprada. Se a compra for recusada, abre-se leilão público de 20 segundos.
- Ao parar em propriedade de outra pessoa, paga-se aluguel conforme títulos e construções. Companhias usam a regra indicada no título.
- Completar grupo de cor permite construir casas e hotéis. Construções seguem a regra de equilíbrio definida para o tabuleiro.
- Jogadores podem negociar dinheiro e títulos durante a vez ativa, em janela de 45 segundos. Construções devem ser vendidas antes da transferência do título.
- Hipotecas geram dinheiro, suspendem aluguel do título e têm custo de resgate.
- Prisão, Sorte ou Revés, dívidas e falência são resolvidas pelas cartas e regras da casa.
- Ao completar 30 minutos, resolve-se a ação e os pagamentos em andamento. Compara-se patrimônio após liquidar bens e construções; empate vai aos dados.
- A partida também pode terminar antes se restar apenas um jogador solvente.

## Express — cerca de 8 minutos

- Seis rodadas com fases cronometradas de 40 segundos. A preparação e transições compõem a duração aproximada de oito minutos.
- Cada jogador recebe em segredo uma carta dentre oito objetivos digitais originais. Exemplos de famílias de objetivo: completar um grupo de cor, obter uma quantidade de propriedades ou realizar construções.
- Cumprir objetivo concede bônus em dinheiro; não encerra a partida imediatamente.
- A negociação só ocorre durante as fases de 40 segundos.
- Ao fim das seis rodadas, vence quem tiver maior saldo em dinheiro. Empate: compara-se patrimônio incluindo valor de liquidação de imóveis e construções; persistindo, decide-se nos dados.
- As condições e o relógio são mostrados antes do início. Valores e texto dos objetivos são conteúdo autoral e serão balanceados na implementação.

## Regras compartilhadas

- Salas de 2–4 jogadores, sem conta.
- Desconexão: janela de 60 segundos para reconectar; após isso, pula-se a ação/vez atual sem jogar ou negociar automaticamente pela pessoa.
- O servidor será a autoridade para ordem de turno, resultados de dados, movimento, compras, cobranças, leilões, trocas e demais alterações compartilhadas.
- Nomes, valores, efeitos de cartas e economia serão originais, sem alegar reproduzir uma edição física específica.

## Ciclo básico implementado

- A primeira pessoa a entrar na sala começa. O servidor rola dois dados de seis lados e move a peça pelo percurso de 40 casas; todas as pessoas recebem o mesmo estado.
- Depois da exibição da casa alcançada, a pessoa da vez confirma para passar o turno à próxima pessoa. O servidor rejeita rolagens e confirmações fora da vez.
- Esta etapa apenas identifica e mostra a casa. Não concede bônus ao passar pela Partida e ainda não executa compra, aluguel, taxa, evento ou movimento para a prisão; esses efeitos dependem das regras econômicas e cartas a fechar nas fases seguintes.
- Os relógios de 30 minutos e de seis rodadas Express ainda não estão ativos no ciclo básico; entram com a implementação dos presets e da resolução de fim de partida.

## Economia inicial implementada

- Cada pessoa começa com R$ 1.500.000. Ao cruzar a Partida, recebe R$ 200.000.
- Ao parar em propriedade livre, a pessoa da vez pode comprar pelo preço impresso no espaço ou recusar e abrir leilão público de 20 segundos. O leilão começa em R$ 10.000, sobe em incrementos mínimos de R$ 10.000 e termina quando todos os demais passam ou o tempo acaba.
- O aluguel base corresponde a 10% do preço da propriedade, com mínimo de R$ 10.000; completar o grupo de cor dobra esse valor. Se o saldo do pagador for menor, o pagamento atual é limitado ao saldo restante; liquidação e falência estão na próxima parte da implementação.
- Ao possuir todas as propriedades residenciais de uma cor, o dono pode construir. Cada casa ou hotel custa metade do preço do imóvel e soma 10% desse preço ao aluguel; o bônus de grupo continua valendo. Os níveis 1–4 são casas e o nível 5 substitui as casas por um hotel. A construção deve ficar equilibrada: o nível de um imóvel não pode ultrapassar em mais de um o nível mais baixo do grupo. Estações não recebem casas ou hotéis.
- As taxas digitais custam R$ 50.000, R$ 75.000, R$ 100.000 e R$ 125.000 nas casas 4, 18, 28 e 38. Os valores são autorais e serão ajustados com playtests.
- Construções residenciais, equilíbrio de grupo e hotéis são validados no servidor. A cena 3D mostra casas e hotéis quando o estado sincronizado muda.

## Fora do que está especificado

O tabuleiro, textos completos das cartas, valores econômicos e procedimentos detalhados de prisão, hipoteca, falência e construção ainda precisam ser escritos como regras autorais e implementados. Não temos o texto público das cartas Express. Esses detalhes não alteram as decisões de duração, vitória e número de jogadores acima; serão definidos e registrados antes de fechar cada sistema.
