<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method = method(['GET', 'POST']);
$user = authenticate();
$data = $method === 'GET' ? $_GET : $_POST;
$client = tenant($user, $data['cliente_id'] ?? null);
$tarefa = positiveId($data['tarefa_id'] ?? null);
owned('tarefas_kanban', $tarefa, $client);

if ($method === 'GET') {
    $rows = query(
        'SELECT a.id,a.nome_original,a.mime,a.tamanho,a.criado_em,u.nome AS enviado_por
         FROM tarefa_anexos a LEFT JOIN usuarios u ON u.id=a.criado_por_usuario_id
         WHERE a.tarefa_id=? ORDER BY a.id DESC LIMIT 200',
        [$tarefa]
    )->fetchAll();
    respond($rows);
}

$file = $_FILES['arquivo'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > 10 * 1024 * 1024 || !is_uploaded_file($file['tmp_name'])) {
    throw new HttpError(422, 'Anexo obrigatório, máximo de 10 MB.');
}
if (!class_exists('finfo')) throw new RuntimeException('Extensão fileinfo necessária.');
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$ext = [
    'application/pdf' => 'pdf',
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'text/plain' => 'txt',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'application/vnd.ms-excel' => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
][$mime] ?? null;
if (!$ext) throw new HttpError(422, 'Tipo de arquivo não suportado.');
$nomeOriginal = isset($data['nome']) && trim((string) $data['nome']) !== '' ? substr(trim((string) $data['nome']), 0, 255) : $file['name'];
$nomeArquivo = bin2hex(random_bytes(24)).'.'.$ext;
$path = dirname(__DIR__).'/storage/uploads/'.$nomeArquivo;
if (!move_uploaded_file($file['tmp_name'], $path)) throw new RuntimeException('Falha ao armazenar anexo.');
try {
    $id = transaction(function () use ($tarefa, $nomeOriginal, $nomeArquivo, $mime, $file, $user) {
        query(
            'INSERT INTO tarefa_anexos (tarefa_id,nome_original,arquivo_nome,mime,tamanho,criado_por_usuario_id) VALUES (?,?,?,?,?,?)',
            [$tarefa, $nomeOriginal, $nomeArquivo, $mime, $file['size'], $user['id']]
        );
        return (int) database()->lastInsertId();
    });
} catch (Throwable $e) {
    unlink($path);
    throw $e;
}
respond(['id' => $id], 201);
