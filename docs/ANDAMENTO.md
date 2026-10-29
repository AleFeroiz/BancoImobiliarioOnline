# Andamento do projeto

> Retrato de trabalho para retomar o projeto entre sessões. Para requisitos e decisões, consulte os documentos de origem indicados em `AGENTS.md`.

## Estado observado — 2026-10-28

- A base do produto está implementada: React + TypeScript + Vite, cena React Three Fiber, regras desacopladas e servidor autoritativo Colyseus, conforme `README.md` e `docs/PLANO.md`.
- As fases de salas online e ciclo de partida estão implementadas. A fase de economia/interação e a fase de acabamento seguem em andamento; confira `docs/PLANO.md` antes de iniciar trabalho nelas.
- Os valores iniciais da economia e dos objetivos Express ainda dependem de playtests com pessoas. A escolha do provedor Node para o servidor também continua pendente.
- A negociação de títulos ainda tem propostas abertas em `docs/DECISOES.md`; não as trate como comportamento aprovado sem nova decisão.
- Evidências de automação, simulação e revisão visual estão em `docs/VALIDACAO.md`. Elas descrevem estados específicos e não substituem uma conferência do código e do ambiente atuais.

## Frente concluída — sequência visual, economia e câmera (2026-10-28)

- Nota de retomada: [sequência visual, economia e câmera](trabalho/sequencia-visual-economia-camera.md).
- Pedido do usuário: tocar dados, depois movimento do peão, depois mostrar ações de chegada; limitar leilão ao turno de quem vende, deixar hipoteca apenas para resolver dívida sem saldo suficiente; elevar a câmera para aproximar a leitura da referência visual enviada.
- Regra anterior conferida em `docs/DECISOES.md`: leilão podia começar fora da vez; hipoteca valia durante a vez e dívida. A decisão atual foi incorporada em `docs/DECISOES.md`, `docs/REGRAS-DE-JOGO.md`, `docs/PLANO.md` e `README.md`.
- Branch atual observada: `docs/ale-dev-memory`, com upstream `origin/docs/ale-dev-memory` e commit local `44b6944`. O tracking local não mostrou divergência, mas `git fetch origin` não foi possível porque o sandbox permite apenas leitura em `.git` e negou escrita em `.git/FETCH_HEAD`; o estado remoto atual não foi confirmado.
- Implementação: o servidor restringe leilões ao turno da pessoa vendedora e hipotecas/demolição durante dívida ao saldo insuficiente; a cena e o cartão de turno sequenciam dados, caminhada do peão e ação contextual; a câmera passou a olhar de cima tanto no desktop como no celular.
- Validação: `npm run verify` passou (116 testes, build web e build do servidor). `git diff --check` passou. O build mantém o aviso conhecido do chunk de cena 3D acima de 500 kB. Revisão visual manual ficou pendente: a prévia local não abriu no navegador integrado por timeout e a automação no Chrome foi encerrada pelo controle de segurança antes de interagir com a janela.
- Próximo passo: revisar a mudança visual em navegador/aparelho após a branch de trabalho ficar disponível. A branch atual e o `.git` somente leitura impedem criar branch, commit ou PR nesta sessão.

## Retomada

1. Verifique branch, `git status`, upstream e alterações recebidas antes de editar.
2. Leia as instruções e a fonte de verdade aplicável; use `docs/PLANO.md` para escolher ou confirmar a frente de produto.
3. Para trabalho substancial que atravessar sessões, mantenha uma nota própria em `docs/trabalho/` e adicione seu link aqui. Registre só estado verificado, decisões, evidências e a próxima ação.
4. Ao concluir, atualize a nota da frente e este retrato se o estado do projeto tiver mudado materialmente; siga o fluxo de validação e integração definido em `AGENTS.md`.

## Registro inicial da memória de trabalho

- **2026-10-28 — Integração AleDevMemory:** documentação existente mantida como fonte de verdade; este arquivo passa a ser o índice conciso de andamento; `AGENTS.md` define como manter e sincronizar contexto durável. Após instalar dependências com `npm ci --no-audit --no-fund`, `npm run verify` passou: 17 arquivos e 103 testes, build web e build do servidor. A execução precisou apontar `TEMP`/`TMP` para dentro do workspace e permitir acesso de rede local aos testes Colyseus; o build emitiu apenas o aviso já esperado de chunk acima de 500 kB. `git diff --check` passou. Próximo passo: atualizar este arquivo em futuras frentes substanciais e criar notas específicas apenas quando ajudarem a retomada.
