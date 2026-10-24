<?php
require_once dirname(__DIR__).'/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
try {
  $tables = query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('usuarios','login_tentativas','sessoes_api') ORDER BY TABLE_NAME")->fetchAll(PDO::FETCH_COLUMN);
  $columns = [];
  foreach (['usuarios','login_tentativas','sessoes_api'] as $table) {
    $columns[$table] = query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION", [$table])->fetchAll();
  }
  respond(['database'=>getenv('DB_NAME') ?: 'configured-local','tables'=>$tables,'columns'=>$columns]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE); }
