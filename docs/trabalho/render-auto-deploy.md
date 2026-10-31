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

## Comparação de hospedagem — 2026-10-31

- Render: plano Starter de 512 MB custa US$ 7/mês. O Free pode dormir depois de 15 minutos sem tráfego de entrada, inclusive mensagens WebSocket, e o despertar leva cerca de um minuto; a documentação do fornecedor diz para não usar Free em produção. Render lista Oregon, Ohio, Virginia, Frankfurt e Singapura, sem região no Brasil.
- Fly.io: `gru` hospeda máquinas em São Paulo. A tabela pública usa preços de Ashburn como base e avisa que variam por região; a máquina `shared-cpu-1x` de 512 MB custa US$ 3,69/mês em Ashburn, não como cotação de `gru`. A saída para a Internet na América do Sul custa US$ 0,04/GB; sem taxa de plataforma, sem camada gratuita permanente.
- Railway: o plano Hobby é um compromisso mínimo de US$ 5/mês aplicado ao uso, com excedente cobrado; as regiões atualmente listadas são Califórnia, Virgínia, Amsterdã e Singapura.
- Decisão do usuário em 2026-10-31: continuar no Render por simplicidade, aproveitando o serviço já vinculado. Não fazer upgrade pago sem confirmar o custo. O Free serve para testes e partidas privadas, mas pode hibernar após 15 minutos sem tráfego e levar cerca de um minuto para despertar; o fornecedor não o recomenda para produção.
- Fontes oficiais: [Fly regions](https://fly.io/docs/reference/regions/), [Fly pricing](https://fly.io/docs/about/pricing/), [Render pricing](https://render.com/pricing), [Render Free](https://render.com/docs/free), [Render regions](https://render.com/docs/regions), [Railway billing](https://docs.railway.com/pricing/understanding-your-bill), [Railway regions](https://docs.railway.com/deployments/regions).
- Nota operacional: esta sessão não estava autenticada no painel Render. A configuração do serviço deve ser revisada no painel antes da primeira publicação do estado atual; o segredo `RENDER_DEPLOY_HOOK_URL` continua sendo inserido diretamente em GitHub Actions Secrets pelo proprietário, sem compartilhá-lo em chat.
