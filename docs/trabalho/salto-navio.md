# Revisão do salto e do navio

## Pedido e resultado

- A referência enviada mostra um sapato fechado, de bico fino e salto agulha. A sandália anterior foi substituída por um sapato com cabedal fechado, abertura para o pé, arco e salto fino; couro escuro e sola escura mantêm a leitura da referência.
- O navio foi reconstruído com casco afilado, convés, ponte em dois níveis, janelas e chaminé. Ambos permanecem low poly: 236 e 256 triângulos, respectivamente.
- Fonte: `assets/blender/player-tokens.blend`; GLB Y-up: `public/assets/player-tokens.glb`. Cópia anterior em `.tmp/salto-navio-antes.blend`.
- O novo material `HighHeel_Leather` é recolorido no lobby pela cor escolhida, preservando a sola escura. O mapeamento e as expectativas de cor estão em `src/ui/lobbyTokenMaterials.ts` e `src/ui/lobbyTokenMaterials.test.ts`.

## Validação

- Blender 5.2.2 LTS por MCP: revisão em três quartos, perfil e topo; GLB reimportado com 13 raízes, sete partes no salto e 18 no navio.
- Lobby desktop local: salto vermelho e azul conforme a seleção de cor; navio selecionado e visível. Em partida com bot, o navio moveu e a cena permaneceu visível após a compra do bot e pagamento de aluguel.
- `npm run verify`: 408 testes em 73 arquivos e builds web/servidor passaram. Revisão mobile e em aparelho físico não realizada.
