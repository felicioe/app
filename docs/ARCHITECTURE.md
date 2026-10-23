# Arquitetura do Thera Workspace

## Responsabilidades

O repositório `felicioe/app` contém exclusivamente o Thera Workspace e o Thera Flow/BPO. Ele é publicado em `https://app.therafinancial.com.br`.

- **Lovable:** implementa e evolui a interface React/TypeScript em `src/`.
- **Claude/Codex:** implementam a API PHP, autenticação, regras de negócio, banco, testes, documentação e deployment.
- **Hostinger:** publica o build do Vite e a pasta `api/` no subdomínio do Workspace.

O domínio `https://therafinancial.com.br` pertence ao repositório `felicioe/SiteGlobal`. O domínio `https://krieger.therafinancial.com.br` pertence ao projeto Krieger e possui banco e configuração próprios. Nenhum desses projetos deve ser incorporado ao Workspace.

## Composição da aplicação

```
navegador
  -> SPA React/Vite (arquivos compilados)
  -> /api/*.php
  -> PHP 8.x + PDO
  -> banco MySQL exclusivo do Workspace
```

O React não acessa o MySQL diretamente. Toda autenticação, autorização, isolamento por `cliente_id`, upload, aprovação, importação e faturamento passam pela API PHP.

## Contrato de publicação

A raiz do deployment deve conter os arquivos gerados por `npm run build` e a pasta `api/`. A Hostinger deve apontar o site do subdomínio para a branch `main) depois que o PR de consolidação for aprovado.

Variáveis obrigatórias no ambiente do servidor:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `APP_SIGNING_KEY`
- `CORS_ORIGINS=https://app.therafinancial.com.br`

Segredos nunca entram no GitHub, no frontend ou em arquivos públicos.

## Fluxo de trabalho

1. Lovable implementa a interface e abre PR no repositório `app).
2. Claude/Codex revisam o contrato da API e implementam backend, banco e testes.
3. O PR registra issue, critérios de aceite, validações e impacto de deployment.
4. Após merge em `main`, a Hostinger faz o deployment do subdomínio.
5. O comentário de publicação registra SHA, data/hora, URL e resultado dos smoke tests.

## Critérios para considerar a consolidação concluída

- O build React não contém página institucional antiga.
- A SPA carregada em `app.therafinancial.com.br` consome a API pela mesma origem.
- `POST /api/auth/login.php` retorna JSON padronizado.
- O banco do Workspace é separado do Krieger.
- O domínio principal continua servindo somente o SiteGlobal.
- O frontend do Lovable e a API PHP têm documentação de integração atualizada.
