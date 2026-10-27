# Plano do jogo

## Visão

Um jogo de Banco Imobiliário para abrir no navegador e jogar com amigos, sem cadastro. A pessoa escolhe um nome, cria uma sala ou entra usando o código recebido. A partida deve ser simples de organizar e funcionar bem para um grupo pequeno.

## Experiência desejada

- A tela inicial permite escolher nome e criar ou entrar em uma sala. Ao criar, o anfitrião escolhe Clássico Rápido ou Express; quem entra vê o modo selecionado antes de confirmar.
- A sala mostra participantes, anfitrião e estado de preparação; o anfitrião inicia a partida.
- A partida acontece em um tabuleiro 3D com câmera inclinada e perspectiva isométrica, casas fáceis de ler, peças, dados animados e HUD discreta, tanto em computador quanto em celular.
- Jogadores fazem ações por turnos, e a interface explica claramente o que aconteceu e qual ação está disponível.
- Se alguém perder conexão, deve poder voltar à mesma sala durante um período a definir.
- Sem contas e sem progresso permanente na primeira versão. A sala e a partida são temporárias, salvo decisão futura.

## Escopo combinado para a primeira versão

1. Criar sala, escolher modo de regras, entrar por código, validar nomes e exibir lobby.
2. Iniciar partida e manter ordem dos jogadores.
3. Executar turnos, dados, movimento, compra, leilão e aluguel de propriedades e companhias.
4. Implementar conjuntos, casas, hotéis, hipotecas, negociação entre jogadores, cartas/eventos, prisão, dívidas e falência.
5. Mostrar dinheiro, propriedades, construções, eventos e ações disponíveis para cada jogador.
6. Oferecer partida rápida com relógio e cálculo de patrimônio no fim, além da vitória por falência.
7. Reconectar um participante que caiu, sem permitir que duas pessoas controlem a mesma vaga.
8. Ajustar a apresentação 3D e a interface em computadores e celulares.

O usuário quer duas opções de regras na criação da sala: Clássico Rápido e Express. O escopo inclui todas as mecânicas principais nos dois modos; eles se diferenciam pelo ritmo, objetivos e condição de vitória, que ainda precisam ser definidos. Qualquer alteração ou exceção de regra deve aparecer antes da partida.

## Stack e arquitetura propostas

| Parte | Proposta inicial | Motivo |
|---|---|---|
| Aplicação web | React + TypeScript + Vite | Lobby e HUD têm bastante interface e compartilham estado com a partida. |
| Cena 3D | React Three Fiber + Three.js | Tabuleiro genuinamente 3D com composição declarativa ligada à aplicação React. |
| Estado das regras | Módulo TypeScript independente da cena | Permite validar regras e manter a renderização como representação do estado. |
| Multijogador | Servidor autoritativo por sala; Colyseus é a opção inicial a avaliar | Oferece salas, estado compartilhado e recursos de reconexão adequados a uma partida por turnos. |
| Deploy da aplicação | Vercel | Combina com uma aplicação web estática/Vite. |
| Deploy do servidor | Comparar Vercel Functions com WebSockets e uma hospedagem Node persistente | Escolher após validar salas, estado compartilhado, reconexão e custo. |
| Dados | Sem banco na primeira versão, salvo necessidade de recuperação entre reinícios | Sem contas nem histórico, uma partida pode ser temporária. |

Essas escolhas são recomendações de partida, não compromissos. A implementação deve validar a hospedagem do servidor, reconexão e custo antes de abrir o jogo para além do grupo de amigos.

### Hospedagem em aberto

Vercel pode hospedar o frontend, e desde 20 de outubro de 2026 as Vercel Functions também têm suporte geral a WebSockets. Isso não define, sozinho, como manter o estado de uma sala entre participantes que se conectam a instâncias diferentes. Vamos comparar Functions com estado compartilhado e um servidor Node persistente para as partidas. A documentação do Colyseus descreve seu servidor como uma aplicação Node e inclui salas e reconexão; o provedor só deve ser escolhido depois de validar esse fluxo e o custo.

Referências oficiais consultadas em 2026-10-27: [WebSockets no Vercel](https://vercel.com/changelog/websocket-support-is-now-generally-available), [salas Colyseus](https://docs.colyseus.io/room), [implantação Colyseus](https://docs.colyseus.io/deployment), [reconexão Colyseus](https://docs.colyseus.io/room/reconnection).

## Limites iniciais

- Recomendação para o MVP: salas de 2 a 4 pessoas, igual à edição Express atualmente listada pela Estrela. Assentos e HUD ficam mais legíveis, os turnos circulam mais rápido e o tabuleiro continua claro no celular. "Sem limite" não combina com um tabuleiro por assentos; a página oficial do [Banco Imobiliário Express](https://www.estrela.com.br/produto/banco-imobiliario-express-150394) especifica 2, 3 ou 4 jogadores.
- Dois presets de regras na criação da sala; nada de marketplace, ranking ou matchmaking público no MVP.
- Sem login, contas, chat de voz ou sistema social.
- Sem copiar assets, marca ou layout exato de *Business Tour*. A referência descreve câmera, profundidade e clareza visual.
- Computador e celular são plataformas-alvo desde o MVP; desempenho e controles em celulares modestos precisam ser validados durante os protótipos.

## Roteiro de preparação

1. Fechar os detalhes da variante rápida e sua duração padrão.
2. Confirmar stack e topologia de hospedagem.
3. Definir direção visual original e uma lista mínima de assets.
4. Transformar o MVP em issues com critérios de aceite.
5. Só então iniciar a implementação.

## Perguntas para fechar antes da produção

Veja `docs/DECISOES.md` para as definições restantes. As principais são duração padrão do modo rápido, detalhes de leilão e visibilidade do repositório GitHub.
