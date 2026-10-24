# Publicação do Thera Workspace

## Frontend

O build Vite deve ser publicado com `index.html`, assets gerados e `public/.htaccess` no diretório público do site.

O fallback SPA é obrigatório para `/workspace`, `/advisory` e qualquer rota futura do React.

## API PHP

A pasta `api/` deve permanecer no mesmo site, com execução PHP habilitada. O servidor não deve tratar os arquivos PHP como arquivos estáticos.

Variáveis obrigatórias: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `APP_SIGNING_KEY` e `CORS_ORIGINS`.

A pasta `api/storage/uploads` precisa ser gravável pelo PHP e bloqueada para acesso direto.

## Validação pós-publicação

1. `GET /api/health.php`: confirmar HTTP 200 com `api=ok` e `database=ok`.
2. Abrir `/`, `/workspace` e `/advisory` diretamente.
3. Testar login com usuário real.
4. Confirmar `GET /api/auth/me.php` sem token retorna 401.
5. Confirmar isolamento entre dois `cliente_id`.
6. Testar upload, aprovação, notificações e importação.
7. Confirmar que `api/storage/uploads` não permite download direto.

O preview estático valida apenas o frontend. Ele não comprova a execução da API PHP nem a conexão MySQL.
