<?php
require_once dirname(__DIR__).'/bootstrap.php';
$method=method(['GET','POST']); $user=authenticate();
$scope=in_array($user['perfil'],['bpo_adm','bpo_operador'],true)?null:positiveId($user['cliente_id']);
if ($method==='GET') {
    $sql='SELECT n.id,n.documento_id,n.mensagem,n.lida,n.criada_em FROM notificacoes n JOIN documentos_pagar d ON d.id=n.documento_id WHERE n.usuario_id=?'; $args=[$user['id']];
    if ($scope!==null) { $sql.=' AND d.cliente_id=?'; $args[]=$scope; }
    respond(query($sql.' ORDER BY n.id DESC LIMIT 100',$args)->fetchAll());
}
$data=input();
$sql='UPDATE notificacoes n JOIN documentos_pagar d ON d.id=n.documento_id SET n.lida=1 WHERE n.id=? AND n.usuario_id=?'; $args=[positiveId($data['id']??null),$user['id']];
if ($scope!==null) { $sql.=' AND d.cliente_id=?'; $args[]=$scope; }
query($sql,$args); respond(['atualizada'=>true]);
