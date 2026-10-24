# Thera Workspace — instruções de continuidade

Leia primeiro `docs/CLAUDE_HANDOFF.md`. Ele contém o estado atual do projeto, o histórico de entregas, o fluxo de deploy e as pendências conhecidas.

## Regras rápidas

- Responder ao usuário em pt-BR.
- Trabalhar sempre em branch `codex/<descrição>` quando houver alteração funcional.
- Validar com `npm run build` antes de publicar.
- Abrir PR no repositório `felicioe/app`, mesclar em `main` e sincronizar o checkout local.
- Nunca versionar senhas, tokens, `database.local.php` ou arquivos `.env`.
- A aplicação é deployada pela Hostinger a partir da branch `main`.
