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
| Repositório | Nome desejado: `BancoImobiliarioOnline`. |
| Referência visual | A captura de *Business Tour* enviada pelo usuário orienta a sensação de perspectiva e leitura do tabuleiro. |
| Fase atual | Preparar produto, regras, GitHub e instruções antes de iniciar produção. |

## Propostas iniciais — confirmar antes de implementar

| Tema | Proposta | Estado |
|---|---|---|
| Frontend | React + TypeScript + Vite | Pendente |
| Renderização 3D | React Three Fiber + Three.js | Pendente |
| Ritmo/regras | Clássico Rápido com mecânicas completas; Express com objetivos e rodada cronometrada | Dois modos na criação da sala confirmados; detalhes de cada preset pendentes |
| Regras e autoridade | Estado e ações validados no servidor por sala | Pendente; recomendação técnica |
| Multiplayer | Avaliar Colyseus para salas, sincronização e reconexão | Pendente |
| Frontend em produção | Vercel | Pendente |
| Servidor de partidas | Comparar Vercel Functions com WebSockets e hospedagem Node persistente | Pendente |
| Persistência | Sem contas e sem persistência de partidas no MVP | Pendente |
| Repositório | Preparar Git local com branch `main` e criar remoto `BancoImobiliarioOnline` | Autenticação CLI pendente; visibilidade a definir |
| Tamanho da sala | 2–4 jogadores no MVP | Recomendação; usuário perguntou se deveria ser sem limite ou até 4. |

## Questões de produto em ordem de impacto

1. Qual duração inicial do Clássico Rápido: 30 ou 45 minutos?
2. No modo Express, quais mecânicas clássicas devem permanecer além de compra, troca e objetivos?
3. Confirmar o limite de 4 pessoas no MVP; recomendado por ritmo e legibilidade no celular.
4. O repositório GitHub será público ou privado? O nome solicitado é `BancoImobiliarioOnline`.
5. Em quais momentos de um turno os jogadores podem negociar títulos e dinheiro?
6. Quais opções de avatar/cor e regras para anfitrião e desconexão?
7. O primeiro lançamento deve usar formas simples ou assets 3D mais acabados?

## Referência visual e propriedade intelectual

A captura fornecida comunica perspectiva, escala do tabuleiro, presença de peças/dados e disposição geral do HUD. Os modelos, ilustrações, tabuleiro, nomes e componentes de interface do projeto devem ser originais ou licenciados. Uma semelhança de gênero e composição não exige reproduzir elementos identificáveis do jogo de referência.

## Histórico

- 2026-10-27: criado o esqueleto de preparação do projeto. A stack e o provedor ainda são propostas.
- 2026-10-27: usuário confirmou computador e celular, quer todas as mecânicas no modo Clássico Rápido, quer também uma opção Express no seletor da criação da sala e escolheu `BancoImobiliarioOnline` como nome do remoto. Recomendado limite de quatro jogadores.
