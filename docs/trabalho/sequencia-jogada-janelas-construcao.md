# Sequência de jogada, janelas centrais e casas

- **Estado:** concluído, validado e publicado em `origin/main`.
- **Pedido confirmado:** desacelerar dados, peão e eventos; manter apenas uma etapa ativa por vez, inclusive com bots; esconder os dados quando não estiverem rolando ou enquanto houver janela informativa; centralizar tooltips, propriedade, evento e compra.
- **Regra confirmada:** terreno residencial livre pode ser comprado junto com zero a três casas. Para acrescentar casas a um terreno próprio, é preciso cair nele; uma visita permite chegar até três casas. Hotel só pode ser comprado em uma visita posterior ao mesmo terreno, se já houver três casas. Não se exige grupo completo nem construção equilibrada.
- **Referências:** capturas enviadas pelo usuário em 2026-10-28, usadas somente como referência de hierarquia e posicionamento. Interface, marca e assets serão originais.
- **Arquivos previstos:** `src/ui/App.tsx`, `src/ui/BoardScene.tsx`, `src/ui/styles.css`, `shared/game.ts`, `server/src/rooms/GameRoom.ts`, schemas de sala, testes e documentação de regra.
- **Validação:** `npm run verify` passou com 135 testes em 21 arquivos, build web e build do servidor; `git diff --check` passou. No navegador, uma sala real com três bots foi observada em desktop (1280 × 720) e redimensionada para mobile (390 × 844), sem overflow horizontal; turnos avançaram em fases separadas e os cartões permaneceram centralizados. Não foi testado aparelho físico nem Firefox.
- **Ritmo atualizado a pedido do usuário:** rolagem de dados 2,8 s; caminhada 0,75 s por casa; teleporte 1,8 s; construção 1,4 s.
- **Publicação:** commit `c941eba` está em `origin/main`; a conferência pós-push alinhou `HEAD` e `origin/main` no mesmo hash.
- **Próxima ação:** acompanhar playtests para ajustar o ritmo e revisar o enquadramento em aparelhos móveis reais.
