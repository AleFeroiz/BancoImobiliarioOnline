# Decisões do projeto

## Confirmadas e vigentes

- O produto é **BANTEC**: jogo de tabuleiro privado para navegador, sem contas, para 2–4 participantes, com tabuleiro 3D original e interface responsiva.
- Existe um modo. A anfitriã escolhe no lobby partidas de 15 minutos, 30 minutos ou 1 hora. O saldo inicial é R$ 2.000.000 por participante.
- O percurso tem 40 casas: 24 cidades, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos especiais. Não existem casas de descanso nem o modo Express.
- As cidades, regiões, cores e preços abaixo definem a economia do tabuleiro. Os preços são valores de jogo orientados pela ordem do PIB municipal, não uma conversão de PIB para reais.
- Regras atuais de aluguel, construções, dívida, vitória, cartas, cantos e negociação estão especificadas em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md). Essa especificação substitui as regras antigas registradas no histórico.

## Cidades, regiões e cores

| Região | Cor do piso | Cidades e preço de compra |
|---|---|---|
| Norte | Turquesa `#00A6A6` | Canaã dos Carajás — R$ 200.000; Porto Velho — R$ 250.000; Parauapebas — R$ 275.000; Belém — R$ 350.000; Manaus — R$ 650.000. |
| Centro-Oeste | Dourado `#E6B84B` | Rio Verde — R$ 225.000; Cuiabá — R$ 325.000; Campo Grande — R$ 375.000; Goiânia — R$ 500.000; Brasília — R$ 725.000. |
| Nordeste | Rosa `#D45087` | Maceió — R$ 300.000; São Luís — R$ 400.000; Recife — R$ 475.000; Salvador — R$ 525.000; Fortaleza — R$ 550.000. |
| Sul | Verde `#4A9D68` | Itajaí — R$ 425.000; Joinville — R$ 450.000; Porto Alegre — R$ 575.000; Curitiba — R$ 625.000. |
| Sudeste | Azul `#3B65CC` | Osasco — R$ 600.000; Belo Horizonte — R$ 675.000; Maricá — R$ 700.000; Rio de Janeiro — R$ 800.000; São Paulo — R$ 950.000. |

A volta começa pela região de menor participação no PIB nacional e termina na de maior: **Norte → Centro-Oeste → Nordeste → Sul → Sudeste**. Dentro de cada região, as cidades seguem do menor para o maior PIB municipal; São Paulo é o último imóvel antes da Partida. Para 2023, as participações regionais são Norte 5,8%, Centro-Oeste 10,6%, Nordeste 13,8%, Sul 16,8% e Sudeste 53,0% ([IBGE](https://agenciadenoticias.ibge.gov.br/media/com_mediaibge/arquivos/9c2b887d59dd6c63da1b39b00c6cacce.pdf)). A seleção de cidades e os preços são uma escala de balanceamento, não uma conversão de PIB.

## Outras regras econômicas aprovadas

- **Monopólio Regional:** possuir todas as cidades de uma região dobra o aluguel. Completar duas regiões diferentes é uma vitória imediata. O Sul tem quatro cidades; cada outra região tem cinco.
- **Monopólio em Linha:** cada lado do tabuleiro contém seis cidades e uma companhia. Possuir os sete títulos daquele lado vence imediatamente. Taxas e Sorte ou Revés não contam.
- **Companhias:** AgroBrasil, Aviação Brasil, Energia Brasil e Mineração Brasil custam R$ 500.000 cada. Os aluguéis totais são R$ 100.000, R$ 250.000, R$ 450.000 e R$ 750.000 para uma, duas, três ou quatro companhias. Possuir as quatro vence imediatamente; companhias não pertencem às regiões, mas contam para a linha e os impostos.
- **Cidades:** aluguel de 10%, 20%, 40%, 70% e 100% do preço para terreno, uma, duas, três casas e hotel. Uma região completa dobra o aluguel; Copa do Mundo multiplica o resultado por três. Casa custa metade do preço da cidade; hotel custa três casas e substitui as três.
- **Taxas:** R$ 10.000, R$ 15.000, R$ 20.000 e R$ 25.000 por cidade/companhia possuída. Construções não contam. Título vendido ou devolvido ao banco deixa de contar.
- **Devolução durante dívida:** devolver uma cidade ou companhia ao banco rende 50% do preço e encerra a posse imediatamente; o título volta a ficar livre. Não existe hipoteca ou resgate. Construções do grupo precisam ser vendidas antes.
- **Recompra forçada:** ao cair em imóvel de outra pessoa, primeiro se paga o aluguel normal. Se, depois disso, ainda houver saldo para 1,5× o investimento total e o imóvel não tiver hotel, o jogador pode recomprá-lo. O valor integral da recompra é pago diretamente ao dono, sem depender de consentimento; a posse passa ao comprador. Hotel impede recompra.
- **Duplas:** numa rolagem normal, duplas permitem repetir depois de concluir a chegada. A terceira dupla consecutiva envia à Prisão sem mover pelo terceiro resultado. Duplas tentadas para sair da Prisão não concedem nova jogada.
- **Resultado final:** a tela de encerramento informa a causa sincronizada pelo servidor: tempo, falência, Monopólio em Linha, Monopólio Duplo Regional, quatro companhias ou ausência de participantes solventes.
- **Sorte ou Revés:** baralho autoral de 12 cartas com reposição; efeitos e exceções atuais estão em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md).
- **Seleção no tabuleiro:** toda ação que pede escolher cidade/imóvel destaca as casas válidas e apaga as inválidas; seleção de participantes continua nos controles de jogadores. Em cartas com alvo, a pessoa tem até 15 segundos para ler/fechar a revelação e depois recebe uma janela completa de 15 segundos para escolher.
- **Marca e modelo central:** BANTEC é a identidade global. A FATEC Itapetininga fica no centro do tabuleiro como modelo visual somente dos três blocos e da torre mostrados nas referências do usuário; não ocupa uma casa nem altera regras. Durante a rolagem, os dados ficam na altura Y=1,065, com escala visual 0,55 e salto curto de 0,065 unidade; o indicador do total fica em Y=1,57. O limite inferior geométrico preserva ao menos 0,01 unidade de folga sobre os telhados, e as posições laterais evitam a torre durante o giro.
- **Modo noturno:** preferência local persistida; escurece toda a home e o lobby e somente o fundo externo na partida, sem escurecer ou recolorir o tabuleiro.

## Propostas abertas e validações necessárias

- As 12 cartas foram percorridas em revisão manual visual; a evidência consolidada está em `docs/VALIDACAO.md`. Continuam pendentes os playtests humanos de equilíbrio/ritmo para 15, 30 e 60 minutos.
- Validar equilíbrio e ritmo das partidas de 15, 30 e 60 minutos com pessoas; o saldo inicial e a economia continuam sujeitos a calibração depois desses jogos.
- A home foi repaginada com o percurso visual das cinco regiões; a próxima revisão da página inicial deve preservar esse caminho, a leitura rápida e o acesso direto a criar/entrar em sala.
- **Hospedagem escolhida: Render, priorizando simplicidade** (2026-10-31). O serviço existente está documentado como Free e vinculado ao repositório; a escolha não aprova upgrade pago. O Free serve para testes e partidas privadas, mas não é indicado pelo fornecedor para produção: pode hibernar após 15 minutos sem tráfego de entrada e levar cerca de um minuto para despertar. Antes de publicar o estado atual, o proprietário precisa copiar o Deploy Hook do painel para o segredo `RENDER_DEPLOY_HOOK_URL` em GitHub Actions e desligar o deploy nativo para evitar deploys duplicados. Para uso contínuo, confirmar o custo do Starter (referência pesquisada: US$ 7/mês, 512 MB). Fontes: [limites do Render Free](https://render.com/docs/free), [Deploy Hooks](https://render.com/docs/deploy-hooks), [preços Render](https://render.com/pricing).

## Histórico de decisões substituídas

Os registros abaixo documentam etapas antigas do projeto; **não são regras atuais**. Para jogar, use apenas as decisões vigentes e `docs/REGRAS-DE-JOGO.md`.

- **2026-10-27 a 2026-10-29:** o protótipo usou Clássico Rápido e Express, objetivos Express, saldo inicial de R$ 1.500.000, hipoteca resgatável, cidades/ruas antigas, três estações com aluguel por dado, taxas de R$ 50.000 a R$ 125.000 e Volta ao Mundo. Esses sistemas foram substituídos pela reforma BANTEC.
- **2026-10-27 a 2026-10-30:** foram estabelecidos o tabuleiro 3D original, os cantos especiais, casas e hotéis low-poly, lobby online, bots, negociação, leilão voluntário, acessibilidade, modo DEV, animações e controles responsivos. Esses elementos permanecem somente onde compatíveis com as regras atuais.
- **2026-10-31:** aprovada a reforma brasileira com cinco regiões, cidades e valores definidos, quatro companhias, quatro taxas, novo baralho, partidas de 15/30/60 minutos, duplas com Prisão na terceira, recompra forçada e remoção do Express. Também foi definida a FATEC Itapetininga no centro e a identidade BANTEC.
