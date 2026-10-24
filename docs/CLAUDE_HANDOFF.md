# Thera Workspace — handoff técnico

## Objetivo do produto

Aplicação da Thera Financial com dois ambientes autenticados:

- `/workspace`: Thera Flow / Workspace BPO, para documentos a pagar, aprovações e rotinas financeiras.
- `/advisory`: Thera Advisory, para projetos, tarefas e apontamento técnico de horas.
- `/`: landing page com os dois acessos.

O frontend é React + TypeScript + Vite + Tailwind. A API é PHP 8 com PDO/MySQL e JWT/Bearer.

## Repositório e deploy

- GitHub: `https://github.com/felicioe/app`
- Branch de produção: `main`
- Hostinger: deploy automático a partir de `main`; o build executa `npm run build`.
- O script `scripts/copy-api.mjs` copia `api/` para `dist/api` durante o build.
- Comandos locais:

```bash
npm install
npm run build
npm run dev
```

Não há necessidade de alterar manualmente a Hostinger para o fluxo normal. Variáveis de banco devem permanecer configuradas no painel da Hostinger.

## Banco e segurança

`api/config/database.php` usa PDO, `utf8mb4`, prepared statements e configuração por variáveis de ambiente. O arquivo opcional `api/config/database.local.php` é ignorado pelo Git e serve somente para testes locais.

Variáveis esperadas no ambiente de produção:

- `DB_HOST` — atualmente o acesso da aplicação Node/PHP usa o host local recomendado pela Hostinger (`127.0.0.1`).
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Nunca copiar valores reais dessas variáveis para documentação, commits ou mensagens.

Autenticação:

- `api/auth/login.php`
- `api/auth/logout.php`
- `api/auth/me.php`
- middleware em `api/auth/middleware.php`/bootstrap relacionado
- frontend em `src/services/authService.ts` e `src/services/apiClient.ts`

O JWT é armazenado na sessão local do navegador e enviado como `Authorization: Bearer ...`.

## Entregas concluídas

1. API PHP/PDO, autenticação JWT e CORS configurados.
2. Correção da conexão MySQL da Hostinger usando host local.
3. Landing page com os botões “Acessar Workspace BPO” e “Acessar Thera Advisory”.
4. Login separado por rota, exigido em `/workspace` e `/advisory`.
5. Kanban Advisory integrado a `api/advisory/kanban.php`.
6. Timer/apontamento integrado a `api/advisory/timesheet.php`.
7. Dashboard de horas integrado em `src/components/advisory/TimesheetView.tsx`.
8. Cockpit Workspace integrado em `src/components/flow/WorkspaceView.tsx`.
9. Upload de documentos com anexo e aprovação de alçadas.
10. Logout real: chama API, limpa sessão e retorna ao login.
11. Dashboard passou a carregar tarefas reais via `kanban.php` para evitar tarefa fixa.

## Histórico recente

- `c00f33d` — merge cockpit Workspace
- `26a2aad` — merge entrada de documentos
- `a7efc26` — merge dashboard de horas Advisory
- `f760fc3` — merge logout da sessão
- `6170afa` — carregar tarefas reais no timesheet

Issues/PRs principais:

- Issue #8 / PR #9: entrada de documentos do Workspace.
- Issue #10 / PR #11: dashboard de horas.
- Issue #12 / PR #13: logout.
- Issue #14: tarefas reais no timesheet (encerrada; commit direto em `main`).
- Issue #15: impedir reaprovação de documentos (aberta, pendente).

## Estado atual do frontend

`src/App.tsx` decide o módulo pela URL e mostra:

- Advisory + `dashboard` → `TimesheetView`.
- Advisory + `kanban` → `KanbanView`.
- Workspace + `entrada_docs` → `WorkspaceView`.

`AppLayout` ainda usa `CLIENTES_MOCK` para o seletor de clientes. Isso é provisório: deve ser substituído por endpoint de clientes autenticado.

## Pendências prioritárias

### 1. Fechar issue #15

Impedir reaprovação no frontend e confirmar a proteção no backend. O componente `WorkspaceView.tsx` está muito compactado em linhas únicas; ao editar, prefira reformatar o componente inteiro para facilitar manutenção. O botão deve ficar desabilitado quando `status === 'aprovado'`, e o backend deve continuar rejeitando transições inválidas.

### 2. Dados mestres do Flow

O formulário de documentos exige IDs de fornecedor, tipo, plano de contas e centro de custo. Criar endpoints GET para esses cadastros e trocar campos numéricos livres por selects carregados da API.

### 3. Clientes reais

Criar endpoint autenticado de clientes e remover a dependência de `CLIENTES_MOCK` no layout. Manter o mock apenas como fallback de desenvolvimento.

### 4. Advisory

- Trocar o campo numérico de tarefa por um select de tarefas reais.
- Implementar fechamento/faturamento usando `advisoryService.fechar`.
- Implementar despesas usando `advisoryService.registrarDespesa`.
- Adicionar filtros de período no dashboard.

### 5. Qualidade e operação

- Adicionar testes automatizados mínimos para auth, timesheet e documentos.
- Verificar logs e permissões da pasta `api/storage/uploads` na Hostinger.
- Configurar pipeline GitHub Actions para `npm run build` em PR.
- Remover o artefato local não versionado `thera-api-deploy.zip` quando não for mais necessário.

## Fluxo recomendado para o próximo agente

1. `git status --short` e `git pull --ff-only origin main`.
2. Ler este arquivo e conferir issue #15.
3. Criar branch `codex/<tarefa>`.
4. Implementar e validar `npm run build`.
5. Fazer commit convencional e push da branch.
6. Abrir PR no GitHub, mesclar em `main` e atualizar o checkout.
7. Confirmar ao usuário o commit/PR e eventuais limitações do deploy.

## Cuidados

- Não expor credenciais do banco ou senhas de usuário.
- Não executar `git reset --hard` nem apagar diretórios amplos.
- Não considerar o deploy concluído apenas pelo push: a Hostinger pode levar alguns minutos para construir e publicar.
- Se a API retornar erro interno, testar primeiro a URL/host do banco e as variáveis do ambiente da Hostinger.

## Incidente de produção resolvido em 24/10/2026

Sintoma: o login retornava HTTP 500 em `/api/auth/login.php` mesmo após a criação das tabelas de autenticação.

Diagnóstico comprovado:

- O PHP da Hostinger não recebia automaticamente as variáveis `DB_*` configuradas para o app Node.
- O runtime PHP não encontrava `database.local.php` no diretório ativo.
- Depois de corrigir a configuração do banco, o erro mudou para HTTP 401, revelando que o hash da senha do usuário administrador estava divergente.

Correção aplicada:

1. `api/config/database.php` passou a procurar o `.env` privado em todos os caminhos usados pelo runtime Hostinger, sem versionar credenciais.
2. A versão ativa foi reimplantada no Hostinger.
3. `database.local.php` foi criado no diretório de runtime ativo pelo File Manager.
4. O hash do usuário `felicioe@gmail.com` foi atualizado diretamente no banco, sem registrar a senha em GitHub.

Validação final:

- `POST https://www.therafinancial.com.br/api/auth/login.php` retornou HTTP 200.
- `GET https://www.therafinancial.com.br/api/auth/me.php` com Bearer retornou HTTP 200.
- Usuário validado: perfil `bpo_adm`.

Prevenção de regressão:

- Não remover o fallback de `.env` de `database.php`.
- Após cada deploy Node, confirmar se o runtime PHP ainda localiza a configuração privada.
- Nunca colocar senha, token ou `database.local.php` no GitHub.
- Se o login voltar a falhar, testar primeiro o status HTTP: 500 indica configuração/conexão PHP; 401 indica credencial/hash.
