<?php
declare(strict_types=1);
require_once __DIR__.'/../bootstrap.php';

$user = authenticate(['bpo_adm']);
$method = method(['GET','POST','PATCH']);

function adminPayload(): array {
    $data = input();
    $perfil = required($data, 'perfil');
    $allowed = ['bpo_adm','bpo_operador','cliente_diretor','cliente_gerente','cliente_coordenador','cliente_usuario'];
    if (!in_array($perfil, $allowed, true)) throw new HttpError(422, 'Perfil inválido.');
    return [$data, $perfil];
}

if ($method === 'GET') {
    $cliente = isset($_GET['cliente_id']) ? positiveId($_GET['cliente_id']) : null;
    $sql = 'SELECT u.id,u.cliente_id,u.nome,u.email,u.ativo,u.perfil FROM usuarios u';
    $params = [];
    if ($cliente !== null) { $sql .= ' WHERE u.cliente_id=?'; $params[] = $cliente; }
    $sql .= ' ORDER BY u.nome ASC LIMIT 500';
    respond(query($sql, $params)->fetchAll());
}

if ($method === 'POST') {
    [$data, $perfil] = adminPayload();
    $nome = required($data, 'nome');
    $email = strtolower(required($data, 'email'));
    $senha = required($data, 'senha');
    if (strlen($senha) < 12) throw new HttpError(422, 'A senha inicial deve ter pelo menos 12 caracteres.');
    $clienteId = in_array($perfil, ['bpo_adm','bpo_operador'], true) ? null : positiveId($data['cliente_id'] ?? null);
    $hash = password_hash($senha, PASSWORD_DEFAULT);
    try {
        $id = transaction(function(PDO $db) use ($clienteId,$nome,$email,$hash,$perfil): int {
            $stmt = $db->prepare('INSERT INTO usuarios (cliente_id,nome,email,senha_hash,ativo,perfil) VALUES (?,?,?,?,1,?)');
            $stmt->execute([$clienteId,$nome,$email,$hash,$perfil]);
            return (int)$db->lastInsertId();
        });
    } catch (PDOException $e) {
        if ((int)$e->errorInfo[1] === 1062) throw new HttpError(409, 'E-mail já cadastrado.');
        throw $e;
    }
    respond(['id'=>$id], 201);
}

[$data, $perfil] = adminPayload();
$id = positiveId($data['id'] ?? null);
if ($id === (int)$user['id'] && array_key_exists('ativo', $data) && !(bool)$data['ativo']) {
    throw new HttpError(422, 'Não é permitido desativar a própria conta.');
}
$fields = [];
$params = [];
foreach (['nome','email','perfil'] as $field) {
    if (array_key_exists($field, $data)) {
        $value = trim((string)$data[$field]);
        if ($value === '') throw new HttpError(422, 'Campo inválido: '.$field);
        $fields[] = $field.'=?'; $params[] = $field === 'email' ? strtolower($value) : $value;
    }
}
if (array_key_exists('ativo',$data)) { $fields[]='ativo=?'; $params[]=(int)(bool)$data['ativo']; }
if (array_key_exists('senha',$data)) {
    $senha = required($data, 'senha');
    if (strlen($senha) < 12) throw new HttpError(422, 'A senha deve ter pelo menos 12 caracteres.');
    $fields[]='senha_hash=?'; $params[]=password_hash($senha, PASSWORD_DEFAULT);
}
if (!$fields) throw new HttpError(422, 'Nenhuma alteração informada.');
$params[] = $id;
query('UPDATE usuarios SET '.implode(',', $fields).' WHERE id=?', $params);
respond(['id'=>$id,'updated'=>true]);
