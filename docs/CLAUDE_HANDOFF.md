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
12. Issue #15 fechada: reaprovação de documento bloqueada no front (`status === 'aprovado'` desabilita o botão); backend já rejeitava a transição com HTTP 409.
13. Dados mestres do Flow: `GET api/flow/cadastros.php` (fornecedores, tipos de documento, plano de contas — só contas analíticas — e centro de custo); os 4 campos numéricos livres do formulário de documentos agora são selects.
14. Clientes reais: `GET api/clientes.php` substitui o seletor fixo da sidebar; `CLIENTES_MOCK` só é usado como fallback visível (selo “Clientes de exemplo”) se a API falhar.
15. Advisory completo: select de tarefas reais e filtro de período no dashboard de horas; nova tela `FaturamentoView.tsx` com fechamento de período (`advisoryService.fechar`) e registro/listagem de despesas (`advisoryService.registrarDespesa`), ligada ao menu “Fechamento & Faturas”.
16. CI: `.github/workflows/build.yml` roda `npm run build`, lint de todo o PHP e os testes de `api/tests/` (sem banco) em cada PR e push em `main`.
17. `api/storage/uploads/.htaccess` versionado para garantir que a pasta de upload exista em qualquer checkout/deploy (antes era um diretório vazio, não versionado pelo Git).

## Histórico recente

- PR #17 — bloquear reaprovação de documento (issue #15).
- PR #20 — dados mestres do Flow (`flow/cadastros.php` + selects).
- PR #21 — clientes reais (`clientes.php` + fallback de mock).
- PR #22 — select de tarefas reais e filtro de período no timesheet.
- PR #23 — fechamento/faturamento e despesas do Advisory (`FaturamentoView.tsx`).
- PR #25 — **hotfix**: `api/clientes.php` retornava HTTP 500 em toda chamada (caminho errado do `require_once` do bootstrap — ver “Incidentes resolvidos” abaixo).
- PR #27 — pipeline de CI, diretório `api/storage/uploads` versionado, smoke test ampliado.
- Commits diretos em `main` (outro agente/sessão, não revertidos): remoção de `api/auth/diagnose.php`, ajuste de leitura de variáveis privadas do ambiente Hostinger em `api/config/database.php`, e página de consentimento/LGPD em `src/App.tsx`.

Issues/PRs principais:

- Issue #8 / PR #9: entrada de documentos do Workspace.
- Issue #10 / PR #11: dashboard de horas.
- Issue #12 / PR #13: logout.
- Issue #14: tarefas reais no timesheet (encerrada; commit direto em `main`).
- Issue #15: impedir reaprovação de documentos (**encerrada** via PR #17).

## Estado atual do frontend

`src/App.tsx` decide o módulo pela URL e mostra:

- Advisory + `dashboard` → `TimesheetView`.
- Advisory + `kanban` → `KanbanView`.
- Advisory + `faturas` → `FaturamentoView`.
- Workspace + `entrada_docs` → `WorkspaceView`.

A lista de clientes vem de `GET api/clientes.php` (carregada em `App.tsx` após o login) e é passada por prop para `AppLayout`. `CLIENTES_MOCK` (`src/mock/mockData.ts`) só é usado como fallback se essa chamada falhar, com aviso visível na tela — não deve ser removido, serve de rede de segurança para desenvolvimento local sem backend.

## Assunções de schema a validar em produção (não bloqueiam o deploy, mas podem fazer um cadastro aparecer vazio)

Várias tabelas referenciadas pelo código (`fornecedores`, `tipos_documento`, `clientes`) já existem em produção e não têm DDL neste repositório — `api/sql/schema.reference.sql` é só referência para banco novo, não a migração real (ver `api/README.md`). As assunções feitas, documentadas também no `api/README.md`:

- `fornecedores` e `tipos_documento`: assumidas colunas `id,nome` em `api/flow/cadastros.php`.
- `clientes`: assumida coluna única `nome` (sem `razao_social`/`nome_fantasia` separados) em `api/clientes.php`.

Se algum select aparecer vazio ou com nome errado em produção, rodar `SHOW CREATE TABLE <tabela>;` e ajustar apenas a query do endpoint correspondente — mudança isolada e de baixo risco.

## Pendências

### Qualidade e operação (parcialmente endereçado)

- Testes automatizados mínimos de auth/CORS/roteamento e cálculo de faturamento já existem (`api/tests/run.php`, `api/tests/http_smoke.py`) e agora rodam em CI a cada PR. **Faltam** testes de ponta a ponta contra MySQL real (auth completo, timesheet, documentos) — não executáveis no ambiente de desenvolvimento atual, que não tem `pdo_mysql` configurado contra um banco real.
- `thera-api-deploy.zip`: não existe mais no checkout atual, nada a remover.
- Verificar na Hostinger (fora do alcance deste repositório) se a pasta `api/storage/uploads` está com permissão de escrita pelo PHP após o próximo deploy — o `.htaccess` garante que a pasta exista no código, mas permissão de escrita no servidor é operacional.

### Novas pendências identificadas

- Validar as assunções de schema da seção acima contra o banco real da Hostinger.
- `menuFlow` em `AppLayout.tsx` ainda lista os itens `fila_pagamentos` e `plano_contas` sem view implementada (caem no placeholder “Módulo em desenvolvimento”).

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
- **Caminho do bootstrap em novo endpoint PHP**: arquivos dentro de uma subpasta (`api/flow/*.php`, `api/advisory/*.php`, `api/auth/*.php`) usam `require_once dirname(__DIR__).'/bootstrap.php';`. Um arquivo direto na raiz de `api/` (como `api/clientes.php`) deve usar `require_once __DIR__.'/bootstrap.php';` — o padrão errado quebra com HTTP 500 silencioso (ver incidente de 24/10/2026 abaixo). `php -l` não detecta esse erro porque é um caminho de arquivo em tempo de execução, não sintaxe; testar com `php -S` local ou rodar o smoke test antes de confiar no endpoint.
- Outra sessão/agente pode estar trabalhando no mesmo repositório em paralelo (commits diretos em `main` já foram observados). Sempre `git pull --ff-only origin main` antes de criar uma branch nova, e revalidar `npm run build` após sincronizar.

## Incidentes resolvidos

### 24/10/2026 — HTTP 500 em `api/clientes.php`

Sintoma: toda chamada ao endpoint de clientes (introduzido para substituir `CLIENTES_MOCK`) retornava HTTP 500, inclusive sem autenticação (deveria ser 401).

Causa: `api/clientes.php` usava `require_once dirname(__DIR__).'/bootstrap.php';`, padrão correto só para arquivos em subpasta. Por estar na raiz de `api/`, o caminho resolvido ficava fora do projeto e o `require_once` falhava com erro fatal não tratado.

Correção: trocado para `require_once __DIR__.'/bootstrap.php';` (PR #25). Detectado ao ampliar `api/tests/http_smoke.py` para cobrir o endpoint — reforça o valor de manter esse teste atualizado a cada novo endpoint.

### 24/10/2026 — Login HTTP 500

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
