# Medidor de FPS e playtest no Chrome

## Fatos verificados

- Pedido: oferecer uma opção dentro da partida para ativar/desativar um medidor e validar o jogo no Chrome, movendo a câmera.
- `main` estava limpa e alinhada com `origin/main` em `c44db1f` no começo do trabalho.
- O canvas da partida usa React Three Fiber com `frameloop="demand"`; portanto, um contador baseado só em `requestAnimationFrame` da página não representaria os quadros da cena quando a câmera está parada.

## Decisões desta implementação

- A medição acompanha os callbacks renderizados pela cena R3F e conta intervalos reais entre eles.
- A interface é opcional e desligada por padrão. Com ela ativa, mostra FPS e milissegundos por quadro; após 1 segundo sem quadros, informa que a cena está ociosa.
- O probe só é montado enquanto o medidor está ligado, e a leitura DOM é atualizada a cada 250 ms sem reconciliar a cena 3D.

## Validação

- `npm run verify`: passou com 175 testes em 32 arquivos; builds web e de servidor passaram.
- Os testes unitários cobrem cálculo de 60 FPS, cena ociosa, retomada após pausa e descarte de timestamps inválidos.
- Playtest Chrome pendente. `cua.getApp({windowId:459546})` foi interrompido pelo controle de segurança porque não conseguiu identificar a URL atual da janela Chrome com confiança suficiente. A sessão CUA solicitou encerrar o controle do computador; não tentei contornar a proteção.
- `graphify update .` falhou porque a CLI não está instalada; o MCP Graphify disponível aponta para outro repositório.

## Próximo passo

Retomar a validação visual quando houver uma sessão Chrome controlável e com URL verificável. Entrar em uma sala, comparar o medidor desligado/ligado e arrastar a câmera para observar a leitura da cena.
