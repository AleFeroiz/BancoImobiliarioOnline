# Zoom da câmera e destaque das fichas

## Fatos

- Pedido de 2026-10-29: zoom por scroll no mouse e pinça em dispositivos móveis; fichas dos jogadores mais visíveis.
- `src/ui/BoardScene.tsx` usa `OrbitControls` do Drei com zoom desligado, câmera responsiva e peões atuais compostos por primitivas; carrinho, moto e avião usam GLB.
- A renderização da cena é sob demanda (`frameloop="demand"`).
- Graphify MCP disponível não indexa este repositório e a CLI local não está instalada.

## Decisão de implementação

- Usar o zoom embutido de `OrbitControls`, com distâncias mínima e máxima para mouse e pinça.
- Aumentar discretamente a escala visual das fichas e colocar um aro branco com centro na cor do dono próximo ao chão. Não altera estado de jogo ou animação de movimento.

## Validação

- `npm run verify`: 183 testes em 35 arquivos e builds frontend/servidor passaram.
- Playtest em viewport 690×900 com sala Clássica e três bots: scroll aproximou o tabuleiro, scroll inverso restaurou o enquadramento e as fichas apareceram com aro contrastante durante uma decisão real de compra.
- A pinça não foi simulada em hardware touch nesta sessão; o controle é o zoom nativo de OrbitControls com `enableZoom`.
- `graphify update .` não executou porque a CLI não está instalada; o Graphify MCP disponível indexa outro repositório.
