# Seletor de fichas de personagem

## Pedido confirmado

Criar fichas low-poly originais para carro, moto e avião, além do peão atual, e permitir que cada participante escolha sua ficha antes da partida. A alteração é visual: regras, movimento, posição, dinheiro e outras ações não mudam. Cada modelo preserva a cor associada ao dono.

## Fatos verificados

- O lobby é estado compartilhado Colyseus e aceita mensagens próprias de jogadores enquanto `waiting`.
- A cena R3F renderiza cada jogador em `AnimatedPawn`, onde hoje o peão é composto por primitivas.
- Blender 5.2.2 LTS conectado; add-on MCP atualizado; cena inicial padrão, sem modelos do projeto carregados.
- `main` limpa e alinhada a `origin/main` no início, commit `65ec727`.

## Decisão de implementação

- Guardar `characterType` no estado do participante, com `pawn` como padrão, e validar no servidor que cada cliente altera apenas sua própria escolha durante o lobby.
- Usar uma cena GLB autoral para carro, moto e avião, com material `OWNER_TINT` aplicado pela cor do jogador na cena. Manter o peão atual.
- A escolha não modifica estado/regras da partida além da preferência visual sincronizada.

## Validação e continuidade

- `npm run verify` passou: 150 testes em 24 arquivos e builds web/servidor. O build web mantém aviso do chunk 3D acima de 500 kB.
- Blender 5.2.2 LTS inspecionou os modelos e reimportou o GLB final: 26 malhas, três raízes nomeadas e exportação Y-up. `OWNER_TINT` está no material dos detalhes coloridos.
- Playtest visual pendente: o CUA no Windows encerrou a inspeção porque não conseguiu confirmar a URL da janela Chrome; o navegador integrado também está desativado. Não registrar screenshot visual como validada.
- Próximo passo: conferir os quatro modelos e cores em Chrome/navegador interno quando a ferramenta de browser estiver disponível.
