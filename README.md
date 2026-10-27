# Banco Imobiliário Online

Jogo de tabuleiro 3D para navegador, para partidas privadas entre amigos. Sem conta: cada pessoa informa um nome e cria uma sala ou entra usando código. Os modos são Clássico Rápido (30 minutos) e Express (seis rodadas de 40 segundos, cerca de 8 minutos), para 2–4 pessoas.

## Estado atual

A primeira fatia de produção contém a experiência inicial, seletor de regras, fluxo local demonstrativo de sala e uma cena 3D original em React Three Fiber. A sala e o botão de dados são demonstrações no navegador; ainda não conectam participantes em dispositivos diferentes nem implementam as regras completas. A próxima fase liga o frontend ao servidor autoritativo Colyseus.

## Desenvolvimento local

Requer Node.js 24 LTS e npm 10 ou superior.

```sh
npm install
npm run dev
```

Para executar todos os testes e o build:

```sh
npm run verify
```

O hook Husky executa `npm run verify` antes de cada commit. Correções de bugs devem vir com um teste de regressão.

Para gerar a versão estática para hospedagem:

```sh
npm run build
npm run preview
```

## Estrutura

- `src/ui/`: telas, HUD, estilos e cena React Three Fiber.
- `src/game/`: dados e geometria do tabuleiro, fora da camada visual.
- `docs/PLANO.md`: escopo e fases de produção.
- `docs/REGRAS-DE-JOGO.md`: regras acordadas e referências pesquisadas.
- `docs/DECISOES.md`: decisões confirmadas e detalhes a calibrar.
- `AGENTS.md`: regras de trabalho, incluindo uso obrigatório do Game Studio.

## Direção visual

A imagem de *Business Tour* enviada pelo usuário é referência de câmera inclinada, profundidade e leitura do tabuleiro. A implementação usa composição, nomes, formas e materiais próprios; não inclui assets nem interface copiados do jogo de referência.
