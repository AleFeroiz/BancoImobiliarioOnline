# Posicionamento de propriedades e bandeiras — 2026-11-02

## Fatos verificados

- Os quatro lados do tabuleiro giram as peças de propriedade; nas laterais, a largura local do modelo vira a dimensão radial voltada à borda.
- Terreno, casas e hotel são raízes nomeadas dentro de `board-models.glb`. As fontes Blender deixam esses modelos alinhados como uma faixa de variações, então as raízes podem estar afastadas de (0,0,0) no arquivo.
- Em runtime, cada raiz é clonada, a transformação raiz é zerada e seus limites são recentralizados; a base é apoiada em Y=0 no eixo Y-up usado pelo GLB/Three.js. Esse arranjo em faixa não é o deslocamento exibido na mesa.
- Companhias usam o mesmo tipo de casa `property` que cidades e entram no conjunto de imóveis próprios.

## Correções aplicadas

- O recuo até a borda agora considera largura nas laterais e profundidade nos lados de cima/baixo, incluindo o rótulo de aluguel.
- A bandeira de festival fica na borda voltada para o interior, com o sentido local ajustado para as quatro orientações do percurso.
- Na transferência que altera ao mesmo tempo dono e nível de construção, o modelo sincroniza o nível recebido e reinicia as transformações da animação. O modelo usado na animação de terremoto também limpa a transformação raiz de origem e usa o mesmo alinhamento de borda.
- O cartão agora destaca cidades e companhias; o nome acessível do controle fala em títulos.

## Validação

- `npm run verify`: 55 arquivos e 296 testes aprovados, build web e build do servidor concluídos; permanece o aviso de chunk 3D acima de 500 kB. A primeira execução após renomear o controle de destaque encontrou uma expectativa textual antiga, atualizada junto com o nome acessível.
- Playtest local: sala com bot iniciou; Porto Velho foi comprado e apareceu no tabuleiro com aluguel e modelo; cartão selecionado destacou o título e escureceu os demais pisos.
- Blender MCP conectado: versão 5.2.2 LTS. Apenas inspeção de cena; nenhum arquivo `.blend` ou `.glb` foi modificado nesta frente.

## Próximo passo

- Observar uma liquidação e recompra numa sessão com outra pessoa, com atenção às construções em ângulo próximo. A regressão visual de transferência simultânea de dono e nível é coberta pela lógica testada; o fluxo completo não foi reproduzido manualmente.
