# Como contribuir

## Preparação

1. Leia `AGENTS.md` e os documentos em `docs/`.
2. Use Node.js 24 LTS e npm. Rode `npm install`; o preparo configura o hook Husky.
3. Crie uma branch `feat/`, `fix/`, `docs/` ou `chore/`; não trabalhe diretamente em `main`.

## Implementação, testes e commits

- Cada implementação deve incluir ou atualizar testes e gerar commit/push ao GitHub.
- Antes de cada commit, o hook `.husky/pre-commit` executa `npm run verify`: a suíte completa (`npm test`) e o build (`npm run build`). Não faça commit se algo falhar e não ignore o hook.
- Toda correção de bug deve incluir um teste de regressão que reproduza o defeito.
- Para mudanças visuais sem teste automatizado apropriado, valide pelo Game Studio e mantenha testes para a lógica associada.
- Use mensagens curtas no formato Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:` ou `refactor:`.

## Pull requests

- Explique o problema e a solução, liste mudanças visíveis e decisões afetadas.
- Registre como validou a mudança e inclua captura ou vídeo para mudanças visuais.
- Não marque como feita uma validação que não foi executada.
- Atualize a documentação afetada na mesma mudança.

## Ativos e coordenação

Use assets originais ou com licença compatível. A referência visual orienta a direção, mas não autoriza copiar arte, marca ou interface de terceiros.

O usuário autorizou Codex e agentes delegados a coordenar tarefas do projeto por mensagem com chats existentes ou novos. Use essa autorização apenas para trabalho relacionado ao projeto e não envie segredos ou dados pessoais.
