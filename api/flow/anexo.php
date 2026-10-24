<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']); $user=authenticate(); $client=tenant($user,$_GET['cliente_id']??null);
$doc=owned('documentos_pagar',positiveId($_GET['documento_id']??null),$client);
$path=dirname(__DIR__).'/storage/uploads/'.basename($doc['arquivo_url']);
if (!is_file($path)) throw new HttpError(404,'Anexo não encontrado.');
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
header('Content-Type: '.$mime); header('Content-Disposition: attachment; filename="documento-'.$doc['id'].'.'.pathinfo($path,PATHINFO_EXTENSION).'"'); header('Cache-Control: no-store'); readfile($path);
