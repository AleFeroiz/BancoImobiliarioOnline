# Regras do jogo

## Referência histórica: Express

A página oficial da Estrela para o [Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) confirma oito cartas de objetivo, Sorte ou Revés, casas, dados, ampulheta e partidas para 2–4 pessoas. A descrição diz que os objetivos ajudam a acumular dinheiro e que vence quem tiver mais dinheiro ao fim do tempo; ela não publica o texto do manual nem das cartas.

Uma [ficha de distribuidor do produto 828100](https://www.brokercorporativo.com.br/farol/brokercorp/produto/banco-imobiliario-express-estrela/1570102/) anuncia aproximadamente 8 minutos e seis rodadas de 40 segundos. Essa duração é referência comercial, não transcrição do manual.

Como referência histórica de regras clássicas, o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf) descreve liquidação de bens no final e desempate nos dados. A versão BANTEC usa regras autorais descritas a seguir; o modo Express não faz mais parte do jogo.

## Tabuleiro regional aprovado — implementação em andamento

Esta seção descreve as regras vigentes da reforma e prevalece sobre as regras anteriores abaixo. O código usa a composição regional, novos preços e aluguéis, impostos, condições de vitória, duração escolhida no lobby, Volta ao Brasil, recompra e baralho de 12 cartas. O modo Express, o estado de imóvel hipotecado e o aluguel por dado das antigas estações foram removidos. A suíte automática passou; ainda falta revisar liquidação de dívida em partida e percorrer manualmente as cartas e condições de vitória. Os alvos de Proteção e Cidade-sede estão definidos em `DECISOES.md`.

### Composição vigente do tabuleiro

- O percurso tem 40 casas: 24 cidades, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos (Partida, Prisão, Copa do Mundo e Volta ao Brasil). Não existem casas de descanso.
- As cinco regiões são grupos de monopólio. A sequência é Norte, Centro-Oeste, Nordeste, Sul e Sudeste; São Paulo fecha a volta antes da Partida. Cada lado tem seis cidades e uma companhia. O Sul possui quatro cidades; cada outra região possui cinco.
- Construções residenciais custam metade do preço da cidade por casa; hotel custa três vezes uma casa e substitui três casas.
- Casas e hotéis ficam sobre o piso, alinhados à borda para preservar o corredor de movimento; o nome da cidade continua visível.
- O modo noturno é uma preferência local persistida neste navegador: escurece a página inicial e a sala; durante a partida, altera apenas a cor do fundo externo, sem mudar as cores nem o brilho do tabuleiro.

### Rolagem de dados

- Quando os dois dados mostram o mesmo número, a pessoa avança normalmente, resolve a casa de destino e, ao concluir essa resolução, ganha outra rolagem no mesmo turno.
- Na terceira dupla consecutiva do mesmo turno, a pessoa vai diretamente para a Prisão: não avança pelo resultado do terceiro lançamento e perde o restante do turno. Cumpre três turnos presa conforme a regra de Prisão abaixo.
- A tentativa de duplas para sair da Prisão é uma regra própria; conseguir duplas nessa tentativa não concede uma rolagem extra.

## Regras econômicas e de vitória vigentes

As 24 cidades e preços estão definidos em [DECISOES.md](DECISOES.md). As regras a seguir são as aprovadas para a reforma.

- **Monopólio Regional:** todas as cidades da mesma região pertencem a um grupo. Completar uma região dobra o aluguel. Completar duas regiões (Monopólio Duplo Regional) vence a partida imediatamente. As companhias não pertencem aos grupos regionais.
- **Monopólio em Linha:** cada lado inclui seis cidades e uma companhia. É necessário possuir os sete títulos para completar a linha; taxas e casas Sorte ou Revés não contam. Completar a linha vence a partida imediatamente; não há multiplicador de aluguel por linha.
- **Vitória pelas companhias:** possuir as quatro companhias vence a partida imediatamente. As companhias contam para a linha e para o cálculo das taxas.
- **Companhias:** AgroBrasil, Aviação Brasil, Energia Brasil e Mineração Brasil custam R$ 500.000 cada. O aluguel total recebido pelo dono escala conforme a quantidade: R$ 100.000 com uma, R$ 250.000 com duas, R$ 450.000 com três e R$ 750.000 com quatro. A quarta companhia também completa uma condição de vitória imediata.
- **Aluguel das cidades:** sobre o preço P, os níveis são 10% (terreno), 20% (uma casa), 40% (duas), 70% (três) e 100% (hotel). Monopólio Regional multiplica o aluguel por 2; a Copa do Mundo aplica seu multiplicador de 3 ao aluguel calculado.
- **Custos das construções:** cada casa custa metade do preço da cidade; o hotel custa três vezes o custo de uma casa e substitui as três casas.
- **Taxas:** cada uma cobra, por imóvel que a pessoa possui, R$ 10.000, R$ 15.000, R$ 20.000 ou R$ 25.000, conforme o espaço. Cidades e companhias contam. Imóveis vendidos ou que retornaram ao banco não contam; construções não são imóveis adicionais.
- **Devolução ao banco:** durante uma dívida, receber 50% do preço significa entregar a cidade ou companhia ao banco e perder o título. O imóvel volta a ficar livre; não há propriedade hipotecada nem resgate.
- **Recompra forçada:** ao cair num imóvel de outra pessoa, a pessoa pode pagar ao dono 1,5× o investimento total daquele imóvel e tomar o título, sem pedir autorização. Imóveis com hotel não podem ser recomprados.
- **Partida:** há uma modalidade. No lobby, a anfitriã escolhe 15 minutos, 30 minutos ou 1 hora. O Express e seu baralho de objetivos foram removidos.
- **Dinheiro inicial:** R$ 2.000.000 por participante como valor inicial de playtest; o balanceamento pode ser revisto após partidas.
- **Cores regionais nos pisos:** Norte turquesa `#00A6A6`; Nordeste rosa `#D45087`; Centro-Oeste dourado `#E6B84B`; Sudeste azul `#3B65CC`; Sul verde `#4A9D68`. Nomes e preços das cidades devem permanecer legíveis sobre os pisos.

## Regras anteriores em retirada

Os trechos abaixo descrevem o sistema pré-reforma e servem somente como histórico para a migração. Não usar suas referências a Express, estações, aluguel por dado, hipoteca resgatável ou Volta ao Mundo como regras vigentes.

### Baralho Sorte ou Revés da reforma

O baralho passa a ter 12 cartas autorais, sorteadas com reposição:

1. **Generoso:** dê um imóvel seu (cidade ou companhia) a outro jogador à sua escolha.
2. **Aniversário:** receba R$ 50.000 de cada outro jogador.
3. **Apagão:** escolha um imóvel de outra pessoa; ele não cobra aluguel durante três turnos do dono. Imóveis com hotel não podem ser alvo.
4. **Terremoto:** escolha um imóvel de outra pessoa e destrua-o. Imóveis com hotel não podem ser alvo.
5. **Ladrão:** escolha um jogador e roube R$ 200.000 dele.
6. **Proteção:** escolha um imóvel seu. Por três turnos, efeitos de cartas não podem afetá-lo.
7. **Prisão:** vá para a Prisão e resolva o canto conforme a regra normal.
8. **Volta ao Brasil:** vá para o canto Volta ao Brasil; receba o bônus de R$ 200.000 por chegar e resolva a ação do canto. O bônus é pago uma vez.
9. **Sede da Copa:** vá para o canto Copa do Mundo e resolva sua ação normal.
10. **Troca-troca:** escolha dois jogadores, podendo incluir você; eles trocam de posição no tabuleiro.
11. **Cidade-sede:** vá para a cidade que estiver sediando a Copa do Mundo e resolva a casa de chegada normalmente.
12. **Início:** vá para a Partida e receba R$ 200.000.

Ao receber ou pagar dinheiro sem saldo suficiente, aplicam-se as regras gerais de dívida. Ficam confirmadas as interpretações de Terremoto (o imóvel volta ao banco livre, sem construções ou compensação), duração de Apagão/Proteção nos próximos três turnos do dono, proteção contra qualquer carta (inclusive Generoso), Troca-troca sem resolver as casas de chegada e descarte de Cidade-sede sem movimento quando não houver sede ativa.

O percurso começa pela região com menor PIB total e segue **Norte → Centro-Oeste → Nordeste → Sul → Sudeste**, encerrando a volta com São Paulo antes da Partida. As cidades dentro de cada região vão da menor para a maior economia municipal. Em 2023, as participações regionais no PIB brasileiro foram 5,8%, 10,6%, 13,8%, 16,8% e 53,0%, respectivamente ([IBGE](https://agenciadenoticias.ibge.gov.br/media/com_mediaibge/arquivos/9c2b887d59dd6c63da1b39b00c6cacce.pdf)). PIB total mede produção econômica, não renda dos moradores; a seleção e os preços são uma escala de balanceamento, não uma conversão do PIB em dinheiro de partida.

## Clássico Rápido — 30 minutos

- Jogo por turnos em tabuleiro fechado. Rola-se dado e move-se a peça; casas e cartas resolvem seus efeitos.
- Ao cair em uma propriedade livre, a pessoa da vez escolhe entre comprar pelo preço indicado ou não comprar. Ao recusar, a propriedade permanece sem dono e a jogada continua; não há leilão.
- Separadamente, a pessoa da vez pode iniciar, durante o próprio turno e fora da resolução de uma compra ou dívida, um leilão voluntário para vender uma propriedade que já possui. Não se pode abrir nem disputar um leilão durante uma dívida, rolagem ou movimento do peão. O dono define o lance inicial e os demais jogadores podem ofertar durante 20 segundos; cada novo lance deve superar o anterior em pelo menos R$ 10.000. O valor do maior lance fica reservado enquanto o leilão está aberto. Sem ofertas, o título continua com o dono; com ofertas, o maior lance paga ao vendedor e recebe o título. Hipoteca acompanha o título. Antes de vender um título de grupo com casas ou hotel, é necessário vender as construções do grupo.
- Ao parar em propriedade residencial de outra pessoa, paga-se aluguel conforme títulos e construções. Nas três estações (incluindo o aeroporto), a pessoa que caiu clica para rolar um dado visível; o resultado multiplicado por R$ 50.000 é pago ao dono. Se a estação estiver hipotecada, não há aluguel. Se a pessoa não decidir a tempo, a rolagem acontece automaticamente quando a fase expira.
- Ao cair na casa Prisão (canto 2), a pessoa pode escolher entre aguardar um turno preso, tentar duplas rolando dois dados ou pagar R$ 200.000 para sair e lançar os dados no mesmo turno. Duplas libertam a pessoa e ela avança a soma dos dados. Uma tentativa sem duplas consome um turno preso. Depois do terceiro turno preso, a pessoa sai automaticamente. A carta de prisão também a envia para esse canto e aplica as mesmas opções.
- Ao cair na Copa do Mundo (canto 3), escolha uma propriedade sua para sediar o evento. Ela cobra três vezes o aluguel calculado normalmente, incluindo grupo e construções, até outra sede ser escolhida. Se você ainda não possui propriedades, não há sede disponível e a Copa não altera a sede atual.
- Ao cair na Volta ao Mundo (canto 4), escolha uma propriedade própria, uma propriedade livre ou qualquer casa especial. A viagem teletransporta a peça e resolve normalmente a casa de destino; não concede bônus por passar pela Partida. Propriedades de outra pessoa não podem ser escolhidas.
- Casas só podem ser construídas em terrenos residenciais próprios e não hipotecados. Não é preciso completar o grupo de cor nem equilibrar níveis entre terrenos. Terreno livre pode ser comprado com até três casas num único pagamento; novos níveis exigem outra visita ao terreno próprio. Hotel exige três casas e uma visita posterior.
- Jogadores podem clicar no cartão de qualquer participante para ver seu perfil e imóveis e enviar uma proposta de troca a qualquer momento durante a partida. Uma proposta fica pendente até ser aceita pelo destinatário, recusada por ele ou cancelada por quem enviou; trocar de turno não a encerra. Só há uma proposta pendente por sala. As construções do grupo precisam ser vendidas antes de transferir um título; hipotecas acompanham o título.
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
- Ao fim das seis rodadas, vence quem tiver maior saldo em dinheiro. Empate: compara-se patrimônio incluindo valor de liquidação de imóveis e construções; persistindo, decide-se nos dados.
- Os alvos, bônus e textos são autorais. Este segundo balanço substitui o primeiro depois de uma simulação que mostrou baixa ocorrência para grupos, construções e duas estações. Os valores continuam iniciais e devem ser revistos após playtests com pessoas.

## Regras compartilhadas

- Salas de 2–4 participantes, sem conta; a anfitriã pode adicionar bots aos lugares livres antes do início.
- Durante a partida, clique no cartão de um participante para consultar seu perfil e todos os imóveis. Uma proposta de troca de dinheiro e títulos é aceita somente quando o destinatário confirmar; ela permanece pendente até resposta, cancelamento de quem enviou, falência ou fim da partida. Há uma proposta por sala. As construções do grupo devem ser vendidas antes de transferir um título; hipotecas acompanham o imóvel.
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
