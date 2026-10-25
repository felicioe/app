<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['POST']);
$user = authenticate(['bpo_adm', 'bpo_operador']);
$data = input();
$client = tenant($user, $data['cliente_id'] ?? null);
$titulo = required($data, 'titulo');
if (strlen($titulo) > 200) throw new HttpError(422, 'Título muito longo.');
$id = transaction(function () use ($client, $titulo) {
    query('SELECT id FROM clientes WHERE id=? FOR UPDATE', [$client]);
    query('INSERT INTO projetos_consultoria (cliente_id, titulo) VALUES (?,?)', [$client, $titulo]);
    return (int) database()->lastInsertId();
});
respond(['id' => $id], 201);
