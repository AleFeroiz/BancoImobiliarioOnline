# Plano do jogo

## Visão

Um jogo de tabuleiro para abrir no navegador e jogar com amigos, sem cadastro. Cada pessoa informa um nome e cria uma sala ou entra pelo código recebido. A partida combina um tabuleiro 3D original com interface acessível e regras executadas pelo servidor.

## Experiência

- Tela inicial para escolher nome e criar/entrar em sala.
- Ao criar, a anfitriã escolhe duração de 15, 30 ou 60 minutos; há uma modalidade de partida.
- Lobby lista até quatro participantes, anfitrião e estado de preparação; anfitrião inicia.
- Tabuleiro 3D com inclinação inicial discreta e câmera orbitável pelo arraste do mouse ou toque, zoom pela roda do mouse e pinça no celular, preservando os quatro cantos no enquadramento inicial; as fichas têm leve aumento de escala e aro contrastante na base. A partida usa toda a janela, sem o cabeçalho geral. Partida, Prisão (três turnos), Copa do Mundo (aluguel 3× numa propriedade própria escolhida, se houver, e estádio 3D) e Volta ao Brasil (teletransporte para casa própria, livre ou especial e aeroporto com avião) são os quatro cantos. Espaços legíveis, peças e dados; cada pessoa escolhe no lobby peão, carrinho, moto ou avião como ficha visual colorida por dono; cada jogada mostra os dados, depois o percurso da ficha e por fim a ação de chegada; o anfitrião controla a velocidade das animações (0,5×, 1× ou 2×, padrão 1×), e observadores acompanham as fases por balão junto à ficha; câmera livre durante movimento e inspeção de casas fora do turno; valores de aluguel em texto 3D sobre cada propriedade, voltados à câmera; no lobby, a anfitriã pode habilitar ferramentas de dados, com o estado visível a todas as pessoas; HUD em HTML responsivo para desktop e celular.
- Ações disponíveis e resultados da jogada ficam claros em cada turno.
- O botão “?” abre um guia rápido. A pessoa tem 20 segundos para rolar e 15 segundos para uma decisão; expiração recusa compras, conclui automaticamente o turno de prisão, escolhe destinos padrão para os cantos novos e avança a liquidação de dívidas.
- Partidas temporárias, sem conta ou progresso persistente.
- Durante a partida, as opções locais abrem em tela sobreposta sem pausar o estado sincronizado; incluem qualidade gráfica, FPS, áudio e movimento reduzido. Emotes curtos são transmitidos a todos e os cantos Aeroporto, Prisão e Copa têm sons de chegada próprios.

## Regras vigentes

O produto atual é o **BANTEC**. As regras oficiais do projeto estão centralizadas em [REGRAS-DE-JOGO.md](REGRAS-DE-JOGO.md), os valores e decisões confirmadas em [DECISOES.md](DECISOES.md), e o que ainda falta validar em [ANDAMENTO.md](ANDAMENTO.md). Express, hipotecas resgatáveis, aluguel por dado de estação e Volta ao Mundo são sistemas históricos e não pertencem ao produto atual.

### Reforma BANTEC — implementação concluída; playtests de equilíbrio pendentes

O código contém o percurso regional de 40 casas, 24 cidades brasileiras, quatro companhias, quatro taxas, quatro Sorte ou Revés e quatro cantos úteis; aluguéis escalonados, seleção de duração e cor, cinco cores regionais, saldo inicial de R$ 2 milhões, cartas autorais, duplas com Prisão na terceira e condições de vitória imediata. Também estão implementados recompra forçada por 1,5×, devolução de imóvel ao banco durante dívida, ausência de hipoteca, remoção do Express, modelo central da FATEC Itapetininga, modo noturno e seleção no tabuleiro com opções válidas iluminadas e inválidas apagadas. A home BANTEC apresenta a rota Norte → Centro-Oeste → Nordeste → Sul → Sudeste, com as cores oficiais e a composição do tabuleiro; foi revisada em desktop e celular. A interface de dívida, as quatro companhias, as duas vitórias por monopólio e os encerramentos por falência e por tempo foram validados em partidas reais. As 12 cartas foram revisadas visualmente. Um smoke test público confirmou que Vercel e o servidor multiplayer do Render iniciam uma partida e resolvem uma rolagem. Testes de integração cobrem regras e encerramentos. Permanecem playtests com pessoas para avaliar o equilíbrio e o ritmo das partidas de 15, 30 e 60 minutos; no painel Render ainda falta confirmar o SHA publicado e o estado do Auto-Deploy. Evidências atuais estão em `docs/ANDAMENTO.md` e `docs/VALIDACAO.md`.

Em 2026-10-31, o hook de pré-commit passou com 236 testes em 46 arquivos e builds do frontend e servidor. As exceções de Apagão/Terremoto contra hotéis têm regressão automatizada; condições imediatas de monopólio, falência e resolução do tempo têm testes de integração. A dívida e o painel final foram observados em partidas reais no navegador. O build ainda informa um chunk de cena 3D acima de 500 KB. Veja `docs/ANDAMENTO.md` para a validação mais recente e os próximos passos concretos.

## Arquitetura confirmada

| Parte | Decisão | Responsabilidade |
|---|---|---|
| Aplicação | React + TypeScript + Vite | Lobby, navegação, HUD e integração com a sala. |
| Cena | React Three Fiber + Three.js | Representar tabuleiro, peças, dados e animações. |
| Regras | Módulo TypeScript sem dependência de renderização | Estado determinístico e transições do jogo. |
| Multiplayer | Node + Colyseus autoritativo | Criar/entrar em sala, validar ações e sincronizar estado. |
| Frontend publicado | Vercel | Servir a aplicação web. |
| Servidor publicado | Render (Node + WebSockets) | Manter salas multiplayer Colyseus; serviço existente no plano Free, com deploy solicitado pelo workflow após os checks. |
| Persistência | Nenhuma no MVP | Salas temporárias; sem contas e histórico. |

## Fases de produção

1. **Fatia visual inicial:** tela inicial, escolha de duração e cena 3D responsiva com tabuleiro e peças próprias estão implementadas. A identidade e a home foram repaginadas para BANTEC; a home apresenta as cinco regiões e foi revisada em desktop e celular.
2. **Salas online:** servidor Colyseus, código privado de cinco caracteres, lobby sincronizado, anfitrião, bots de lobby e reconexão. O anfitrião pode preencher lugares vagos com bots; durante a partida, o bot assume imediatamente uma pessoa desconectada, inclusive compra ou dívida pendente, e devolve o controle na reconexão (janela de até 24 horas). O suporte ao modo Express citado nos testes históricos deixou de ser parte do produto. O servidor está hospedado no Render por simplicidade; o smoke test público confirmou conexão, início de partida e uma jogada. Ainda falta revisar no painel a versão ativa e a configuração de Auto-Deploy.
3. **Ciclo de partida:** a única modalidade permite escolher 15, 30 ou 60 minutos; o servidor sincroniza a contagem e encerra por patrimônio ao fim do tempo. O modo Express e seus objetivos privados foram retirados. As condições de vitória imediata por monopólio são autoritativas no servidor. Ainda são necessários playtests humanos para avaliar estratégia e equilíbrio.
4. **Economia e interação:** implementada. Na reforma BANTEC, hipoteca foi substituída pela devolução do título ao banco por 50% do preço durante dívida, liberando o imóvel. Carteira, inspetor, leilões voluntários, propostas de troca, cartões de jogadores e seleção no tabuleiro estão implementados e foram revisados no navegador; as cartas também foram percorridas visualmente.
5. **Presets:** durações de partida, critérios de vitória e quatro companhias aprovadas pelo usuário implementados. O balanço geral deve ser avaliado em partidas com pessoas.
6. **Acabamento:** implementado e revisado. A interface mostra informações das casas, aluguéis e ações contextuais. Construções ocupam a faixa interna dos pisos e preservam nomes/corredor; cinco regiões têm cores próprias. Copa e Volta usam assets originais, e o modelo central representa somente os blocos e torre da FATEC Itapetininga. Lobby e HUD são responsivos; modo noturno, cor, duração, qualidade gráfica, áudio, movimento reduzido e emotes estão disponíveis. Os painéis finais por vitória, tempo e falência foram revisados em jogo.

## Limites do MVP

- Sem login, contas, matchmaking público, ranking ou chat de voz.
- Sem assets, marcas, textos ou layout copiados de *Business Tour*; criar identidade visual própria.
- Suportar computador e celular desde o começo; medir WebGL e controles em aparelhos móveis modestos.

## Referências de hospedagem

O frontend continua publicado na Vercel e o servidor Node + Colyseus usa o serviço Render já vinculado ao repositório. O workflow CI passa `npm run verify` e chama o Deploy Hook do Render; o log confirmou aceitação. O status Vercel confirmou publicação concluída e o smoke test público iniciou e executou uma jogada multiplayer. Falta confirmar no painel Render o SHA ativo e se o Auto-Deploy está desligado para evitar publicações duplicadas. O plano Free pode adormecer após inatividade; nenhum upgrade pago foi aprovado. Documentação: [WebSockets na Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment), [reconexão Colyseus](https://docs.colyseus.io/room/reconnection), [Render Free](https://render.com/docs/free) e [Deploy Hooks](https://render.com/docs/deploy-hooks).
