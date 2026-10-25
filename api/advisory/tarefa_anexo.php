<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']);
$user = authenticate();
$client = tenant($user, $_GET['cliente_id'] ?? null);
$anexoId = positiveId($_GET['anexo_id'] ?? null);
$anexo = query(
    'SELECT a.* FROM tarefa_anexos a
     JOIN tarefas_kanban t ON t.id=a.tarefa_id
     JOIN projetos_consultoria p ON p.id=t.projeto_id
     WHERE a.id=? AND p.cliente_id=?',
    [$anexoId, $client]
)->fetch();
if (!$anexo) throw new HttpError(404, 'Anexo não encontrado.');
$path = dirname(__DIR__).'/storage/uploads/'.basename($anexo['arquivo_nome']);
if (!is_file($path)) throw new HttpError(404, 'Arquivo não encontrado.');
header('Content-Type: '.$anexo['mime']);
header('Content-Disposition: inline; filename="'.rawurlencode($anexo['nome_original']).'"');
header('Cache-Control: no-store');
readfile($path);
