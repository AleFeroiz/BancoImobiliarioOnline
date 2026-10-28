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

## 2026-10-27 — Chrome: hipoteca, resgate e carteira

- No Chrome headless do sistema, em 1280 × 900, dois clientes criaram e entraram na mesma sala, iniciaram a partida, compraram Colina Verde por R$ 200.000, hipotecaram por R$ 100.000 e resgataram por R$ 110.000.
- O segundo cliente viu o marcador visual aparecer sobre o título hipotecado e desaparecer após o resgate; os saldos e a descrição da ação também foram sincronizados. O painel de carteira é recolhido por padrão, legível e não cobre o centro do tabuleiro.
- A inspeção encontrou um erro de arredondamento no resgate de R$ 121.001 para um título de R$ 220.000. O cálculo foi alterado para aritmética inteira; o teste de regressão agora exige R$ 121.000. A suíte cobre ainda autorização do dono/vez, cobrança, resgate, ausência de aluguel e bloqueio por construções no grupo.

## 2026-10-27 — Chrome: dívida, sala e layout responsivo

- O Google Chrome headless foi controlado por Chrome DevTools Protocol porque a ponte do Codex lista apenas o navegador interno. Duas abas criaram e ocuparam a mesma sala, iniciaram a partida e executaram compra, hipoteca e resgate com estado sincronizado; não houve erros de console.
- Revisei capturas da sala e da partida em 1280 × 900. Ajustei a transparência do tabuleiro atrás da sala e do HUD, aumentei a leitura dos textos e troquei a faixa diagonal sem função no centro do tabuleiro por um pequeno jardim circular.
- Em viewport móvel de 390 × 844, a partida não apresentou rolagem horizontal nem conteúdo maior que a tela.
- Os testes automatizados cobrem dívida acima do saldo sem cobrança parcial, liquidação por hipoteca, falência com transferência de saldo e título hipotecado, fim de partida com uma pessoa solvente e bloqueio de construção em grupo hipotecado.
