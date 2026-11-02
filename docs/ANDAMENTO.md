# Escala maior no lobby — concluído (2026-11-02)

- Pedido: ampliar os controles e textos do lobby, mantendo todos os dados visíveis sem rolagem.
- Implementado: aumentei tipografia, alturas de botões, fichas, avatares, espaçamento e respiro do cartão. As regras mobile continuam em duas colunas e foram ampliadas com medidas próprias para caber em 390×844, inclusive com seis participantes.
- Revisão visual local: desktop 1280×720 e celular 390×844 com seis lugares ocupados; todo o lobby coube na tela, sem barra de rolagem.
- `npm run verify` passou: 62 arquivos de teste, 336 testes, builds Vite e servidor. Permanece o aviso conhecido de chunk 3D acima de 500 kB. Graphify atualizado para 1.161 nós, 2.194 arestas e 80 comunidades.
- Próximo passo: conferir a legibilidade final em celulares físicos.

# Falha ao recuperar a conexão e rotação de fichas — concluído (2026-11-02)

- Pedido: resolver quedas frequentes em que as tentativas Colyseus não recuperam a sala; desfazer a correção anterior dos tokens e aplicar os 180° no eixo correto para não deixar os modelos de barriga para cima.
- Estado inicial: `main` está em `0c8d4a3`, alinhada com `origin/main`. As alterações locais em `assets/blender/special-corners.blend` e `.blend1` continuam fora do escopo.
- Descobertas: o SDK instalado encerra a reconexão automática após 15 tentativas e o cliente atual volta à home no `onLeave`, sem tentar recuperar pelo token ou pelo código/nome. O GLB usa raízes com rotação X=90°; a rotação Euler Y anterior foi composta no referencial local inclinado e tombou os modelos. A primeira tentativa local em Z também não correspondeu ao eixo vertical real, como mostrou a revisão do usuário. Blender 5.2.2 LTS/add-on 1.8 conectados; os nós temporários do GLB foram removidos e a cena aberta foi restaurada sem salvar.
- Implementado: o cliente continua tentando por até 60 tentativas automáticas e, se esgotadas, tenta o token de sessão e depois a cadeira pelo código/nome. Só retorna à home se ambas as rotas falharem; mostra uma mensagem para tentar entrar novamente com a mesma identidade. A correção visual agora gira 180° pelo eixo Y global da cena, preservando a postura vertical e invertendo o avanço.
- Regressões: 4 testes novos para configuração e fallback da reconexão; 14 casos geométricos verificam a inversão no eixo Y global nas nove fichas e preservam as outras cinco. Suíte Colyseus preexistente cobre token e reentrada por identidade.
- Validação: `npm run verify` passou após o ajuste final (62 arquivos, 336 testes, builds web e servidor; aviso conhecido de chunk 3D acima de 500 kB). Playtest local: Salto selecionado, partida iniciada, ficha movida até Belém e câmera inclinada para revisar a direção; porta 2567 sem listener identificável, alternativa 2569 usada. `git diff --check` passou.
- Limite: não forcei uma desconexão ao vivo no navegador. As rotas de recuperação são cobertas por testes; viewport mobile não foi revisado nesta tarefa.

# Câmera orbital e orientação dos tokens — concluído (2026-11-02)

- Pedido: adicionar um botão acima das configurações que alterna entre órbita do tabuleiro e órbita do personagem local, sem mudar mecânicas; corrigir a orientação dos tokens Salto, Trem, Cofrinho, Navio, Patinho, Cachorro, Gato, Vaca e Pinguim, que avançam de ré.
- Estado inicial verificado: branch `main` alinhada com `origin/main` em `a428015`; há alterações locais preexistentes em `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1`, fora do escopo e a preservar.
- Implementado: botão local acima de Config alterna entre a órbita do tabuleiro e a órbita da ficha da própria pessoa. A câmera acompanha a posição animada do peão e preserva orientação/distância ao alternar. Os nove modelos citados recebem correção visual de 180°; os outros cinco preservam a orientação. As regras e o estado compartilhado não foram alterados.
- Regressões: cobertura da correção dos nove tokens, orientação preservada nos outros cinco e deslocamento/retorno do alvo mantendo o enquadramento. Atualizado o teste da lateral do HUD de três para quatro atalhos.
- Validação: `npm run verify` passou com 61 arquivos e 332 testes; builds web e servidor passaram. Playtest manual em partida com ficha Salto: botão apareceu acima de Config; alternância recentrou a câmera na ficha e a segunda ativação retornou ao tabuleiro. `git diff --check` sem erros. Não houve viewport mobile disponível para inspeção manual.
- Próximo passo: observar a preferência de enquadramento durante partidas em telas pequenas e com diferentes fichas.

# Bots, dívida e avisos de efeitos na cidade — concluído (2026-11-02)

- Pedido: melhorar decisões dos bots, especialmente recompra; restringir valores de liquidação à pessoa que está pagando a dívida; destacar efeitos temporários nas cidades e celebrar a Copa com confete.
- Descobertas: faltava uma ação de bot na fase `buyback`; o cliente mostrava valores de liquidação em todos os dispositivos porque só conferia a fase sincronizada; apagão e proteção não tinham sinal visual no instante da aplicação, e a Copa só deixava a bandeira permanente.
- Implementado: recompra pelo bot com reserva de caixa e menor reserva quando completa grupo; valores de liquidação somente para a sessão ativa que resolve dívida; mensagens sincronizadas e selos/aneis temporários para transferência, apagão, proteção, terremoto e Copa, com confetes na sede. Terremoto mantém também o colapso 3D.
- Validação: `npm run verify` passou com 59 arquivos e 317 testes, build Vite e build do servidor. Playtest local confirmou o selo de Proteção sobre a cidade e a bandeira da sede; a conexão temporária caiu quando o servidor reiniciou durante o build.
- Próximo passo: observar em partidas reais se as decisões de recompra e os avisos temporários das cidades ficam claros para o grupo.

# Ajuste da home e do lobby — concluído (2026-11-02)

- Pedido: remover o destaque “Seu Brasil, seu negócio.”, aproximar os marcadores regionais de BANTEC, reorganizar o lobby para caber numa tela e remover o painel decorativo “LUGARES À MESA”.
- Implementado: a home mostra BANTEC com os cinco marcadores regionais logo abaixo. O lobby usa colunas para convite/configurações e escolhas visuais/participantes; o painel lateral decorativo foi removido. O layout compacto foi ajustado para desktop, tablet e celular, mantendo as escolhas de 12 cores, 14 fichas, seis lugares, prontidão, bots e início da partida.
- Validação visual manual em navegador local: home no desktop e celular; lobby com seis participantes em viewport 390×844 e painel completo em viewport de tablet. Não houve rolagem nas capturas finais; a altura de tablet foi ajustada depois da primeira revisão.
- `npm run verify` passou: 59 arquivos de teste, 317 testes, build Vite e build do servidor. O aviso conhecido de chunk acima de 500 kB permanece.
- `npm run graphify -- update .` concluiu: 1.139 nós, 2.149 arestas e 79 comunidades.
- Próximo passo: acompanhar a leitura do lobby em celulares físicos.

# Link de convite direto para a sala — concluído (2026-11-02)

- Pedido: gerar um link de sala que leve a pessoa diretamente ao convite; antes de entrar, ela informa o nome de usuário.
- Estado verificado: o anfitrião já via e podia copiar o código, mas quem recebia precisava abrir a home, digitar o código e depois entrar.
- Direção: link com código na query string; a home reconhece um código válido, pede o nome e oferece a entrada direta. No lobby, o anfitrião copia o convite; o código manual continua funcionando.
- Implementado: o lobby gera e copia uma URL com o código da sala; o link mantém o caminho da aplicação e acrescenta `?room=...`. Ao abrir uma sala válida, a home identifica o convite, foca o campo de nome e permite entrar pelo botão ou Enter, sem digitar o código. Se a cópia automática não estiver disponível, o link fica visível para cópia manual. O código manual segue disponível fora do fluxo do convite.
- Validação: `npm run verify` passou com loopback local permitido (58 arquivos, 311 testes e builds web/servidor). Playtest local em duas abas: criei a sala `GW8TM`, copiei `http://127.0.0.1:5173/?room=GW8TM`, abri o link noutra aba, informei “Convidado” e confirmei entrada no mesmo lobby com 2/6 lugares ocupados.
- Próximo passo: observar o compartilhamento em celulares usando o clipboard do navegador; quando esse recurso é negado, o campo de link selecionável oferece cópia manual.

# Salas e interface responsivas para seis participantes — concluído (2026-11-02)

- Pedido: permitir partidas com até seis pessoas e revisar a responsividade geral, com atenção aos cartões de jogadores e às telas desktop, tablet e celular.
- Estado verificado: servidor e lobby limitavam salas a quatro; o HUD de partida usava quatro posições fixas e a prévia de lugares no lobby tinha quatro assentos.
- Direção: usar um limite compartilhado de seis; cartões em uma fileira em telas largas e grade de três por duas em telas menores; preservar cena 3D, escolhas no tabuleiro e o conteúdo compacto dos painéis.
- Implementado: o limite `MAX_ROOM_PLAYERS` é compartilhado entre lobby e servidor; seis conexões são aceitas, a sétima é recusada e o preenchimento por bots respeita o mesmo limite. O lobby mostra seis vagas e a mesa de assentos em grade 3×2. O HUD mostra seis cartões numa fileira em telas largas e em grade 3×2 em larguras compactas, com um arranjo específico para celular em paisagem. As regras de turno, economia, tempo e ordem foram preservadas.
- Validação: `npm run verify` passou com loopback local permitido (57 arquivos, 308 testes e builds web/servidor). Playtest local real com anfitriã e cinco bots chegou a 6/6, iniciou a partida e renderizou os seis cartões, seis fichas empilhadas e o painel de compra em viewport 789×860; não encontrei falha visual nesse tamanho. Testes verificam as regras CSS para desktop, tablet/celular e paisagem. O navegador interno não ofereceu emulação/ajuste de viewport nesta sessão, então não capturei uma revisão visual independente em tela larga e celular.
- Próximo passo: revisar manualmente em um monitor e em um celular físicos, especialmente a leitura dos saldos nos cartões estreitos.

# Falha ao carregar a partida após início — concluída (2026-11-02)

- Captura pública mostra o módulo dinâmico `CashHud-….js` retornando 404 ao iniciar a partida, seguido por exceção de importação e tela vazia. `CashHud` é lazy-loaded quando a tela de jogo é montada; o app não tinha recuperação para falha de chunk nem Error Boundary na raiz.
- Implementado: uma falha de preload do Vite provoca uma única recarga da página por janela de 30 segundos; se o app continuar falhando, Error Boundary mostra uma instrução e botão “Atualizar página”. Regressões cobrem o limite de repetição, nova tentativa após 30 segundos e indisponibilidade do session storage. Sem mudança de regras ou arquitetura do servidor.
- `npm run verify` passou com loopback local permitido: 57 arquivos de teste, 305 testes e builds web/servidor. Graphify atualizado para 1.115 nós, 2.096 arestas e 79 comunidades.
- Playtest local com anfitriã e três bots: início da partida renderizou tabuleiro 3D e HUD de saldo; console sem erros ou avisos. Não forcei a falha do chunk nem a tela do Error Boundary no navegador.
- Causa inicial provável: referência de bundle antiga em cache após publicação, mas a captura sozinha não identifica a origem do 404. A publicação da correção permite observar se a tela pública volta a carregar.
- Publicado no commit `36ea860`; Vercel marcou o check como `success`. Playtest público com anfitriã e três bots iniciou a partida e exibiu o tabuleiro 3D e o HUD; console sem erros ou avisos. A sala de teste foi encerrada.
- Próximo passo: observar se participantes afetados deixam de ver o 404 após receber o bundle publicado; a tela de erro continua coberta por regressão, sem falha forçada em produção.

# Empilhamento de fichas no tabuleiro — concluído (2026-11-02)

- Todas as fichas agora compartilham a posição voltada para dentro de cada piso e ocupantes da mesma casa formam uma torre vertical em ordem estável de assento. Nas quatro casas de canto, a pilha fica centralizada.
- Regressões cobrem orientação nos quatro lados, centralização nos cantos, seis pessoas na mesma pilha, separação entre casas e dados inválidos.
- Validação: `npm run verify` passou com loopback local permitido (56 arquivos, 302 testes; builds Vite e servidor). O build continua exibindo o aviso conhecido de chunk 3D acima de 500 kB. Playtest local com anfitriã e três bots mostrou as quatro fichas empilhadas na Partida; console do navegador sem erros ou avisos. A pilha de seis foi verificada em teste determinístico, pois a sala continua limitada a quatro participantes.
- O usuário apontou os cartões de participantes como a principal estranheza da UI. Não houve decisão de layout nesta frente; a revisão dos cartões segue como próxima conversa de design.

# Recuperação do tabuleiro após perda de WebGL — concluído (2026-11-02)

- Relato: após comprar duas casas, o navegador do anfitrião piscou e continuou mostrando HUD/turno; para a amiga, somente o tabuleiro desapareceu. Reabrir a página recuperou a cena. Isso isola o sintoma no Canvas local; a captura não mostrou erro JavaScript nem uma mensagem explícita de contexto WebGL.
- A recuperação anterior reconstruía o Canvas com a mesma qualidade gráfica. Agora, se o navegador não restaurar o contexto em 1,8 s, a cena é recriada uma vez com qualidade inferior e preferência de GPU padrão, preservando a conexão/sala. Se o contexto falhar novamente, aparece uma mensagem persistente com botão para tentar recuperar o tabuleiro; trocar a qualidade gráfica também reinicia a cena.
- Os avisos `Permissions-Policy` e `unsupported GPOS/GSUB LookupType` da captura não são exceções JavaScript e não identificam a origem da piscada.
- Regressões cobrem eventos de perda/restauração e redução de qualidade. `npm run verify` passou: 55 arquivos, 298 testes, build Vite e build do servidor. Playtest local iniciou partida com bot, manteve Canvas visível e não encontrou erros/avisos de console; não forcei uma perda real da GPU no navegador.
- Próximo passo: observar a restauração em um cliente afetado. Se voltar a ocorrer sem a mensagem de recuperação, capturar o console depois que o tabuleiro sumir para localizar o erro de renderização alternativo.

# Paleta de cores de participantes — concluída (2026-11-02)

- Pedido: substituir cores próximas entre si por uma seleção inspirada nas cores de personagens de Among Us.
- Estado inicial verificado: a lista tinha 12 entradas, incluindo pares visualmente próximos (turquesa/ciano e roxo/lavanda); cada cor é compartilhada entre lobby, cartões, fichas e sinais no tabuleiro.
- Implementado: 12 tons reconhecíveis inspirados nos personagens de Among Us; os pares próximos da paleta anterior foram removidos. As cores e nomes atualizados alimentam lobby, peões, cartões e indicações de cor.
- `npm run verify` passou: 55 arquivos, 296 testes e builds web/servidor. A primeira execução do teste Colyseus falhou por loopback restrito; repetida com acesso local permitido, passou. O build mantém o aviso existente do chunk 3D acima de 500 kB.
- Playtest visual local no lobby: os 12 nomes e amostras foram renderizados em três linhas, com a cor selecionada visível no cartão da mesa. Servidor de sala e Vite foram encerrados após a revisão.
- Código publicado em `main` no commit `8362402`; a paleta e o teste de regressão já estão sincronizados com `origin/main`.
- Próximo passo: observar em uma partida com mais pessoas se os tons continuam fáceis de distinguir na tela.

# Prontidão de participantes no lobby — concluído (2026-11-02)

- Pedido: exigir que cada pessoa confirme que está pronta antes de a anfitriã iniciar a partida.
- Decisão aplicada à implementação: cada participante humano marca pronto no lobby; bots contam como prontos e o servidor impede início enquanto faltar confirmação ou conexão.
- Implementado: botão de prontidão individual, estado visível para a sala, bots prontos automaticamente e validação autoritativa para iniciar somente quando todas as pessoas estiverem prontas/conectadas.
- `npm run verify` passou com loopback permitido: 55 arquivos e 295 testes; build web e servidor concluídos. O aviso existente de chunk 3D acima de 500 kB permanece.
- Playtest desktop com dois clientes humanos confirmou estado sincronizado, bloqueio até ambos confirmarem, botão habilitado após todos ficarem prontos e início da partida. Revisão móvel confirmou o layout do lobby e o fluxo com bot.
- Graphify foi atualizado localmente. Os artefatos gerados incorporaram também alterações simultâneas e não relacionadas no tabuleiro, então ficam fora deste commit junto com essas alterações.
- Alterações locais preexistentes em `assets/blender/special-corners.blend` e `.blend1` permanecem fora do escopo.
- Próximo passo: revisar o diff seletivo e publicar somente o escopo desta tarefa em `main`.

# Posicionamento de propriedades e bandeiras de festival — concluído (2026-11-02)

- Corrigido o recuo radial dos modelos e rótulos nas laterais: largura local agora é usada após rotação de 90 graus. Ajustadas também as mudanças simultâneas de dono/nível e a normalização do modelo de terremoto para não deixar os modelos ou as transformações da animação defasados.
- Bandeiras de festival agora se posicionam voltadas para dentro conforme o lado do tabuleiro. O cartão do participante destaca títulos de cidade e companhia; seu rótulo acessível foi atualizado.
- Ver detalhes, origem/normalização dos modelos Blender e limites do playtest em [docs/trabalho/posicionamento-propriedades-festival.md](trabalho/posicionamento-propriedades-festival.md).
- Próximo passo: observar liquidação e recompra ao vivo com câmera próxima, incluindo companhia.

# Cronômetro de turno no modo sem limite — concluído (2026-11-01)

- Corrigido: o relógio do turno agora tem intervalo próprio e continua ativo quando a partida não tem limite total; a contagem total permanece em zero e sem encerramento por tempo.
- O lobby explica que “Sem tempo” remove só o limite da partida. Regras e decisão confirmada registram que turnos e decisões continuam cronometrados.
- Regressão de servidor verifica que, após iniciar sem limite, o turno cai abaixo de 20 segundos enquanto a partida segue ativa com `matchSeconds: 0`.
- `npm run verify` passou: 55 arquivos de teste, 292 testes, build web e build do servidor. O build web mantém o aviso conhecido de chunk 3D acima de 500 kB.
- Graphify atualizado: 1.073 nós, 2.020 arestas e 77 comunidades. Próximo passo: acompanhar turnos sem limite em uma partida online.

# Leilão voluntário com aceite e disputa — concluído (2026-11-01)

- O dono anuncia uma propriedade em qualquer fase e fora do próprio turno; pode manter construções no grupo, e melhorias seguem com o imóvel. Outra pessoa tem 10 segundos para aceitar; o aceite abre uma janela de 10 segundos para lances. Cada oferta válida reinicia essa contagem. Sem aceite ou sem lances, o anúncio termina sem venda.
- O painel separa aceite de disputa e mostra o cronômetro atual. O vendedor pode cancelar antes do primeiro lance. A oferta vencedora transfere o título com as construções. Se o título voltar ao banco no meio do leilão, a sala cancela e devolve o lance reservado.
- Regressões cobrem anúncio fora do turno durante dívida e com construções, aceite obrigatório antes de ofertar, lance reservado e reembolsado ao ser superado, reinício do relógio, transferência das construções e expiração sem aceite.
- `npm run verify` passou: 55 arquivos de teste, 292 testes e builds web/servidor. Playtest local confirmou o anúncio sem restrição, o rótulo de aceite e a contagem regressiva de 10 segundos. O modo de dois clientes humanos não foi exercitado manualmente; os estados de aceite/lance estão cobertos pelo teste de servidor.
- As alterações de trabalho locais em `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1` são alheias a esta tarefa e permanecem preservadas.

# Efeitos de propriedades, leilão, setas e animação de projéteis — concluído (2026-11-01)

- Pedido: manter o terreno apoiado no piso; limpar os efeitos de uma propriedade quando o título voltar ao banco, mantendo o Festival; impedir efeitos temporários em cidades livres; remover negociação entre jogadores; explicar o bloqueio do leilão; adicionar setas 3D de destino e vez; evitar que ovo, lama, tomate ou farinha pulem a animação em lançamentos repetidos.
- Implementado: o terreno fica no nível da superfície enquanto casas/hotel mantêm sua altura; devolução por dívida, falência sem credor e Terremoto usam a mesma limpeza de efeitos e da sede da Copa. Festival permanece na cidade. A negociação de dinheiro e títulos saiu da interface, protocolo, schema e regras. A seta dourada indica a casa de destino e uma seta na cor do jogador aponta para o peão da vez. O relógio de projéteis reinicia na montagem do novo evento e limita frames longos para não pular o voo.
- Regressões: limpeza de efeitos/Festival na devolução e Terremoto, cancelamento de leilão e devolução de lance quando o título volta ao banco, razão do bloqueio de leilão, cálculo do destino e avanço seguro da animação após frame longo.
- Validação automatizada: `npm run verify` passou com 55 arquivos de teste, 291 testes, build web e build do servidor. O hook será executado novamente no commit. O build mantém o aviso conhecido de chunks acima de 500 kB.
- Playtest manual: Vite e sala local foram abertos; a porta 2567 estava ocupada sem processo identificável, então usei a porta alternativa 2569. O leilão ficou bloqueado em Canaã porque outra cidade do mesmo grupo tinha construções, e a interface mostrou esse motivo. Em Maceió, sem construções no grupo, o botão habilitou e abriu o estado de leilão por 20 segundos. Um Terremoto atingiu o próprio título durante o leilão e revelou que ele continuava aberto; a regressão cobre o cancelamento e o reembolso. A compra de Canaã também mostrou o modelo de terreno no tile; a vista geral não permite medir visualmente a folga de altura. Alterações locais em `assets/blender/special-corners.blend` e `.blend1` foram preservadas fora do escopo.
- Publicação: `5ff5dff` e `438d444` já estão em `main` e `origin/main`; a nova correção ainda será publicada após a validação e o hook.
- O fluxo de leilão descrito acima substitui as restrições antigas; a validação anterior de 20 segundos e grupo sem construções é histórica.
- Próximo passo: observar os aceites e disputas em uma partida com duas pessoas humanas.

# Cartões destacam cidades e ajuste de construções — concluído (2026-11-01)

- Pedido: elevar as construções até o modelo ficar todo acima do piso sem alterar o deslocamento lateral; remover o atalho Bens e trocar o clique do cartão por destaque das cidades da pessoa, escurecendo os demais espaços.
- Implementado: elevação vertical passou a 0,2 unidade, mantendo o deslocamento lateral; seleção de cartão ilumina cidades próprias e escurece os demais espaços, e clicar novamente limpa o destaque. O atalho Bens e o perfil foram removidos; Troca aparece como ação contextual.
- `npm run verify` passou: 54 arquivos, 290 testes, build web e build do servidor. Playtest local com Modo DEV confirmou o cartão como controle de destaque, cidade própria iluminada e demais casas escurecidas; a partida não mostrou perfil nem atalho Bens. Comprei Canaã dos Carajás já com duas casas e aproximei a câmera: os modelos das casas ficaram visíveis sobre o piso. O offset vertical compartilhado também é verificado por teste geométrico.
- Próximo passo: observar a leitura dos rótulos e do modelo de hotel em partidas com ângulo de câmera diferente.

# Personalização de fichas, colocação no tabuleiro e reconexão — concluídas (2026-11-01)

- Dez fichas low-poly adicionais estão no GLB, totalizando 14 opções; o seletor oferece 12 cores. “Salto” é um sapato de salto com a silhueta refinada e GLB reexportado pelo Blender 5.2.2 LTS. Após revisão visual do usuário, as construções foram elevadas 0,08 unidade acima da superfície do piso; o deslocamento lateral rumo à borda e os rótulos à frente dos peões foram preservados.
- Ajuste posterior do usuário na faixa da cartola foi preservado: salvei a fonte `.blend` e reexportei o GLB de runtime; a escala da faixa está 1,0718× no novo GLB.
- Se uma pessoa sair durante a partida, o bot assume e o cartão exibe “BOT NO CONTROLE”. A cadeira preserva seus bens e a sala aceita retorno pelo mesmo código e nome. A partida desativa o descarte automático; se não houver humano conectado, a sala é mantida até 24 horas para reconexão e encerra antes caso a partida termine.
- Regressão de servidor cobre sala com bot e sem outro cliente humano, controle automatizado, rejeição de nome diferente, reconexão exata, preservação dos bens e restauração do descarte automático. `npm run verify` passou com 53 arquivos / 287 testes e builds web/servidor; grafo atualizado.
- Playtest desktop: o lobby mostrou as 12 cores e 14 fichas; partida com bot mostrou o selo no cartão. Em sala solo, sair e entrar de novo com o mesmo código e nome restaurou o controle humano e removeu o selo. Uma sala nova com código diferente não permite reentrada, como esperado.
- Alterações locais anteriores em `assets/blender/special-corners.blend` e `.blend1` são externas a esta tarefa e devem ser preservadas.
- Próximo passo: observar o alinhamento das construções em partidas com outros níveis de melhoria e diferentes lados do tabuleiro; alterações locais da cartola seguem preservadas.

# Recuperação visual da cena após piscada — implementada (2026-11-01)

- Relato novo: na troca de turno, a tela piscou e o tabuleiro 3D desapareceu para uma participante; a captura do console mostra `game:started` sem listener e `favicon.ico` 404, mas não mostra erro de WebGL explícito. Os avisos de GPOS/GSUB também não comprovam relação com a cena.
- A mensagem `game:started` agora muda a tela para a partida e tem listener registrado; a tela também declara um favicon SVG próprio.
- A cena sob demanda agora invalida quadros ao voltar ao foco/visibilidade. Se WebGL perder o contexto e não restaurar em 1,8 s, o Canvas é recriado; se restaurar, a cena recebe nova invalidação.
- Ajuste visual solicitado: o modelo de propriedade se desloca mais para o lado interno do tile, reservando o corredor externo para o caminho dos peões.
- `npm run verify` passou com 51 arquivos / 282 testes e builds web/servidor. Na sala local com bot, o evento de início abriu a partida, o tabuleiro continuou visível depois das trocas de turno e o console não registrou avisos/erros; o modelo comprado ficou sobre o tile.
- A piscada/desaparecimento reportados não foram reproduzidos nem confirmados com dois clientes humanos. A recuperação reduz o risco de tela vazia, mas a causa original ainda não foi provada. Próximo passo: observar a próxima partida online; se repetir, coletar logs do cliente e do servidor no momento exato.

# Correção visual de propriedades e indicador de liquidação — implementada (2026-11-01)

- Pedido confirmado: modelos de propriedade comprada ficam sobre o próprio piso, deslocados só o suficiente para abrir passagem aos peões; o rótulo 3D mostra o nome da cidade acima do aluguel e usa a cor de quem possui o terreno.
- O valor de venda/liquidação fica oculto durante o jogo normal e aparece apenas enquanto a partida está na fase de dívida/liquidação.
- Corrigido: o modelo ocupa o tile, junto ao lado interno; o nome da cidade fica acima do aluguel na cor do dono; o valor de liquidação só é montado no estado `debt`.
- Testes específicos cobrem o posicionamento dentro do piso e a ausência do valor fora da dívida; `npm run verify` passou com 51 arquivos / 280 testes e builds web/servidor.
- Playtest local com compra real de Belém confirmou visualmente o modelo sobre o piso, o nome na cor coral acima do aluguel e a ausência de `LIQ.` fora da fase de dívida. A fase de dívida foi verificada nos testes, não visualmente no navegador.
- A porta 2567 estava ocupada sem processo identificável; o playtest usou 2569. Próximo passo: observar a leitura do rótulo em câmera mais próxima e durante uma dívida real.

# Ajustes de regras, liquidação e apresentação — implementado (2026-11-01)

- Implementados: cobranças de cartas limitadas ao saldo; escolhas expiradas aleatórias entre opções válidas; rolagem D6 visível nas companhias; dívida e liquidação destacadas; opções de compra/melhoria limitadas ao saldo; melhoria após recompra; dados ampliados; construções posicionadas mais para dentro do piso; preservação da vitória por monopólio durante a recompra.
- Regressões cobertas para pagamento parcial de cartas, escolha aleatória no timeout, D6 da companhia e vitórias em Linha/Regional após recompra.
- `npm run verify` passou: 51 arquivos de teste, 279 testes, build web e build do servidor. Playtest local confirmou o painel de compra inicial bloquear a 3ª casa/hotel e uma compra de terreno atualizar saldo/estado.
- O servidor local padrão na porta 2567 falhou com `EADDRINUSE` sem listener identificável; o playtest foi realizado usando a porta 2569. Os arquivos Blender `assets/blender/special-corners.blend` e `.blend1` são alterações locais fora de escopo e devem ser preservados.
- Próximo passo: revisar as alterações sincronizadas em `main` e publicar somente os arquivos relacionados a esta tarefa.

# Tabuleiro 3D some na troca de turno — proteção implementada (2026-11-01)

- Relato: ao concluir a primeira vez, a tela do usuário pisca; no cliente da amiga, HUD e botões permanecem, mas o tabuleiro 3D desaparece. A captura mostra que a interface segue ativa enquanto a cena 3D não é desenhada.
- Causa exata não reproduzida localmente. O Canvas mantido em `frameloop="demand"` já redesenhava normalmente nas trocas anfitrião↔bot; por isso não atribuo o incidente a uma falha confirmada da rede ou do servidor.
- Proteção: o cliente agora solicita quadros adicionais de renderização na abertura de cada turno e redesenha ao receber o evento de restauração do contexto WebGL. O Canvas continua sob demanda, sem renderização contínua.
- Regressões cobrem as solicitações de quadros e seu cancelamento quando uma troca de turno substitui a anterior. Validação: `npm run verify` passou em 51 arquivos / 276 testes e builds web/servidor; partida local com bot permaneceu visível após várias trocas.
- Limitação: não foi possível reproduzir com dois clientes humanos nem confirmar o mesmo sintoma no navegador da amiga. Próximo passo: observar partidas publicadas; se voltar a ocorrer, coletar o console do cliente afetado para identificar a causa específica.

# Continuação após resolver cartas com alvo — concluída (2026-11-01)

- Reprodução relatada: após usar cartas como Proteção, selecionar o alvo encerra o efeito, mas não aparece ação para concluir a vez.
- Causa encontrada na interface: a carta permanece como contexto em `activeCardTitle`; isso suprime o controle “Continuar” na fase `resolve`, inclusive quando a revelação já foi fechada para selecionar o alvo. O servidor já muda corretamente para `resolve`.
- O controle de continuação agora depende da fase `resolve`, de a revelação estar fechada e de não haver chegada numa propriedade própria ou feedback pendente; a presença do título da carta não o suprime.
- Regressão coberta em `turnActivity.test.ts`. `npm run verify` passou com 274 testes em 50 arquivos e builds web/servidor. Em partida descartável local, preparei Proteção no Modo DEV, ativei a carta e confirmei “Continuar” após o efeito. Graphify atualizado para 1.027 nós, 1.911 arestas e 69 comunidades.
- Correção publicada em `main`. Próximo passo: observar se o controle também permanece claro após outras cartas com alvo e em partidas sem Modo DEV.

# Bandeira de festival e rolagem dos dados — concluídas (2026-11-01)

- O usuário pediu uma bandeira inspirada em bandeirolas de festa, com duas estacas, nas cidades em festival, substituindo o emoji. Também pediu melhorar a rolagem dos dados.
- Blender 5.2.2 LTS conectado: modelo low-poly criado e exportado em `assets/blender/festival-banner.blend` e `public/assets/festival-banner.glb`. A bandeira tem duas estacas, corda arqueada e seis bandeirolas coloridas; a cena Blender original foi preservada.
- Animação atualizada para cambalhotas em três eixos, oscilação amortecida e três quicadas decrescentes; duração de 1,8 s em 1×. A sequência de turnos e o resultado final dos dados continuam iguais.
- A cena do tabuleiro agora carrega o GLB nos três espaços sorteados para festivais, com posição e escala relativas ao tamanho do tile. Na partida local, os três locais foram vistos no tabuleiro; a rolagem percorreu a etapa de “Girando os dados” e seguiu para movimento do peão.
- Blender `look` confirmou a silhueta 3D da peça com duas estacas e bandeirolas coloridas. A validação automatizada passou em 273 testes, build web e build do servidor; graphify foi atualizado para 1.024 nós, 1.905 arestas e 70 comunidades.
- Próximo passo: commit revisado e push em `main`.

# Reforma econômica inspirada em Business Tour — implementada (2026-11-01)

## Primeira volta e velocidade de animação — corrigidas (2026-11-01)

- O usuário esclareceu a reprodução: partida recém-iniciada, primeira rolagem, e a primeira cidade já oferecia três casas. O teste ponta a ponta repete essa sequência em Porto Velho (soma 3 nos dados) e confirma que o servidor rejeita três casas sem alterar saldo/fase, mas permite comprar com duas. Na revisão visual local, a opção “3 casas” apareceu desabilitada e o aviso vermelho foi exibido nessa primeira chegada.
- O estado do botão final de compra agora também valida o limite da primeira volta, além das opções de construção e da validação autoritativa do servidor. Um caso separado foi coberto: teletransportes de cartas e Volta ao Brasil não contam como volta completa, embora mantenham o bônus de cruzar a Partida.
- A velocidade pedida foi aplicada à escala inteira das animações: 1× usa a duração antiga de 2×; 0,5× dura o dobro de 1× e 2× a metade. Para cada passo do peão, isso resulta em 375 ms, 188 ms e 94 ms, respectivamente.
- `npm run verify`: 270 testes em 49 arquivos passaram; build web e build do servidor passaram. A revisão no navegador local confirmou o fluxo da primeira rolagem; as opções de 3 casas e hotel ficaram bloqueadas com o aviso vermelho. Graphify foi atualizado para 1.013 nós, 1.882 arestas e 73 comunidades. Servidores locais foram encerrados.
- Próximo passo: commit revisado e push em `main`.

## Restrições de primeira volta e cartas de aluguel — em implementação (2026-11-01)

- O usuário confirmou duas regras: não construir a terceira casa antes de completar uma volta; e adicionar cartas de dobro e desconto de 50% no próximo aluguel, inclusive companhia. Quando ambas estiverem pendentes, os efeitos acumulam multiplicativamente no próximo aluguel.
- A regra da primeira volta é individual. A terceira casa (e hotel) fica indisponível até o jogador cruzar a Partida pela primeira vez; compra inicial de imóvel com nível 3+ também deve respeitar o bloqueio.
- Próximo passo: implementar estado autoritativo, mensagem visual de bloqueio, cartas, regressões, validar e publicar em `main`.

- O usuário aprovou manter R$ 2.000.000 iniciais e R$ 300.000 ao passar pela Partida; três cidades aleatórias recebem festival ×2 no início; Copa passa de ×3 para ×2; multiplicadores regionais/festival/Copa acumulam.
- As 24 cidades mantêm nomes, regiões e cores do BANTEC; compra, custos de construção e aluguéis incrementais foram interpolados pela posição na curva de 20 cidades de Business Tour observadas em capturas. As taxas permanecem como estavam. O estoque do tabuleiro segue com 40 casas.
- Companhias continuam a R$ 500.000 e quatro dão vitória. Aluguel usa um novo D6 ao cair: R$ 50.000 × companhias do dono (1–3) × resultado. Recompra forçada: 2× investimento, depois do aluguel; hotel continua inelegível.
- Parar exatamente na Partida oferece uma melhoria de um nível em uma cidade própria aleatória elegível, paga pelo custo normal; passar não oferece melhoria. A melhoria é opcional.
- Escopo alheio preservado: `assets/blender/special-corners.blend` e `.blend1` têm mudanças do usuário.
- Validação: `npm run verify` passou com 262 testes, build do frontend e build do servidor. Graphify foi atualizado. Na partida local, confirmei os saldos iniciais de R$ 2.000.000, três marcadores 🎉 ×2 no tabuleiro e a animação de duplas; os testes de integração cobrem a oferta paga ao parar exatamente na Partida e o novo D6 de companhia. Não concluí uma partida para medir o equilíbrio entre pessoas.
- Próximo passo: observar partidas reais com amigos para calibrar a duração e a pressão financeira sem alterar os multiplicadores aprovados por enquanto.
# Auditoria da reforma BANTEC — 2026-11-01

- Velocidade-base do movimento ajustada e publicada em `main` (`65b2c0e`): cada casa agora leva 375 ms em 1×, equivalente ao antigo 2×. Testes e builds passaram; partida local confirmou movimento e chegada a Belém. Próximo passo da reforma: continuar as frentes pendentes, preservando a revisão econômica registrada no início deste arquivo.
- O worktree está em `main`; as alterações do usuário em `assets/blender/special-corners.blend` e `.blend1` permanecem fora do escopo e sem staging.
- Nova frente solicitada: corrigir Apagão e aluguel visível; destaque de duplas; animação persistente de projéteis; bolha 3D da Proteção; colapso e som do Terremoto; troca imediata das fichas; marcador da sede da Copa; bônus da Partida condicionado ao trajeto; liquidação automática ao cobrir dívida; teleportes de cartas animados; e opção sem limite de tempo.
- A revisão econômica agora está sendo conduzida nesta frente; consulte a seção mais recente no início deste arquivo para os parâmetros aprovados.
- Próximo passo: concluir regressões e ajustes visuais, executar `npm run graphify -- update .` e `npm run verify`, fazer revisão visual pelo Game Studio e publicar somente os arquivos relacionados.

# Playtest manual das 12 cartas BANTEC — concluído (2026-10-31)

## Smoke test público — Vercel e sala multiplayer funcionando (2026-10-31)

- A escolha do usuário foi Render por simplicidade para o servidor multiplayer; o frontend permanece na Vercel. O status Vercel do commit `4547e14` confirmou “Deployment has completed”. O CI passou, chamou o hook mascarado e o Render aceitou o pedido.
- Na URL pública, criei uma sala temporária, adicionei Bot 1, iniciei a modalidade de 15 minutos e fiz uma rolagem: o jogo conectou, sincronizou saldos/relógio, resolveu 9 casas e mostrou a compra de Rio Verde com a escada de aluguel esperada. Saí da sala e fechei a aba; o console não retornou erros/avisos.
- Na home pública atual, confirmei que as opções de 15 minutos, 30 minutos e 1 hora ficam selecionáveis, uma por vez. Isso valida o controle publicado; o ritmo e o equilíbrio de cada duração ainda precisam de partidas humanas.
- No teste local com bots, iniciei partidas de 15, 30 e 60 minutos; a de 15 minutos confirmou compra de Manaus e Bot 1 pagando R$ 65.000 de aluguel, seguido da oferta de recompra de R$ 975.000. Esses testes cobrem início e fluxo econômico, não substituem partidas com pessoas. A sessão interna do Render pediu autenticação, então parei sem credenciais ou aceite; depois, o usuário confirmou a configuração do `Auto-Deploy` e o funcionamento do site.
- O usuário confirmou que desligou o `Auto-Deploy` nativo do Render e testou o site público, onde o jogo já está rodando; consideramos a publicação operacionalmente confirmada. O workflow do commit `df78bd9` também terminou com sucesso e o Render aceitou o pedido pelo Deploy Hook. O SHA exato ativo no serviço não foi lido no painel.
- O segredo não foi exibido nem registrado. O deploy solicitado não envolveu upgrade pago.
- Próximo passo concreto: obter impressões de equilíbrio/ritmo em partidas com pessoas para 15, 30 e 60 minutos; os testes locais com bots e a confirmação de disponibilidade do usuário não substituem esse feedback.

# Dados ainda mais baixos durante a rolagem — ajuste implementado (2026-10-31)

- A pedido do usuário, baixei a posição-base dos dados de Y=1,10 para Y=1,065 e reduzi a escala de 0,63 para 0,55. A animação mantém pelo menos 0,01 unidade de folga geométrica em qualquer rotação sobre os telhados da FATEC.
- Na rolagem real da sala local F6BG5, os dados apareceram baixos junto aos prédios sem atravessar o volume da Fatec.

- Em sala local FHNFW com Modo DEV e Bot 1, confirmei Generoso transferindo Manaus ao bot; Aniversário transferindo R$ 50.000 do bot ao anfitrião; Apagão destacando alvos válidos, aplicando-se a Manaus e zerando o aluguel na chegada seguinte (mensagem: 2 turnos restantes); Terremoto destruindo Manaus e devolvendo-a ao banco.
- Na sala descartável RZMAQ, Cidade-sede foi descartada sem mover quando não havia sede ativa. Sede da Copa permitiu selecionar Joinville e o inspetor mostrou aluguel de R$ 135.000 (base R$ 45.000, triplicada).
- Na sala descartável P28D9, Proteção iluminou Fortaleza como alvo elegível e confirmou imunidade a cartas por três turnos do dono. Ladrão permitiu selecionar Bot 1 e transferiu R$ 200.000 após a liquidação da dívida. Troca-troca confirmou que BANTEC QA Restante e Bot 1 trocaram de lugar sem resolver as casas de chegada.
- Com Generoso, Aniversário, Apagão, Terremoto, Prisão, Volta ao Brasil, Sede da Copa, Troca-troca, Cidade-sede, Ladrão, Proteção e Vá para o início revisados, as 12 cartas estão confirmadas visualmente. Volta ao Brasil creditou R$ 200.000 ao chegar; Vá para o início também teve crédito de R$ 200.000 registrado em validação anterior.
- A sala temporária foi usada apenas para teste e encerrada; as alterações locais de `special-corners.blend` e `.blend1` foram preservadas e ficaram fora do escopo. O usuário escolheu Render por simplicidade. O workflow confirmou o segredo e o pedido de deploy aceito; falta revisar no painel se o deploy terminou e se o Auto-Deploy está desligado. O serviço Free pode dormir e não é recomendado pelo fornecedor para produção; não foi autorizado upgrade pago. Permanecem playtests humanos de equilíbrio para 15, 30 e 60 minutos.

# Seleção de casas pelo tabuleiro — correção visual concluída (2026-10-31)

- A revisão manual do Apagão mostrou que, depois de fechar a carta, ainda surgia um cartão central de turno sobre o tabuleiro, embora a cidade válida estivesse iluminada. A primeira correção ocultava o modal, mas não esse segundo cartão.
- A implementação agora usa as opções válidas de `boardChoicePhase` para remover o cartão central durante seleções de propriedades, destinos, dívidas, trocas e carteira; o cartão de revelação continua até ser fechado ou expirar. Em uma sala real, fechei a revelação de Volta ao Brasil, vi as casas válidas iluminadas e inválidas apagadas sem o cartão central, e escolhi São Paulo no tabuleiro.
- Testes focados passaram (14 testes); `npm run verify` passou com 247 testes em 46 arquivos e builds web/servidor; Graphify foi atualizado para 945 nós e 1.754 arestas. A seleção de alvo do Apagão e a ausência de aluguel em uma chegada posterior foram confirmadas manualmente na retomada de 2026-10-31.

# Altura dos dados — novo ajuste solicitado (2026-10-31)

- Baixei os dados de Y=1,12 para Y=1,10, reduzi a escala de 0,68 para 0,63 e aproximei o indicador do resultado de Y=1,62 para Y=1,57. A caixa em qualquer rotação mantém aproximadamente 0,015 unidade de folga sobre os telhados da FATEC.
- O teste geométrico passou; `npm run verify` passou com 247 testes em 46 arquivos e builds do frontend/servidor. `npm run graphify -- update .` atualizou o grafo para 943 nós e 1.752 arestas. Na sala local, observei os dados girando a baixa altura junto aos telhados centrais; a folga geométrica mínima permanece positiva e não há interseção com a FATEC.
- Próximo passo da reforma completa: concluir a revisão visual das cartas autorais, fazer playtests humanos de equilíbrio/ritmo e obter a escolha de hospedagem do usuário.

# Altura dos dados durante a rolagem — concluído (2026-10-31)

- Reduzi a posição-base dos dados de Y=1,18 para Y=1,12 e a escala de 0,82 para 0,68; o salto permanece em 0,065 e o indicador do resultado foi ajustado para Y=1,62.
- A escala menor mantém ao menos 0,01 unidade de folga geométrica sobre os telhados da FATEC, incluindo a caixa dos dados girando; as posições continuam afastadas da torre.
- A rolagem foi observada no navegador local: os dados permanecem suspensos junto aos prédios, sem entrar no volume central. `npm run graphify -- update .` atualizou o grafo para 940 nós e 1.746 arestas. `npm run verify` passou com 246 testes em 46 arquivos e builds web/servidor; permanece o aviso conhecido do chunk 3D acima de 500 kB.
- Próximo passo da reforma completa: concluir a revisão visual das cartas autorais e fazer playtests humanos de equilíbrio/ritmo; a escolha do provedor de hospedagem e do limite de custo ainda depende do usuário.

## Motivo do encerramento explícito no resultado — em validação (2026-10-31)

- A tela final escondia `landingDescription`, então não mostrava por que a partida acabou; o estado também não diferenciava os três monopólios. O servidor passa a sincronizar `matchEndReason` e a interface mostra tempo, falência, Monopólio em Linha, Monopólio Duplo Regional, quatro companhias ou ausência de pessoas solventes.
- Regressões adicionadas para as três causas de monopólio, falência e encerramento por tempo. `npm run graphify -- update .` atualizou o grafo para 939 nós e 1.745 arestas; `npm run verify` passou com 246 testes em 46 arquivos e builds frontend/servidor; o aviso de chunk 3D acima de 500 kB continua. Na revisão visual, o anfitrião com saldo zero caiu em AgroBrasil, devia R$ 250.000 e declarou falência; o painel encerrou a partida mostrando Bot 1 vencedor, a causa da falência e a classificação com patrimônios/saldos.

## Preparação de cartas pelo Modo DEV — implementação concluída; revisão manual parcial (2026-10-31)

- Acrescentei ao Modo DEV uma seleção da próxima carta, validada no servidor, acessível apenas à anfitriã e consumida uma única vez no próximo sorteio Sorte ou Revés. Regressões cobrem permissão, id inválido, consumo único, seleção de alvo e efeito de Apagão.
- Em sala local, armei Apagão e vi a propriedade adversária elegível destacada, com as demais apagadas. A seleção manual não foi concluída antes de expirar o prazo; a suspensão de aluguel ainda depende de revisão manual.
- `npm run graphify -- update .` atualizou o grafo para 934 nós e 1.732 arestas. `npm run verify`: 243 testes em 46 arquivos passaram; builds web e servidor passaram. Persiste o aviso já conhecido de chunk 3D acima de 500 kB. `git diff --check` passou.
- Permanecem pendentes na reforma completa: playtests humanos de equilíbrio/ritmo para 15, 30 e 60 minutos e a escolha de hospedagem após confirmar prioridade de latência versus simplicidade/custo.

## Altura dos dados na rolagem — concluído (2026-10-31)

- Novo ajuste solicitado: posição-base Y=1,18, escala 0,82 e indicador do resultado Y=1,7. Mantive a animação e posições laterais que afastam os dados da torre.
- A regressão geométrica considera a caixa girando, o topo dos telhados e a posição/footprint da torre; exige folga mínima de 0,02 acima dos telhados e ausência de interseção lateral com a torre.
- Próximo passo da reforma completa: concluir a revisão visual das cartas autorais (incluindo confirmar o efeito de Apagão em uma cobrança posterior) e fazer playtests humanos de equilíbrio/ritmo. A hospedagem agora tem comparação e proposta registradas, mas a escolha do provedor e o limite de custo precisam do usuário.

## Dados mais baixos durante a rolagem — concluído (2026-10-31)

- Novo ajuste a pedido do usuário: posição-base Y=2,165, salto reduzido de 0,10 para 0,065 e indicador do total em Y=2,72. Mantida a escala 0,9. O teste usa o raio geométrico da caixa girando já escalado e exige pelo menos 0,01 unidade de folga sobre a torre da FATEC (Y≈1,81); a folga calculada é aproximadamente 0,012.
- O teste geométrico específico passou com 3 casos. Em partida local, conferi os dados suspensos acima dos prédios centrais, sem interseção visível. `npm run verify` passou: 240 testes em 46 arquivos e builds de frontend e servidor.
- Próximo passo da reforma completa: concluir a revisão visual das cartas autorais (incluindo confirmar o efeito de Apagão em uma cobrança posterior) e fazer playtests humanos de equilíbrio/ritmo. A hospedagem agora tem comparação e proposta registradas, mas a escolha do provedor e o limite de custo precisam do usuário.

## Recompra após aluguel — concluída (2026-10-31)

- Regra implementada conforme confirmação: aluguel normal primeiro; depois, se houver caixa suficiente para 1,5× do investimento e não for hotel, aparece a recompra. O preço integral vai ao antigo dono e a posse passa ao comprador. Se o aluguel exigir liquidação de dívida, a opção só aparece após pagar a dívida e se ainda houver saldo.
- Testes de servidor cobrem recompra, saldo insuficiente após aluguel, hotel e recompra após quitar dívida. Revisão manual no navegador confirmou a ordem: aluguel de R$ 192.500 pago ao Bot 1; opção de R$ 1.031.250; após aceitar, o Bot recebeu esse valor e o título passou ao anfitrião.
- Validação completa: `npm run verify` passou com 240 testes em 46 arquivos e builds de frontend/servidor. `graphify update .` atualizou o índice. Evidências em [VALIDACAO.md](VALIDACAO.md#2026-10-31--recompra-depois-do-aluguel).
- Próximo passo da reforma completa: revisar visualmente as cartas autorais restantes e registrar os itens ainda pendentes em `docs/trabalho/reforma-bantec.md`.

## Recompra forçada na interface — concluído (2026-10-31)

- Bot 1 comprou Manaus e três casas por R$ 1.625.000, sem hotel. O anfitrião foi à propriedade pelo teleporte DEV; a tela ofereceu “Recomprar por R$ 2.437.500” ou “Pagar aluguel”, sem pedir aceite ao dono.
- Confirmei a recompra: o saldo do anfitrião caiu de R$ 2.545.000 para R$ 107.500 e o do bot subiu de R$ 377.500 para R$ 2.815.000. O aviso confirmou o pagamento direto ao antigo proprietário, e a propriedade passou ao anfitrião.
- Captura visual inspecionada. Próximo passo: revisar visualmente as cartas restantes; a causa da falência por aluguel ainda foi inferida pelo estado da partida, pois o painel final não a identifica.

## Vitórias por monopólio na interface — concluído (2026-10-31)

- Em uma sala local de teste, completei Norte e Centro-Oeste com o teleporte DEV e observei o encerramento imediato por Monopólio Duplo Regional. O painel mostrou vencedor, patrimônio, saldo e classificação; patrimônio final do anfitrião: R$ 3.875.000.
- Em outra sala, comprei os sete títulos do lado 0 (seis cidades e AgroBrasil). A compra de Rio Verde encerrou imediatamente a partida por Monopólio em Linha; o painel mostrou vencedor, patrimônio, saldo e classificação. Patrimônio final: R$ 2.550.000.
- As duas capturas confirmam que a interface final não fica presa em compras, avisos ou controles DEV. O painel final após insolvência também foi visto; a causa por aluguel é inferida pelo único imóvel possuído, três casas em São Paulo, contra bot sem caixa ou bens. Permanece a revisão visual das cartas.

## Seleção e efeito de cartas — revisão manual parcial (2026-10-31)

- Em sala local com Bot 1, confirmei Ladrão: após selecionar o alvo, Codex Cartas recebeu R$ 200.000 (de R$ 2.250.000 para R$ 2.450.000) e Bot 1 pagou o mesmo valor (de R$ 435.000 para R$ 235.000).
- Também revisei o início do Apagão: o tabuleiro apagou as casas inelegíveis e iluminou propriedades válidas de Bot 1. A tentativa de clicar em Belém ocorreu no fim da contagem e abriu o inspetor; portanto, não confirmou o envio do alvo. Uma chegada posterior cobrou o aluguel de R$ 245.000, mas como a carta expirou sem a seleção confirmada, isso não prova falha do efeito.
- Nesta retomada, confirmei Ladrão no navegador: BANTEC QA recebeu R$ 200.000 (R$ 1.675.000 → R$ 1.875.000) e Bot 1 pagou R$ 200.000 (R$ 6.562.500 → R$ 6.362.500). Também selecionei Cuiabá como destino da carta Volta ao Brasil, que preservou a resolução normal de chegada sem bônus por passar pela Partida.
- Repeti a seleção do Apagão em Manaus. O tabuleiro iluminou a cidade de Bot 1 e apagou as inválidas, mas as tentativas venceram o prazo antes de a seleção ser registrada; não há confirmação visual de suspensão de aluguel. Os testes de integração cobrem a suspensão durante três turnos do dono e a retomada após expirar.
- Corrigi a janela de seleção: o aviso da carta tem até 15 segundos e, ao fechá-lo, o servidor inicia uma nova janela integral de 15 segundos. A expiração automática do aviso também inicia a seleção. Regressão de servidor cobre o reinício do prazo; no navegador, fechei Terremoto e confirmei os 15 segundos completos, com a mensagem de que não havia alvo elegível.
- Próxima validação: selecionar Apagão sobre uma propriedade elegível de outra pessoa e comprovar numa chegada posterior que o aluguel não foi cobrado. Revisar visualmente as demais cartas autorais.

## Ferramentas DEV para testes de partida — concluído (2026-10-31)

- O pedido foi adicionar um teleporte DEV para escolher diretamente qualquer casa, além de definir o saldo de qualquer participante e ativar dinheiro infinito.
- A anfitriã, em uma sala com Modo DEV ativo, pode escolher entre as 40 casas. O peão teleporta sem percorrer casas nem receber bônus de passagem pela Partida; a chegada chama o resolvedor normal para compra, aluguel, imposto, carta ou efeito especial.
- O saldo pode ser ajustado até o limite numérico do jogo. O dinheiro infinito evita descontos nos gastos e pagamentos do participante escolhido; as receitas pagas a outros participantes continuam sendo creditadas.
- `npm run verify`: 237 testes em 46 arquivos e builds de frontend/servidor passaram. Graphify foi atualizado.
- A revisão manual numa sala com bot confirmou teleporte para Canaã dos Carajás, abertura da compra regular, definição visual do saldo em R$ 1.230.000 e ativação do dinheiro infinito. Testes cobrem também construção e pagamento de aluguel sem desconto do saldo infinito.
- Nota de validação: [Ferramentas DEV de teleporte e saldo](VALIDACAO.md#2026-10-31--ferramentas-dev-de-teleporte-e-saldo).
- Próximo passo concreto da reforma completa: revisar visualmente as cartas restantes. A recompra forçada e o teleporte direto para qualquer uma das 40 casas já foram validados na interface.

## Playtest da Linha 0 — concluído (2026-10-31)

- Em partida local com Modo DEV, adquiri os sete títulos do lado 0 (Canaã dos Carajás, Porto Velho, AgroBrasil, Parauapebas, Belém, Manaus e Rio Verde). O último título encerrou a partida por Monopólio em Linha.
- O painel final mostrou vencedor, patrimônio de R$ 2.550.000, saldo de R$ 100.000 e classificação. A vitória também foi registrada no bloco “Vitórias por monopólio na interface”.
- Em outra sala, confirmei a recompra forçada de Manaus com três casas por R$ 2.437.500 e o repasse direto ao antigo dono; ver [Recompra forçada na interface](#recompra-forçada-na-interface--concluído-2026-10-31).
- Na Copa do Mundo, a cena iluminou os imóveis próprios válidos e apagou os demais. A carta Generoso abriu a seleção de imóvel no tabuleiro; o efeito ainda não foi concluído naquela sessão.
- Nota de continuidade da frente: [Reforma BANTEC](trabalho/reforma-bantec.md).

## Auditoria de cartas e dívida — progresso (2026-10-31)

- Conferi as regras aprovadas contra `server/test/GameRoom.test.ts`: os efeitos das 12 cartas, pagamentos de Aniversário e Ladrão com dívida, Terremoto, Apagão, Proteção, movimentos, troca de posição, Cidade-sede sem sede e início têm cobertura de integração autoritativa.
- A exceção de hotel para Apagão e Terremoto não tinha regressão específica. Adicionei um teste que tenta os dois efeitos num imóvel com hotel e confirma rejeição sem alterar posse, hotel ou aluguel suspenso; passou.
- `npm run verify`: 234 testes em 46 arquivos passaram; builds do frontend e servidor passaram. Graphify foi atualizado. Permanece o aviso conhecido do chunk 3D acima de 500 KB.
- No navegador, uma partida de dois participantes confirmou a carta Aniversário (+R$ 50.000 recebido do outro participante) e a dívida de aluguel de R$ 210.000 em Maceió. A seleção pelo tabuleiro vendeu um nível de construção em Joinville e outro em Belém; a dívida foi paga e os títulos continuaram com o anfitrião.
- Playtest desta retomada: uma sala local encerrou quando o relógio chegou a zero; a interface exibiu “PARTIDA ENCERRADA”, vencedor, classificação, patrimônios/saldos e botão para voltar ao início, sem travar.
- Registro histórico: a dívida e o fim por tempo foram vistos na interface; as vitórias por Linha e Duplo Regional foram concluídas em 2026-10-31. A revisão visual das cartas restantes e da recompra forçada permanece aberta.
- Nota de continuidade da frente: [Reforma BANTEC](trabalho/reforma-bantec.md).

## Rota regional na home BANTEC — concluído (2026-10-31)

- A home agora exibe o percurso Norte → Centro-Oeste → Nordeste → Sul → Sudeste, com as cinco cores de região e a composição de 24 cidades/40 casas/quatro companhias. O indicador “01/03” foi substituído por informações reais do tabuleiro.
- `HOME_REGION_ROUTE` deriva a sequência e as cores dos dados compartilhados do tabuleiro, evitando uma segunda lista divergente. Testes verificam os cinco nomes, a ordem, as cores e a responsividade da rota.
- Revisão visual no navegador local em 964×883, 390×844 e 320×568: no menor viewport encontrei uma barra horizontal causada pelo `min-width: 320px` do `body`, que ultrapassava a área útil quando a barra vertical estava presente. Removi o piso fixo; a nova captura em 320×568 não mostra rolagem horizontal. Em 390×844, a rota continua em uma linha e a rolagem revela o formulário completo.
- `npm run graphify -- update .` concluiu. `npm run verify` passou com 233 testes em 46 arquivos; builds do frontend e servidor passaram. O chunk de cena 3D permanece acima de 500 KB.
- O Vite iniciou normalmente. Colyseus retornou `EADDRINUSE` em 2567 sem listener identificável em `Get-NetTCPConnection` ou `netstat`, então não interrompi processo desconhecido; não foi necessária sala para validar a home.
- Registro histórico: nessa data faltavam revisar as cartas e observar as vitórias por Linha/Duplo Regional e o fim por falência; as vitórias foram observadas em 2026-10-31 e o painel após insolvência apareceu nesta retomada.

## Cartões coloridos, avisos identificados e visibilidade das peças — concluído (2026-10-30)

- Pedido atual: controles de botões para o lance inicial de leilão em mouse/touch; avisos com nome e cor do participante; cartões sem avatar/status, contendo nome e saldo em destaque sobre a cor integral do jogador e preservando os símbolos de dinheiro no canto superior direito; contorno para todas as fichas e aumento leve das construções.
- Estado inicial: `main` alinhada com `origin/main`; preservar `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1`, que já estavam modificados. A correção de aeroporto já estava na cena Blender do usuário; exportei os 38 meshes ao GLB do jogo em Y-up sem salvar por cima do `.blend` local.
- Implementação concluída: controles de lance em passos de R$ 10.000 com mínimo protegido; avisos identificam e colorizam a pessoa ativa; cartões mostram somente nome e saldo grande na cor do participante e mantêm os símbolos 3D no alto à direita; contornos traseiros nas fichas e construções na escala 1,25.
- `npm run verify`: 204 testes e builds de frontend/servidor passaram, inclusive no hook de pré-commit. A revisão visual em partidas locais confirmou cartões simplificados e o aeroporto na casa Volta ao Mundo. A personalização de avisos, os passos do lance e o material de contorno têm testes de regressão. Graphify update foi tentado, mas a CLI não está instalada.
- Próximo passo concreto: conferir a leitura dos cartões em diferentes resoluções após os próximos playtests humanos.
# Andamento do projeto

## Playtest de compras e aluguel — progresso (2026-10-31)

- Numa sala local de 30 minutos com modo DEV, saldo inicial de R$ 2.000.000 e um bot, comprei Belém por R$ 350.000. A prévia exibiu aluguel de R$ 35.000; o bot caiu nela e pagou esse valor.
- O anfitrião recebeu R$ 200.000 ao passar pela Partida e comprou Manaus por R$ 650.000; o saldo exibido ficou em R$ 1.200.000. O bot comprou Aviação Brasil por R$ 500.000 e Recife com uma casa por R$ 712.500. Depois de parar em Rio Verde, o saldo do bot apareceu como R$ 1.437.500; a posse não foi inspecionada.
- A sessão confirmou o fluxo de compra, a escada de preços/aluguel e o bônus de Partida. Ela não chegou a uma condição de vitória. A rota da Linha 0 não foi concluída nesta sessão.
- Próximo passo concreto: iniciar uma nova sala e terminar uma vitória pela interface; depois observar Monopólio Duplo Regional e falência. As cartas restantes também continuam pendentes de revisão visual.
- Nota de continuidade: [Reforma BANTEC](trabalho/reforma-bantec.md).

## Precisão dos aluguéis BANTEC — progresso (2026-10-31)

- O playtest de compra de Belém expôs um erro: três casas mostravam R$ 244.999, embora 70% de R$ 350.000 sejam R$ 245.000. A causa era `Math.floor` aplicado ao resultado de ponto flutuante.
- A fórmula agora arredonda ao real mais próximo. O teste de regressão falhou antes da correção com R$ 244.999 e passou depois. No navegador, a compra de Belém mostrou R$ 245.000 em três casas e preço total de R$ 875.000.
- `npm run graphify -- update .` concluiu. `npm run verify` passou: 235 testes em 46 arquivos, build do frontend e build do servidor. A primeira execução de testes falhou porque o sandbox bloqueou o loopback (`fetch failed`); a repetição com a permissão local do playtest passou. Continua o aviso conhecido do chunk 3D acima de 500 KB.
- A árvore segue em `main`; as mudanças locais nos arquivos do Blender foram preservadas. O painel de compra confirmou R$ 245.000 para Belém com três casas. Em seguida, uma partida real venceu pelas quatro companhias e mostrou o resultado final sem ser coberto por avisos ou painéis.
- Próximo passo concreto da reforma: revisar visualmente as cartas restantes e observar encerramentos por tempo e falência pela interface. A dívida já foi liquidada numa partida real; as três vitórias imediatas têm cobertura de integração e a vitória pelas quatro companhias foi observada no navegador.

## Painel de encerramento da partida — concluído (2026-10-31)

- Relato: ao finalizar a partida, o painel de resultado pode sumir ou ficar com estado visual incorreto.
- Causa confirmada no frontend: o cartão final herdava condições transitórias de carta ativa e de fila de avisos; a etapa visual de dados/peão também podia manter texto de espera no resultado. Modais locais abertos (ajuda, configurações, carteira, leilão ou troca) podiam continuar sobre a partida encerrada.
- Correção: resultado final passa a ter prioridade sobre cartas, animações e avisos pendentes; ao receber o estado encerrado, a interface limpa animações, avisos e painéis locais. Ajuda e configurações não podem cobrir o resultado final.
- `npm run verify`: 231 testes em 45 arquivos e builds do frontend/servidor passaram; `npm run graphify -- update .` atualizou o grafo. O build mantém o aviso conhecido de chunk 3D acima de 500 KB.
- A lógica que prioriza o painel final está coberta por regressão automatizada. Em 2026-10-31, uma partida real de dois participantes venceu ao obter AgroBrasil, Aviação Brasil, Energia Brasil e Mineração Brasil. O painel exibiu “PARTIDA ENCERRADA”, “VENCEDOR DA PARTIDA”, patrimônio de R$ 2.400.000, saldo de R$ 50.000 e a classificação completa; a captura visual confirmou o painel central legível sobre o tabuleiro.
- Os testes de integração do servidor verificam vitória por Monopólio em Linha, Monopólio Duplo Regional e quatro companhias; a vitória por companhias também foi concluída no navegador. Falência e fim por tempo têm testes de integração, mas ainda faltam observar esses finais pela interface.
- Próximo passo concreto: percorrer visualmente as cartas restantes e validar o painel final ao encerrar por tempo ou falência.

## Reforma BANTEC — implementação em andamento (2026-10-31)

- Decisões aprovadas e preços das 24 cidades, cinco regiões, cores de piso, monopólios, impostos diferenciados, recompra por 1,5×, saldo inicial de R$ 2 milhões para playtest e partidas de 15/30/60 minutos estão em `docs/DECISOES.md`, `docs/REGRAS-DE-JOGO.md` e `docs/PLANO.md`.
- Implementados: composição regional de 40 casas, fórmula de aluguel escalonada, vitórias por Monopólio em Linha/Duplo Regional/quatro companhias, duração e cor escolhidas no lobby, bônus da Volta ao Brasil, recompra forçada sem consentimento do dono, remoção do Express, modelo central da FATEC Itapetininga com três blocos e torre, e nova rolagem por duplas com Prisão na terceira dupla seguida.
- A preferência local de modo noturno está implementada na home, sala e jogo: a home fica escura por inteiro, enquanto na partida apenas o fundo externo ao tabuleiro muda de cor. O ajuste persiste neste navegador. Os atalhos Bens, Config, Emote e Regras agora formam uma coluna de botões quadrados iguais na lateral direita, com tamanhos responsivos.
- O baralho autoral de 12 cartas já está no código e no servidor, incluindo alvos escolhidos pelos jogadores e pagamentos com tratamento de dívida. A seleção de qualquer cidade/imóvel usa o tabuleiro, com casas válidas iluminadas e inválidas apagadas. Durante dívida, devolver uma propriedade ao banco rende metade do preço, libera o título e apaga suas construções; hipoteca, resgate e aluguel por dado das antigas estações foram removidos.
- No playtest foram resolvidas Volta ao Brasil (destino São Paulo e compra), Troca-troca e Prisão (com opção de aguardar), além da seleção de propriedades, carteira, compra e recusa. A revelação e as mensagens do servidor usam agora o nome “Volta ao Brasil”. A interface também confirmou uma vitória real por quatro companhias e o painel final. Ainda faltam percorrer as demais cartas, liquidar uma dívida real e validar outras condições de vitória.
- O Graphify local deve ser usado exclusivamente por `npm run graphify -- <comando>`; consultas precedem navegação no código e `npm run graphify -- update .` atualiza o grafo após mudanças. Foi confirmado que o comando local funciona neste ambiente.
- Os dados agora rolam acima da FATEC no centro do tabuleiro; um teste de regressão garante que ambos ficam acima do edifício e que o indicador do resultado fica mais alto. A revisão do navegador confirmou a rolagem lado a lado, sem cobrir a FATEC, e o fundo externo escuro sem escurecer o tabuleiro. A home e o lobby também foram revisados em modo noturno, incluindo os seletores de duração.
- Nesta revisão, baixei os dados para Y=2,3 e reduzi o salto da rolagem para 0,16 unidade, mantendo margem acima da torre; o indicador do total passou para Y=3,05. A conferência visual em partida ativa confirmou os dados suspensos sobre a FATEC, sem interseção visível; os detalhes estão em `docs/VALIDACAO.md`.
- A partida real no navegador confirmou compra de Parauapebas, compra de São Paulo com duas casas por R$ 1.900.000, carteira e seleção pelo tabuleiro. Os dados apareceram sobre a FATEC sem cobrir seus prédios; o modo noturno deixou o tabuleiro colorido e escureceu só o fundo de fora.
- `npm run graphify -- update .` atualizou o grafo local. `npm run verify` passou com 231 testes em 45 arquivos e builds frontend/servidor; permanece o aviso conhecido de chunk 3D acima de 500 KB.
- A correção do painel de encerramento está publicada em `391e8bf` e foi validada visualmente numa vitória pelas quatro companhias. Próximos passos concretos: (1) finalizar a revisão da home BANTEC; (2) liquidar uma dívida real; (3) percorrer as cartas restantes; (4) validar vitórias em linha e duplo regional, além do fim por tempo/falência.

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
# Lançamento cosmético de objetos — concluído (2026-10-31)

- Adicionei aos cartões dos adversários um seletor de tomate, ovo, lama e farinha. O servidor valida o alvo, o participante e o item e limita cada par lançador/alvo a um lançamento a cada cinco segundos.
- Cada objeto é animado em 3D da ficha de quem lançou até a ficha-alvo; apenas o cliente atingido recebe o overlay visual por três segundos. O overlay não captura cliques. Em sala local com dois clientes, vi o tomate alcançar a ficha e o efeito aparecer apenas no alvo; abri Bens enquanto ele estava ativo, confirmando que a interface continuou clicável.
- Regressões cobrem alvo inválido, item inválido, alvo próprio, sucesso, cooldown e lançamento a outro alvo durante o cooldown do primeiro. `npm run verify` passou com 252 testes em 48 arquivos, build web e build do servidor; o Vite manteve o aviso conhecido de chunk 3D acima de 500 kB. `git diff --check` passou. Graphify foi atualizado.
- Próximo passo: seguir com a próxima frente pendente da reforma e continuar os playtests humanos de equilíbrio e duração.
# Trajetória do arremesso em fichas em movimento — concluída (2026-10-31)

- O projétil antes calculava a origem e o destino a partir da casa lógica (`player.position`), que muda antes da ficha concluir o movimento visual. Agora cada ficha registra seu grupo 3D animado; o arremesso captura a origem visual no disparo e atualiza o alvo pela posição renderizada a cada frame.
- Regressões cobrem ancoragem e percurso entre coordenadas atuais, incluindo movimento e limites exatos de início/fim. Em playtest local, lancei durante a animação do Bot 1 e vi o tomate junto à ficha em movimento; o percurso usou a ficha que estava visível, em vez da casa final.
- `npm run verify`: 254 testes em 49 arquivos passaram; builds frontend/servidor passaram. `npm run graphify -- update .` atualizou o grafo para 977 nós e 1.820 arestas. O build mantém o aviso conhecido de chunk 3D acima de 500 kB.
- Próximo passo: continuar os playtests humanos pendentes da reforma BANTEC.
# Revisão econômica inspirada em Business Tour — concluída (2026-11-01)

- O usuário confirmou a direção de aproximar a economia das cidades ao Business Tour: caixa inicial segue em R$ 2.000.000; bônus por volta passa a R$ 300.000; Copa dobra o aluguel; as quatro companhias continuam vencendo a partida, e o aluguel usa R$ 50.000 × quantidade de companhias do dono × resultado de um dado de seis faces (apenas até três companhias).
- Dados observados pelo usuário em 20 cidades do Business Tour: custos BUY/RENT são acréscimos por nível; festivais escolhem três cidades no início e elevam seu aluguel (Roma mostrou R$ 320.000 com duas casas contra R$ 160.000 da tabela base); recompra observada a 2× o investimento. Ao cair exatamente na Partida, a pessoa recebe uma oportunidade paga de melhorar uma cidade aleatória própria, sem precisar estar nela.
- Para BANTEC, o usuário aprovou distribuir a curva de 20 cidades entre as 24 cidades por interpolação, manter 40 casas para preservar a disponibilidade aproximada por cidade, manter as taxas atuais por falta de referência do Business Tour e tratar o acúmulo de bônus por último, aceitando aluguel muito alto como parte do ritmo rápido.
- A economia foi aplicada aos módulos do servidor, tabuleiro e HUD; as regras e decisões vigentes foram atualizadas. As alterações locais preexistentes em `assets/blender/special-corners.blend` e `.blend1` foram preservadas e ficaram fora do escopo.
- Validação concluída conforme a seção inicial e `docs/VALIDACAO.md`; próximo passo é observar partidas completas com pessoas para avaliar duração, ritmo de falência e frequência dos aluguéis extremos.
