<?php
declare(strict_types=1);
final class HttpError extends RuntimeException {
    public function __construct(public int $statusCode, string $message) { parent::__construct($message); }
}
function respond(mixed $data = null, int $code = 200, ?string $error = null): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['status'=>$code < 400 ? 'success':'error','data'=>$data,'error'=>$error,'timestamp'=>gmdate('c')], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}
function input(): array {
    try { $value = json_decode(file_get_contents('php://input'), true, 64, JSON_THROW_ON_ERROR); }
    catch (JsonException) { throw new HttpError(400, 'JSON inválido.'); }
    if (!is_array($value) || array_is_list($value)) throw new HttpError(422, 'Objeto JSON obrigatório.');
    return $value;
}
function method(array $allowed): string {
    $method = $_SERVER['REQUEST_METHOD'];
    if (!in_array($method, $allowed, true)) { header('Allow: '.implode(', ', $allowed)); throw new HttpError(405,'Método não permitido.'); }
    return $method;
}
function required(array $data, string $key): string {
    if (!isset($data[$key]) || !is_scalar($data[$key]) || trim((string)$data[$key]) === '') throw new HttpError(422, 'Campo obrigatório: '.$key);
    return trim((string)$data[$key]);
}
function positiveId(mixed $value): int {
    if (filter_var($value, FILTER_VALIDATE_INT) === false || (int)$value < 1) throw new HttpError(422,'Identificador inválido.');
    return (int)$value;
}
function validDate(string $date): string {
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) throw new HttpError(422,'Data inválida.');
    return $date;
}
function transaction(callable $work): mixed {
    $db = database(); $db->beginTransaction();
    try { $result = $work($db); $db->commit(); return $result; }
    catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}
function query(string $sql, array $params = []): PDOStatement {
    $stmt = database()->prepare($sql); $stmt->execute($params); return $stmt;
}
