# Thera Workspace — API

Implementação PHP 8.1+ sem framework. O frontend é a aplicação React em `src/App.tsx` (compilada via `index.html`/Vite), incluindo a landing page institucional. Um scaffold estático antigo (`institucional.html`, `main.js`, `style.css`, nunca referenciado pelo build) foi removido em 25/10/2026 para não confundir o próximo agente — o conteúdo de texto dessa landing page agora vive no banco (`conteudo_site`, servido por `GET/POST institucional.php`) e é editável em `/admin/site` por usuários `bpo_adm`.

## Banco e instalação

O escopo recebido informa nomes de tabelas, mas não o DDL. `sql/schema.reference.sql` descreve um contrato de colunas para um banco novo de desenvolvimento — **não corresponde ao schema real de produção** (confirmado em 25/10/2026 via `information_schema.COLUMNS` no banco `u630316951_app`). As divergências encontradas foram corrigidas no código (ver tabela abaixo); se o schema mudar novamente, repetir essa comparação antes de confiar no código.

### Mapeamento confirmado contra o banco real (25/10/2026)

| Tabela | Divergência do schema de referência | Status |
|---|---|---|
| `clientes` | `razao_social`+`nome_fantasia` (não `nome`); `tipo_cobranca_padrao` (não `tipo_cobranca`) | Corrigido em `api/clientes.php` |
| `fornecedores` | coluna de nome é `razao_social` | Corrigido em `api/flow/cadastros.php` |
| `tipos_documento` | tem `cliente_id` (não é catálogo global) | Corrigido em `api/flow/cadastros.php` |
| `tarefas_kanban` | **sem** `cliente_id` (escopo só via `projeto_id` → `projetos_consultoria.cliente_id`); status é `coluna_status`, valores `backlog/planejado/em_andamento/validacao/concluido` | Corrigido em `api/advisory/kanban.php` — **valor exato do estágio "concluído" (`concluido` vs `concluida`) ainda não confirmado**, assumido `concluido` por analogia com `projetos_consultoria.status` |
| `projetos_consultoria` | nome do projeto é `titulo` (não `nome`) | Corrigido em `api/advisory/kanban.php` (alias `titulo AS nome`) |
| `apontamentos_horas` | data é `data_registro` (não `data`) | Corrigido em `api/advisory/timesheet.php` e `BillingService.php` |
| `despesas_adicionais` | data é `data_despesa` (não `data`); `tipo` é `NOT NULL` sem valor padrão, lista de valores aceitos **ainda não confirmada por completo** (conhecidos: `deslocamento`, `hospedagem`, `alimentacao`, e pelo menos mais um começando com "ma...") | Corrigido em `api/advisory/despesas.php` — campo `tipo` agora obrigatório no formulário, mas sem validação client-side contra a lista real |
| `faturas_honorarios` | colunas reais: `codigo_fatura` (NOT NULL, gerado pelo código), `total_horas_minutos`, `valor_servicos`, `valor_despesas_reembolsadas`, `status` (`rascunho`/`emitida`/`paga`) — não `total_minutos`/`valor_honorarios`/`valor_despesas` | Corrigido em `BillingService.php` e no frontend (`advisoryService.ts`, `FaturamentoView.tsx`) |
| `documentos_pagar`, `regras_alcada`, `documento_alcadas`, `documento_aprovadores`, `aprovacoes_documento`, `regra_aprovadores`, `plano_contas`, `centros_custo` | Conferidas e **batem** com o que o código já usava | Nenhuma mudança necessária |

**Não confirmado ainda**: o valor exato do enum `documentos_pagar.status` além de `pendente_aprovacao`/`parcialmente_aprovado` (a consulta foi truncada pela ferramenta usada). `ApprovalService::approve()` grava o literal `'aprovado'` ao final da cadeia de aprovação — se esse valor não existir no enum real, a aprovação final falhará com SQL inválido. Validar com `SHOW CREATE TABLE documentos_pagar;` (texto completo, não grade truncada) antes de confiar 100% no fluxo de aprovação em produção.

No servidor, habilitar `pdo_mysql`, `fileinfo`, `zip`, `simplexml` e `mbstring` (UTF-8 nos arquivos). Todas as tabelas devem usar InnoDB. Colocar `api/` ao lado dos arquivos compilados do Vite. Apache deve aceitar `.htaccess`, `mod_rewrite` e `mod_setenvif`. A pasta `api/storage/uploads` precisa de escrita pelo PHP e deve continuar bloqueada para acesso HTTP direto. Configurar `upload_max_filesize=10M`, `post_max_size=12M` e HTTPS.

Configurar variáveis no ambiente do PHP/Apache, sem colocá-las no frontend ou versionar segredos:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nome_do_banco
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
APP_SIGNING_KEY=segredo_aleatorio_com_pelo_menos_32_caracteres
CORS_ORIGINS=https://app.therafinancial.com.br
```

Gerar chave com `php -r "echo bin2hex(random_bytes(32));"`. Criar hashes das senhas com `password_hash($senha, PASSWORD_DEFAULT)` em uma rotina administrativa segura; não há usuário ou senha padrão. Não há cadastro público. Os usuários devem ter `ativo=1`.

Tokens aleatórios de 256 bits expiram em oito horas; somente SHA-256 do token fica no banco. Login verifica bcrypt/Argon2 com `password_verify`, limita dez falhas por IP/e-mail por quinze minutos, e logout revoga a sessão. Se houver proxy, configurar corretamente o IP remoto no servidor. Executar limpeza periódica de sessões expiradas e tentativas antigas.

## Contrato HTTP

Respostas: `{status,data,error,timestamp}`; `status` é `success` ou `error`. Autenticação: `Authorization: Bearer <token>`. Enviar `cliente_id` nas chamadas de negócio: usuários de cliente só podem acessar o cliente da sessão; perfis BPO devem informar explicitamente o cliente. Leituras de listas têm limites; paginação ainda não implementada.

- `POST auth/login.php`: JSON `{email,senha}`; retorna `{token,usuario}`.
- `GET auth/me.php`, `POST auth/logout.php`.
- `GET advisory/timesheet.php?cliente_id=1&inicio=2026-10-01&fim=2026-10-31`: lista e total integral de minutos.
- `POST advisory/timesheet.php`: `{cliente_id,projeto_id,tarefa_id?,data,hora_inicio,hora_fim,faturavel?}`. Horários `HH:mm`, mesmo dia. Apenas BPO grava.
- `GET/POST/PATCH advisory/kanban.php`: listar projetos/tarefas, criar tarefa e mover status (`pendente`, `em_andamento`, `concluida` — mapeados internamente para a coluna real `coluna_status`). Apenas BPO altera. Tarefas são escopadas por cliente via `projeto_id` (a tabela `tarefas_kanban` não tem `cliente_id` próprio).
- `GET/POST advisory/despesas.php`: `{cliente_id,tipo,data,descricao,valor,reembolsavel}`. `tipo` é obrigatório e deve bater com um valor já cadastrado no banco (lista completa ainda não confirmada). Valores monetários como string decimal com ponto.
- `POST advisory/faturamento.php`: `{cliente_id,inicio,fim}`; exclusivo `bpo_adm`. `GET` lista faturas (`codigo_fatura`, `total_horas_minutos`, `valor_servicos`, `valor_despesas_reembolsadas`, `valor_total`, `status`). Datas inclusivas. Valores calculados em centavos, arredondamento ao centavo após somar os minutos. Ciclo padrão do timesheet: mês calendário. Fechamentos sobrepostos são rejeitados; horas e despesas não podem ser lançadas em períodos encerrados. `codigo_fatura` é gerado automaticamente (`FAT-<cliente_id>-<inicio>-<fim>`).
- `GET institucional.php`: conteúdo público da landing page (`{chave: valor}`), sem autenticação. `POST institucional.php`: atualiza um ou mais pares `{chave: valor}`, exclusivo `bpo_adm`. Requer a migração `api/sql/migrations/002_conteudo_site.sql` (tabela `conteudo_site`, idempotente).
- `GET clientes.php`: lista clientes para o seletor da sidebar. Perfis BPO (`bpo_adm`, `bpo_operador`) veem todos os clientes; perfis de cliente veem apenas o próprio (`cliente_id` da sessão). Colunas confirmadas: `razao_social`, `nome_fantasia`, `tipo_cobranca_padrao`.
- `GET flow/cadastros.php?tipo=fornecedores|tipos_documento|plano_contas|centros_custo&cliente_id=1`: cadastros para alimentar selects do formulário de documentos. Todos os quatro tipos exigem `cliente_id` (escopo por tenant — inclusive `tipos_documento`, que não é catálogo global). `plano_contas` retorna apenas contas `analitica` por padrão; com `todos=1` retorna sintéticas e analíticas (com o campo `tipo`), usado pela tela de gestão do plano de contas.
- `GET flow/documentos.php`: `cliente_id`, filtros opcionais `inicio`, `fim` (vencimento), `status`.
- `POST flow/documentos.php`: multipart `cliente_id,descricao,valor,vencimento,linha_digitavel?,chave_pix?,anexo`. PDF/JPEG/PNG/WebP até 10 MB, nome aleatório, download autenticado em `GET flow/anexo.php?cliente_id=1&documento_id=1`.
- `GET flow/alcadas.php`: regras por cliente. `POST flow/alcadas.php` ou `/api/flow/alcadas/aprovar`: `{cliente_id,documento_id}`.
- `GET flow/notificacoes.php`, `POST flow/notificacoes.php`: `{id}` marca a notificação do próprio usuário como lida.
- `POST flow/importador_contas.php`: JSON `{cliente_id,destino,linhas:[{codigo,descricao,tipo?,codigo_pai?}]}`. `destino`: `plano_contas` ou `centros_custo`; contas usam `sintetica`/`analitica`. Também aceita multipart `arquivo` CSV UTF-8 ou XLSX, `cliente_id`, `destino` e `mapeamento` JSON como `{"codigo":"Conta","descricao":"Descrição","tipo":"Tipo","codigo_pai":"Pai"}`. XLSX lê a primeira planilha padrão `sheet1.xml`, valores armazenados (não calcula fórmulas). Até 5000 linhas, 100 colunas em XLSX, 10 MB compactados e 32 MB descompactados. Códigos existentes/duplicados, ciclos e pais analíticos causam rollback integral.

## Alçadas e evidências

Cadastrar `regras_alcada` e `regra_aprovadores` administrativamente. Cada regra aplicável ao valor é obrigatória; etapas menores precedem maiores, regras da mesma etapa são paralelas. `simples` exige a quantidade configurada, `conjunta` exige no mínimo dois usuários distintos. Na criação, regras e aprovadores são copiados para o documento. Sem regra ou aprovadores suficientes o documento não é criado. BPO não recebe exceção para assinar: deve ser aprovador elegível do cliente.

A assinatura é uma evidência de aprovação autenticada com HMAC, usuário, documento, valor, instante e nonce; não é assinatura com certificado ICP-Brasil. Notificações são internas, persistidas na mesma transação e consultadas pelo frontend. Envio de e-mail não está configurado.

## Integração frontend

Importar `authService`, `advisoryService`, `flowService` nos componentes reais. Substituir mocks por chamadas em effects/React Query, mantendo estados de carregamento e erro. Não calcular permissões apenas no frontend. `authService.current()` revalida a sessão; `thera:session` avisa mudanças. Token é persistido no localStorage conforme solicitado, portanto a SPA deve evitar HTML não confiável e manter política CSP no servidor. Os serviços usam a mesma origem `/api`; no Vite local configurar proxy para um Apache/PHP de desenvolvimento. Para CORS local adicionar a origem exata na variável do servidor.

## Verificação

`php api/tests/run.php` cobre cálculos, precisão, datas, escopo multi-tenant e CSV/validação de lotes. `python api/tests/http_smoke.py` verifica autenticação, CORS, métodos e JSON inválido usando servidor efêmero local. Executar lint de todos os PHP, `npx tsc -p tsconfig.services.json` e `npm run build`. Validar em MySQL de desenvolvimento antes do deploy: isolamento entre dois clientes, login/logout, aprovação concorrente/repetida, cascata, rollback de lote, downloads sem token e dois fechamentos simultâneos. A máquina local fornecida não tem `pdo_mysql`, `fileinfo` ou `zip` habilitados; esses fluxos não podem ser considerados testados ponta a ponta aqui.
