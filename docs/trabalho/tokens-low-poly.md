# Revisão visual low-poly das fichas

## Fatos

- A fonte é `assets/blender/player-tokens.blend`; o jogo carrega `public/assets/player-tokens.glb`.
- Blender 5.2.2 LTS e MCP Blender 1.8 estavam conectados. Foi feita cópia de segurança em `.tmp/player-tokens-before-refresh.blend`.
- As 13 fichas existentes foram revisadas em conjunto. Onze silhuetas permaneceram inalteradas; o sapato de salto e o navio precisavam de leitura melhor.
- O salto agora é uma sandália low-poly com palmilha escura estreita, arco exposto, salto fino, tiras cruzadas, tira de tornozelo e fivela dourada. O navio tem casco facetado com proa afilada; cabine, vela e materiais foram preservados.
- Nomes das raízes, materiais partilhados, orientação e escala dos modelos restantes foram preservados. A cor principal do salto continua em `TOKEN_RED`; o detalhe usa `TOKEN_GOLD`.

## Validação

- Revisão visual no Blender em três quartos, perfil e vista superior para o salto; casco verificado em três quartos, perfil e vista superior.
- Exportação GLB em Y-up concluída. O arquivo foi reimportado na sessão Blender e apresentou 13 raízes de ficha; a hierarquia do salto e seus materiais foram confirmados.
- `npm run verify` passou: 406 testes, build Vite e build do servidor. A primeira execução sandbox falhou nos testes Colyseus por `fetch failed`; a repetição com loopback aprovado passou.
- Playtest em servidor local alternativo (2568; 2567 falhou com `EADDRINUSE` sem listener visível) e Vite 5173: selecionei Salto no lobby, iniciei partida com bot e revisei o tabuleiro em movimento. Os dois servidores foram encerrados e as portas ficaram livres.

## Decisões

- Manter os outros onze modelos sem alterações nesta revisão, pois suas formas e detalhes já identificavam as peças no conjunto.
- Sem mudança de regra, engine ou direção visual aprovada; permanecem as fichas low-poly originais e recoloração dinâmica já usadas pelo jogo.

## Próximo passo

- Publicar somente os arquivos relacionados à revisão; os outros onze modelos foram revisados e não precisaram de alteração nesta tarefa.
