# Bairros em sequência e tema da Sorte

## Fatos verificados — 2026-10-29

- `shared/board.ts` coloca as 24 propriedades construíveis em oito grupos de três IDs consecutivos, dois grupos em cada lado do percurso.
- As posições das taxas foram mantidas em 4, 18, 28 e 38. As quatro casas Sorte estão em 8, 14, 24 e 34.
- Completar um grupo já dobra o aluguel base; a regra foi mantida e segue coberta por testes.
- `src/ui/BoardScene.tsx` desenha uma roleta low-poly autoral nos espaços Sorte. `src/ui/boardTileTheme.ts` dá a esses pisos um tema dourado.
- `npm run verify` passou com 145 testes em 22 arquivos e compilou o cliente e o servidor. `git diff --check` passou.
- A revisão visual ficou pendente: o navegador integrado está desativado nas configurações de Work e a tentativa via Chrome foi interrompida pelo controle CUA. A tentativa headless não gerou captura.

## Próximo passo

Quando o navegador estiver habilitado, revisar uma partida em desktop e em viewport móvel, confirmar a leitura dos oito grupos e das quatro roletas, e registrar as capturas em `docs/VALIDACAO.md`.

## Perguntas abertas

- Nenhuma decisão de regra ficou em aberto nesta frente.
