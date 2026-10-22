<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method=method(['GET','POST','PATCH']); $user=authenticate(); $data=$method==='GET'?$_GET:input(); $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') respond(['projetos'=>query('SELECT * FROM projetos_consultoria WHERE cliente_id=?',[$client])->fetchAll(),'tarefas'=>query('SELECT * FROM tarefas_kanban WHERE cliente_id=? ORDER BY id DESC LIMIT 1000',[$client])->fetchAll()]);
if (!in_array($user['perfil'],['bpo_adm','bpo_operador'],true)) throw new HttpError(403,'Perfil sem permissão.');
$status=$data['status']??'pendente'; if (!in_array($status,['pendente','em_andamento','concluida'],true)) throw new HttpError(422,'Status inválido.');
if ($method==='PATCH') { $id=positiveId($data['id']??null); owned('tarefas_kanban',$id,$client); query('UPDATE tarefas_kanban SET status=? WHERE id=? AND cliente_id=?',[$status,$id,$client]); }
else { $project=positiveId($data['projeto_id']??null); owned('projetos_consultoria',$project,$client); query('INSERT INTO tarefas_kanban (cliente_id,projeto_id,titulo,status) VALUES (?,?,?,?)',[$client,$project,required($data,'titulo'),$status]); $id=(int)database()->lastInsertId(); }
respond(['id'=>$id]);
