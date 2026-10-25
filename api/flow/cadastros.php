<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']);
$user = authenticate();
$tipo = required($_GET, 'tipo');
$permitidos = ['fornecedores', 'tipos_documento', 'plano_contas', 'centros_custo'];
if (!in_array($tipo, $permitidos, true)) throw new HttpError(422, 'Cadastro inválido.');

$client = tenant($user, $_GET['cliente_id'] ?? null);

if ($tipo === 'tipos_documento') {
    // cliente_id NULL = tipo de documento global, visível para todos os clientes.
    respond(query('SELECT id,nome FROM tipos_documento WHERE cliente_id=? OR cliente_id IS NULL ORDER BY nome LIMIT 500', [$client])->fetchAll());
}
if ($tipo === 'fornecedores') {
    respond(query('SELECT id,razao_social AS nome FROM fornecedores WHERE cliente_id=? ORDER BY razao_social LIMIT 500', [$client])->fetchAll());
}
if ($tipo === 'plano_contas') {
    $todos = !empty($_GET['todos']);
    $sql = $todos
        ? 'SELECT id,codigo,descricao,tipo FROM plano_contas WHERE cliente_id=?'
        : "SELECT id,codigo,descricao FROM plano_contas WHERE cliente_id=? AND tipo='analitica'";
    respond(query($sql.' ORDER BY codigo LIMIT 1000', [$client])->fetchAll());
}
respond(query('SELECT id,codigo,descricao FROM centros_custo WHERE cliente_id=? ORDER BY codigo LIMIT 1000', [$client])->fetchAll());
