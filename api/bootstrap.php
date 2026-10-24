<?php
declare(strict_types=1);
require_once __DIR__.'/helpers/response.php';
set_exception_handler(function(Throwable $e): void {
    if ($e instanceof HttpError) respond(null, $e->statusCode, $e->getMessage());
    error_log((string)$e); respond(null, 500, 'Erro interno. Consulte o administrador.');
});
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$configuredOrigins = getenv('CORS_ORIGINS') ?: '';
$allowed = array_values(array_unique(array_filter(array_merge(
    ['https://www.therafinancial.com.br', 'https://app.therafinancial.com.br'],
    array_map('trim', explode(',', $configuredOrigins))
))));
if ($origin !== '' && !in_array($origin, $allowed, true)) throw new HttpError(403, 'Origem não permitida.');
if ($origin !== '') { header('Access-Control-Allow-Origin: '.$origin); header('Vary: Origin'); }
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
require_once __DIR__.'/config/database.php';
require_once __DIR__.'/helpers/auth_middleware.php';
date_default_timezone_set('America/Sao_Paulo');
