# Cena sem luzes e sombras

## Fatos

- Pedido de 2026-10-29: remover todas as luzes e sombras 3D por desempenho; destacar casas escolhíveis com suas cores/materiais originais e reduzir em aproximadamente 80% o contraste e brilho de casas não escolhíveis, incluindo piso e construções.
- A cena R3F principal tinha uma luz ambiente, uma direcional e `ContactShadows`; o Canvas de dinheiro tinha outras duas luzes. Pisos, cenografia, peões e modelos GLB usavam materiais dependentes de luz.
- `main` local e `origin/main` estavam em `90c968a`; o `git fetch origin` foi negado ao gravar `.git/FETCH_HEAD`.
- Graphify MCP está autorizado apenas para `GustavoGLD/Hospital`; `graphify` CLI não está instalado.

## Decisão confirmada

- Retirar fontes de luz, mapas/passes de sombra e receivers dos dois canvases. Usar materiais sem iluminação preservando cor, textura e transparência dos GLBs.
- Durante seleção de destino, casas válidas mantêm as cores. Casas inválidas têm o contraste reduzido nos materiais existentes, sem geometria escura sobreposta. Ao sair da seleção, restaurar as cores originais.

## Implementação

- `src/ui/sceneMaterials.ts` cria materiais unlit e aplica/restaura redução de contraste.
- `src/ui/BoardScene.tsx` remove luzes/sombra, converte materiais próprios e GLB, e liga a redução de contraste às casas e construções indisponíveis.
- `src/ui/CashHud.tsx` remove suas luzes e converte os modelos de dinheiro para materiais sem iluminação.
- `src/ui/sceneMaterials.test.ts` cobre conversão, contraste e restauração.

## Validação

- `npm run verify`: 180 testes em 33 arquivos, build frontend e build servidor passaram. `git diff --check` passou; o chunk GLTF assíncrono continua em 956,03 KB / 259,61 KB gzip.
- O playtest local exibiu o tabuleiro sem luzes e sombras e manteve o arraste da câmera. A leitura CUA foi 7 FPS / 141,7 ms durante arraste sintético, que não comprova desempenho real no Chrome. O estado visual de seleção não foi alcançado manualmente; helper de cor tem testes para desaturação, escurecimento e restauração.
- A automação não conseguiu acessar o Chrome standalone ao não identificar a URL da janela ativa. O Graphify CLI não está instalado e o MCP atual aponta para outro repositório.

## Próximo passo

- Sincronizar e publicar a mudança diretamente em `main` com o hook de pré-commit ativo; depois repetir a amostra de FPS no Chrome real e inspecionar visualmente uma seleção Copa/Volta.
