# Bairros em sequência e tema da Sorte

## Fatos verificados — 2026-10-29

- `shared/board.ts` coloca as 24 propriedades construíveis em oito grupos de três IDs consecutivos, dois grupos em cada lado do percurso.
- As posições das taxas foram mantidas em 4, 18, 28 e 38. As quatro casas Sorte estão em 8, 14, 24 e 34.
- Completar um grupo já dobra o aluguel base; a regra foi mantida e segue coberta por testes.
- `src/ui/BoardScene.tsx` desenha uma roleta low-poly autoral nos espaços Sorte. `src/ui/boardTileTheme.ts` dá a esses pisos um tema dourado.
- `npm run verify` passou com 145 testes em 22 arquivos e compilou o cliente e o servidor. `git diff --check` passou.
- Revisão em Chrome 156 headless com sala real e três bots: roleta visível em “Sorte ou Revés”, tabuleiro completo em 1280×900 e 390×844, sem overflow horizontal. Capturas temporárias em `.tmp/browser-test-desktop.png` e `.tmp/browser-test-mobile.png`.

## Próximo passo

Se for necessário aprofundar a revisão, conferir Chrome visível, Firefox ou aparelho físico; a validação desta sessão cobriu o Chrome headless e viewports emulados.

## Perguntas abertas

- Nenhuma decisão de regra ficou em aberto nesta frente.
