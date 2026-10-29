# Andamento do projeto

> Retrato de trabalho para retomar o projeto entre sessões. Para requisitos e decisões, consulte os documentos de origem indicados em `AGENTS.md`.

## Estado observado — 2026-10-28

- A base do produto está implementada: React + TypeScript + Vite, cena React Three Fiber, regras desacopladas e servidor autoritativo Colyseus, conforme `README.md` e `docs/PLANO.md`.
- As fases de salas online e ciclo de partida estão implementadas. A fase de economia/interação e a fase de acabamento seguem em andamento; confira `docs/PLANO.md` antes de iniciar trabalho nelas.
- Os valores iniciais da economia e dos objetivos Express ainda dependem de playtests com pessoas. A escolha do provedor Node para o servidor também continua pendente.
- A negociação de títulos ainda tem propostas abertas em `docs/DECISOES.md`; não as trate como comportamento aprovado sem nova decisão.
- Evidências de automação, simulação e revisão visual estão em `docs/VALIDACAO.md`. Elas descrevem estados específicos e não substituem uma conferência do código e do ambiente atuais.

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
- `git diff --check` passou; `main` e `origin/main` estavam alinhadas antes da integração. Depois da publicação, futuras frentes continuam diretamente em `main`.

## Retomada

1. Verifique branch, `git status`, upstream e alterações recebidas antes de editar.
2. Leia as instruções e a fonte de verdade aplicável; use `docs/PLANO.md` para escolher ou confirmar a frente de produto.
3. Para trabalho substancial que atravessar sessões, mantenha uma nota própria em `docs/trabalho/` e adicione seu link aqui. Registre só estado verificado, decisões, evidências e a próxima ação.
4. Ao concluir, atualize a nota da frente e este retrato se o estado do projeto tiver mudado materialmente; siga o fluxo de validação e integração definido em `AGENTS.md`.

## Registro inicial da memória de trabalho

- **2026-10-28 — Integração AleDevMemory:** documentação existente mantida como fonte de verdade; este arquivo passa a ser o índice conciso de andamento; `AGENTS.md` define como manter e sincronizar contexto durável. Após instalar dependências com `npm ci --no-audit --no-fund`, `npm run verify` passou: 17 arquivos e 103 testes, build web e build do servidor. A execução precisou apontar `TEMP`/`TMP` para dentro do workspace e permitir acesso de rede local aos testes Colyseus; o build emitiu apenas o aviso já esperado de chunk acima de 500 kB. `git diff --check` passou. Próximo passo: atualizar este arquivo em futuras frentes substanciais e criar notas específicas apenas quando ajudarem a retomada.
