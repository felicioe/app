<?php
require_once __DIR__.'/bootstrap.php';
require_once __DIR__.'/services/BillingService.php';
$method = method(['GET', 'POST', 'PATCH']);
$user = authenticate();

if ($method === 'GET') {
    $sql = 'SELECT id,razao_social,nome_fantasia,cnpj_cpf,email_contato,telefone,tipo_cobranca_padrao,valor_hora_padrao,valor_mensalidade_fixa,franquia_horas,permite_reembolso_despesas,ativo FROM clientes';
    $params = [];
    $condicoes = [];
    if (!in_array($user['perfil'], ['bpo_adm', 'bpo_operador'], true)) {
        $condicoes[] = 'id=?';
        $params[] = positiveId($user['cliente_id']);
    } elseif (empty($_GET['todos'])) {
        $condicoes[] = 'ativo=1';
    }
    if ($condicoes) $sql .= ' WHERE '.implode(' AND ', $condicoes);
    $rows = query($sql.' ORDER BY razao_social LIMIT 500', $params)->fetchAll();
    respond(array_map(fn(array $row) => [
        'id' => (int) $row['id'],
        'razaoSocial' => $row['razao_social'],
        'nomeFantasia' => $row['nome_fantasia'] ?: $row['razao_social'],
        'cnpjCpf' => $row['cnpj_cpf'],
        'emailContato' => $row['email_contato'],
        'telefone' => $row['telefone'],
        'tipoCobranca' => $row['tipo_cobranca_padrao'],
        'valorHora' => (float) $row['valor_hora_padrao'],
        'valorMensalidade' => (float) $row['valor_mensalidade_fixa'],
        'franquiaHoras' => (float) $row['franquia_horas'],
        'permiteReembolsoDespesas' => (bool) $row['permite_reembolso_despesas'],
        'ativo' => (bool) $row['ativo'],
    ], $rows));
}

if ($user['perfil'] !== 'bpo_adm') throw new HttpError(403, 'Apenas o administrador BPO pode gerenciar clientes.');
$data = input();

$razaoSocial = required($data, 'razaoSocial');
if (strlen($razaoSocial) > 255) throw new HttpError(422, 'Razão social muito longa.');
$nomeFantasia = isset($data['nomeFantasia']) && trim((string) $data['nomeFantasia']) !== '' ? trim((string) $data['nomeFantasia']) : null;
$cnpjCpf = isset($data['cnpjCpf']) && trim((string) $data['cnpjCpf']) !== '' ? trim((string) $data['cnpjCpf']) : null;
$emailContato = isset($data['emailContato']) && trim((string) $data['emailContato']) !== '' ? trim((string) $data['emailContato']) : null;
$telefone = isset($data['telefone']) && trim((string) $data['telefone']) !== '' ? trim((string) $data['telefone']) : null;
$tipoCobranca = $data['tipoCobranca'] ?? 'hora';
if (!in_array($tipoCobranca, ['hora', 'fechado', 'misto'], true)) throw new HttpError(422, 'Tipo de cobrança inválido.');
$valorHora = BillingService::decimal(BillingService::cents($data['valorHora'] ?? '0'));
$valorMensalidade = BillingService::decimal(BillingService::cents($data['valorMensalidade'] ?? '0'));
$franquiaHoras = filter_var($data['franquiaHoras'] ?? 0, FILTER_VALIDATE_INT);
if ($franquiaHoras === false || $franquiaHoras < 0) throw new HttpError(422, 'Franquia de horas inválida.');
$reembolso = ($data['permiteReembolsoDespesas'] ?? true) ? 1 : 0;

if ($method === 'POST') {
    $id = transaction(function () use ($razaoSocial, $nomeFantasia, $cnpjCpf, $emailContato, $telefone, $tipoCobranca, $valorHora, $valorMensalidade, $franquiaHoras, $reembolso) {
        query(
            'INSERT INTO clientes (razao_social,nome_fantasia,cnpj_cpf,email_contato,telefone,tipo_cobranca_padrao,valor_hora_padrao,valor_mensalidade_fixa,franquia_horas,permite_reembolso_despesas,ativo) VALUES (?,?,?,?,?,?,?,?,?,?,1)',
            [$razaoSocial, $nomeFantasia, $cnpjCpf, $emailContato, $telefone, $tipoCobranca, $valorHora, $valorMensalidade, $franquiaHoras, $reembolso]
        );
        return (int) database()->lastInsertId();
    });
    respond(['id' => $id], 201);
}

$id = positiveId($data['id'] ?? null);
$ativo = ($data['ativo'] ?? true) ? 1 : 0;
transaction(function () use ($id, $razaoSocial, $nomeFantasia, $cnpjCpf, $emailContato, $telefone, $tipoCobranca, $valorHora, $valorMensalidade, $franquiaHoras, $reembolso, $ativo) {
    if (!query('SELECT id FROM clientes WHERE id=? FOR UPDATE', [$id])->fetch()) throw new HttpError(404, 'Cliente não encontrado.');
    query(
        'UPDATE clientes SET razao_social=?,nome_fantasia=?,cnpj_cpf=?,email_contato=?,telefone=?,tipo_cobranca_padrao=?,valor_hora_padrao=?,valor_mensalidade_fixa=?,franquia_horas=?,permite_reembolso_despesas=?,ativo=? WHERE id=?',
        [$razaoSocial, $nomeFantasia, $cnpjCpf, $emailContato, $telefone, $tipoCobranca, $valorHora, $valorMensalidade, $franquiaHoras, $reembolso, $ativo, $id]
    );
});
respond(['id' => $id]);
