# Regras do BANTEC

Este documento descreve somente as regras atuais do BANTEC. Referências ao Express, Volta ao Mundo, estações, hipotecas resgatáveis ou regras clássicas abaixo não fazem parte do jogo atual. A base de decisões e a lista de cidades estão em [DECISOES.md](DECISOES.md).

## Sala e partida

- Partidas privadas para 2–4 participantes, sem conta. A anfitriã pode preencher lugares vazios com bots antes de começar.
- Há um modo de jogo. No lobby, a anfitriã escolhe 15 minutos, 30 minutos ou 1 hora; cada participante começa com R$ 2.000.000.
- A partida termina imediatamente se alguém completar um Monopólio em Linha, dois Monopólios Regionais ou possuir as quatro companhias. Se o relógio zerar, a resolução já iniciada termina e vence quem tiver maior patrimônio; dívidas continuam até serem quitadas ou levarem à falência.
- Para o desempate pelo tempo, compara-se dinheiro disponível + preço de compra dos títulos ainda possuídos + valor de venda das construções (metade do custo pago por construção). Empates seguem para decisão nos dados; se os resultados continuarem iguais, o servidor escolhe aleatoriamente entre as pessoas empatadas.
- O servidor controla ordem, dados, movimento, compras, pagamentos, cartas, trocas e encerramento. Dados repetidos numa rolagem normal permitem nova jogada depois da resolução; a terceira dupla consecutiva leva diretamente à Prisão sem avançar.

## Tabuleiro e percurso

- O tabuleiro tem 40 casas: 24 cidades brasileiras, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos especiais. Não existem casas de descanso.
- As cidades estão divididas nas cinco regiões e seguem a ordem econômica Norte → Centro-Oeste → Nordeste → Sul → Sudeste. São cinco cidades em cada região, exceto o Sul, com quatro. São Paulo encerra o percurso antes da Partida.
- As regiões são grupos de monopólio. Completar uma região dobra o aluguel das suas cidades. Completar duas regiões diferentes vence imediatamente. As companhias não pertencem a uma região.
- Cada lado do tabuleiro tem seis cidades e uma companhia. Possuir todos os sete títulos do mesmo lado completa um Monopólio em Linha e vence imediatamente; taxas e Sorte ou Revés não contam.
- A paleta regional dos pisos é Norte turquesa `#00A6A6`, Centro-Oeste dourado `#E6B84B`, Nordeste rosa `#D45087`, Sul verde `#4A9D68` e Sudeste azul `#3B65CC`.
- Toda casa tem uma função. Os cantos são Partida, Prisão, Copa do Mundo e Volta ao Brasil.

## Compra, construções e rendas

- Ao parar numa cidade livre, a pessoa escolhe comprar ou recusar. Recusada, ela permanece livre.
- A compra oferece o terreno ou o terreno junto com uma, duas ou três casas. Cada casa custa metade do preço da cidade. Depois, novas casas só podem ser compradas quando a pessoa voltar ao imóvel. O hotel exige três casas e uma visita posterior; custa três vezes uma casa e substitui as três casas.
- O aluguel de cidade é calculado sobre o preço P: terreno 10% de P, uma casa 20%, duas casas 40%, três casas 70% e hotel 100%. Monopólio Regional dobra o valor e a sede da Copa do Mundo triplica o aluguel calculado.
- As companhias são AgroBrasil, Aviação Brasil, Energia Brasil e Mineração Brasil. Cada uma custa R$ 500.000. O aluguel total do dono escala por quantidade de companhias: uma R$ 100.000, duas R$ 250.000, três R$ 450.000 e quatro R$ 750.000. Possuir as quatro vence a partida.
- As quatro taxas cobram por imóvel que a pessoa possui: R$ 10.000, R$ 15.000, R$ 20.000 e R$ 25.000. Cidades e companhias contam; construções não. Títulos já vendidos ou devolvidos ao banco não contam.
- Ao cair num imóvel de outra pessoa, primeiro se paga o aluguel normal ao dono. Depois, se ainda houver saldo para pagar 1,5× o investimento total da propriedade e ela não tiver hotel, aparece a opção de recompra. O valor integral da recompra vai diretamente ao dono, sem depender da aceitação dele; a posse passa ao comprador. Hotel impede recompra. Se o aluguel entrar em dívida, a opção só aparece depois que a dívida for quitada e se restar saldo suficiente.

## Dívidas e falência

- Quando uma cobrança ultrapassa o saldo, registra-se o valor integral da dívida, sem débito parcial. Enquanto não puder pagar, a pessoa pode vender construções por metade do custo de construção ou devolver ao banco uma cidade/companhia por metade do preço de compra.
- Devolver um título ao banco encerra a posse imediatamente: ele fica livre para ser comprado por qualquer pessoa. Não existe hipoteca, aluguel suspenso por hipoteca ou resgate de título. Construções do grupo precisam ser vendidas antes de devolver um título.
- Quando houver saldo suficiente, a dívida integral é paga ao credor ou ao banco. Se não restarem ativos liquidáveis e o saldo não cobrir a dívida, a pessoa declara falência: o dinheiro restante e seus títulos passam ao credor jogador; se o credor for o banco, os títulos voltam ao banco sem construções. A partida termina quando sobra uma única pessoa solvente.
- Toda escolha de imóvel durante uma dívida é feita no tabuleiro: opções válidas ficam iluminadas e as inválidas apagadas.

## Cantos especiais

- **Partida:** ao passar ou chegar, recebe R$ 200.000.
- **Prisão:** pode aguardar um turno, tentar sair com duplas ou pagar R$ 200.000 e lançar no mesmo turno. Uma tentativa sem duplas consome o turno preso; depois de três turnos, sai automaticamente. Duplas tentadas para sair não concedem uma rolagem extra.
- **Copa do Mundo:** escolhe uma propriedade própria para sediar a Copa; ela cobra três vezes o aluguel normal até a sede mudar. Sem propriedade própria elegível, não há nova sede. A escolha usa o tabuleiro e destaca as opções válidas.
- **Volta ao Brasil:** ao chegar, recebe R$ 200.000 e escolhe no tabuleiro uma propriedade própria, uma propriedade livre ou uma casa especial para visitar; a chegada é resolvida normalmente. A carta Volta ao Brasil paga o bônus por chegar ao canto.

## Cartas Sorte ou Revés

O servidor sorteia com reposição entre estas doze cartas autorais:

1. **Generoso:** transfira uma propriedade sua para outra pessoa à sua escolha.
2. **Aniversário:** receba R$ 50.000 de cada outro participante.
3. **Apagão:** escolha uma propriedade de outra pessoa; ela fica sem cobrar aluguel durante três turnos do dono. Hotel não pode ser alvo.
4. **Terremoto:** escolha uma propriedade de outra pessoa e destrua-a. Hotel não pode ser alvo; a propriedade destruída volta ao banco.
5. **Ladrão:** escolha uma pessoa e roube R$ 200.000 dela.
6. **Proteção:** escolha uma propriedade sua; por três turnos do dono, nenhum efeito de carta pode afetá-la.
7. **Prisão:** vá para a Prisão e aplique as opções normais desse canto.
8. **Volta ao Brasil:** vá para o canto Volta ao Brasil, receba R$ 200.000 e escolha um destino válido.
9. **Sede da Copa:** vá para a Copa do Mundo e escolha uma propriedade própria elegível.
10. **Troca-troca:** escolha duas pessoas, podendo incluir você; elas trocam de posição sem resolver as casas de chegada.
11. **Cidade-sede:** vá para a cidade que sedia a Copa e resolva a casa de chegada. Sem sede ativa, descarte a carta sem mover.
12. **Início:** vá para a Partida e receba R$ 200.000.

Proteção bloqueia qualquer efeito de carta, inclusive Generoso. Apagão e Proteção duram os três próximos turnos do dono. Se um efeito cobrar dinheiro sem saldo suficiente, aplicam-se as regras de dívida. A seleção de qualquer propriedade-alvo acontece diretamente no tabuleiro com o padrão de opções iluminadas/apagadas; alvos que sejam pessoas são selecionados pelos controles de participantes.

## Ações e negociação

- Ao clicar numa cidade, qualquer pessoa pode inspecionar preço, construção, aluguel e dono, inclusive durante o turno de outra pessoa. A carteira mostra os bens de cada participante.
- Durante o próprio turno, fora de rolagem, movimento, compra ou dívida, a pessoa pode abrir um leilão voluntário de propriedade sua. O vendedor escolhe o lance inicial; lances devem aumentar pelo menos R$ 10.000 e ficam reservados por 20 segundos. A maior oferta compra o título; sem oferta, o dono o mantém. Construções do grupo precisam ser vendidas antes de leiloar um título.
- Propostas de troca de dinheiro e títulos podem ser enviadas pelo perfil de participante a qualquer momento. Há uma proposta ativa por sala; ela fica aberta até ser aceita, recusada, cancelada pelo remetente, ou encerrada por falência/fim de partida. O servidor valida títulos, construções e saldos ao enviar e aceitar.
- A anfitriã pode ativar o modo DEV no lobby. Quando ativo, apenas ela pode forçar os dados durante a rolagem válida; o servidor verifica anfitriã, jogador ativo e valores.
- A velocidade visual compartilhada é 0,5×, 1× ou 2×. O turno dá 20 segundos para rolar e até 15 segundos para cada decisão. Se alguém não agir, a compra é recusada, a Prisão aguarda, ações obrigatórias são concluídas e a dívida avança pela próxima liquidação disponível.

## Apresentação e acesso

- O jogo usa React + React Three Fiber no navegador. O tabuleiro é 3D e original; menus, regras, lobby e HUD são interface HTML responsiva.
- As casas selecionáveis no tabuleiro preservam as cores originais quando válidas e ficam apagadas quando inválidas. Construções ficam apoiadas no piso, alinhadas à faixa interna para preservar os nomes e o corredor.
- A FATEC Itapetininga fica no centro como modelo visual dos três blocos e da torre mostrados nas imagens de referência. Não ocupa casa de jogo. Os dados ficam suspensos pouco acima dos prédios durante a rolagem.
- O modo noturno escurece a home e o lobby. Na partida, altera somente o fundo externo, sem escurecer o tabuleiro. A preferência é local e pode ser alterada durante o jogo.
- Bens, Config, Emote e Regras ficam em botões quadrados na lateral; a interface adapta-se ao celular. Movimento reduzido, áudio e qualidade gráfica são controles locais.
- A câmera gira por mouse/toque na área do tabuleiro e usa a roda/pinça para zoom; botões e painéis interativos não devem iniciar rotação.

## Escopo removido e referências

- Express, seus objetivos e suas rodadas foram removidos do produto. Volta ao Mundo, estações, aluguéis por dado e hipotecas resgatáveis foram substituídos pelas regras deste documento.
- *Business Tour* é referência de ritmo econômico e clareza visual, não de nomes, arte, textos ou interface copiados. O nome, as cidades, as cartas, regras e assets do BANTEC são originais.
- Para contexto histórico de regras comerciais, consulte a [página oficial do Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) e o [manual oficial do Super Banco Imobiliário](https://estrela.vteximg.com.br/arquivos/Manual-Super-Banco-Imobili%C3%A1rio.pdf). Essas fontes não definem as regras atuais do BANTEC.
