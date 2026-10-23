<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/bootstrap.php';

$user = authenticate();
$client = tenant($user, $_GET['cliente_id'] ?? null);
respond(query('SELECT id,nome,tipo_cobranca,franquia_horas,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas FROM clientes WHERE id=?', [$client])->fetch() ?: throw new HttpError(404, 'Cliente não encontrado.'));
