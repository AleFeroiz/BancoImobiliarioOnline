# Banco Imobiliário Online

Jogo de tabuleiro 3D para navegador, para partidas privadas entre amigos. Sem conta: cada pessoa informa um nome e cria uma sala ou entra usando código. Os modos são Clássico Rápido (30 minutos) e Express (seis rodadas de 40 segundos, cerca de 8 minutos), para 2–4 pessoas. Ao comprar um terreno residencial, é possível incluir até três casas; novas casas exigem revisitar o imóvel e o hotel só fica disponível numa visita posterior quando ele já tem três casas.

## Estado atual

Cada pessoa tem 20 segundos para lançar os dados e 10 segundos para cada decisão; expirações seguem o padrão automático das regras. O botão “?” abre um guia rápido, e mudanças no saldo local tocam efeitos distintos para dinheiro recebido e pago.

Os modelos 3D de cédulas e maços de ouro e prata acompanham o saldo de cada participante. Na partida, o tabuleiro e o HUD 3D usam materiais sem luzes ou sombras; avisos aparecem em sequência e aguardam antes de mostrar a próxima decisão. A tela ocupa toda a janela, com inclinação inicial discreta e câmera orbitável pelo arraste do mouse ou toque no tabuleiro. Durante escolhas de destino, as casas indisponíveis ficam apagadas pela alteração dos próprios materiais, enquanto as opções válidas preservam as cores. Copa do Mundo e Volta ao Mundo usam um estádio e um aeroporto com avião low-poly originais. Os quatro pisos Sorte formam roletas completas, e a rolagem usa dados 3D nivelados com o total legível durante o movimento do peão. Cartas informativas são temporárias; os saldos 3D aparecem ligados aos cartões dos participantes na interface.

Durante uma partida, o botão **FPS** na barra inferior ativa um medidor opcional da cena 3D, com quadros por segundo e tempo por quadro; em repouso ele indica que a cena está ociosa.

A versão atual contém a experiência inicial, seletor de regras, salas privadas Colyseus por código, lobby sincronizado e uma cena 3D original em React Three Fiber. A anfitriã pode preencher lugares vagos com bots; se uma pessoa cair durante a partida, um bot assume a mesma cadeira imediatamente, e ela retoma o controle ao reconectar. A anfitriã controla a velocidade visual da sala entre 0,5×, 1× e 2×, iniciando em 1×; em desenvolvimento local, pode ativar ferramentas DEV para forçar os dados na vez ativa. A partida tem turnos autoritativos, dados, movimento, economia, casas e hotéis, cartas Sorte ou Revés, prisão por três turnos, Copa do Mundo com aluguel triplicado na propriedade escolhida, Volta ao Mundo para casa própria, livre ou especial, hipotecas, dívidas, falência e negociação inicial de dinheiro e títulos. Propriedades podem ser compradas ou recusadas; a compra inicial pode incluir até três casas, novas casas exigem revisitar o terreno e o hotel só fica disponível numa visita posterior com três casas prontas. Recusar deixa a propriedade livre e não inicia leilão. Leilões voluntários de títulos próprios só podem ser abertos durante o turno de quem vende; hipotecas só podem liquidar dívidas quando o saldo é insuficiente. Dados, movimento do peão, resolução e ações dos bots são sequenciados pelo servidor para que só uma etapa ocorra de cada vez; observadores veem um balão de atividade junto ao peão e os dados ficam desobstruídos durante a rolagem. O Clássico tem relógio de 30 minutos e resultado por patrimônio; o Express tem seis rodadas cronometradas, objetivo secreto individual com bônus e resultado por saldo, com desempates por patrimônio e dados. As ruas residenciais aparecem em grupos contíguos de três, e as casas Sorte ou Revés usam piso dourado e arte própria de roleta. A cena usa construções low-poly originais criadas no Blender e pisos diferenciados por tipo de casa, com imóveis residenciais preenchidos pela cor de seu grupo. A partida conta com uma trilha ambiente procedural original e efeitos opcionais, controlados pelo botão de áudio. Os detalhes das ofertas de negociação permanecem em `docs/DECISOES.md`.

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
