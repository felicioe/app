<?php
declare(strict_types=1);
function database(): PDO {
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;

    $local = is_file(__DIR__.'/database.local.php') ? require __DIR__.'/database.local.php' : [];
    $env = [];
    foreach ([__DIR__.'/../../.env', __DIR__.'/../../../.env', '/home/u630316951/hbuilds/config/.env'] as $envFile) {
        if (!is_file($envFile)) continue;
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
            [$key, $value] = explode('=', $line, 2); $env[trim($key)] = trim($value, " \t\"'");
        }
    }
    $read = static fn(string $key, $fallback = null) => getenv($key) !== false ? getenv($key) : ($env[$key] ?? $fallback);
    $host = $read('DB_HOST', $local['host'] ?? 'localhost');
    $port = $read('DB_PORT', $local['port'] ?? '3306');
    $name = $read('DB_NAME', $local['name'] ?? null);
    $user = $read('DB_USER', $local['user'] ?? null);
    // A configuração local do deploy tem precedência para permitir rotação segura
    // da senha sem depender de um valor antigo mantido no painel de ambiente.
    $password = $local['password'] ?? $read('DB_PASSWORD');
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
