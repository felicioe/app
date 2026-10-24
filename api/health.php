<?php
declare(strict_types=1);
require_once __DIR__.'/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    throw new HttpError(405, 'Método não permitido.');
}

try {
    database()->query('SELECT 1');
    respond(['api'=>'ok','database'=>'ok','environment'=>'workspace']);
} catch (Throwable) {
    respond(['api'=>'ok','database'=>'unavailable','environment'=>'workspace'], 503);
}
