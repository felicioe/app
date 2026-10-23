# Thera Workspace — API

Implementação PHP 8.1+ sem framework para a API do Thera Workspace. O frontend React/Vite fica em `src/` e é mantido pelo Lovable; a API PHP em `api/` é mantida por Claude/Codex. A aplicação é publicada exclusivamente em `app.therafinancial.com.br`; o site institucional e o Krieger possuem repositórios e deployments separados.

## Banco e instalação

O escopo recebido informa nomes de tabelas, mas não o DDL. `sql/schema.reference.sql` descreve **o contrato exato de colunas utilizado pelo código**, para um banco novo de desenvolvimento. Não é uma migração para o banco existente. Antes de implantação, comparar o `SHOW CREATE TABLE` das tabelas existentes, adaptar nomes/tipos e preparar uma migração revisada com backup. O código usa também tabelas auxiliares de sessões, tentativas, snapshots de alçadas e notificações. `fornecedores` e `tipos_documento` existentes não são alterados.

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
- `GET/POST/PATCH advisory/kanban.php`: listar projetos/tarefas, criar tarefa e mover status (`pendente`, `em_andamento`, `concluida`). Apenas BPO altera.
- `GET/POST advisory/despesas.php`: `{cliente_id,data,descricao,valor,reembolsavel}`. Valores monetários como string decimal com ponto.
- `POST advisory/faturamento.php`: `{cliente_id,inicio,fim}`; exclusivo `bpo_adm`. `GET` lista faturas. Datas inclusivas. Valores calculados em centavos, arredondamento ao centavo após somar os minutos. Ciclo padrão do timesheet: mês calendário. Fechamentos sobrepostos são rejeitados; horas e despesas não podem ser lançadas em períodos encerrados.
- `GET flow/cliente.php?cliente_id=1`: retorna somente o tenant autorizado pela sessão.
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


## Administração do Workspace

Rotas administrativas exigem `Authorization: Bearer <token>` de um usuário `bpo_adm`.

- `GET /api/admin/usuarios.php`: lista usuários, opcionalmente filtrados por `cliente_id`.
- `POST /api/admin/usuarios.php`: cria usuário com `nome`, `email`, `senha`, `perfil` e `cliente_id` quando aplicável.
- `PATCH /api/admin/usuarios.php`: atualiza usuário por `id`; pode alterar nome, e-mail, perfil, ativo e senha.
- `GET /api/admin/clientes.php`: lista clientes/tenants.
- `POST /api/admin/clientes.php`: cria cliente com regras de cobrança.
- `PATCH /api/admin/clientes.php`: atualiza dados de cobrança de um cliente.

Senhas nunca são retornadas. A interface deve tratar 401/403/409/422 usando o envelope padrão.
