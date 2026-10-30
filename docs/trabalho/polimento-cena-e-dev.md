# Polimento da cena e ferramentas DEV

## Pedido confirmado

- Posicionar casas na borda interna dos pisos e elevar bases que estejam afundadas; orientar textos para fora em cada lado.
- Deixar órbita de câmera ativa durante animação de peão e habilitar inspeção de casa fora da própria vez, inclusive enquanto outra pessoa joga.
- Corrigir posição do aeroporto no canto Volta ao Mundo e melhorar a apresentação geral da partida.
- Criar opção DEV visível ao anfitrião para escolher resultados dos dados.
- Alterar velocidade inicial das animações de 0,5× para 1×.

## Fatos verificados

- Estado inicial: `main` no commit `40d4f56`, alinhada a `origin/main`.
- Alterações preexistentes de Blender em `assets/blender/special-corners.blend` e seu `.blend1` devem ser preservadas.
- O Graphify conectado não indexa este repositório; a CLI não está instalada.
- A cena usa `BoardScene.tsx`; o servidor autoritativo de salas usa `server/src/rooms/GameRoom.ts`; `DEFAULT_ANIMATION_SPEED` alimenta estado do servidor.

## Decisões de implementação

- Peças, textos e aeroporto permanecem como ajustes visuais do renderer, sem mudar regra ou coordenadas de jogo.
- Inspeção não concede ações de turno; ações de compra/construção/negociação continuam sujeitas às validações atuais.
- Forçar dados é uma ferramenta de teste de anfitrião validada no servidor; valores continuam sendo enviados pelo servidor e não mudam a sequência autoritativa.
- Velocidade inicial passa a 1× tanto no servidor quanto nas referências e documentos.

## Validação e continuidade

- `npm run verify`: 187 testes em 36 arquivos passaram; build web e do servidor passaram; `git diff --check` passou. Permanece o aviso conhecido do chunk 3D (956,10 KB, 259,64 KB gzip).
- Playtest local em viewport 690×865: anfitrião forçou 3+4 (total 7), velocidade inicial 1× e inspeção de Praça Central durante movimento ativo de bot funcionaram.
- Zoom por pinça não foi testado em hardware touch. Blender MCP não conectou; aeroporto centralizado e nivelado em runtime sem alterar a fonte Blender. Graphify CLI ausente, MCP disponível aponta a outro projeto.
- Antes de publicar, revisar diff e preparar somente arquivos desta tarefa; preservar `assets/blender/special-corners.blend` e `assets/blender/special-corners.blend1`, alterações anteriores do usuário.
