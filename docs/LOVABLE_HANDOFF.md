# Handoff do frontend

O frontend deste projeto é mantido diretamente no repositório `felicioe/app`. O Lovable não faz mais parte do fluxo de desenvolvimento, integração ou publicação.

## Responsabilidades

- Frontend React/Vite, componentes, rotas e serviços TypeScript: manutenção direta no `felicioe/app`.
- API, autenticação, autorização, regras de negócio, banco, uploads e migrações: PHP/PDO no mesmo repositório.
- Publicação: build Vite e pasta `api/` no subdomínio `app.therafinancial.com.br` pela Hostinger.

O código produzido anteriormente no projeto do Lovable pode ser usado apenas como referência visual e funcional. Nenhum commit do Lovable deve ser tratado como integrado automaticamente ao repositório oficial.

## Origem da API

Em produção, usar a mesma origem:

    https://app.therafinancial.com.br/api

Em desenvolvimento, configurar o proxy do Vite para o Apache/PHP local.

Todas as chamadas autenticadas enviam `Authorization: Bearer <token>` e `Content-Type: application/json`, salvo uploads multipart.

## Estados obrigatórios

Toda tela deve tratar carregamento, resposta vazia, erro de rede, HTTP 401 (limpar sessão e voltar ao login), HTTP 403 (acesso insuficiente), HTTP 409 (conflito), HTTP 422 (validação) e confirmação de sucesso.

O frontend não decide permissões sozinho. Ele pode ocultar ações por conveniência, mas a API é a autoridade.

## Fluxos

### Login

`POST /api/auth/login.php` com JSON `{email,senha}`. Guardar o token somente para a sessão do Workspace e chamar `GET /api/auth/me.php` ao iniciar a aplicação.

### Administração

Disponível somente para `bpo_adm`:

- `GET/POST/PATCH /api/admin/usuarios.php`
- `GET/POST/PATCH /api/admin/clientes.php`

Não exibir senha, hash ou credenciais. Usuários cliente devem sempre estar vinculados a um `cliente_id`.

### Advisory

Usar os serviços existentes para timesheet, Kanban, despesas e faturamento. A seleção de cliente deve ser enviada pelo contexto autorizado da sessão.

### BPO/Flow

Usar os endpoints de documentos, anexos, alçadas, notificações e importação. Upload deve mostrar progresso, validação de tipo e tamanho e resultado da transação.

O BPO/Flow é um módulo do Thera Workspace e compartilha login, cliente ativo e permissões com o Advisory.

## Integração

Toda alteração de frontend deve ser implementada no repositório oficial, passar pelo build Vite e pelos testes disponíveis antes de ser publicada.