<?php
declare(strict_types=1);
function authenticate(array $roles = []): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer ([a-f0-9]{64})$/i', $header, $match)) throw new HttpError(401, 'Autenticação necessária.');
    $user = query('SELECT u.id,u.nome,u.email,u.perfil,u.cliente_id,s.id AS sessao_id FROM sessoes_api s JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=? AND s.expira_em>UTC_TIMESTAMP() AND u.ativo=1', [hash('sha256', $match[1])])->fetch();
    if (!$user) throw new HttpError(401, 'Sessão inválida ou expirada.');
    if ($roles && !in_array($user['perfil'], $roles, true)) throw new HttpError(403, 'Perfil sem permissão.');
    return $user;
}
function tenant(array $user, mixed $requested = null): int {
    if (in_array($user['perfil'], ['bpo_adm','bpo_operador'], true)) return positiveId($requested);
    $id = positiveId($user['cliente_id']);
    if ($requested !== null && positiveId($requested) !== $id) throw new HttpError(403, 'Cliente fora do escopo.');
    return $id;
}
function owned(string $table, int $id, int $client): array {
    if (!in_array($table,['projetos_consultoria','tarefas_kanban','documentos_pagar'], true)) throw new LogicException('Tabela inválida');
    $row = $table === 'tarefas_kanban'
        ? query('SELECT t.* FROM tarefas_kanban t JOIN projetos_consultoria p ON p.id=t.projeto_id WHERE t.id=? AND p.cliente_id=?',[$id,$client])->fetch()
        : query("SELECT * FROM $table WHERE id=? AND cliente_id=?",[$id,$client])->fetch();
    if (!$row) throw new HttpError(404,'Registro não encontrado.');
    return $row;
}
