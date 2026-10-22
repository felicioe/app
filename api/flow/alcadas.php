<?php
require_once dirname(__DIR__).'/bootstrap.php';
require_once dirname(__DIR__).'/services/ApprovalService.php';
$method=method(['GET','POST']); $user=authenticate(['bpo_adm','bpo_operador','cliente_diretor','cliente_gerente','cliente_coordenador']);
$data=$method==='POST'?input():$_GET; $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') respond(query('SELECT id,etapa,valor_minimo,valor_maximo,tipo_aprovacao,aprovadores_necessarios FROM regras_alcada WHERE cliente_id=? ORDER BY etapa',[$client])->fetchAll());
respond(ApprovalService::approve(positiveId($data['documento_id']??null),$client,$user));
