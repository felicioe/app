<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method=method(['GET','POST']); $user=authenticate(); $data=$method==='POST'?input():$_GET; $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') {
    $start=validDate($data['inicio']??date('Y-m-01')); $end=validDate($data['fim']??date('Y-m-t'));
    if ($end<$start) throw new HttpError(422,'Período inválido.');
    $rows=query('SELECT * FROM apontamentos_horas WHERE cliente_id=? AND data BETWEEN ? AND ? ORDER BY data DESC,id DESC LIMIT 2000',[$client,$start,$end])->fetchAll();
    $sum=query('SELECT COALESCE(SUM(duracao_minutos),0) AS minutos FROM apontamentos_horas WHERE cliente_id=? AND data BETWEEN ? AND ?',[$client,$start,$end])->fetch();
    respond(['apontamentos'=>$rows,'total_minutos'=>(int)$sum['minutos']]);
}
if (!in_array($user['perfil'],['bpo_adm','bpo_operador'],true)) throw new HttpError(403,'Perfil sem permissão.');
$date=validDate(required($data,'data')); $start=required($data,'hora_inicio'); $end=required($data,'hora_fim');
foreach ([$start,$end] as $time) if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$time)) throw new HttpError(422,'Horário inválido. Use HH:mm.');
$minutes=(int)((strtotime($date.' '.$end)-strtotime($date.' '.$start))/60);
if ($minutes<=0) throw new HttpError(422,'A hora final deve ser posterior à inicial no mesmo dia.');
$id=transaction(function() use ($data,$client,$user,$date,$start,$end,$minutes) {
    query('SELECT id FROM clientes WHERE id=? FOR UPDATE',[$client]);
    if (query('SELECT id FROM faturas_honorarios WHERE cliente_id=? AND ? BETWEEN periodo_inicio AND periodo_fim',[$client,$date])->fetch()) throw new HttpError(409,'Período já encerrado.');
    $project=positiveId($data['projeto_id']??null); owned('projetos_consultoria',$project,$client);
    $task=isset($data['tarefa_id'])?positiveId($data['tarefa_id']):null;
    if ($task && (int)owned('tarefas_kanban',$task,$client)['projeto_id']!==$project) throw new HttpError(422,'Tarefa de outro projeto.');
    query('INSERT INTO apontamentos_horas (cliente_id,usuario_id,projeto_id,tarefa_id,data,hora_inicio,hora_fim,duracao_minutos,faturavel) VALUES (?,?,?,?,?,?,?,?,?)',[$client,$user['id'],$project,$task,$date,$start,$end,$minutes,($data['faturavel']??true)?1:0]);
    return (int)database()->lastInsertId();
}); respond(['id'=>$id,'duracao_minutos'=>$minutes],201);
