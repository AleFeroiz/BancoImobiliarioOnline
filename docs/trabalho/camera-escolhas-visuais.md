# Câmera por arraste e escolhas visuais

## Fatos

- O pedido de 2026-10-29 solicita câmera controlada por mouse/toque em vez de sliders, escolhas de casas no próprio tabuleiro, compra residencial compacta com preço/aluguel, leilão no inspetor do imóvel e estádio/aeroporto com avião nos cantos.
- A base iniciou limpa na `main`, alinhada a `origin/main` em `479d069`.
- O Graphify conectado indexa somente outro repositório. Blender MCP está conectado, add-on atualizado, Blender 5.2.2 LTS.

## Decisões confirmadas

- A órbita preserva os limites já aprovados de inclinação e pausa quando modais bloqueiam a interação.
- As escolhas de Copa e Volta são confirmadas diretamente ao clicar numa casa elegível; casas inelegíveis aparecem escurecidas.
- Valores, regras de compra/leilão e autoridade do servidor não mudam.
- Os modelos dos cantos usam Blender editável e GLB Y-up no navegador.

## Suposições

- Os cards de compra mostram, para cada pacote, custo total e aluguel calculado; o botão Comprar repete o total a pagar.
- O estádio e o aeroporto ficam como miniaturas volumosas que cabem na área da casa especial sem cobrir os terrenos próximos.

## Perguntas abertas

- Conferir a leitura dos cards em celular e a escala do estádio/aeroporto no tabuleiro em uma partida.
- A inspeção contextual de propriedade ocupada e seleção de Copa/Volta não foram alcançadas manualmente nesta sessão; a seleção direta tem cobertura unitária.
- Graphify está ligado a `GustavoGLD/Hospital`, não a este projeto; o executável local `graphify` não está disponível.

## Validação concluída nesta sessão

- Blender 5.2.2 LTS produziu as fontes editáveis e GLBs dos dois cantos.
- Navegador integrado: partida real a 1440 × 900, órbita por mouse confirmada sem cortar o tabuleiro após correção de eixo vertical; compra de Alameda Azul mostrou os quatro pacotes e aluguel selecionado.
- `npm run verify` e `git diff --check` registrados em `docs/VALIDACAO.md`.
