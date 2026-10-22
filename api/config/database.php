<?php
declare(strict_types=1);
function database(): PDO {
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;

    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '3306';
    $name = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $password = getenv('DB_PASSWORD');
    if (!$name || !$user || $password === false || $password === '') {
        throw new RuntimeException('Configure DB_NAME, DB_USER e DB_PASSWORD no ambiente do servidor.');
    }
    if (strpbrk($host, ";\r\n") !== false || strpbrk($name, ";\r\n") !== false
        || !ctype_digit($port) || (int)$port < 1 || (int)$port > 65535) {
        throw new RuntimeException('Configuração de banco inválida.');
    }
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10,
        ]
    );
    return $pdo;
}
