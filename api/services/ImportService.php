<?php
declare(strict_types=1);
final class ImportService {
    public static function save(int $client, string $target, array $rows): array {
        if (!in_array($target,['plano_contas','centros_custo'],true) || !$rows || count($rows)>5000) throw new HttpError(422,'Destino ou quantidade de linhas inválida (1 a 5000).');
        $items=[];
        foreach ($rows as $row) {
            if (!is_array($row)) throw new HttpError(422,'Linha inválida.');
            $code=required($row,'codigo'); $description=required($row,'descricao');
            if (strlen($code)>64 || strlen($description)>255 || isset($items[$code])) throw new HttpError(422,'Código duplicado ou campo muito longo: '.$code);
            if ($target==='plano_contas' && !in_array($row['tipo']??null,['sintetica','analitica'],true)) throw new HttpError(422,'Tipo de conta inválido.');
            $items[$code]=['codigo'=>$code,'descricao'=>$description,'tipo'=>$row['tipo']??null,'pai'=>isset($row['codigo_pai'])&&$row['codigo_pai']!==''?(string)$row['codigo_pai']:null];
        }
        return transaction(function() use ($client,$target,$items) {
            if (!query('SELECT id FROM clientes WHERE id=? FOR UPDATE',[$client])->fetch()) throw new HttpError(404,'Cliente não encontrado.');
            $pending=$items; $inserted=0;
            while ($pending) {
                $progress=false;
                // Sintéticas precedem analíticas; hierarquias são resolvidas em múltiplas passagens.
                uasort($pending,fn($a,$b)=>($a['tipo']==='analitica')<=>($b['tipo']==='analitica'));
                foreach ($pending as $code=>$row) {
                    $parent=null;
                    if ($target==='plano_contas' && $row['pai']!==null) {
                        if (isset($pending[$row['pai']])) continue;
                        $parent=query('SELECT id,tipo FROM plano_contas WHERE cliente_id=? AND codigo=?',[$client,$row['pai']])->fetch();
                        if (!$parent || $parent['tipo']!=='sintetica') throw new HttpError(422,'Conta pai ausente ou analítica: '.$row['pai']);
                    }
                    if (query("SELECT id FROM $target WHERE cliente_id=? AND codigo=?",[$client,(string)$code])->fetch()) throw new HttpError(409,'Código já existente: '.$code);
                    if ($target==='plano_contas') query('INSERT INTO plano_contas (cliente_id,codigo,descricao,tipo,conta_pai_id) VALUES (?,?,?,?,?)',[$client,(string)$code,$row['descricao'],$row['tipo'],$parent['id']??null]);
                    else query('INSERT INTO centros_custo (cliente_id,codigo,descricao) VALUES (?,?,?)',[$client,(string)$code,$row['descricao']]);
                    unset($pending[$code]); $progress=true; $inserted++;
                }
                if (!$progress) throw new HttpError(422,'Hierarquia circular ou autorreferência.');
            }
            return ['inseridos'=>$inserted];
        });
    }
}
