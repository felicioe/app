<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']);
$user = authenticate();
$tipo = required($_GET, 'tipo');
$permitidos = ['fornecedores', 'tipos_documento', 'plano_contas', 'centros_custo'];
if (!in_array($tipo, $permitidos, true)) throw new HttpError(422, 'Cadastro inválido.');

if ($tipo === 'tipos_documento') {
    respond(query('SELECT id,nome FROM tipos_documento ORDER BY nome LIMIT 500')->fetchAll());
}

$client = tenant($user, $_GET['cliente_id'] ?? null);

if ($tipo === 'fornecedores') {
    respond(query('SELECT id,nome FROM fornecedores WHERE cliente_id=? ORDER BY nome LIMIT 500', [$client])->fetchAll());
}
if ($tipo === 'plano_contas') {
    $todos = !empty($_GET['todos']);
    $sql = $todos
        ? 'SELECT id,codigo,descricao,tipo FROM plano_contas WHERE cliente_id=?'
        : "SELECT id,codigo,descricao FROM plano_contas WHERE cliente_id=? AND tipo='analitica'";
    respond(query($sql.' ORDER BY codigo LIMIT 1000', [$client])->fetchAll());
}
respond(query('SELECT id,codigo,descricao FROM centros_custo WHERE cliente_id=? ORDER BY codigo LIMIT 1000', [$client])->fetchAll());
