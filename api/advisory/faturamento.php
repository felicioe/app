<?php
require_once dirname(__DIR__).'/bootstrap.php';
require_once dirname(__DIR__).'/services/BillingService.php';
$method=method(['GET','POST']); $user=authenticate(['bpo_adm']);
$data=$method==='POST'?input():$_GET; $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') respond(query('SELECT * FROM faturas_honorarios WHERE cliente_id=? ORDER BY id DESC LIMIT 200',[$client])->fetchAll());
$start=validDate(required($data,'inicio')); $end=validDate(required($data,'fim'));
if ($end<$start) throw new HttpError(422,'Período inválido.');
respond(BillingService::close($client,$start,$end),201);
