<?php
declare(strict_types=1);
require_once __DIR__.'/../bootstrap.php';

authenticate(['bpo_adm']);
$method = method(['GET','POST','PATCH']);

if ($method === 'GET') {
    respond(query('SELECT id,nome,tipo_cobranca,franquia_horas,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas FROM clientes ORDER BY nome ASC LIMIT 500')->fetchAll());
}

$data = input();
if ($method === 'POST') {
    $nome = required($data, 'nome');
    $tipo = required($data, 'tipo_cobranca');
    if (!in_array($tipo, ['hora','fechado','misto'], true)) throw new HttpError(422, 'Tipo de cobrança inválido.');
    $franquia = (string)($data['franquia_horas'] ?? '0');
    $hora = (string)($data['valor_hora_padrao'] ?? '0');
    $mensalidade = (string)($data['valor_mensalidade_fixa'] ?? '0');
    $reembolso = (int)(bool)($data['permite_reembolso_despesas'] ?? false);
    $id = transaction(function(PDO $db) use ($nome,$tipo,$franquia,$hora,$mensalidade,$reembolso): int {
        $stmt = $db->prepare('INSERT INTO clientes (nome,tipo_cobranca,franquia_horas,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$nome,$tipo,$franquia,$hora,$mensalidade,$reembolso]);
        return (int)$db->lastInsertId();
    });
    respond(['id'=>$id], 201);
}

$id = positiveId($data['id'] ?? null);
$sets = [];
$params = [];
foreach (['nome','tipo_cobranca','franquia_horas','valor_hora_padrao','valor_mensalidade_fixa','permite_reembolso_despesas'] as $field) {
    if (!array_key_exists($field, $data)) continue;
    $value = $data[$field];
    if ($field === 'tipo_cobranca' && !in_array($value, ['hora','fechado','misto'], true)) throw new HttpError(422, 'Tipo de cobrança inválido.');
    $sets[] = $field.'=?';
    $params[] = $field === 'permite_reembolso_despesas' ? (int)(bool)$value : $value;
}
if (!$sets) throw new HttpError(422, 'Nenhuma alteração informada.');
$params[] = $id;
query('UPDATE clientes SET '.implode(',', $sets).' WHERE id=?', $params);
respond(['id'=>$id,'updated'=>true]);
