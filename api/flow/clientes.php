<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/bootstrap.php';

authenticate(['bpo_adm','bpo_operador']);
respond(query('SELECT id,nome,tipo_cobranca,franquia_horas,valor_hora_padrao,valor_mensalidade_fixa,permite_reembolso_despesas FROM clientes ORDER BY nome ASC LIMIT 500')->fetchAll());
