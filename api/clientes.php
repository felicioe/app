<?php
require_once __DIR__.'/bootstrap.php';
method(['GET']);
$user = authenticate();
$sql = 'SELECT id,razao_social,nome_fantasia,tipo_cobranca_padrao,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas FROM clientes';
$params = [];
if (!in_array($user['perfil'], ['bpo_adm', 'bpo_operador'], true)) {
    $sql .= ' WHERE id=?';
    $params[] = positiveId($user['cliente_id']);
}
$rows = query($sql.' ORDER BY razao_social LIMIT 500', $params)->fetchAll();
respond(array_map(fn(array $row) => [
    'id' => (int) $row['id'],
    'razaoSocial' => $row['razao_social'],
    'nomeFantasia' => $row['nome_fantasia'] ?: $row['razao_social'],
    'tipoCobranca' => $row['tipo_cobranca_padrao'],
    'valorHora' => (float) $row['valor_hora_padrao'],
    'valorMensalidade' => (float) $row['valor_mensalidade_fixa'],
    'permiteReembolsoDespesas' => (bool) $row['permite_reembolso_despesas'],
], $rows));
