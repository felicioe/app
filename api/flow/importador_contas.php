<?php
require_once dirname(__DIR__).'/bootstrap.php';
require_once dirname(__DIR__).'/services/ImportService.php';
require_once dirname(__DIR__).'/services/TabularReader.php';
method(['POST']); $user=authenticate(['bpo_adm','bpo_operador']);
if (isset($_FILES['arquivo'])) {
    $data=$_POST; $file=$_FILES['arquivo'];
    if ($file['error']!==UPLOAD_ERR_OK || $file['size']>10*1024*1024 || !is_uploaded_file($file['tmp_name'])) throw new HttpError(422,'Arquivo inválido, máximo 10 MB.');
    $rows=TabularReader::read($file['tmp_name'],strtolower(pathinfo($file['name'],PATHINFO_EXTENSION)));
    try { $map=json_decode($data['mapeamento']??'{}',true,32,JSON_THROW_ON_ERROR); }
    catch (JsonException) { throw new HttpError(422,'Mapeamento JSON inválido.'); }
    if (!is_array($map) || !isset($map['codigo'],$map['descricao'])) throw new HttpError(422,'De-Para obrigatório.');
    $mapped=[]; foreach ($rows as $row) { $item=[]; foreach (['codigo','descricao','tipo','codigo_pai'] as $field) if (isset($map[$field])) { if (!is_string($map[$field]) || !array_key_exists($map[$field],$row)) throw new HttpError(422,'Coluna não encontrada.'); $item[$field]=$row[$map[$field]]; } $mapped[]=$item; }
    $data['linhas']=$mapped;
} else $data=input();
$client=tenant($user,$data['cliente_id']??null);
if (!is_array($data['linhas']??null)) throw new HttpError(422,'Linhas obrigatórias.');
respond(ImportService::save($client,required($data,'destino'),$data['linhas']),201);
