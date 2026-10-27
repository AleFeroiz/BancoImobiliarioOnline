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
| Express | Seis rodadas de 40 segundos, cerca de 8 minutos de duração total, oito objetivos digitais originais e vitória por maior saldo ao final. Concluir objetivo não encerra a partida imediatamente. |
| Objetivos Express | Uma carta privada por jogador; objetivos originais que podem envolver grupo de cor, quantidade de propriedades ou construções. Cumprir concede bônus em dinheiro. Valores e textos serão balanceados durante a implementação. |
| Pontuação Express | Maior saldo em dinheiro ao fim das seis rodadas. Empate: maior patrimônio avaliando imóveis e construções pelo valor de venda; persistindo, desempate nos dados. |
| Fim do Clássico | Ao fim dos 30 minutos, concluir a ação e os pagamentos em andamento; vence o maior patrimônio após liquidação de bens e construções. Empate resolvido nos dados. |
| Leilão | Propriedade recusada vai a leilão público de 20 segundos, com incremento mínimo definido pelo jogo. |
| Negociação | Clássico: durante a vez ativa, em janela de 45 segundos. Express: durante as fases cronometradas de 40 segundos. |
| Desconexão | Até 60 segundos para reconectar; depois, pular a ação/vez atual sem tomar decisões automáticas em nome da pessoa. |
| Direção visual | Tabuleiro e peças originais low-poly, câmera inclinada fixa e interface DOM responsiva. A imagem de *Business Tour* é referência de composição e leitura, não de assets ou reprodução exata. |
| Stack | React + TypeScript + Vite + React Three Fiber/Three.js. Regras desacopladas da cena e validadas por servidor autoritativo Node com Colyseus. |
| Hospedagem planejada | Frontend na Vercel; servidor multiplayer em hospedagem compatível com Node e WebSockets. Validar operação e custo antes do lançamento público. |
| Dados | MVP sem contas e sem progresso persistente; salas e partidas temporárias. |
| Código da sala | Código privado único de 5 caracteres, usado como ID da sala Colyseus. |
| Repositório | `BancoImobiliarioOnline`, remoto privado no GitHub, branch principal `main`. |
| Fluxo Game Studio | Usar o plugin Game Studio em todas as tarefas deste projeto, conforme `AGENTS.md`, incluindo habilidade de roteamento e a habilidade especializada pertinente. |

## Detalhes de implementação que ainda serão calibrados

- Valores, nomes e efeitos das 8 cartas de objetivo originais.
- Economia do tabuleiro, preço de propriedades e valores de construções para sustentar partidas nos tempos definidos.
- Efeitos concretos das cartas Sorte ou Revés, regras de prisão e limites de tempo por turno.
- Detalhes de reconexão/retorno após o prazo de 60 segundos e de saída voluntária.
- Opções visuais de avatares, cores e acessibilidade.
- Escolha final do provedor Node para hospedar o servidor, depois de validar Colyseus com salas reais.

## Base de regras Express

A página oficial da Estrela confirma a presença de oito cartas de objetivo e descreve a vitória pelo dinheiro ao fim do tempo, sem publicar o texto das cartas. A referência de seis rodadas de 40 segundos e cerca de oito minutos vem de ficha de distribuição do produto 828100, não de manual público. Os objetivos do jogo digital serão autorais e não apresentados como cópia das cartas físicas. Veja [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md) para fontes e escopo.

## Histórico

- 2026-10-27: preparação do produto, das regras, do repositório e das instruções do projeto.
- 2026-10-27: usuário confirmou as decisões acima, aceitou as sugestões propostas e retirou a vitória instantânea por objetivo.
- 2026-10-27: início da produção com a primeira fatia de interface e tabuleiro 3D; a conexão online será ligada ao servidor Colyseus em etapa seguinte.
