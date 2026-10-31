## Rota regional na home BANTEC — concluído (2026-10-31)

- A home agora exibe o percurso Norte → Centro-Oeste → Nordeste → Sul → Sudeste, com as cinco cores de região e a composição de 24 cidades/40 casas/quatro companhias. O indicador “01/03” foi substituído por informações reais do tabuleiro.
- `HOME_REGION_ROUTE` deriva a sequência e as cores dos dados compartilhados do tabuleiro, evitando uma segunda lista divergente. Testes verificam os cinco nomes, a ordem, as cores e a responsividade da rota.
- Revisão visual no navegador local em 964×883, 390×844 e 320×568: no menor viewport encontrei uma barra horizontal causada pelo `min-width: 320px` do `body`, que ultrapassava a área útil quando a barra vertical estava presente. Removi o piso fixo; a nova captura em 320×568 não mostra rolagem horizontal. Em 390×844, a rota continua em uma linha e a rolagem revela o formulário completo.
- `npm run graphify -- update .` concluiu. `npm run verify` passou com 233 testes em 46 arquivos; builds do frontend e servidor passaram. O chunk de cena 3D permanece acima de 500 KB.
- O Vite iniciou normalmente. Colyseus retornou `EADDRINUSE` em 2567 sem listener identificável em `Get-NetTCPConnection` ou `netstat`, então não interrompi processo desconhecido; não foi necessária sala para validar a home.
- Próximo passo concreto da reforma completa: reproduzir uma dívida real e percorrer por jogo cartas e vitórias ainda não vistas; confirmar visualmente o painel final em vitória real.

## Cartões coloridos, avisos identificados e visibilidade das peças — concluído (2026-10-30)

- Pedido atual: controles de botões para o lance inicial de leilão em mouse/touch; avisos com nome e cor do participante; cartões sem avatar/status, contendo nome e saldo em destaque sobre a cor integral do jogador e preservando os símbolos de dinheiro no canto superior direito; contorno para todas as fichas e aumento leve das construções.
- Estado inicial: `main` alinhada com `origin/main`; preservar `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1`, que já estavam modificados. A correção de aeroporto já estava na cena Blender do usuário; exportei os 38 meshes ao GLB do jogo em Y-up sem salvar por cima do `.blend` local.
- Implementação concluída: controles de lance em passos de R$ 10.000 com mínimo protegido; avisos identificam e colorizam a pessoa ativa; cartões mostram somente nome e saldo grande na cor do participante e mantêm os símbolos 3D no alto à direita; contornos traseiros nas fichas e construções na escala 1,25.
- `npm run verify`: 204 testes e builds de frontend/servidor passaram, inclusive no hook de pré-commit. A revisão visual em partidas locais confirmou cartões simplificados e o aeroporto na casa Volta ao Mundo. A personalização de avisos, os passos do lance e o material de contorno têm testes de regressão. Graphify update foi tentado, mas a CLI não está instalada.
- Próximo passo concreto: conferir a leitura dos cartões em diferentes resoluções após os próximos playtests humanos.
# Andamento do projeto

## Painel de encerramento da partida — concluído (2026-10-31)

- Relato: ao finalizar a partida, o painel de resultado pode sumir ou ficar com estado visual incorreto.
- Causa confirmada no frontend: o cartão final herdava condições transitórias de carta ativa e de fila de avisos; a etapa visual de dados/peão também podia manter texto de espera no resultado. Modais locais abertos (ajuda, configurações, carteira, leilão ou troca) podiam continuar sobre a partida encerrada.
- Correção: resultado final passa a ter prioridade sobre cartas, animações e avisos pendentes; ao receber o estado encerrado, a interface limpa animações, avisos e painéis locais. Ajuda e configurações não podem cobrir o resultado final.
- `npm run verify`: 231 testes em 45 arquivos e builds do frontend/servidor passaram; `npm run graphify -- update .` atualizou o grafo. O build mantém o aviso conhecido de chunk 3D acima de 500 KB.
- A lógica que escolhe o painel final está coberta por regressão automatizada. Não consegui reproduzir uma partida final pela interface nesta sessão; o estado terminal foi exercitado nos testes de integração do servidor, mas falta revisão visual real dessa tela.
- Próximo passo concreto: revisão visual do estado final em uma partida real.

## Reforma BANTEC — implementação em andamento (2026-10-31)

- Decisões aprovadas e preços das 24 cidades, cinco regiões, cores de piso, monopólios, impostos diferenciados, recompra por 1,5×, saldo inicial de R$ 2 milhões para playtest e partidas de 15/30/60 minutos estão em `docs/DECISOES.md`, `docs/REGRAS-DE-JOGO.md` e `docs/PLANO.md`.
- Implementados: composição regional de 40 casas, fórmula de aluguel escalonada, vitórias por Monopólio em Linha/Duplo Regional/quatro companhias, duração e cor escolhidas no lobby, bônus da Volta ao Brasil, recompra forçada sem consentimento do dono, remoção do Express, modelo central da FATEC Itapetininga com três blocos e torre, e nova rolagem por duplas com Prisão na terceira dupla seguida.
- A preferência local de modo noturno está implementada na home, sala e jogo: a home fica escura por inteiro, enquanto na partida apenas o fundo externo ao tabuleiro muda de cor. O ajuste persiste neste navegador. Os atalhos Bens, Config, Emote e Regras agora formam uma coluna de botões quadrados iguais na lateral direita, com tamanhos responsivos.
- O baralho autoral de 12 cartas já está no código e no servidor, incluindo alvos escolhidos pelos jogadores e pagamentos com tratamento de dívida. A seleção de qualquer cidade/imóvel usa o tabuleiro, com casas válidas iluminadas e inválidas apagadas. Durante dívida, devolver uma propriedade ao banco rende metade do preço, libera o título e apaga suas construções; hipoteca, resgate e aluguel por dado das antigas estações foram removidos.
- No playtest foram resolvidas Volta ao Brasil (destino São Paulo e compra), Troca-troca e Prisão (com opção de aguardar), além da seleção de propriedades, carteira, compra e recusa. A revelação e as mensagens do servidor usam agora o nome “Volta ao Brasil”. Ainda faltam percorrer as demais cartas, liquidar uma dívida real e validar condições de vitória pela interface.
- O Graphify local deve ser usado exclusivamente por `npm run graphify -- <comando>`; consultas precedem navegação no código e `npm run graphify -- update .` atualiza o grafo após mudanças. Foi confirmado que o comando local funciona neste ambiente.
- Os dados agora rolam acima da FATEC no centro do tabuleiro; um teste de regressão garante que ambos ficam acima do edifício e que o indicador do resultado fica mais alto. A revisão do navegador confirmou a rolagem lado a lado, sem cobrir a FATEC, e o fundo externo escuro sem escurecer o tabuleiro. A home e o lobby também foram revisados em modo noturno, incluindo os seletores de duração.
- A partida real no navegador confirmou compra de Parauapebas, compra de São Paulo com duas casas por R$ 1.900.000, carteira e seleção pelo tabuleiro. Os dados apareceram sobre a FATEC sem cobrir seus prédios; o modo noturno deixou o tabuleiro colorido e escureceu só o fundo de fora.
- `npm run graphify -- update .` atualizou o grafo local. `npm run verify` passou com 231 testes em 45 arquivos e builds frontend/servidor; permanece o aviso conhecido de chunk 3D acima de 500 KB.
- A correção do painel de encerramento está publicada em `391e8bf`; ainda falta ver a tela final numa vitória real. Próximos passos concretos: (1) finalizar a home BANTEC; (2) liquidar uma dívida real; (3) percorrer as cartas restantes; (4) validar vitórias em linha, duplo regional e quatro companhias no jogo, além do fim por tempo/falência; (5) confirmar o painel final e o desempate por patrimônio.

## Orientação das construções, movimento repetido e revisão — em andamento (2026-10-30)

- Escopo: alinhar casas/hotéis à orientação dos textos em cada lado; investigar jogadas consecutivas com o mesmo destino; revisar riscos do código com evidências e propostas de correção.
- Estado inicial: branch `main`; preservar alterações locais em `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1`. Graphify CLI indisponível; consultar alternativa conectada antes de navegar pelo código.
- Plano: reproduzir os defeitos, acrescentar regressões, corrigir a apresentação sem mudar regras, executar suíte/build e playtest local, registrar a revisão e publicar somente este escopo.

> Retrato de trabalho para retomar o projeto entre sessões. Para requisitos e decisões, consulte os documentos de origem indicados em `AGENTS.md`.

## HUD de turno, atalhos e leitura do aluguel — implementação concluída (2026-10-30)

- Pedido atual: colocar o valor 3D de aluguel sobre o modelo da construção; destacar melhor os aluguéis na inspeção; mover Configurações, Emote e Regras para junto do cartão do jogador e ampliar os botões; levar o ritmo para o topo ao lado do relógio de partida e mostrar também o relógio do turno.
- Estado inicial: `main` no commit `abea502`, alinhada a `origin/main`; alterações existentes em `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1` devem ser preservadas e não entram neste escopo.
- Implementação: rótulos acompanham o modelo de construção e aparecem acima do topo, com a mesma posição lateral alinhada à borda interna; aluguel recebeu tipografia maior no resumo e nas opções da inspeção. Configurações, Emote e Regras agora ficam em botões maiores ao lado do cartão local no desktop e em faixa dedicada no celular. Ritmo e relógio do tempo restante da etapa/vez aparecem ampliados no topo com o relógio da partida.
- Testes/builds: `npm run verify` passou com 225 testes em 44 arquivos e builds frontend/servidor; `git diff --check` passou. Regressão de posição vertical e lateral do rótulo coberta em `modelPlacement.test.ts`.
- Revisão visual não concluída: as portas 5173 e 2567 apareceram livres na enumeração, mas o servidor Colyseus retornou `EADDRINUSE` ao tentar iniciar; a sessão foi encerrada e nenhum processo desconhecido foi interrompido. A ferramenta `graphify` não está instalada, e o Graphify MCP só indexa `GustavoGLD/Hospital`, que não é este projeto.
- Próximo passo concreto: publicar em `main` somente os arquivos desta frente, preservando alterações locais do Blender.

## Aluguéis 3D, opções em tela inteira, emotes e sons de chegada — implementação concluída (2026-10-30)

- Pedido atual: aumentar os valores de aluguel 3D; abrir configurações em tela cheia sem pausar a partida e oferecer ajustes de imagem/desempenho; adicionar seis emotes sincronizados; trocar a cor azul fixa da fachada dos hotéis pela cor do proprietário; tocar sons ao chegar ao Aeroporto, Prisão e Copa.
- Inspeção: o texto da cena usava `fontSize=0.115`; o GLB usa `Hotel deep teal.001` na fachada e só marcava teto/placa com `OWNER_TINT`; o menu gráfico anterior era um popover. O servidor envia mensagens Colyseus autoritativas.
- Implementação: valores de aluguel ampliados e em negrito, fachada de hotel tingida pela cor do dono sem recolorir os vidros, configurações de gráficos/FPS/áudio/movimento numa tela sobreposta sem pausar turnos, whitelist server-side de emotes e balões temporários, e sons sintetizados de avião, sirene e torcida.
- Validação: `npm run verify` passou com 224 testes em 44 arquivos e builds frontend/servidor; `git diff --check` passou. O playtest visual não abriu: Colyseus retornou `EADDRINUSE` em 2567, sem PID identificável. Testes cobrem whitelist de emotes e broadcast do servidor, estilos de som de chegada e tintura da fachada do hotel com preservação dos vidros.
- Graphify: o único índice disponível é `GustavoGLD/Hospital`, sem relação com este repositório; a CLI local e uma ferramenta de atualização para este checkout não estão disponíveis.
- Próximo passo: revisar diff e publicar em `main` somente os arquivos desta tarefa, preservando os arquivos locais Blender.

## Painel de compra, inspeção, passos do peão e qualidade gráfica — implementação concluída (2026-10-30)

- Pedido atual: manter a decisão de compra visível sem saldo e com casa previamente selecionada; mostrar rótulos 3D somente em propriedades possuídas; corrigir layout de perfil com só um imóvel; substituir campos numéricos por botões; tocar um efeito suave por passo do peão; incluir inspeção de níveis e valores; expor controle gráfico com padrão de maior resolução.
- Implementação: decisão de compra não é mais ocultada por seleção antiga do inspetor, mesmo se não houver saldo. Rótulos 3D só são criados para imóveis com dono. A carteira usa altura sem rolagem quando só há um imóvel. Inspeção residencial agora mostra terreno e níveis de uma a três casas, aluguel/custo e seleção do nível atual; hotel aparece quando aplicável. Proposta e lances usam steppers de dinheiro em R$ 10.000 com limites de saldo, e outros valores continuam seguindo o padrão de botões. O peão toca “puf” em cada passo caminhado. O menu ⚙ oferece desempenho, equilibrado e alta resolução; o padrão usa DPR de 1–2×.
- Testes e build: `npm run verify` passou com 218 testes em 42 arquivos e builds de frontend/servidor. Aviso conhecido de chunk 3D em 956,43 KB (259,81 KB gzip). `git diff --check` passou. Regressões cobertas: compra não escondida por seleção, ausência de aluguel 3D sem dono, steppers limitados e qualidade gráfica padrão.
- Playtest visual pendente: o servidor local retornou `EADDRINUSE` em 2567; consultas de listener/processos não identificaram o proprietário da porta. Graphify update não executou porque o comando não está instalado.
- Próximo passo: publicar em `main` somente os arquivos desta tarefa, mantendo fora do commit os dois arquivos locais do Blender.

## Perfil de jogador, propostas, sons e rolagem de estação — implementação concluída (2026-10-30)

- Pedido atual: remover os atalhos “Imóveis” e “Negociar”; abrir perfil/carteira ao clicar em qualquer cartão; incluir efeitos de dinheiro, construção e dado; tornar manual e visível a rolagem do aluguel das estações; permitir propostas que dependem do aceite do destinatário.
- Implementação: cartões abrem painel não modal com todos os imóveis, ícone/tipo, construções e aluguel atualizado. O painel inicia proposta com dinheiro e títulos; uma oferta por sala fica pendente até resposta ou cancelamento e sobrevive à troca de turno. O servidor revalida saldo e títulos ao aceitar e limpa ofertas em falência/fim de partida. A estação abre fase de decisão, mostra um dado 3D, cobra um dado × R$ 50.000 após clique e rolagem animada; expiração ainda rola automaticamente. Áudio sintetizado agora diferencia caixa registradora, perda distorcida, chocalho de dados e construção.
- Documentação de regras, decisões, plano e README atualizada. `npm run verify` passou com 214 testes em 40 arquivos, build frontend e build servidor; chunk 3D conhecido de 956,43 KB (259,81 KB gzip). `git diff --check` passou. Graphify update foi tentado, mas a CLI não está instalada.
- Playtest visual pendente: a inicialização Colyseus retornou `EADDRINUSE` na porta 2567, embora a enumeração não tenha revelado listener ou processo que pudesse ser identificado e substituído; não foi aberta captura de jogo nesta rodada.
- Estado inicial do Git: manter fora desta tarefa `assets/blender/special-corners.blend` modificado e `assets/blender/special-corners.blend1` não rastreado.
- Próximo passo: repetir o playtest de carteira, proposta e estação quando a porta Colyseus estiver livre; publicar em `main` apenas os arquivos desta tarefa e preservar os arquivos Blender locais.

## Rótulos de aluguel, escolha da Copa e seletores DEV — implementação concluída (2026-10-30)

- Pedido atual: colocar os avisos de saldo abaixo dos cartões superiores e acima dos inferiores; consertar os seletores dos dados forçados; permitir sede da Copa apenas em imóvel próprio; exibir o aluguel em texto 3D voltado para a câmera.
- Implementação: posicionamento do pop-up usa o assento do jogador; o seletor DEV usa botões −/+ clicáveis e com suporte a toque, avançando em ciclo de 1 a 6; cliente e servidor limitam a Copa aos imóveis do jogador ativo e a fase é encerrada sem sede quando não há propriedades próprias; cada propriedade mostra aluguel atualizado, incluindo grupo completo, construções, hipoteca e faixa das estações, em texto billboard que acompanha a câmera.
- Testes e builds: `npm run verify` passou com 213 testes; builds do frontend e servidor passaram. O chunk 3D conhecido ficou em 956,43 KB (259,81 KB gzip). `git diff --check` passou após os ajustes.
- Graphify query/update foram tentados; a CLI `graphify` não está instalada. O playtest visual ficou pendente: a inicialização Colyseus retornou `EADDRINUSE` na porta 2567, sem processo/listener identificável pelas ferramentas de porta disponíveis. Nenhuma captura visual foi feita nesta rodada.
- Próximo passo concreto: revisar e publicar em `main` apenas os arquivos desta mudança, mantendo fora do commit os dois arquivos Blender locais preexistentes.

## Retorno de saldo, ferramenta DEV no lobby e aluguel de estações — concluído (2026-10-30)

- Pedido atual: animar ganhos/perdas junto aos cartões de todos os jogadores; exibir a configuração DEV no lobby antes do início e permitir ao anfitrião habilitar os dados forçados no Chrome; cobrar aluguel das estações com resultado de um dado × R$ 50.000; explicar de forma simples o posicionamento das casas para alguém familiarizado com Unity.
- Implementação: cada cartão recebe fila própria de pop-ups de saldo, verde para ganho e vermelho para perda, que some em 1,2 s. No lobby, apenas a anfitriã pode alternar as ferramentas DEV; o estado Colyseus fica visível para todas as pessoas e o servidor só aceita a rolagem forçada quando habilitada, pelo anfitrião, na fase válida e com dados de 1 a 6. Ao cair em estação alheia não hipotecada, o servidor rola um dado e cobra R$ 50.000 por ponto (R$ 50.000–300.000); a interface mostra a faixa.
- Documentação de regras e decisão atualizada. Foi preservada a regra da opção DEV somente como configuração consentida no lobby, sem mexer em regra geral do modo de jogo.
- `npm run verify`: 207 testes passaram; builds do frontend e servidor passaram. O aviso conhecido do chunk de cena 3D segue em 956,28 KB (259,73 KB gzip). `git diff --check` passou. Graphify update foi tentado, mas a CLI não está instalada.
- Playtest local no navegador: criei uma sala, habilitei Modo DEV no lobby, confirmei o estado “Ativado para esta partida”, adicionei um bot e iniciei; o painel DEV com seleção dos dois dados apareceu em jogo, com 1× selecionado. Os testes confirmam que só a anfitriã muda a opção no lobby e que o servidor aceita o dado forçado quando a sala está em modo DEV mesmo com `NODE_ENV=production`. Os logs do navegador não registraram erros.
- A rolagem de estação foi validada por teste de integração Colyseus: o pagamento ao dono fica entre R$ 50.000 e R$ 300.000, em múltiplos de R$ 50.000, e a mensagem mostra o resultado do dado. A animação do pop-up de saldo foi revisada no código e a classificação de ganhos/perdas tem teste unitário; não foi possível gerar uma mudança de saldo no playtest visual desta rodada.
- Próximo passo concreto: revisar o diff, publicar somente os arquivos relacionados em `main` e preservar os arquivos Blender já alterados no workspace.

## Correções de compra, prisão e origens 3D — concluído (2026-10-30)

- Pedido atual: restaurar os painéis de compra/construção quando há avisos na tela; adicionar fuga da prisão por duplas e pagamento de R$ 200.000; deixar inspeção disponível fora da vez; mostrar aluguel; inverter orientação dos textos; alinhar construções pela borda interna e normalizar origens dos modelos.
- Estado inicial: `main` sincronizada com `origin/main` no commit `9eb2bbc`; preservar alterações preexistentes em `assets/blender/special-corners.blend` e `.blend1`.
- Achados: `feedbackPending` suprime painéis de decisão essenciais; a prisão ainda rejeita os comandos de duplas/fiança; os offsets das construções são fixos embora as caixas dos modelos variem.
- Graphify query falhou porque o comando `graphify` não está instalado neste ambiente; continuar por leitura local e tentar atualização do grafo depois das mudanças.
- Implementação: painéis de compra/prisão/dívida e inspeção não somem atrás da fila de avisos; a câmera continua habilitada com painéis; a prisão oferece espera, tentativa autoritativa de duplas com movimento pela soma, ou pagamento de R$ 200.000 com rolagem na mesma vez. Compra e inspeção mostram claramente o aluguel por parada. Construções têm origem centralizada na base e deslocamento calculado pela profundidade real do modelo para alinhar a borda externa com a borda interna do piso; fichas, estádio, aeroporto e modelos de dinheiro também usam origem central/baseada no chão. Os rótulos foram girados em 180° em relação ao ajuste anterior.
- `npm run verify`: 200 testes, build do frontend e build do servidor passaram com loopback aprovado; aviso conhecido de chunk 3D (956,20 KB / 259,70 KB gzip) permanece. Graphify update não rodou: `graphify` não está instalado.
- Playtest local: criei partida Clássica com dois bots, confirmei 1× selecionado e modo DEV visível; forcei uma rolagem, comprei Jardim das Flores com uma casa e vi o aluguel/custo no painel e a atualização de saldo e propriedade. A rolagem do mouse alterou o zoom no navegador. Nenhum erro JavaScript foi registrado. O pagamento de prisão foi exercitado na integração Colyseus; toque/pinça em aparelho físico não foi testado.
- Próximo passo: publicar apenas os arquivos desta frente diretamente em `main`; preservar os arquivos Blender locais.

## Correções de casas e interações — concluído (2026-10-29)

- Pedido confirmado pelas capturas e pelo esclarecimento sobre a câmera externa: em todas as bordas, construções devem ficar apoiadas e alinhadas à borda interna com a fachada para fora; textos também devem apontar para fora. Completar ainda clique/toque global para dispensar cartas sem acionar o tabuleiro, posicionar o aeroporto no canto Volta ao Mundo, substituir a placa quadrada pela borda do canteiro na cor do dono, expor melhor o controle DEV e aumentar para 15 segundos as janelas de decisão.
- Estado inicial verificado em `main` no commit `89e0620`, alinhado com `origin/main`; alterações locais anteriores em `assets/blender/special-corners.blend` e `.blend1` devem ser preservadas fora do escopo.
- Graphify query foi tentada antes da busca de código; a CLI não está instalada e o Graphify MCP conectado indexa outro projeto.
- Implementação: construções seguem a borda interna com fachada para fora e apoio ajustado ao topo do piso; as rotações locais dos rótulos consideram a rotação composta do piso e apontam para fora nos quatro lados. Revelações dispensam clique/toque capturado na raiz sem propagar ação ao tabuleiro; o aeroporto é recentrado pela caixa de limites, apoiado na base e reduzido para caber no canto; a placa adicional sob o terreno foi removida e a borda de pedra recebe a cor do dono. O modo DEV está identificado e destacado; janelas de decisão e de revelação passaram a 15 segundos. A velocidade inicial permanece em 1×, a câmera fica livre durante movimento e inspeção continua acessível fora da vez.
- `npm run verify`: 194 testes em 38 arquivos passaram; builds frontend e servidor passaram. O aviso existente do chunk 3D permanece em 956,20 KB (259,70 KB gzip). `git diff --check` passou.
- Playtest local com anfitrião e dois bots: 1× apareceu selecionado ao iniciar; modo DEV e escolhas dos dados ficaram visíveis; uma compra real com uma casa foi concluída e a construção apareceu alinhada à borda interna. O painel de compra mostrou contagem inicial de 15 segundos. A rotação da câmera deixou os quatro lados visíveis para revisão da orientação externa. Interação de carta foi validada com teste de captura de pointer; toque em dispositivo físico não foi simulado.
- Graphify update não rodou porque a CLI não está instalada; o Graphify MCP conectado aponta para outro projeto. Blender MCP não estava conectado; o aeroporto foi ajustado em runtime e nenhum arquivo Blender foi incluído.
- Próximo passo: publicar somente os arquivos desta frente em `main`; preservar os arquivos Blender que já estavam modificados no workspace.

## Polimento da cena, interação de inspeção e controles de teste — implementação validada (2026-10-29)

- Pedido confirmado: alinhar casas na borda interna e orientá-las em altura, orientar rótulos para fora por lado do tabuleiro, reposicionar aeroporto, liberar câmera durante animação e inspeção fora da vez, polir a apresentação, adicionar modo DEV do anfitrião para dados forçados e mudar velocidade inicial para 1×.
- Estado inicial verificado: branch `main` no commit `40d4f56`, com `origin/main` alinhada; alterações preexistentes em `assets/blender/special-corners.blend` e arquivo `.blend1` permanecem fora do escopo.
- Graphify query tentou o repositório `AleFeroiz/BancoImobiliarioOnline`, mas o Graphify autorizado está indexando somente `GustavoGLD/Hospital`. A leitura da cena prossegue por busca local.
- Implementação: construções foram movidas para a borda interna e elevadas, rótulos recebem orientação por lado, aeroporto é recentrado e apoiado na superfície pelo renderer, paleta da mesa ganhou contraste, câmera segue ativa durante o movimento e inspeção de casas funciona fora da vez. A velocidade compartilhada inicial é 1×.
- Ferramenta DEV aparece somente para anfitrião no build local; o servidor revalida anfitrião, fase, jogador ativo, prisão e valores dos dados, e a recusa em produção foi exercitada em teste de servidor.
- `npm run verify` passou: 187 testes em 36 arquivos, build web e build do servidor. O aviso conhecido de chunk 3D permanece em 956,10 KB (259,64 KB gzip). `git diff --check` passou.
- Playtest local: forçar 3+4 exibiu total 7; 1× estava selecionado por padrão; ao clicar Praça Central durante o movimento do bot, o inspetor abriu e o peão continuou se movendo. Zoom e aro contrastante das fichas já estavam implementados e visíveis. Não houve simulação de pinça em hardware móvel.
- O Blender MCP não conectou; o lançador instalado não abriu nesta sessão. O aeroporto foi reposicionado em runtime sem alterar o asset Blender. `graphify update .` não poderá rodar porque a CLI continua ausente.
- Nota de trabalho: [polimento da cena e ferramentas DEV](trabalho/polimento-cena-e-dev.md).
- Próximo passo: revisar e publicar em `main`, sem incluir as alterações preexistentes dos arquivos Blender.

## Zoom da câmera e destaque das fichas — implementação validada (2026-10-29)

- Pedido confirmado: permitir zoom pela roda do mouse e gesto de pinça no celular; destacar visualmente as fichas dos participantes.
- Estado inicial: branch `main`; `assets/blender/special-corners.blend` está modificado e `assets/blender/special-corners.blend1` não rastreado, ambos fora do escopo e preservados. `git fetch origin` falhou com permissão negada ao abrir `.git/FETCH_HEAD`; a revisão local mostra `main...origin/main` sem commits divergentes.
- A cena usa React Three Fiber/Drei `OrbitControls`; zoom pela roda agora está ativo com limites relativos ao enquadramento responsivo, o mesmo controle atende gesto de pinça. `AnimatedPawn` aumenta levemente as peças e acrescenta aros de contraste no chão. A dica de controle foi atualizada; `DECISOES.md` e `PLANO.md` refletem o comportamento visual.
- `npm run verify` passou com 183 testes em 35 arquivos e builds frontend/servidor. Playtest em viewport 690×900 confirmou aproximação e retorno por scroll numa partida com três bots e decisão real de compra. Pinça não simulada por falta de emulação touch disponível; detalhes em [VALIDACAO.md](VALIDACAO.md).
- Graphify local não está instalado; Graphify MCP aponta para `GustavoGLD/Hospital`, não este repositório. Código localizado pela busca dos arquivos de câmera e cena.
- Nota de trabalho: [zoom da câmera e destaque das fichas](trabalho/zoom-e-destaque-fichas.md).
- Próximo passo: revisar e publicar a mudança em `main`; alterações locais de Blender não fazem parte deste escopo.

## Investigação de travamento no Chrome — correção concluída (2026-10-29)

- Pedido confirmado: reproduzir no Chrome os travamentos fortes da partida e corrigir a causa.
- Estado inicial verificado: árvore limpa em `main`, alinhada a `origin/main`; portas locais 5173 e 2567 estavam livres.
- Histórico relacionado: otimizações anteriores já usam React Three Fiber com renderização sob demanda, teto de DPR, materiais sem luzes/sombras e texturas de rótulos menores; as medições anteriores foram no navegador integrado e não confirmaram o Chrome do usuário.
- Reprodução controlada em Chrome 156, GTX 970, 1365×900 e DPR 1: a revisão `07646a4` ficou em ~97 FPS; `2def5f6` e a versão atual travavam a ~7 FPS durante arrasto. `2def5f6` introduziu os efeitos CSS responsáveis. Em cópia temporária, retirar apenas o overlay grande não recuperou o desempenho; simplificar os efeitos CSS dos símbolos de dinheiro recuperou ~99 FPS. A roleta não alterou a medição.
- Correção: remover `filter`, perspectiva, transformações 3D, recortes `clip-path` e sombra CSS dos símbolos de dinheiro; gradientes, bordas e camadas simples mantêm a leitura visual. Teste de regressão impede reintroduzir essas propriedades nos seletores `.cash-*`.
- Validação final na versão corrigida em partida local com bot: Chrome 156, 1365×900/DPR 1, arrasto real da câmera por 2,5 s, 74,8 FPS (monitor de 75 Hz), mediana de 13,3 ms e zero quadros acima de 50 ms. Captura temporária em `%TEMP%\banco-chrome-fixed-main.png`.
- `npm run verify` passou: 181 testes em 34 arquivos, build web e build do servidor. O aviso conhecido de tamanho do chunk GLTF permanece em 956,10 KB (259,64 KB gzip); `git diff --check` passou.
- `graphify update .` foi tentado e falhou porque a CLI não está instalada; o MCP Graphify da sessão aponta para outro repositório.
- Publicado em `main` pelo hook normal: `dec234f` (`Fix Chrome lag from cash HUD CSS effects`); `origin/main` confirmado no mesmo commit.
- Próximo passo: acompanhar próximos playtests; se outro hardware ainda apresentar quadros longos, repetir a medição de arrasto nesse Chrome e comparar a GPU usada.

## Remoção de luzes e sombras 3D — validação local concluída (2026-10-29)

- Pedido confirmado: eliminar toda iluminação e sombra da cena e destacar destinos elegíveis pela diferença dos materiais, sem placas/sombras sobrepostas. Destinos indisponíveis devem ficar 80% menos contrastados/mais apagados em pisos, modelos, detalhes e rótulos; destinos válidos preservam ou elevam as cores originais.
- A árvore estava limpa em `main`, em `90c968a`. A primeira tentativa de `git fetch origin` foi negada ao escrever `.git/FETCH_HEAD`; a repetição autorizada concluiu, sem commits novos nem divergência em relação a `origin/main`.
- Auditoria da implementação: o tabuleiro tinha luz ambiente e direcional, HUD 3D do dinheiro tinha mais duas luzes, e Drei `ContactShadows` adicionava a única sombra. Materiais standard/Lambert e os materiais dos GLBs dependiam das luzes.
- Implementação: remover as quatro luzes e a sombra de contato dos dois canvases; converter materiais próprios e GLBs para `MeshBasicMaterial`; remover a placa escura sobre cada casa inválida; alterar a cor dos materiais de toda a casa e das construções durante seleção e restaurar após sair dela. Os testes cobrem conversão unlit, redução de contraste em 80% e restauração.
- `npm run verify` passou: 180 testes em 33 arquivos, builds frontend e servidor. O aviso de chunk GLTF continua em 956,03 KB (259,61 KB gzip). `git diff --check` passou.
- Playtest local em partida Clássica com três bots: tabuleiro, cores, cartões e dinheiro ficaram visíveis após retirar as luzes; o arraste girou a câmera. A leitura do medidor durante o arraste do CUA variou a 7 FPS/141,7 ms, mas a injeção de ponteiro do navegador integrado não representa uma medição confiável do Chrome/hardware real. A automação do Chrome standalone foi bloqueada por não conseguir confirmar com segurança a URL da janela. O estado visual real de escolha de destino não foi alcançado manualmente; contraste/restauração ficam cobertos pelos testes unitários.
- Graphify não está conectado a este repositório; a CLI não está instalada.
- Nota: [cena sem luzes, sombras e realce por contraste](trabalho/cena-sem-luzes-sombras.md).
- Próximo passo: revisar as alterações e publicar em `main` com hook ativo.

## Correção do desempenho baixo — implementação validada localmente (2026-10-29)

- Relato confirmado: após publicar o medidor, o usuário observou demora até a leitura e cerca de 2 FPS ao testar a partida.
- Estado inicial: `main` em `866b8b9`, após a função do medidor. A cena usava sombras direcionais dinâmicas, quatro malhas de acabamento por casa, hit-testing em todos os meshes da cena e rótulos de 768×384. O Canvas adicional do dinheiro é sob demanda e não invalida a cena principal durante o arraste; portanto, não há evidência de que as peças de dinheiro sejam a origem principal.
- Implementação: desligar o passe de sombras direcionais dinâmicas, consolidar a moldura de cada casa numa malha, deixar o piso como única superfície raycastável e reduzir texturas de rótulo. O medidor exibe a primeira amostra após dois frames e sinaliza repouso mesmo sem janela completa.
- Validação local: em uma partida Clássica com três bots no navegador integrado, arrastei a câmera. O medidor mostrou 77 FPS/13,0 ms e depois 75 FPS/13,3 ms; observei o tabuleiro, os rótulos, casas Sorte e HUD após o giro. `npm run verify` passou com 176 testes em 32 arquivos e builds web/servidor.
- Chrome standalone segue sem revisão visual: a sessão disponibilizada ao CUA não lista conexão de navegador Chrome controlável; o teste local foi feito no navegador integrado. `graphify update .` falhou porque a CLI não está instalada e o MCP Graphify disponível aponta para outro repositório.
- Nota de trabalho: [otimização para desempenho baixo](trabalho/otimizacao-2fps.md).
- Próximo passo: publicar a correção em `main`; pedir ao usuário para comparar o FPS no mesmo Chrome/hardware, porque esse navegador não está conectado à automação desta sessão.

## Medidor de FPS — implementação concluída; Chrome pendente (2026-10-29)

- Pedido confirmado: adicionar um medidor opcional de FPS na partida e testar o jogo no Chrome, inclusive movimentando a câmera para observar o desempenho.
- Estado inicial verificado: `main` limpa e alinhada a `origin/main` no commit `c44db1f`. A cena R3F usa `frameloop="demand"`, então a medição deve contar callbacks de render da própria cena e sinalizar repouso, sem ativar um loop contínuo.
- Implementação: botão FPS desligado por padrão na barra inferior; leitura de FPS e milissegundos por quadro montada apenas quando habilitada; probe R3F condicional, indicação de ociosidade e nova janela de amostra ao retomar renderização.
- Validação: `npm run verify` passou com 175 testes em 32 arquivos e builds web/servidor. Playtest Chrome não realizado: a automação bloqueou a seleção da janela quando não conseguiu determinar com confiança a URL atual, e encerrou o controle do computador.
- Graphify: `graphify update .` falhou porque a CLI não está instalada; o MCP disponível continua apontando para outro repositório.
- Nota de trabalho: [medidor de FPS e playtest no Chrome](trabalho/medidor-fps.md).
- Próximo passo: retomar a validação visual no Chrome quando uma sessão Chrome controlável e com URL verificável estiver disponível; ativar o FPS e arrastar a câmera durante a partida.

## Frente em andamento — publicação automática no Render (2026-10-29)

- O serviço gratuito está conectado ao GitHub (`main`) e a tela atual mostra `Auto-Deploy: On Commit`, mas os deploys permanecem manuais. O commit de teste `03ef597` não apareceu no histórico do Render.
- Foi preparado um passo no workflow do GitHub Actions para chamar o Deploy Hook depois de `npm run verify`; ele só será ativado quando o segredo `RENDER_DEPLOY_HOOK_URL` for configurado no repositório.
- Configuração externa única ainda necessária: adicionar o segredo pelo painel do GitHub, desligar o auto-deploy nativo no Render para evitar duplicidade e executar `workflow_dispatch` em `main` uma vez.
- Detalhes e passos: [deploy automático do Render](trabalho/render-auto-deploy.md).
- Próximo passo: após a configuração externa, confirmar no GitHub Actions que o hook foi aceito e no Render que `03ef597` (ou o HEAD atual) virou deploy; então validar que um push posterior aciona o workflow automaticamente.

## Frente concluída — otimização de renderização (2026-10-29)

- Pedido confirmado: analisar o projeto por completo, remover gargalos de travamento e validar em partida real; após a otimização, permitir girar a câmera ao arrastar/tocar em qualquer área sem controle interativo, inclusive no celular.
- Estado inicial: `main` limpa e alinhada a `origin/main`. A cena React Three Fiber mantinha uma sombra de contato renderizando a cena e desfocando o mapa em todos os frames; ambas as cenas WebGL tinham loop contínuo, e o relógio remoto recriava snapshots de jogadores, imóveis e dados a cada atualização.
- Auditoria: a implementação instalada de Drei deixava `ContactShadows` em `frames=Infinity`, fazendo uma captura de profundidade e quatro passagens de desfoque por frame. Os dois canvases WebGL e os peões em repouso também renderizavam sem parar. Ticks de sala substituíam dados de jogadores, propriedades e dados sem mudança visual; o módulo estático de símbolos de dinheiro incluía o Three.js no pacote inicial. Cada um dos 40 rótulos ocupava 1024×512.
- Implementação: sombra de contato em captura única de 256 px, sombras direcionais de 512 px, tetos DPR 1,25, canvases sob demanda com retomada explícita em animações, peões estáticos em repouso, cena memorizada por valores visuais, snapshots estáveis, HUD de dinheiro sob demanda e carregado só na partida, e rótulos 768×384 com anisotropia 4. O arraste por mouse/toque gira a câmera também em áreas sem controle interativo; botões e janelas ficam excluídos.
- Validação: `npm run verify` passou com 171 testes em 31 arquivos e builds web/servidor. O pacote inicial caiu de 1.419,60 KB (405,36 KB gzip) antes da separação do HUD para 458,01 KB (143,60 KB gzip), redução de 67,7% em bytes e 64,6% gzip. Em partida Clássica com três bots, observei dados, movimento do peão, chegada e carta Sorte em viewport 690×880; arraste sobre cartão sem ação girou a câmera e o botão de compra respondeu. A navegação via pointer events inclui toque, mas aparelho físico/viewport de 390 px não estava disponível para revisão manual.
- Graphify: o MCP continuou apontando para `GustavoGLD/Hospital` e `graphify update .` falhou porque a CLI não está instalada. O build mantém um aviso conhecido: o chunk GLTF, carregado somente ao abrir a partida, tem 955,19 KB (259,21 KB gzip).
- Nota de trabalho: [otimização de renderização](trabalho/otimizacao-renderizacao.md).
- Próximo passo: acompanhar desempenho e legibilidade em aparelhos móveis modestos; escolher e validar uma hospedagem Node para o multiplayer antes de lançamento.

## Estado observado — 2026-10-28

- A base do produto está implementada: React + TypeScript + Vite, cena React Three Fiber, regras desacopladas e servidor autoritativo Colyseus, conforme `README.md` e `docs/PLANO.md`.
- As fases de salas online e ciclo de partida estão implementadas. A fase de economia/interação e a fase de acabamento seguem em andamento; confira `docs/PLANO.md` antes de iniciar trabalho nelas.
- Os valores iniciais da economia e dos objetivos Express ainda dependem de playtests com pessoas. A escolha do provedor Node para o servidor também continua pendente.
- A negociação de títulos ainda tem propostas abertas em `docs/DECISOES.md`; não as trate como comportamento aprovado sem nova decisão.
- Evidências de automação, simulação e revisão visual estão em `docs/VALIDACAO.md`. Elas descrevem estados específicos e não substituem uma conferência do código e do ambiente atuais.

## Frente concluída — HUD, dados, cartas e roleta em piso integral (2026-10-29)

- Nota de trabalho: [HUD, dados, cartas e roleta](trabalho/hud-cartas-dados-roleta.md).
- Pedido confirmado: fazer os quatro pisos de Sorte virarem roletas completas; trocar o cartão genérico de rolagem por um botão simples; animar e manter os dados nivelados com resultado acima enquanto o peão anda; mostrar cartas em cartão temporário que fecha com clique ou após 10 segundos; reduzir seletores e painéis excessivos; reposicionar o dinheiro 3D para a interface, associado aos cartões dos participantes.
- Estado inicial verificado: `main` limpa/alinhada a `origin/main` no commit `07646a4`. A roleta atual é pequena e fica sobre piso liso; a UI de rolagem usa o cartão central; os modelos de dinheiro estão em vitrines no centro do tabuleiro, não junto aos cartões dos jogadores.
- Implementação: os quatro pisos Sorte usam oito setores radiais que cobrem toda a área quadrada. A rolagem tem o botão compacto “Girar dados”; os dados terminam nivelados, mostram o total durante o movimento e desaparecem ao concluir. Cartas de evento e avisos de Copa/Volta aceitam clique/toque para fechar e expiram em 10 segundos. Negociação usa botões para o parceiro e para imóveis múltiplos; o ritmo usa opções segmentadas. Barras, moedas e notas acompanham o saldo em uma camada 3D transparente e ícones legíveis acima dos cartões desktop ou dentro deles no celular.
- Validação automatizada: `npm run verify` passou com 165 testes em 29 arquivos, builds web e de servidor. `git diff --check` passou. O build ainda registra o aviso conhecido do bundle 3D acima de 500 kB.
- Playtest Game Studio: partida local real com três bots, botão de rolagem e dados/resultados no tabuleiro; saldo e dinheiro visíveis junto aos quatro jogadores. Revisei viewport 690×880 e viewport móvel 390×844; o tabuleiro, os quatro cartões e “Girar dados” permaneceram acessíveis. Ao concluir o movimento, os dados sumiram. Não alcancei uma carta Sorte ou a escolha de Copa/Volta nesta partida, então esse estado permanece coberto pela implementação e pendente de revisão visual específica.
- Graphify: `graphify update .` não foi possível porque o executável CLI não está instalado; o servidor MCP da sessão apontava apenas para outro repositório. As fontes alteradas foram conferidas diretamente e a suíte completa passou.
- Próximo passo: revisar uma revelação de carta e uma escolha Copa/Volta em partida real; acompanhar contraste e escala dos modelos 3D nos saldos intermediários.

## Frente concluída — câmera por arraste e decisões visuais no tabuleiro (2026-10-29)

- Nota de trabalho: [câmera por arraste e escolhas visuais](trabalho/camera-escolhas-visuais.md).
- Pedido confirmado: substituir os dois sliders por órbita com mouse/toque, usar clique direto nas casas válidas para Copa/Volta, compactar as quatro opções de compra com custo/aluguel, mostrar o leilão no inspetor do imóvel e criar estádio e aeroporto/avião originais.
- Estado inicial verificado: `main` limpa/alinhada a `origin/main` no commit `479d069`. Graphify desta sessão lista apenas `GustavoGLD/Hospital`, então a navegação foi feita pelos arquivos do projeto. Blender MCP reconectado e validado em 5.2.2 LTS.
- Implementação concluída: órbita por mouse/toque, seleção direta de destinos, quatro pacotes de compra com custo/aluguel, leilão contextual e modelos 3D dos cantos. A validação desktop observou a câmera e uma compra real; testes/build passaram. Os limites de revisão manual estão registrados em `docs/VALIDACAO.md`.
- Próximo passo: revisar no navegador móvel os cards e a órbita; conferir estádio e aeroporto dentro das casas especiais em uma partida. Graphify desta sessão continua apontando para outro repositório.

## Frente atual — fichas de veículo no lobby (2026-10-29)

- Nota de trabalho: [seletor de fichas de personagem](trabalho/seletor-fichas-personagem.md).
- Pedido confirmado: criar modelos low-poly originais de carro, moto e avião e permitir escolher entre esses modelos e o peão no lobby; a alteração é visual e preserva as regras e a cor do dono.
- Estado inicial verificado: `main` estava limpa e alinhada a `origin/main` no commit `65ec727`; Blender 5.2.2 LTS está conectado com o add-on MCP atualizado. A sincronização do lobby e o ponto de renderização das peças foram localizados.
- Implementação concluída: modelos e seletor sincronizado; testes/build passaram. Blender conferiu o GLB final; a tentativa de Chrome foi bloqueada pela política da ferramenta CUA ao não conseguir determinar com confiança a URL da janela ativa no Windows. A evidência e o limite estão em `docs/VALIDACAO.md`.
- Próximo passo: revisar visualmente peão/carrinho/moto/avião e a cor de cada dono em Chrome ou navegador interno assim que a inspeção do navegador voltar a estar disponível.

## Frente concluída — bairros em sequência e identidade visual da Sorte (2026-10-29)

- Nota de retomada: [bairros em sequência e tema da Sorte](trabalho/bairros-sequencia-sorte.md).
- Pedido confirmado: reunir as três propriedades de cada grupo em sequência no percurso; preservar o bônus de aluguel por grupo completo; transformar o piso dos espaços “Sorte ou Revés” e dar a eles uma roleta claramente reconhecível.
- Implementação: oito grupos residenciais agora ocupam blocos contíguos de três casas, dois por lado. Os quatro pisos de Sorte usam tema dourado e uma roleta low-poly autoral; a mecânica existente de bônus de aluguel foi preservada.
- Validação automatizada: `npm run verify` passou com 145 testes em 22 arquivos, build web e build do servidor. `git diff --check` passou. O build mantém o aviso conhecido do chunk 3D acima de 500 kB.
- Revisão visual: concluída em Chrome 156 headless, com perfil temporário e conexão DevTools limitada a loopback, porque o navegador integrado está desativado. Uma sala real com três bots avançou até o turno 9; observei uma animação de bot com “Girando os dados” seguida por “Movendo o peão”, um balão por vez. Em 1280×900 e 390×844 o documento não teve overflow horizontal; o tabuleiro inteiro e as roletas ficaram visíveis. Capturas temporárias: `.tmp/browser-test-desktop.png` e `.tmp/browser-test-mobile.png`.
- Limite: esta sessão não revisou Chrome visível, Firefox nem aparelho físico. A próxima revisão pode usar o navegador integrado quando voltar a estar habilitado.

## Frente atual — velocidade de animação e observação de turnos (2026-10-29)

- Pedido confirmado: deixar o ritmo atual como 0,5×, oferecer 1× e 2× com controle exclusivo da anfitriã, mostrar os dados sem sobreposição e substituir o cartão central nos turnos alheios por um balão de atividade sobre o peão.
- Implementação em curso: velocidade sincronizada pelo servidor, escala de duração comum ao servidor e à cena e rótulo de atividade no token do participante ativo.
- Próximo passo: validar permissão de anfitrião, mudanças de velocidade e estados de rolagem/movimento/compra; conferir a cena no navegador desktop e móvel; rodar a suíte completa e publicar diretamente em `main`.

## Frente atual — sons de dinheiro, ajuda e prazo de turno (2026-10-28)

- Pedido confirmado: sons distintos para dinheiro entrando e saindo; corrigir o botão “?”; 20 segundos para rolar e 10 segundos por decisão antes da ação automática prevista.
- Implementação: sons sintetizados ascendentes/descendentes ligados a mudanças no saldo local; guia rápido com fechamento por botão, clique fora e Esc; timer sincronizado pelo servidor com rolagem automática, recusa automática de compra, confirmação automática da resolução, tentativa de duplas na prisão e passos sucessivos de liquidação na dívida.
- Documentação atualizada em `docs/DECISOES.md`, `docs/REGRAS-DE-JOGO.md` e `docs/PLANO.md`.
- Validação automatizada passou nesta sessão: 134 testes em 21 arquivos, build web e build do servidor. `git diff --check` passou. O playtest visual continua pendente: a porta Colyseus 2567 alternou entre ocupada e livre durante as tentativas, sem processo persistente identificável.
- Próximo passo: abrir uma sala local para revisar a ajuda, sons e contagem do turno; depois publicar apenas o escopo desta frente, sem incluir alterações anteriores não relacionadas.

## Frente concluída — sequência de animações, diálogos e compra de construções (2026-10-28)

- Nota de retomada: [sequência de jogada, janelas centrais e casas](trabalho/sequencia-jogada-janelas-construcao.md).
- Pedido confirmado: animações devem ser lentas e sequenciais para pessoas e bots; dados ficam visíveis no centro somente enquanto rolam; janelas e tooltips ficam centralizados; compra pode incluir até três casas e hotel exige uma nova visita com três casas prontas.
- Implementação: o servidor segura a vez durante rolagem e movimento, serializa os bots e publica resolução só após o movimento; UI centraliza as janelas, oculta dados fora da rolagem, mostra opções de 0–3 casas na compra e libera hotel apenas em visita posterior. A câmera subiu para mostrar melhor a mesa; após novo pedido de ritmo, rolagem foi ampliada para 2,8 s e cada casa para 0,75 s.
- Validação automatizada: `npm run verify` passou com 135 testes em 21 arquivos, build web e build do servidor. `git diff --check` passou. Permanece o aviso conhecido de chunk `BoardScene` acima de 500 kB.
- Playtest de navegador: partida Colyseus real com três bots observada em 1280 × 720; as fases exibiram uma ação por vez (rolagem, movimento e resolução), e janelas ficaram centralizadas. A partida foi redimensionada para 390 × 844, sem overflow horizontal; revisão visual em viewport móvel física e Firefox não foi feita.
- Publicação: commit `c941eba` foi enviado para `origin/main`; `git fetch origin` confirmou o mesmo hash em `HEAD` e `origin/main`.
- Próximo passo: acompanhar playtests para ajustar o ritmo e revisar o enquadramento em aparelhos móveis reais.

## Frente concluída — dinheiro 3D e saldos (2026-10-28)

- Nota de retomada: [dinheiro 3D e representação de saldo](trabalho/dinheiro-3d-saldos.md).
- Dinheiro em cena tem três denominações (notas, prata e ouro) calculadas a partir do saldo do jogador. Casas e hotel usam modelos Blender e peças coloridas conforme o dono.
- Validação automatizada de 135 testes e builds passou. A partida real no navegador confirmou os quatro saldos e carregou a mesa; a conferência visual detalhada das denominações no tabuleiro segue pendente por causa da escala e do painel central.
- Publicação confirmada em `main`/`origin/main`: a implementação está em `c941eba` e a documentação de animações em `da7fead`.
- Próximo passo: em uma revisão visual de saldo dedicada, conferir notas, prata e ouro com valores diferentes e inspecionar casas/hotel já construídos.

## Rotina do PC de casa — 2026-10-28

- Procedimento operacional: [README — Rotina no PC de casa](../README.md#rotina-no-pc-de-casa). Registra sincronização segura pela `main`, inicialização de Colyseus e Vite em dois terminais, URL local do navegador, uso do Blender/MCP, verificação, commit, push e conferência da sincronização com GitHub.
- Estado observado nesta sessão: `main` estava alinhada com `origin/main` e sem divergência remota antes das edições; `package.json` confirma os comandos `npm run dev:server`, `npm run dev -- --host 127.0.0.1` e `npm run verify`.
- Blender conectado: 5.2.2 LTS. O MCP respondeu, mas reportou protocolo do add-on 14 frente ao 15 esperado; o README agora registra o comando de atualização, reinício/reativação e a confirmação `up_to_date: true` que deve preceder nova modelagem.
- Diagnóstico de verificação Windows/Codex reproduzido nesta sessão: a primeira tentativa falhou ao renomear arquivos no TEMP do sandbox (`EPERM`); com `TEMP`/`TMP` em `.tmp` do repositório, os 79 testes sem servidor passaram, mas a suíte Colyseus recebeu `fetch failed` por bloqueio de loopback. Os passos para distinguir e repetir com loopback permitido foram incluídos no README e em `AGENTS.md`.
- Validação final: com `TEMP`/`TMP` em `.tmp` do repositório e acesso de loopback, `npm run verify` passou: 119 testes, build web e build do servidor. `git diff --check` passou; a compilação ainda exibe o aviso conhecido do chunk `BoardScene` de 974,19 kB.
- Publicação: esta mudança documental segue o fluxo direto em `main` descrito no README. No PC de casa, atualizar o add-on Blender antes de voltar a usar o MCP.

## Frente concluída — modelos low-poly e pisos (2026-10-28)

- Nota de retomada: [modelos low-poly e pisos diferenciados](trabalho/modelos-lowpoly-e-pisos.md).
- Pedido confirmado: cinco variantes para terrenos/construções, peças recoloridas pela cor do dono, piso residencial inteiro na cor do grupo e pisos próprios para casas especiais.
- Blender 5.2.2 LTS foi aberto e usado; as cinco variantes já foram exportadas e integradas. A primeira geometria foi corrigida após a prévia detectar o eixo vertical errado.
- A revisão visual no navegador confirmou uma sala Clássica com três bots, compra de Jardins do Norte por R$ 280.000 e saldo de R$ 1.220.000. Os pisos diferenciados apareceram no tabuleiro. A vista disponível era 877 × 877; estados com construções e viewports móvel/Firefox ainda aguardam inspeção.
- A correção de coordenadas, o isolamento de loopback, as portas duplicadas e o índice de texto CUA foram registrados neste documento e no fluxo permanente de `AGENTS.md`.
- `npm run verify` passou: 119 testes em 20 arquivos, build web e build do servidor. Três testes cobrem a cor integral dos grupos residenciais e as categorias especiais. O build mantém o aviso do chunk de cena de 974,19 kB acima de 500 kB.
- Publicação confirmada: commit `95f447c` está em `origin/main`; `git status` confirmou a branch sincronizada.
- Próximo passo: revisar construções em jogo e a vista móvel/Firefox para completar a validação visual.

## Frente concluída — sequência visual, economia e câmera (2026-10-28)

- Nota de retomada: [sequência visual, economia e câmera](trabalho/sequencia-visual-economia-camera.md).
- Pedido do usuário: tocar dados, depois movimento do peão, depois mostrar ações de chegada; limitar leilão ao turno de quem vende, deixar hipoteca apenas para resolver dívida sem saldo suficiente; elevar a câmera para aproximar a leitura da referência visual enviada.
- Regra anterior conferida em `docs/DECISOES.md`: leilão podia começar fora da vez; hipoteca valia durante a vez e dívida. A decisão atual foi incorporada em `docs/DECISOES.md`, `docs/REGRAS-DE-JOGO.md`, `docs/PLANO.md` e `README.md`.
- Branch atual: `main`, sincronizada com `origin/main`. `git fetch origin` confirmou o estado remoto e `git push origin main` publicou a frente até `88d1e23`.
- Implementação: o servidor restringe leilões ao turno da pessoa vendedora e hipotecas/demolição durante dívida ao saldo insuficiente; a cena e o cartão de turno sequenciam dados, caminhada do peão e ação contextual; a câmera passou a olhar de cima tanto no desktop como no celular.
- Validação: `npm run verify` passou (116 testes, build web e build do servidor). Uma partida local real foi revisada no Chrome headless em 1440 × 900 e 390 × 844: três jogadas confirmaram dados → caminhada → ação de chegada; o diálogo de compra apareceu depois de o peão parar. O tabuleiro inteiro coube nos dois tamanhos sem overflow horizontal. `git diff --check` passou. O build mantém o aviso conhecido do chunk de cena 3D acima de 500 kB.
- Próximo passo: iniciar novas mudanças diretamente em `main`, validar, commitar e publicar com `git push origin main`; esta frente está concluída e sincronizada.

## Frente concluída — velocidade e observação de jogadas (2026-10-29)

- O anfitrião controla a velocidade compartilhada da animação em 0,5×, 1× ou 2×. 0,5× permanece o padrão; novas velocidades valem na próxima animação, preservando a duração sincronizada de uma sequência em andamento.
- Durante a rolagem, os dados 3D aparecem sem cartão central cobrindo a mesa. Durante o turno de outro participante, os cartões de ação não abrem para o anfitrião observador; um balão junto ao peão indica rolagem, movimento e decisões.
- `npm run verify` passou: 143 testes em 22 arquivos, build web e build do servidor. O build web mantém o aviso conhecido do chunk 3D acima de 500 kB.
- No navegador local, uma partida Clássica com três bots confirmou o seletor do anfitrião (alterado de 0,5× para 2×), dados visíveis no centro durante a rolagem, ausência do cartão central no turno do Bot 1 e balão “Movendo o peão” junto à peça. A sessão observou também o movimento e o resultado da jogada humana antes de avançar ao turno do bot.
- Após a captura, ampliei a escala do balão porque a leitura estava pequena nessa viewport. A revisão visual dessa melhoria ficou pendente: a sessão CUA seguinte informou `Local browser use is disabled in Work settings`; o primeiro playtest permanece válido para a estrutura da tela, não para o novo tamanho.
- `git diff --check` passou; `main` e `origin/main` estavam alinhadas antes da integração. Depois da publicação, futuras frentes continuam diretamente em `main`.

## Frente concluída — cantos do tabuleiro e giro horizontal (2026-10-29)

- Cantos 2–4: Prisão por três turnos completos, Copa do Mundo escolhida pela pessoa da vez (aluguel 3×) e Volta ao Mundo com teletransporte para imóvel próprio, livre ou casa especial. O servidor valida as escolhas e as resolve na ordem do turno.
- A câmera mantém o slider vertical de 0° a 75° e recebeu um slider horizontal de 0° a 359°. A geometria do enquadramento ajusta os quatro cantos para cada orientação; testes cobrem as posições extremas em desktop, tablet e celular.
- `npm run verify` passou: 153 testes em 25 arquivos, build web e build do servidor. `git diff --check` passou. Revisão manual no navegador integrado em 1280 × 720 cobriu inclinações 0°/16°/75° e giros 0°/45°/90°; os cantos permaneceram visíveis.
- `graphify update .` foi tentado após a mudança, mas o executável `graphify` não está instalado nesta sessão. Os artefatos locais em `graphify-out/` e `.codex/` ficaram fora do commit.

## Retomada

1. Verifique branch, `git status`, upstream e alterações recebidas antes de editar.
2. Leia as instruções e a fonte de verdade aplicável; use `docs/PLANO.md` para escolher ou confirmar a frente de produto.
3. Para trabalho substancial que atravessar sessões, mantenha uma nota própria em `docs/trabalho/` e adicione seu link aqui. Registre só estado verificado, decisões, evidências e a próxima ação.
4. Ao concluir, atualize a nota da frente e este retrato se o estado do projeto tiver mudado materialmente; siga o fluxo de validação e integração definido em `AGENTS.md`.

## Registro inicial da memória de trabalho

- **2026-10-28 — Integração AleDevMemory:** documentação existente mantida como fonte de verdade; este arquivo passa a ser o índice conciso de andamento; `AGENTS.md` define como manter e sincronizar contexto durável. Após instalar dependências com `npm ci --no-audit --no-fund`, `npm run verify` passou: 17 arquivos e 103 testes, build web e build do servidor. A execução precisou apontar `TEMP`/`TMP` para dentro do workspace e permitir acesso de rede local aos testes Colyseus; o build emitiu apenas o aviso já esperado de chunk acima de 500 kB. `git diff --check` passou. Próximo passo: atualizar este arquivo em futuras frentes substanciais e criar notas específicas apenas quando ajudarem a retomada.
## Graphify local — CLI e consulta por checkout (2026-10-31)

- Pedido: tornar o Graphify utilizável neste projeto e evitar que consultas usem outro repositório.
- Estado inicial verificado: `graphify-out/graph.json` e `GRAPH_REPORT.md` são versionados, mas o grafo estava no commit `ea4568e`, atrás do `HEAD`; o executável global não estava disponível no PATH. O Graphify MCP consultável nesta sessão apontava para outro projeto.
- Implementação: CLI oficial `graphifyy==0.9.97` instalada localmente sob `.tools/graphify/` (ignorada pelo Git); adicionado o wrapper `npm run graphify -- ...`, que fixa o diretório raiz deste checkout; instruções em `AGENTS.md` agora exigem o wrapper e conferência de caminhos/atualidade.
- Validação: `npm run graphify -- query ...` respondeu sobre regras, aluguel e módulos deste jogo, inclusive chamado com `npm --prefix` a partir de fora da pasta do projeto; `npm run graphify -- update .` concluiu com 868 nós, 1.624 relações e 70 comunidades. Com loopback permitido, `npm run verify` ainda encontrou 11 testes falhando na árvore de trabalho em andamento; `npm run build` passou e `npm run build:server` apontou imports de `EXPRESS_PHASE_SECONDS` e `EXPRESS_ROUNDS` sem export correspondente em `shared/game.ts`.
- Próximo passo: revisar/publicar apenas esta configuração depois de a suíte e o build do servidor passarem; preservar o trabalho local preexistente.
