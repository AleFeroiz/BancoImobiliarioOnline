# BANTEC

Jogo de tabuleiro 3D para navegador, para partidas privadas entre amigos. Sem conta: cada pessoa informa um nome e cria uma sala ou entra usando código. Para 2–4 pessoas, em uma modalidade com duração escolhida no lobby: 15, 30 ou 60 minutos. O tabuleiro representa as cinco regiões do Brasil e tem 24 cidades, quatro companhias, quatro taxas, quatro casas Sorte ou Revés e quatro cantos especiais. Ao comprar um terreno residencial, é possível incluir até três casas; novas casas exigem revisitar o imóvel e o hotel só fica disponível numa visita posterior quando ele já tem três casas.

## Estado atual

Cada pessoa tem 20 segundos para lançar os dados e 15 segundos para cada decisão; expirações seguem o padrão automático das regras. O botão “?” abre um guia rápido, e mudanças no saldo local tocam efeitos distintos para dinheiro recebido e pago.

O cartão de cada participante exibe brevemente ganhos em verde ou perdas em vermelho sempre que o saldo muda.

Os modelos 3D de cédulas e maços de ouro e prata acompanham o saldo de cada participante. Na partida, o tabuleiro e o HUD 3D usam materiais sem luzes ou sombras; avisos aparecem em sequência e aguardam antes de mostrar a próxima decisão. A tela ocupa toda a janela, com inclinação inicial discreta e câmera orbitável pelo arraste do mouse ou toque no tabuleiro. Durante escolhas de destino, as casas indisponíveis ficam apagadas pela alteração dos próprios materiais, enquanto as opções válidas preservam as cores. Copa do Mundo e Volta ao Brasil usam um estádio e um aeroporto com avião low-poly originais. Os quatro pisos Sorte formam roletas completas, e a rolagem usa dados 3D nivelados com o total legível durante o movimento do peão. Cartas informativas são temporárias; os saldos 3D aparecem ligados aos cartões dos participantes na interface.

Somente propriedades que já têm dono mostram o aluguel em texto 3D maior e reforçado, voltado para a câmera; o valor acompanha o monopólio regional, as construções e a sede da Copa. Clicar numa propriedade abre uma inspeção visual dos níveis do terreno e respectivos aluguéis, destacando o nível já construído.

Durante uma partida, o menu **⚙** abre uma tela sobreposta sem pausar ou travar a partida. Nela é possível escolher qualidade gráfica, ativar medidor de FPS, silenciar áudio e reduzir movimento; alta resolução (1–2×) é o padrão. O botão de emotes mostra por alguns segundos, sobre o peão de quem enviou e para toda a sala, joia, deslike, risada, raiva, dedo do meio e choro. Ao cair no Aeroporto, na Prisão ou na Copa do Mundo, a partida toca efeitos próprios de passagem de avião, sirene e torcida.

A versão atual contém a experiência inicial BANTEC, salas privadas Colyseus por código, lobby sincronizado e uma cena 3D original em React Three Fiber. A anfitriã pode preencher lugares vagos com bots; se uma pessoa cair durante a partida, um bot assume a mesma cadeira imediatamente, e ela retoma o controle ao reconectar. No lobby, escolhe-se duração e cor do jogador; a anfitriã controla a velocidade visual da sala e pode habilitar ferramentas DEV para os dados. As regras regionais, aluguéis escalonados, duplas com nova rolagem e Prisão na terceira dupla consecutiva, recompra forçada, impostos por título e vitórias por monopólio são validados pelo servidor. A partida inclui casas, hotéis, as doze cartas Sorte ou Revés da reforma, prisão, Copa do Mundo, Volta ao Brasil, dívidas, falência e negociação de dinheiro e títulos. O título devolvido ao banco durante uma dívida deixa de pertencer ao jogador e volta a ficar livre. Construções ficam no piso preservando a passagem e os nomes das casas. A cena usa construções low-poly originais, pisos diferenciados por região e, no centro, um modelo visual dos três blocos e da torre da FATEC Itapetininga. A partida conta com uma trilha ambiente procedural original e efeitos opcionais, controlados pelo botão de áudio. A preferência local de modo noturno escurece a home e apenas o fundo externo durante a partida. O estado atual e as validações pendentes ficam em `docs/ANDAMENTO.md`.

No Modo DEV ativado no lobby, a anfitriã também pode teleportar a pessoa da vez diretamente para qualquer casa (a chegada aplica o efeito normal), ajustar o saldo de qualquer participante, ativar dinheiro infinito e preparar uma carta Sorte ou Revés específica para o próximo sorteio. A carta preparada é decidida e consumida pelo servidor uma única vez, para facilitar testes sem afetar partidas normais.

## Desenvolvimento local

Requer Node.js 24 LTS e npm 10 ou superior. Abra dois terminais na pasta do projeto:

```sh
npm install
npm run dev:server
```

```sh
npm run dev
```

## Rotina no PC de casa

### Atualizar o projeto pelo GitHub

Abra o PowerShell na pasta do repositório e confira o estado antes de sincronizar:

```powershell
git status --short --branch
git fetch origin
git status --short --branch
git log --oneline --left-right main...origin/main
```

O projeto trabalha diretamente na branch `main`. Se a árvore estiver limpa e o histórico local só estiver atrás, atualize por avanço rápido:

```powershell
git switch main
git pull --ff-only origin main
```

Se houver arquivos modificados, preserve-os e revise antes de trocar de branch ou puxar alterações. Não use reset, limpeza forçada ou sobrescrita para resolver divergências.

### Abrir a partida local no navegador

Instale Node.js 24 LTS e npm 10 ou superior. Na primeira instalação, ou quando o lockfile mudar, rode `npm ci` na raiz do projeto. Abra dois terminais PowerShell nessa pasta. Deixe o servidor de salas no primeiro:

```powershell
npm run dev:server
```

Inicie o site no segundo:

```powershell
npm run dev -- --host 127.0.0.1
```

Abra [http://127.0.0.1:5173/](http://127.0.0.1:5173/) no navegador. O Vite usa a porta 5173 e Colyseus a porta 2567; mantenha somente uma instância de cada servidor. Pare cada uma com Ctrl+C.

No terminal integrado do Codex, o sandbox pode impedir conexões locais mesmo quando um comando imprime “ready/listening”. Nesse caso, permita acesso de loopback para o servidor e o Vite, confirme que ambos iniciaram e só então abra a URL local. Se aparecer `EADDRINUSE`, já há algo ouvindo naquela porta: confira o PID e confirme que é uma sessão antiga deste projeto antes de encerrá-la; não finalize processos desconhecidos.

### Abrir o Blender e os assets

Na última conferência deste PC (2026-10-28), o Blender instalado era 5.2.2 LTS. Abra-o, habilite o add-on `Interface: Blender MCP` nas preferências de Add-ons e inicie `Start MCP Server` no painel do add-on. No Codex, confirme a conexão e a versão com `get_addon_status` e confira a cena com `get_scene_info` antes de modelar.

A conferência de 2026-10-28 encontrou o add-on no protocolo 14, atrás do protocolo 15 esperado pelo servidor. Para atualizar, rode `uvx mcp-for-blender install-addon` no PowerShell; depois reinicie o Blender ou desabilite e habilite `Interface: Blender MCP` nas preferências, inicie `Start MCP Server` outra vez e confirme que `get_addon_status` informa `up_to_date: true`. Se `uvx` não estiver disponível, instale `uv` pelo método oficial documentado pelo projeto Astral e reabra o PowerShell. Não comece modelagem pelo MCP enquanto não confirmar a conexão e a versão atual.

Os modelos editáveis ficam em `assets/blender/`; os GLB usados no jogo ficam em `public/assets/`. O modelo de tabuleiro está em `assets/blender/board-models.blend` e `public/assets/board-models/board-models.glb`; as fichas de veículo estão em `assets/blender/player-tokens.blend` e `public/assets/player-tokens.glb`. Blender usa Z-up; exporte GLB com Y-up para Three.js. Consulte o fluxo completo e os limites do safe mode em `AGENTS.md`.

### Verificar e publicar alterações

Antes do commit, revise os arquivos e rode:

```powershell
npm run verify
git diff --check
git status --short --branch
```

O hook de pré-commit também executa `npm run verify`; espere terminar e não o desative. O fluxo deste projeto publica diretamente na branch `main`, sem branch de tarefa ou PR salvo quando o usuário pedir:

No terminal do Codex no Windows, se o Vitest falhar com `EPERM` ao renomear arquivos temporários dentro de `AppData\\Local\\Packages\\sandbox...\\Temp`, rode novamente com `TEMP` e `TMP` apontando para uma pasta temporária dentro do repositório. Se os testes Colyseus falharem com `fetch failed`, permita acesso de loopback local para o comando de verificação e rode-o novamente; isso é uma falha de acesso do ambiente, não um resultado válido da suíte. No PowerShell:

```powershell
$env:TEMP = Join-Path (Get-Location) '.tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
npm run verify
```

No PC executando o PowerShell fora do sandbox do Codex, use primeiro o comando normal; aplique esses ajustes somente se aparecerem os erros descritos.

```powershell
git add <arquivos revisados>
git commit -m "descrição curta da mudança"
git push origin main
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Depois do push, confirme que a árvore está limpa e que `HEAD` coincide com `origin/main`. Se o GitHub pedir autenticação, complete-a pelo Git Credential Manager ou GitHub Desktop; nunca coloque token em comando, arquivo ou documentação.

Em produção, configure `VITE_ROOM_SERVER_URL` com a origem HTTP/HTTPS do servidor Colyseus. `.env.example` mostra o formato.

Para executar todos os testes e o build:

```sh
npm run verify
```

O hook Husky executa `npm run verify` antes de cada commit. Correções de bugs devem vir com um teste de regressão.

Para gerar a versão estática para hospedagem:

```sh
npm run build
npm run preview
```

## Estrutura

- `src/ui/`: telas, lobby, HUD, integração Colyseus, estilos e cena React Three Fiber.
- `src/game/`: dados, geometria do tabuleiro e testes independentes do render.
- `assets/blender/` e `public/assets/`: fontes Blender e modelos GLB usados na cena.
- `server/src/`: servidor Colyseus autoritativo e estado sincronizado das salas.
- `server/test/`: testes de integração das salas reais.
- `shared/`: contratos compartilhados entre cliente e servidor.
- `docs/PLANO.md`: escopo e fases de produção.
- `docs/REGRAS-DE-JOGO.md`: regras acordadas e referências pesquisadas.
- `docs/DECISOES.md`: decisões confirmadas e detalhes a calibrar.
- `AGENTS.md`: regras de trabalho, incluindo uso obrigatório do Game Studio.

## Direção visual

A imagem de *Business Tour* enviada pelo usuário é referência de câmera inclinada, profundidade e leitura do tabuleiro. A implementação usa composição, nomes, formas e materiais próprios; não inclui assets nem interface copiados do jogo de referência.
