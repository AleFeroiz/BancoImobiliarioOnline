# Otimização após relato de 2 FPS

## Fatos

- Em 2026-10-29, depois de receber o medidor, o usuário relatou que o número demorou a aparecer e chegou a mostrar 2 FPS.
- O commit em `main` no início desta correção era `866b8b9`.
- A cena R3F usa renderização sob demanda. O HUD de dinheiro é outro Canvas sob demanda, sem invalidação contínua enquanto a câmera do tabuleiro se move.
- Antes da correção, a cena recalculava sombras direcionais durante o movimento da câmera, construía quatro meshes de acabamento por casa, raycastava detalhes decorativos e mantinha 40 texturas de rótulo 768×384.

## Implementação

- Remover sombras direcionais dinâmicas do renderer do tabuleiro, mantendo a sombra de contato capturada uma vez.
- Consolidar os quatro filetes de acabamento de cada casa em uma única geometria e reduzir detalhes que entram no raycast. Só o piso da casa precisa detectar seleção.
- Reduzir os rótulos para 512×256, desligar antialiasing nativo e usar material Lambert nos pisos das casas.
- Fazer o medidor apresentar a primeira taxa após dois frames e exibir “ocioso” quando a cena parar antes de completar uma amostra longa.

## Validação concluída localmente; Chrome standalone pendente

- `npm run verify`: 176 testes em 32 arquivos passaram; builds web e de servidor passaram.
- Em partida Colyseus local com três bots no browser integrado, o medidor mostrou 77 FPS / 13,0 ms e depois 75 FPS / 13,3 ms durante e logo após arrastar a câmera. O tabuleiro permaneceu legível no novo ângulo e a leitura voltou a “ocioso” em repouso.
- O Chrome standalone não está conectado como browser controlável na sessão. A captura local valida o caminho visual e os eventos, mas não substitui a medição no Chrome/hardware do usuário.
- `graphify update .` falhou porque a CLI não está instalada e o MCP Graphify aponta para outro repositório.

## Próximo passo

Publicar a correção em `main` e comparar o resultado na mesma máquina/Chrome em que foi observado 2 FPS.
