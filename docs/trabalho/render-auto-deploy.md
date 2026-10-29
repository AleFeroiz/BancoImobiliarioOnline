# Deploy automático do Render

## Fatos verificados

- O serviço `BancoImobiliarioOnline` é um Web Service no plano Free, conectado ao repositório `AleFeroiz/BancoImobiliarioOnline` e à branch `main`.
- A configuração atual mostra `Auto-Deploy: On Commit`, sem filtros de build.
- O commit de teste vazio `03ef597` foi enviado a `origin/main`, mas não gerou evento de deploy no Render; o deploy ativo permaneceu em `2def5f6` e o histórico visível registra gatilhos manuais.
- O serviço tem um Deploy Hook configurado. A documentação oficial do Render permite chamar esse hook por HTTP e mostra GitHub Actions como integração. O plano Free permite Web Services; o limite do plano não explica a ausência do gatilho.

## Contorno preparado

O workflow `.github/workflows/ci.yml` agora pode disparar o Deploy Hook depois que `npm run verify` passar em pushes para `main`. O workflow também aceita `workflow_dispatch` na branch `main`, permitindo disparar o deploy mais recente depois da configuração inicial sem abrir o Render.

## Configuração única pendente no painel

1. Em Render → Settings → Deploy, copie o Deploy Hook sem compartilhá-lo no chat.
2. No GitHub, em Settings → Secrets and variables → Actions, crie o segredo de repositório `RENDER_DEPLOY_HOOK_URL` com esse valor.
3. Em Render → Settings → Deploy, altere `Auto-Deploy` para `Off` para evitar deploys duplicados pelo gatilho nativo e pelo GitHub Actions.
4. No GitHub, abra Actions → CI → Run workflow e execute na branch `main`. O workflow valida a configuração e publica o HEAD atual. Depois, pushes para `main` publicam automaticamente após a suíte passar.

## Segurança

- Não grave o Deploy Hook em arquivos, logs, commits ou mensagens.
- Se o hook for exposto, regenere-o no Render e atualize o segredo no GitHub.
- Até o segredo ser adicionado e o gatilho nativo ser desligado, a automação alternativa ainda não pode acionar o serviço.
