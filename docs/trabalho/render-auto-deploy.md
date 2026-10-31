# Deploy automático do Render

## Fatos verificados

- O serviço `BancoImobiliarioOnline` é um Web Service no plano Free, conectado ao repositório `AleFeroiz/BancoImobiliarioOnline` e à branch `main`.
- A configuração atual mostra `Auto-Deploy: On Commit`, sem filtros de build.
- O commit de teste vazio `03ef597` foi enviado a `origin/main`, mas não gerou evento de deploy no Render; o deploy ativo permaneceu em `2def5f6` e o histórico visível registra gatilhos manuais.
- O serviço tem um Deploy Hook configurado. A documentação oficial do Render permite chamar esse hook por HTTP e mostra GitHub Actions como integração. O plano Free permite Web Services; o limite do plano não explica a ausência do gatilho.

## Estado atualizado — 2026-10-31

- Em workflows CI recentes, `npm run verify` terminou com sucesso e a etapa `Trigger Render deploy` foi executada. Os logs confirmaram “Render accepted the deployment request.” O valor do segredo apareceu mascarado; isso confirma que `RENDER_DEPLOY_HOOK_URL` está configurado sem revelar o conteúdo.
- O status de Vercel reportou “Deployment has completed” no último commit consultado; isso confirma o frontend publicado, não o estado do serviço Render.
- Um smoke test público criou uma sala com bot, iniciou a partida e resolveu uma jogada multiplayer, confirmando que o serviço de salas está respondendo. Isso não identifica o SHA ativo do Render nem a configuração do deploy nativo.
- A inspeção do servidor confirmou que ele inicia somente o transporte WebSocket do Colyseus e não expõe rota HTTP de saúde ou versão. Portanto, não há endpoint público para obter o SHA do serviço; a confirmação continua dependendo do painel Render.
- A resposta do hook confirma que o pedido foi aceito, mas não associa o SHA ativo do Render ao commit. Esta sessão não conseguiu confirmar a configuração no painel.
- Não é necessária a configuração inicial do segredo descrita nas notas antigas. Ainda falta confirmar no painel a configuração de `Auto-Deploy` e verificar que o deploy aceito terminou. Não dispare outro deploy só para repetir essa checagem.

## Contorno preparado

O workflow `.github/workflows/ci.yml` agora pode disparar o Deploy Hook depois que `npm run verify` passar em pushes para `main`. O workflow também aceita `workflow_dispatch` na branch `main`, permitindo disparar o deploy mais recente depois da configuração inicial sem abrir o Render.

## Procedimento configurado / checagem pendente

1. O workflow `.github/workflows/ci.yml` chama o Deploy Hook após `npm run verify` passar em pushes para `main`.
2. O workflow também aceita `workflow_dispatch` na branch `main`.
3. No painel Render, confirmar se `Auto-Deploy` está `Off`, evitando publicação duplicada pelo gatilho nativo e pelo GitHub Actions.
4. No painel Render, verificar se o deploy solicitado pelo workflow do commit `4c85f48` foi concluído e se o serviço está saudável.

## Segurança

- Não grave o Deploy Hook em arquivos, logs, commits ou mensagens.
- Se o hook for exposto, regenere-o no Render e atualize o segredo no GitHub.
- O segredo está configurado no GitHub Actions; seu valor permanece mascarado e não foi copiado para arquivos, logs ou mensagens.
- A configuração `Auto-Deploy` do serviço ainda precisa ser conferida no painel.

## Comparação de hospedagem — 2026-10-31

- Render: plano Starter de 512 MB custa US$ 7/mês. O Free pode dormir depois de 15 minutos sem tráfego de entrada, inclusive mensagens WebSocket, e o despertar leva cerca de um minuto; a documentação do fornecedor diz para não usar Free em produção. Render lista Oregon, Ohio, Virginia, Frankfurt e Singapura, sem região no Brasil.
- Fly.io: `gru` hospeda máquinas em São Paulo. A tabela pública usa preços de Ashburn como base e avisa que variam por região; a máquina `shared-cpu-1x` de 512 MB custa US$ 3,69/mês em Ashburn, não como cotação de `gru`. A saída para a Internet na América do Sul custa US$ 0,04/GB; sem taxa de plataforma, sem camada gratuita permanente.
- Railway: o plano Hobby é um compromisso mínimo de US$ 5/mês aplicado ao uso, com excedente cobrado; as regiões atualmente listadas são Califórnia, Virgínia, Amsterdã e Singapura.
- Decisão do usuário em 2026-10-31: continuar no Render por simplicidade, aproveitando o serviço já vinculado. Não fazer upgrade pago sem confirmar o custo. O Free serve para testes e partidas privadas, mas pode hibernar após 15 minutos sem tráfego e levar cerca de um minuto para despertar; o fornecedor não o recomenda para produção.
- Fontes oficiais: [Fly regions](https://fly.io/docs/reference/regions/), [Fly pricing](https://fly.io/docs/about/pricing/), [Render pricing](https://render.com/pricing), [Render Free](https://render.com/docs/free), [Render regions](https://render.com/docs/regions), [Railway billing](https://docs.railway.com/pricing/understanding-your-bill), [Railway regions](https://docs.railway.com/deployments/regions).
- Nota operacional: esta sessão não estava autenticada no painel Render. O GitHub confirmou que o hook aceitou pedidos de deploy em pushes recentes, mas o estado final precisa ser confirmado no painel. O segredo permanece no GitHub Actions Secrets e não deve ser compartilhado em chat.
