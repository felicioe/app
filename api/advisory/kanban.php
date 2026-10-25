<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method=method(['GET','POST','PATCH']); $user=authenticate(); $data=$method==='GET'?$_GET:input(); $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') {
    $projetos=query('SELECT id,cliente_id,titulo AS nome FROM projetos_consultoria WHERE cliente_id=?',[$client])->fetchAll();
    $tarefas=query("SELECT t.id,t.projeto_id,t.titulo,t.descricao,t.prazo,
        CASE t.coluna_status WHEN 'concluido' THEN 'concluida' WHEN 'em_andamento' THEN 'em_andamento' ELSE 'pendente' END AS status
        FROM tarefas_kanban t JOIN projetos_consultoria p ON p.id=t.projeto_id WHERE p.cliente_id=? ORDER BY t.id DESC LIMIT 1000",[$client])->fetchAll();
    respond(['projetos'=>$projetos,'tarefas'=>$tarefas]);
}
if (!in_array($user['perfil'],['bpo_adm','bpo_operador'],true)) throw new HttpError(403,'Perfil sem permissão.');
$status=$data['status']??'pendente'; if (!in_array($status,['pendente','em_andamento','concluida'],true)) throw new HttpError(422,'Status inválido.');
// coluna_status real: backlog/planejado/em_andamento/validacao/concluido (valor exato da etapa final ainda não confirmado contra o banco).
$coluna=['pendente'=>'backlog','em_andamento'=>'em_andamento','concluida'=>'concluido'][$status];
if ($method==='PATCH') { $id=positiveId($data['id']??null); owned('tarefas_kanban',$id,$client); query('UPDATE tarefas_kanban SET coluna_status=? WHERE id=?',[$coluna,$id]); }
else {
    $project=positiveId($data['projeto_id']??null); owned('projetos_consultoria',$project,$client);
    $titulo=required($data,'titulo'); if (strlen($titulo)>200) throw new HttpError(422,'Título muito longo.');
    $descricao=isset($data['descricao']) && trim((string)$data['descricao'])!=='' ? trim((string)$data['descricao']) : null;
    $prazo=isset($data['prazo']) && trim((string)$data['prazo'])!=='' ? validDate($data['prazo']) : null;
    query('INSERT INTO tarefas_kanban (projeto_id,titulo,descricao,prazo,coluna_status) VALUES (?,?,?,?,?)',[$project,$titulo,$descricao,$prazo,$coluna]);
    $id=(int)database()->lastInsertId();
}
respond(['id'=>$id]);
