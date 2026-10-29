# Dinheiro 3D e representação de saldo

## Fatos

- O pedido do usuário foi mostrar o saldo também como peças 3D low-poly, distribuídas conforme o valor: notas, prata e barras de ouro.
- O saldo dos jogadores aparece na HUD e é convertido em peças pela função `src/ui/cashVisuals.ts`.
- O arquivo fonte Blender é `assets/blender/board-models.blend`; o GLB é `public/assets/money-models/money-models.glb`.

## Implementação

- Valores representados: barra de ouro = R$ 500.000; pilha de prata = R$ 50.000; maço de notas = R$ 10.000. O restante vira uma nota proporcional.
- Os modelos são carregados por jogador na cena React Three Fiber e organizados em grades conforme a quantidade.
- A apresentação das casas também recebeu bases mais visíveis, escala maior e rótulos menores; a base recebe a cor do dono.

## Validação e publicação

- `npm run verify` passou: 135 testes em 21 arquivos, build web e build do servidor. O bundle `BoardScene` permanece acima do aviso de 500 kB.
- No navegador local, iniciei uma partida Clássica com uma pessoa e três bots; confirmei os quatro saldos iniciais de R$ 1.500.000, o carregamento da mesa, a sequência de rolagem/movimento e a chegada ao painel de compra. Usei portas locais alternativas 2568 (Colyseus) e 5175 (Vite), pois 2567 e 5173 não estavam acessíveis nesta sessão.
- A captura de jogo mostrou a cena, mas o painel central e a escala do tabuleiro impediram uma inspeção nítida das peças de saldo. A decomposição exata dos valores segue coberta por testes; a leitura visual das três denominações em saldos diferentes permanece pendente.
- A implementação já está em `origin/main`: commit `c941eba` (`fix: serialize bot turns and slow game animations`); documentação do estado publicada em `da7fead`.
- Limpeza: arquivo de backup Blender `.blend1` é temporário e não deve ser versionado.
