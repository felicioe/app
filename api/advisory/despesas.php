<?php
require_once dirname(__DIR__).'/bootstrap.php';
require_once dirname(__DIR__).'/services/BillingService.php';
$method=method(['GET','POST']); $user=authenticate(['bpo_adm','bpo_operador']); $data=$method==='GET'?$_GET:input(); $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') respond(query('SELECT * FROM despesas_adicionais WHERE cliente_id=? ORDER BY data DESC LIMIT 500',[$client])->fetchAll());
$date=validDate(required($data,'data')); $value=BillingService::decimal(BillingService::cents(required($data,'valor')));
$id=transaction(function() use ($client,$date,$value,$data) {
    query('SELECT id FROM clientes WHERE id=? FOR UPDATE',[$client]);
    if (query('SELECT id FROM faturas_honorarios WHERE cliente_id=? AND ? BETWEEN periodo_inicio AND periodo_fim',[$client,$date])->fetch()) throw new HttpError(409,'Período encerrado.');
    query('INSERT INTO despesas_adicionais (cliente_id,data,descricao,valor,reembolsavel) VALUES (?,?,?,?,?)',[$client,$date,required($data,'descricao'),$value,($data['reembolsavel']??false)?1:0]); return (int)database()->lastInsertId();
}); respond(['id'=>$id],201);
