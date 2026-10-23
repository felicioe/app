# Handoff do frontend para o Lovable

## Origem da API

Em produção, usar a mesma origem:

    https://app.therafinancial.com.br/api

Em desenvolvimento, configurar o proxy do Vite para o Apache/PHP local.

Todas as chamadas autenticadas enviam Authorization: Bearer <token> e Content-Type: application/json.

## Estados obrigatórios

Toda tela deve tratar carregamento, resposta vazia, erro de rede, HTTP 401 (limpar sessão e voltar ao login), HTTP 403 (acesso insuficiente), HTTP 409 (conflito), HTTP 422 (validação) e confirmação de sucesso.

O frontend não decide permissões sozinho. Ele pode ocultar ações por conveniência, mas a API é a autoridade.

## Fluxos mínimos

### Login

POST /api/auth/login.php com JSON {email,senha}. Guardar o token somente para a sessão do Workspace e chamar GET /api/auth/me.php ao iniciar a aplicação.

### Administração

Disponível somente para bpo_adm:

- GET/POST/PATCH /api/admin/usuarios.php
- GET/POST/PATCH /api/admin/clientes.php

Não exibir senha, hash ou credenciais. Usuários cliente devem sempre estar vinculados a um cliente_id.

### Advisory

Usar os serviços existentes para timesheet, Kanban, despesas e faturamento. A seleção de cliente deve ser enviada pelo contexto autorizado da sessão.

### BPO/Flow

Usar os endpoints de documentos, anexos, alçadas, notificações e importação. Upload deve mostrar progresso, validação de tipo/tamanho e resultado da transação.

## Organização de módulos

O BPO/Flow não é uma aplicação separada. Ele é um módulo do Thera Workspace e compartilha login, cliente ativo e permissões com Advisory.

A tela institucional em therafinancial.com.br apenas encaminha para app.therafinancial.com.br; não deve conter componentes internos do Workspace.
