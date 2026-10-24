<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']);
$user = authenticate();
$sql = 'SELECT id,nome,tipo_cobranca,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas FROM clientes';
$params = [];
if (!in_array($user['perfil'], ['bpo_adm', 'bpo_operador'], true)) {
    $sql .= ' WHERE id=?';
    $params[] = positiveId($user['cliente_id']);
}
$rows = query($sql.' ORDER BY nome LIMIT 500', $params)->fetchAll();
respond(array_map(fn(array $row) => [
    'id' => (int) $row['id'],
    'razaoSocial' => $row['nome'],
    'nomeFantasia' => $row['nome'],
    'tipoCobranca' => $row['tipo_cobranca'],
    'valorHora' => (float) $row['valor_hora_padrao'],
    'valorMensalidade' => (float) $row['valor_mensalidade_fixa'],
    'permiteReembolsoDespesas' => (bool) $row['permite_reembolso_despesas'],
], $rows));
