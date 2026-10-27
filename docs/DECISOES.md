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
| Express | Vitória imediata ao completar os objetivos primeiro; se o tempo acabar, vence o maior patrimônio. |
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
| Ritmo/regras | Clássico Rápido de 30 minutos com mecânicas completas; Express com objetivos, vitória imediata por objetivos ou maior patrimônio ao fim do tempo | Modos, duração clássica e condição de vitória do Express confirmados; objetivos exatos e duração do Express pendentes |
| Regras e autoridade | Estado e ações validados no servidor por sala | Pendente; recomendação técnica |
| Multiplayer | Avaliar Colyseus para salas, sincronização e reconexão | Pendente |
| Frontend em produção | Vercel | Pendente |
| Servidor de partidas | Comparar Vercel Functions com WebSockets e hospedagem Node persistente | Pendente |
| Persistência | Sem contas e sem persistência de partidas no MVP | Pendente |
| Repositório | Git local com branch `main` e remoto `BancoImobiliarioOnline` | Criado como privado; `main` publicada em `origin` |
| Tamanho da sala | 2–4 jogadores | Confirmado por enquanto; pode ser revisto depois do MVP. |

## Questões de produto em ordem de impacto

1. Quais objetivos entram no Express e quantos devem ser concluídos para a vitória imediata?
2. Qual duração padrão do Express?
3. Como desempatar patrimônio igual ao fim do relógio?
4. Em quais momentos de um turno os jogadores podem negociar títulos e dinheiro?
5. Quais opções de avatar/cor e regras para anfitrião e desconexão?
6. O primeiro lançamento deve usar formas simples ou assets 3D mais acabados?

## Referência visual e propriedade intelectual

A captura fornecida comunica perspectiva, escala do tabuleiro, presença de peças/dados e disposição geral do HUD. Os modelos, ilustrações, tabuleiro, nomes e componentes de interface do projeto devem ser originais ou licenciados. Uma semelhança de gênero e composição não exige reproduzir elementos identificáveis do jogo de referência.

## Histórico

- 2026-10-27: criado o esqueleto de preparação do projeto. A stack e o provedor ainda são propostas.
- 2026-10-27: usuário confirmou computador e celular, quer todas as mecânicas no modo Clássico Rápido, quer também uma opção Express no seletor da criação da sala e escolheu `BancoImobiliarioOnline` como nome do remoto. Recomendado limite de quatro jogadores.
- 2026-10-27: usuário definiu duração de 30 minutos para o Clássico Rápido, confirmou até quatro jogadores por enquanto e escolheu as duas condições de vitória para o Express: completar objetivos primeiro ou liderar em patrimônio quando o tempo acabar.
- 2026-10-27: autenticação do GitHub concluída; repositório privado `BancoImobiliarioOnline` criado e branch `main` enviada.
