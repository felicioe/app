<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/bootstrap.php';

$user = authenticate();
$data = $_GET;
$client = tenant($user, $data['cliente_id'] ?? null);
$document = positiveId($data['documento_id'] ?? null);
owned('documentos_pagar', $document, $client);
respond(query('SELECT a.id,a.documento_id,a.alcada_id,a.usuario_id,u.nome,a.evidencia,a.criada_em FROM aprovacoes_documento a JOIN usuarios u ON u.id=a.usuario_id WHERE a.documento_id=? ORDER BY a.id ASC', [$document])->fetchAll());
