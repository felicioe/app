<?php
require_once __DIR__.'/bootstrap.php';
$method = method(['GET', 'POST']);
if ($method === 'GET') {
    $rows = query('SELECT chave,valor FROM conteudo_site')->fetchAll();
    $out = [];
    foreach ($rows as $row) $out[$row['chave']] = $row['valor'];
    respond($out);
}
$user = authenticate(['bpo_adm']);
$data = input();
if (!$data) throw new HttpError(422, 'Conteúdo obrigatório.');
transaction(function () use ($data, $user) {
    foreach ($data as $chave => $valor) {
        if (!is_string($chave) || !preg_match('/^[a-z_]{1,80}$/D', $chave)) throw new HttpError(422, 'Chave inválida: '.$chave);
        if (!is_string($valor) || strlen($valor) > 20000) throw new HttpError(422, 'Valor inválido para: '.$chave);
        query(
            'INSERT INTO conteudo_site (chave,valor,atualizado_por_usuario_id) VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE valor=VALUES(valor), atualizado_por_usuario_id=VALUES(atualizado_por_usuario_id)',
            [$chave, $valor, $user['id']]
        );
    }
});
respond(['atualizado' => true]);
