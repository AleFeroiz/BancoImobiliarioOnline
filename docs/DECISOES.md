# Decisões e questões abertas

Este arquivo separa decisões confirmadas de propostas para evitar que uma sugestão vire requisito sem alinhamento.

## Confirmado pelo pedido

| Tema | Decisão |
|---|---|
| Produto | Jogo web casual de Banco Imobiliário para jogar com amigos. |
| Conta | Sem contas; a pessoa usa um nome e cria uma sala ou entra com ID/código. |
| Partida | A visão principal deve ser 3D. |
| Plataformas | Computador e celular. |
| Mecânicas | Incluir o conjunto completo, incluindo leilões, construções, hipotecas e negociação. |
| Modos de partida | Oferecer duas opções de regras na criação da sala: Clássico Rápido e Express. |
| Duração | Clássico Rápido terá 30 minutos. |
| Express | O usuário pediu vitória imediata ao completar objetivos primeiro; se o tempo acabar, vence o maior patrimônio. É uma regra digital personalizada, diferente da descrição pública encontrada para a edição física. |
| Tamanho da sala | De 2 a 4 jogadores por enquanto, nos dois modos. |
| Repositório | Nome desejado: `BancoImobiliarioOnline`. |
| GitHub | Remoto privado criado e conectado em `origin`; branch `main` publicada. |
| Referência visual | A captura de *Business Tour* enviada pelo usuário orienta a sensação de perspectiva e leitura do tabuleiro. |
| Fase atual | Preparar produto, regras, GitHub e instruções antes de iniciar produção. |

## Propostas iniciais — confirmar antes de implementar

| Tema | Proposta | Estado |
|---|---|---|
| Frontend | React + TypeScript + Vite | Pendente |
| Renderização 3D | React Three Fiber + Three.js | Pendente |
| Ritmo/regras | Clássico Rápido de 30 minutos com mecânicas completas; Express com 6 rodadas de 40 segundos, cerca de 8 minutos totais, cartas de objetivo e vitória por dinheiro no fim | Clássico confirmado; duração Express baseada em ficha de distribuição; confirmar regra fiel de dinheiro versus extensão digital de vitória imediata por objetivo |
| Regras e autoridade | Estado e ações validados no servidor por sala | Pendente; recomendação técnica |
| Multiplayer | Avaliar Colyseus para salas, sincronização e reconexão | Pendente |
| Frontend em produção | Vercel | Pendente |
| Servidor de partidas | Comparar Vercel Functions com WebSockets e hospedagem Node persistente | Pendente |
| Persistência | Sem contas e sem persistência de partidas no MVP | Pendente |
| Repositório | Git local com branch `main` e remoto `BancoImobiliarioOnline` | Criado como privado; `main` publicada em `origin` |
| Tamanho da sala | 2–4 jogadores | Confirmado por enquanto; pode ser revisto depois do MVP. |

## Questões de produto em ordem de impacto

1. No Express, aceitar a referência de 6 rodadas × 40 segundos (aprox. 8 minutos no total)?
2. Manter a vitória imediata por objetivos pedida pelo usuário ou seguir a edição, onde objetivos dão dinheiro e vence o maior saldo ao final?
3. Quais objetivos originais entram no digital enquanto o texto das 8 cartas da caixa não estiver acessível?
4. No Express, pontuar só o dinheiro em mãos (referência da edição) ou patrimônio total?
5. Em quais momentos do Clássico Rápido negociar títulos e dinheiro?
6. Quais opções de avatar/cor e regras para anfitrião e desconexão?
7. O primeiro lançamento deve usar formas simples ou assets 3D mais acabados?

## Sugestões para fechar o restante

Estas são recomendações para servir de base. Continuam propostas até o usuário aprová-las.

| Tema | Sugestão | Motivo |
|---|---|---|
| Express: tempo | 6 rodadas de 40 segundos, cerca de 8 minutos no total | É a duração anunciada para o produto 828100; a Estrela confirma a ampulheta e os componentes, mas não publica o texto do manual. |
| Express: objetivos | Oito cartas originais do jogo digital; uma carta privada por pessoa. Cumprir o objetivo paga bônus em dinheiro. | A caixa lista oito cartas de objetivo, mas o texto não está disponível. Bônus mantém a pressão por objetivo sem deixar uma carta fácil encerrar a partida. |
| Express: vitória | Seguir a edição: maior saldo em dinheiro ao final. Manter vitória imediata por objetivo como variante personalizada se o usuário ainda preferir. | As descrições encontradas dizem que os objetivos ajudam a ganhar dinheiro e que vence quem tem mais dinheiro no fim; não confirmam vitória imediata por objetivo. |
| Express: conteúdo de objetivos | Misturar metas de grupo de cor, quantidade de propriedades e construção; escrever nomes e condições próprios. | Evita afirmar que os cartões autorais reproduzem as oito cartas físicas. |
| Clássico: desempate | Calcular dinheiro após liquidação de bens e construções; empate resolvido nos dados. | O manual oficial do Super Banco Imobiliário usa venda de bens para o jogo curto e sugere dados para desempate. |
| Leilão | Se alguém recusar uma propriedade livre, iniciar leilão público de 20 segundos, com lances mínimos em incrementos fixos. | Mantém propriedades circulando sem alongar o turno. |
| Negociação | No Clássico, permitir negociação durante a vez ativa, com janela de 45 segundos; no Express, negociar durante as fases de 40 segundos. | Clarifica quando ofertas podem ocorrer e mantém Express no ritmo de rodada. |
| Desconexão | Dar 60 segundos para reconectar; depois, pular a ação/turno atual sem permitir ações automáticas em nome da pessoa. | Simples e previsível para partidas privadas sem contas. |
| Direção visual | Começar com peças e edifícios low-poly próprios, câmera inclinada fixa e HUD DOM responsiva. | Valida leitura e desempenho antes de produzir assets detalhados. |
| Stack | React + TypeScript + Vite + React Three Fiber; servidor autoritativo Node/Colyseus; frontend na Vercel e servidor multiplayer em hospedagem Node compatível. | Casa com o tabuleiro 3D, lobby/HUD e salas sincronizadas. Confirmar topologia e custos antes do deploy. |

## Referência visual e propriedade intelectual

A captura fornecida comunica perspectiva, escala do tabuleiro, presença de peças/dados e disposição geral do HUD. Os modelos, ilustrações, tabuleiro, nomes e componentes de interface do projeto devem ser originais ou licenciados. Uma semelhança de gênero e composição não exige reproduzir elementos identificáveis do jogo de referência.

## Histórico

- 2026-10-27: criado o esqueleto de preparação do projeto. A stack e o provedor ainda são propostas.
- 2026-10-27: usuário confirmou computador e celular, quer todas as mecânicas no modo Clássico Rápido, quer também uma opção Express no seletor da criação da sala e escolheu `BancoImobiliarioOnline` como nome do remoto. Recomendado limite de quatro jogadores.
- 2026-10-27: usuário definiu duração de 30 minutos para o Clássico Rápido, confirmou até quatro jogadores por enquanto e escolheu as duas condições de vitória para o Express: completar objetivos primeiro ou liderar em patrimônio quando o tempo acabar.
- 2026-10-27: autenticação do GitHub concluída; repositório privado `BancoImobiliarioOnline` criado e branch `main` enviada.
- 2026-10-27: pesquisa da edição Express encontrou a duração anunciada de aproximadamente 8 minutos e seis rodadas de 40 segundos em uma ficha de distribuição; a Estrela confirma 8 cartas de objetivo, mas não publica seu texto. Descrição da edição favorece vitória por dinheiro ao final; vitória instantânea por objetivo fica registrada como regra personalizada solicitada.
- 2026-10-27: adicionadas sugestões iniciais para metas Express, pontuação, leilão, negociação, desconexão, direção visual e stack; todas seguem como propostas.
