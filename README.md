# Banco Imobiliário Online

Jogo de tabuleiro 3D para navegador, para partidas privadas entre amigos. Sem conta: cada pessoa informa um nome e cria uma sala ou entra usando código. Os modos são Clássico Rápido (30 minutos) e Express (seis rodadas de 40 segundos, cerca de 8 minutos), para 2–4 pessoas.

## Estado atual

A versão atual contém a experiência inicial, seletor de regras, salas privadas Colyseus por código, lobby sincronizado e uma cena 3D original em React Three Fiber. A partida já tem turnos autoritativos, dados, movimento, saldo inicial, prêmio por cruzar a Partida, compra de propriedades, aluguel, taxas, leilão, casas e hotéis, cartas Sorte ou Revés, prisão e hipotecas com resgate. Negociação, dívidas, falência e encerramento por tempo seguem em implementação.

## Desenvolvimento local

Requer Node.js 24 LTS e npm 10 ou superior. Abra dois terminais na pasta do projeto:

```sh
npm install
npm run dev:server
```

```sh
npm run dev
```

Em produção, configure `VITE_ROOM_SERVER_URL` com a origem HTTP/HTTPS do servidor Colyseus. `.env.example` mostra o formato.

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

- `src/ui/`: telas, lobby, HUD, integração Colyseus, estilos e cena React Three Fiber.
- `src/game/`: dados, geometria do tabuleiro e testes independentes do render.
- `server/src/`: servidor Colyseus autoritativo e estado sincronizado das salas.
- `server/test/`: testes de integração das salas reais.
- `shared/`: contratos compartilhados entre cliente e servidor.
- `docs/PLANO.md`: escopo e fases de produção.
- `docs/REGRAS-DE-JOGO.md`: regras acordadas e referências pesquisadas.
- `docs/DECISOES.md`: decisões confirmadas e detalhes a calibrar.
- `AGENTS.md`: regras de trabalho, incluindo uso obrigatório do Game Studio.

## Direção visual

A imagem de *Business Tour* enviada pelo usuário é referência de câmera inclinada, profundidade e leitura do tabuleiro. A implementação usa composição, nomes, formas e materiais próprios; não inclui assets nem interface copiados do jogo de referência.
