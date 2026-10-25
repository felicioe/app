<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method = method(['GET', 'POST', 'PATCH', 'DELETE']);
$user = authenticate();
$data = in_array($method, ['GET', 'DELETE'], true) ? $_GET : input();
$client = tenant($user, $data['cliente_id'] ?? null);

if ($method === 'GET') {
    respond(query('SELECT id,razao_social,cnpj_cpf,dados_bancarios,chave_pix FROM fornecedores WHERE cliente_id=? ORDER BY razao_social LIMIT 500', [$client])->fetchAll());
}
if (!in_array($user['perfil'], ['bpo_adm', 'bpo_operador'], true)) throw new HttpError(403, 'Perfil sem permissão.');

if ($method === 'DELETE') {
    $id = positiveId($data['id'] ?? null);
    if (!query('SELECT id FROM fornecedores WHERE id=? AND cliente_id=?', [$id, $client])->fetch()) throw new HttpError(404, 'Fornecedor não encontrado.');
    try {
        query('DELETE FROM fornecedores WHERE id=?', [$id]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') throw new HttpError(409, 'Fornecedor em uso em documentos existentes e não pode ser excluído.');
        throw $e;
    }
    respond(['excluido' => true]);
}

$razaoSocial = required($data, 'razao_social');
if (strlen($razaoSocial) > 255) throw new HttpError(422, 'Nome muito longo.');
$cnpjCpf = isset($data['cnpj_cpf']) && trim((string) $data['cnpj_cpf']) !== '' ? trim((string) $data['cnpj_cpf']) : null;
$dadosBancarios = isset($data['dados_bancarios']) && trim((string) $data['dados_bancarios']) !== '' ? trim((string) $data['dados_bancarios']) : null;
$chavePix = isset($data['chave_pix']) && trim((string) $data['chave_pix']) !== '' ? trim((string) $data['chave_pix']) : null;

if ($method === 'POST') {
    $id = transaction(function () use ($client, $razaoSocial, $cnpjCpf, $dadosBancarios, $chavePix) {
        query('INSERT INTO fornecedores (cliente_id,razao_social,cnpj_cpf,dados_bancarios,chave_pix) VALUES (?,?,?,?,?)', [$client, $razaoSocial, $cnpjCpf, $dadosBancarios, $chavePix]);
        return (int) database()->lastInsertId();
    });
    respond(['id' => $id], 201);
}

$id = positiveId($data['id'] ?? null);
if (!query('SELECT id FROM fornecedores WHERE id=? AND cliente_id=?', [$id, $client])->fetch()) throw new HttpError(404, 'Fornecedor não encontrado.');
query('UPDATE fornecedores SET razao_social=?,cnpj_cpf=?,dados_bancarios=?,chave_pix=? WHERE id=?', [$razaoSocial, $cnpjCpf, $dadosBancarios, $chavePix, $id]);
respond(['id' => $id]);
