<?php
require_once dirname(__DIR__).'/bootstrap.php';
require_once dirname(__DIR__).'/services/BillingService.php';
require_once dirname(__DIR__).'/services/ApprovalService.php';
$method=method(['GET','POST']); $user=authenticate(); $data=$method==='POST'?$_POST:$_GET; $client=tenant($user,$data['cliente_id']??null);
if ($method==='GET') {
    $sql='SELECT id,cliente_id,descricao,valor,vencimento,linha_digitavel,chave_pix,status FROM documentos_pagar WHERE cliente_id=?'; $params=[$client];
    foreach (['status'=>'status = ?','inicio'=>'data_vencimento >= ?','fim'=>'data_vencimento <= ?'] as $key=>$condition) if (!empty($data[$key])) { $sql.=' AND '.$condition; $params[]=$key==='status'?$data[$key]:validDate($data[$key]); }
    respond(query(str_replace('descricao,','numero_documento AS descricao,',str_replace('vencimento,','data_vencimento AS vencimento,',str_replace('anexo_url','arquivo_url',$sql))).' ORDER BY data_vencimento,id LIMIT 500',$params)->fetchAll());
}
if (!in_array($user['perfil'],['bpo_adm','bpo_operador','cliente_diretor','cliente_gerente','cliente_coordenador','cliente_usuario'],true)) throw new HttpError(403,'Perfil sem permissão.');
$description=required($data,'descricao'); if (strlen($description)>500) throw new HttpError(422,'Descrição muito longa.');
$amount=BillingService::decimal(BillingService::cents(required($data,'valor'))); if ($amount==='0.00') throw new HttpError(422,'Valor deve ser positivo.');
$due=validDate(required($data,'vencimento')); $emission=validDate($data['data_emissao']??date('Y-m-d'));
$supplier=positiveId($data['fornecedor_id']??null); $documentType=positiveId($data['tipo_documento_id']??null); $account=positiveId($data['plano_contas_id']??null); $costCenter=positiveId($data['centro_custo_id']??null);
$file=$_FILES['anexo']??null;
if (!$file || $file['error']!==UPLOAD_ERR_OK || $file['size']>10*1024*1024 || !is_uploaded_file($file['tmp_name'])) throw new HttpError(422,'Anexo obrigatório, máximo de 10 MB.');
if (!class_exists('finfo')) throw new RuntimeException('Extensão fileinfo necessária.');
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$ext=['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime]??null;
if (!$ext) throw new HttpError(422,'Anexo deve ser PDF, JPEG, PNG ou WebP.');
$name=bin2hex(random_bytes(24)).'.'.$ext; $path=dirname(__DIR__).'/storage/uploads/'.$name;
if (!move_uploaded_file($file['tmp_name'],$path)) throw new RuntimeException('Falha ao armazenar anexo.');
try {
    $id=transaction(function() use ($client,$user,$description,$amount,$due,$emission,$supplier,$documentType,$account,$costCenter,$data,$name) {
        query("INSERT INTO documentos_pagar (cliente_id,fornecedor_id,tipo_documento_id,plano_contas_id,centro_custo_id,numero_documento,valor,data_emissao,data_vencimento,linha_digitavel,chave_pix,arquivo_url,criado_por_usuario_id,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pendente_aprovacao')",[$client,$supplier,$documentType,$account,$costCenter,$description,$amount,$emission,$due,$data['linha_digitavel']??null,$data['chave_pix']??null,$name,$user['id']]);
        $id=(int)database()->lastInsertId(); ApprovalService::initialize($id,$client,$amount); return $id;
    });
} catch (Throwable $e) { unlink($path); throw $e; }
respond(['id'=>$id,'status'=>'pendente_aprovacao'],201);
