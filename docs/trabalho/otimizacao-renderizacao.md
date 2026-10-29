# Otimização de renderização

## Fatos verificados

- A cena do tabuleiro usa React Three Fiber com sombras direcionais e `ContactShadows` em resolução padrão de 512. A implementação instalada do Drei define `frames = Infinity`; a cada frame ela renderiza a cena em uma textura de profundidade e executa duas passagens de desfoque.
- A câmera principal e a camada 3D do dinheiro rodavam continuamente. Os peões também oscilavam em repouso.
- Cada snapshot Colyseus recriava arrays de jogadores, mapa de propriedades e par de dados, inclusive em atualizações de relógio sem mudança no tabuleiro.
- O limite de densidade da tela principal era 1,6; o HUD 3D do saldo seguia o padrão do Canvas do R3F.
- O projeto usa React, TypeScript, Vite, Three.js/R3F e Colyseus. O estado inicial estava em `main`, alinhado a `origin/main`.

## Implementação concluída

- A sombra de contato agora atualiza uma vez, em resolução 256, com desfoque duplicado desligado; a sombra direcional continua dinâmica em 512.
- Os dois canvases 3D usam renderização sob demanda, limitam DPR a 1,25 e retomam durante animações e alterações de câmera. Os peões ficam parados enquanto não se movem.
- Relógios não substituem listas/mapas de jogadores ou imóveis e dados sem alteração; o canvas principal compara apenas os valores que afetam a cena. A camada de dinheiro é carregada quando a partida abre e também fica sob demanda.
- Rótulos reduziram de 1024×512 para 768×384, com filtragem anisotrópica limitada a 4.
- O arraste usa Pointer Events para mouse e toque também em áreas sem controles. Botões, campos, seletores e painéis clicáveis não iniciam órbita; CSS evita selecionar texto durante o gesto.

## Validação concluída

- `npm run verify`: 171 testes em 31 arquivos; build web e build do servidor passaram.
- O pacote inicial foi de 1.419,60 KB/405,36 KB gzip para 458,01 KB/143,60 KB gzip (reduções de aproximadamente 67,7% e 64,6%). O pacote GLTF de 955,19 KB (259,21 KB gzip) é carregado somente dentro da partida; o aviso de chunk continua.
- Em partida Clássica local com três bots, viewport 690×880: observei rolagem, deslocamento do peão, resolução e carta Sorte. O arraste no cartão sem ação girou a câmera; o botão de compra permaneceu funcional.
- O código compartilha o gesto via Pointer Events, porém a inspeção manual não foi feita em aparelho físico nem em viewport de 390×844 nesta sessão.
- `graphify update .` não rodou: CLI ausente. O MCP acessível aponta para `GustavoGLD/Hospital`.

## Limites conhecidos e próximo passo

- A captura única da sombra de contato é estática; as sombras direcionais permanecem dinâmicas durante o movimento das peças.
- O dispositivo móvel físico e a viewport estreita precisam de revisão quando estiverem disponíveis; a próxima validação pode comparar fluidez em aparelho modesto.
- O provedor Node do Render permanece uma decisão operacional pendente; este trabalho não publica o jogo.
