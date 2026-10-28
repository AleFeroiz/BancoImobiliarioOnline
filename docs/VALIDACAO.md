# Validação visual e de navegador

## 2026-10-27 — Lobby de sala

- Captura antes do ajuste: cartão de sala e coluna decorativa excediam a altura útil da janela; a coluna usava avatares fixos sem relação com os jogadores conectados.
- Captura depois do ajuste no navegador integrado do Codex, em viewport de aproximadamente 784 × 800: cartão centralizado, sem rolagem vertical visível, paleta clara inspirada em papel e feltro, e lugares ocupados ligados aos nomes reais da sala.
- Firefox não estava disponível entre os navegadores conectados à ferramenta nesta sessão. A captura é do navegador integrado e não deve ser tratada como validação específica do Firefox.
- Na captura inicial desta sessão, a automação visual pelo navegador integrado não concluiu o clique para iniciar; depois o mesmo fluxo foi exercitado no Chrome em dois clientes, conforme a seção abaixo.

## 2026-10-27 — Chrome: sala, entrada de jogador e primeira compra

- O Chrome do sistema não apareceu na ponte visual do Codex. Para validar o navegador solicitado, foi aberta uma sessão local do Google Chrome headless em 1280 × 900 e controlada pelo Chrome DevTools Protocol.
- O cliente criou a sala, um segundo cliente entrou pelo código e a sala exibiu 2/4 jogadores. A partida iniciou nos dois clientes e ambos mostraram o saldo inicial de R$ 1.500.000.
- A primeira rolagem chegou a uma propriedade; a ação de compra debitou R$ 140.000 do jogador ativo e ambos os clientes permaneceram sincronizados. A captura da sala e a captura após compra foram inspecionadas visualmente.
- A janela do lobby ficou contida no viewport e apresentou código, assentos e nomes de jogador reais. A tela da partida exibiu tabuleiro 3D, HUD dos dois jogadores, valores e painel de turno sem erro visível.
- A validação foi headless; não substitui a inspeção manual do Chrome gráfico do usuário nem valida outros tamanhos de viewport. Os testes de integração automatizados também cobrem a recusa da compra e o leilão.

## 2026-10-27 — Chrome: estado de construções

- Após adicionar os níveis de construção ao estado sincronizado, criei uma sala com dois clientes Chrome, iniciei a partida e confirmei os saldos dos dois jogadores e ausência de exceções JavaScript.
- Renderizei no Chrome uma cena 3D temporária com três casas e um hotel para revisar a escala e leitura sobre o tabuleiro; a cena mostrou as construções sem encobrir as peças. Os arquivos temporários de QA foram removidos.
- A suíte automatizada agora cobre grupo completo, equilíbrio de níveis, saldo para construir, limite de hotel, estações sem construção e validação autoritativa do servidor.

## 2026-10-27 — Chrome: cartas Sorte ou Revés e prisão

- Usei o Google Chrome do sistema em sessão headless via Chrome DevTools Protocol, com dois clientes conectados à mesma sala Colyseus, no viewport de 1280 × 900.
- Avancei a partida até sair uma carta de crédito; o título, a descrição e o novo saldo apareceram para os dois clientes sem exceções JavaScript. Depois, avancei até a prisão e conferi o estado preso no HUD.
- Na vez da pessoa presa, confirmei que “Tentar duplas” e “Pagar fiança” ficam ativos apenas para o cliente da vez. Cliquei para pagar a fiança: ambos os clientes mostraram o jogador fora da prisão, com saldo reduzido em R$ 50.000, e a ação “Lançar dados” disponível.
- A captura da tela de prisão e dos controles após pagar a fiança foi revisada. A validação cobre a renderização no Chrome e a sincronização básica dessas ações; a geração aleatória foi coberta pela suíte de regras e integração, não forçada por automação de interface.
