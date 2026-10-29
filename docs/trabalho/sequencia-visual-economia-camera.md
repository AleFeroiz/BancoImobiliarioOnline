# Sequência visual, economia e câmera

- **Estado:** implementação concluída; revisão visual manual pendente.
- **Decisões confirmadas:** jogada em sequência (dados, peão, ação de chegada); leilão voluntário só começa no turno do vendedor e fica bloqueado durante dívida; hipoteca e venda de construções durante dívida só ocorrem se o saldo for insuficiente.
- **Implementação:** `src/ui/App.tsx`, `src/ui/BoardScene.tsx`, `src/ui/cameraFraming.ts`, `server/src/rooms/GameRoom.ts` e `server/src/rooms/schema/LobbyState.ts`.
- **Documentação:** `README.md`, `docs/PLANO.md`, `docs/REGRAS-DE-JOGO.md`, `docs/DECISOES.md`, `docs/VALIDACAO.md` e `docs/ANDAMENTO.md`.
- **Commit da implementação:** `ac4de2ff632cf63de41234b512f6a14efcf39af0` (`fix: sequence turn animations and restrict asset actions`), local na branch `docs/ale-dev-memory`.
- **Validação:** hook `npm run verify` passou após o commit: 116 testes, build web e build do servidor. O build mantém o aviso do chunk 3D acima de 500 kB.
- **Limitação:** captura visual não foi concluída. O navegador integrado expirou ao abrir o servidor local; a interação com Chrome foi encerrada antes da navegação. Não afirmar que o novo ângulo foi revisado visualmente.
- **Sincronização:** commit local está à frente do tracking `origin/docs/ale-dev-memory`; `git ls-remote` falhou por erro de DNS. Push e estado remoto atual não confirmados.
- **Próxima ação:** revisar a cena numa janela 3D de navegador em desktop e celular; depois sincronizar a branch de correção conforme o fluxo de PR do projeto.
