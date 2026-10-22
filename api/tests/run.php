<?php
declare(strict_types=1);
require dirname(__DIR__).'/helpers/response.php';
require dirname(__DIR__).'/helpers/auth_middleware.php';
require dirname(__DIR__).'/services/BillingService.php';
require dirname(__DIR__).'/services/TabularReader.php';
require dirname(__DIR__).'/services/ImportService.php';
$checks=0;
function check(bool $ok, string $message): void { global $checks; $checks++; if (!$ok) throw new RuntimeException($message); }
function rejects(callable $work, int $status): void { try { $work(); } catch (HttpError $e) { check($e->statusCode===$status,'Status inesperado'); return; } throw new RuntimeException('Deveria rejeitar'); }
$client=['tipo_cobranca'=>'hora','valor_hora_padrao'=>'120.00','valor_mensalidade_fixa'=>'1000.00','franquia_horas'=>'10.00','permite_reembolso_despesas'=>0];
check(BillingService::calculate($client,90,5000)['total_centavos']===18000,'Horas fracionárias');
$client['tipo_cobranca']='fechado'; check(BillingService::calculate($client,900,0)['total_centavos']===100000,'Mensalidade');
$client['tipo_cobranca']='misto'; check(BillingService::calculate($client,540,0)['total_centavos']===100000,'Dentro da franquia');
check(BillingService::calculate($client,690,5000)['total_centavos']===118000,'Excedentes e reembolso bloqueado');
$client['permite_reembolso_despesas']=1; check(BillingService::calculate($client,690,5000)['total_centavos']===123000,'Reembolso');
check(BillingService::calculate($client,0,0)['total_centavos']===100000,'Mensalidade sem apontamentos');
check(BillingService::cents('0.29')===29,'Precisão monetária');
rejects(fn()=>BillingService::cents('-1.00'),422); rejects(fn()=>BillingService::cents('1.001'),422);
rejects(fn()=>validDate('2026-02-30'),422); check(validDate('2028-02-29')==='2028-02-29','Ano bissexto');
$user=['perfil'=>'cliente_diretor','cliente_id'=>8]; check(tenant($user)===8,'Tenant da sessão'); rejects(fn()=>tenant($user,9),403);
rejects(fn()=>tenant(['perfil'=>'bpo_adm'],null),422);
rejects(fn()=>ImportService::save(1,'usuarios',[['codigo'=>'1','descricao'=>'a']]),422);
rejects(fn()=>ImportService::save(1,'plano_contas',[['codigo'=>'1','descricao'=>'a','tipo'=>'sintetica'],['codigo'=>'1','descricao'=>'b','tipo'=>'analitica']]),422);
$path=tempnam(sys_get_temp_dir(),'thera');
try {
    file_put_contents($path,"\xEF\xBB\xBFConta;Descrição;Tipo\n1;Receitas;sintetica\n1.1;Serviços;analitica\n");
    $rows=TabularReader::read($path,'csv'); check(count($rows)===2 && $rows[1]['Conta']==='1.1','CSV e UTF-8');
    file_put_contents($path,"codigo,codigo\n1,2\n"); rejects(fn()=>TabularReader::read($path,'csv'),422);
} finally { unlink($path); }
echo "$checks verificações passaram.\n";
