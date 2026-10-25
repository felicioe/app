<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method = method(['GET', 'POST', 'PATCH', 'DELETE']);
$user = authenticate();
$data = in_array($method, ['GET', 'DELETE'], true) ? $_GET : input();
$client = tenant($user, $data['cliente_id'] ?? null);

if ($method === 'GET') {
    // cliente_id NULL = tipo de documento global, visível para todos os clientes.
    respond(query('SELECT id,nome,cliente_id FROM tipos_documento WHERE cliente_id=? OR cliente_id IS NULL ORDER BY nome LIMIT 500', [$client])->fetchAll());
}
if (!in_array($user['perfil'], ['bpo_adm', 'bpo_operador'], true)) throw new HttpError(403, 'Perfil sem permissão.');

if ($method === 'DELETE') {
    $id = positiveId($data['id'] ?? null);
    if (!query('SELECT id FROM tipos_documento WHERE id=? AND (cliente_id=? OR cliente_id IS NULL)', [$id, $client])->fetch()) throw new HttpError(404, 'Tipo de documento não encontrado.');
    try {
        query('DELETE FROM tipos_documento WHERE id=?', [$id]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') throw new HttpError(409, 'Tipo de documento em uso em documentos existentes e não pode ser excluído.');
        throw $e;
    }
    respond(['excluido' => true]);
}

$nome = required($data, 'nome');
if (strlen($nome) > 100) throw new HttpError(422, 'Nome muito longo.');

if ($method === 'POST') {
    $id = transaction(function () use ($client, $nome) {
        query('INSERT INTO tipos_documento (cliente_id,nome) VALUES (?,?)', [$client, $nome]);
        return (int) database()->lastInsertId();
    });
    respond(['id' => $id], 201);
}

$id = positiveId($data['id'] ?? null);
if (!query('SELECT id FROM tipos_documento WHERE id=? AND (cliente_id=? OR cliente_id IS NULL)', [$id, $client])->fetch()) throw new HttpError(404, 'Tipo de documento não encontrado.');
query('UPDATE tipos_documento SET nome=? WHERE id=?', [$nome, $id]);
respond(['id' => $id]);
