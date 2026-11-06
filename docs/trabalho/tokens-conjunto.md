# Reformulação do conjunto de fichas

## Estado em 2026-11-06

- Pedido: melhorar todas as fichas, mantendo low poly; integrar somente depois da revisão do conjunto.
- Blender 5.2.2 LTS conectado por MCP. Fonte editável: `assets/blender/player-tokens.blend`; cópia inicial: `.tmp/tokens-before-all-refresh.blend`; GLB distribuído: `public/assets/player-tokens.glb`.
- As 13 raízes foram revisadas. Carro e moto receberam pneus circulares e detalhes; avião, trem e navio receberam correções de forma e orientação; gato, cachorro, vaca, cofrinho, pato e pinguim receberam características próprias; salto e cartola receberam detalhes e ligações. Contagem atual: 148–464 triângulos por ficha.
- O peão padrão não está no GLB: seu novo perfil facetado foi visualizado no Blender e implementado em `src/ui/PawnGeometry.tsx`, compartilhado por `LobbyToken.tsx` e `BoardScene.tsx`.

## Validação

- Revisão por modelo no Blender e reimportação do GLB Y-up: 13 raízes e material `OWNER_TINT` presentes. Revisões visuais adicionais da moto e da vaca reimportadas.
- `npm run verify`: 406 testes em 72 arquivos e builds web/servidor passaram. O aviso anterior de bundle maior que 500 kB permanece.
- Lobby: peão, moto e vaca renderizados; partidas com bot: peão e moto no tabuleiro, com compra de Belém e uma casa por R$ 170.000 na partida com moto. Servidores de teste encerrados.
- A validação de modelos individuais no navegador foi amostral; as 13 formas foram vistas no Blender, mas não houve revisão manual de cada ficha em partida ou em aparelho físico.
