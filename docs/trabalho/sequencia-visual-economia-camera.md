# Sequência visual, economia e câmera

- **Estado:** implementação e revisão visual de navegador concluídas.
- **Decisões confirmadas:** jogada em sequência (dados, peão, ação de chegada); leilão voluntário só começa no turno do vendedor e fica bloqueado durante dívida; hipoteca e venda de construções durante dívida só ocorrem se o saldo for insuficiente.
- **Implementação:** `src/ui/App.tsx`, `src/ui/BoardScene.tsx`, `src/ui/cameraFraming.ts`, `server/src/rooms/GameRoom.ts` e `server/src/rooms/schema/LobbyState.ts`.
- **Documentação:** `README.md`, `docs/PLANO.md`, `docs/REGRAS-DE-JOGO.md`, `docs/DECISOES.md`, `docs/VALIDACAO.md` e `docs/ANDAMENTO.md`.
- **Commit da implementação:** `ac4de2ff632cf63de41234b512f6a14efcf39af0` (`fix: sequence turn animations and restrict asset actions`), originalmente criado em `docs/ale-dev-memory` e integrado por fast-forward em `main`.
- **Validação:** hook `npm run verify` passou após o commit: 116 testes, build web e build do servidor. O build mantém o aviso do chunk 3D acima de 500 kB.
- **Revisão visual:** Chrome headless com WebGL por software, em 1440 × 900 e 390 × 844. Tabuleiro inteiro visível sem overflow horizontal. Em três jogadas reais, cada lançamento exibiu dados, depois o movimento do peão e, ao final, a ação contextual; o terceiro terminou no painel de compra de Costa Branca.
- **Capturas:** `.codex-tmp/review-desktop-initial.png`, `.codex-tmp/review-mobile-initial.png` e `.codex-tmp/review-purchase.png` (temporárias, não versionadas).
- **Sincronização:** `git fetch origin` concluiu; os commits foram integrados localmente em `main`, que aguarda push para `origin/main`.
- **Próxima ação:** publicar `main` no GitHub.
