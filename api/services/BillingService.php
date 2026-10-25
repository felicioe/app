<?php
declare(strict_types=1);
final class BillingService {
    public static function cents(mixed $value): int {
        $text = (string)$value;
        if (!preg_match('/^\d{1,9}(\.\d{1,2})?$/D', $text)) throw new HttpError(422,'Valor monetário inválido.');
        [$whole,$fraction] = array_pad(explode('.',$text),2,'');
        return (int)$whole*100+(int)str_pad($fraction,2,'0');
    }
    public static function calculate(array $client, int $minutes, int $expenses): array {
        $rate=self::cents($client['valor_hora_padrao']); $fixed=self::cents($client['valor_mensalidade_fixa']);
        $allowance=(int)round((float)$client['franquia_horas']*60);
        $base=match($client['tipo_cobranca'] ?? $client['tipo_cobranca_padrao'] ?? null) {
            'hora'=>(int)round($minutes*$rate/60),
            'fechado'=>$fixed,
            'misto'=>$fixed+(int)round(max(0,$minutes-$allowance)*$rate/60),
            default=>throw new HttpError(422,'Tipo de cobrança inválido.')
        };
        $extra=(int)$client['permite_reembolso_despesas']===1 ? $expenses : 0;
        return ['minutos'=>$minutes,'honorarios_centavos'=>$base,'despesas_centavos'=>$extra,'total_centavos'=>$base+$extra];
    }
    public static function close(int $clientId, string $start, string $end): array {
        return transaction(function() use ($clientId,$start,$end) {
            $client=query('SELECT * FROM clientes WHERE id=? FOR UPDATE',[$clientId])->fetch();
            if (!$client) throw new HttpError(404,'Cliente não encontrado.');
            $exists=query('SELECT id FROM faturas_honorarios WHERE cliente_id=? AND periodo_inicio<=? AND periodo_fim>=?',[$clientId,$end,$start])->fetch();
            if ($exists) throw new HttpError(409,'Período já faturado ou sobreposto.');
            $entries=query("SELECT id,duracao_minutos FROM apontamentos_horas WHERE cliente_id=? AND data_registro BETWEEN ? AND ? AND faturavel=1 AND status_faturamento='pendente' FOR UPDATE",[$clientId,$start,$end])->fetchAll();
            $expenses=query('SELECT id,valor FROM despesas_adicionais WHERE cliente_id=? AND data_despesa BETWEEN ? AND ? AND reembolsavel=1 AND fatura_id IS NULL FOR UPDATE',[$clientId,$start,$end])->fetchAll();
            $total=self::calculate($client,array_sum(array_column($entries,'duracao_minutos')),array_sum(array_map(fn($e)=>self::cents($e['valor']),$expenses)));
            $codigo='FAT-'.$clientId.'-'.str_replace('-','',$start).'-'.str_replace('-','',$end);
            query("INSERT INTO faturas_honorarios (cliente_id,codigo_fatura,periodo_inicio,periodo_fim,total_horas_minutos,valor_servicos,valor_despesas_reembolsadas,valor_total,status) VALUES (?,?,?,?,?,?,?,?,'emitida')",[$clientId,$codigo,$start,$end,$total['minutos'],self::decimal($total['honorarios_centavos']),self::decimal($total['despesas_centavos']),self::decimal($total['total_centavos'])]);
            $id=(int)database()->lastInsertId();
            foreach ($entries as $entry) query("UPDATE apontamentos_horas SET status_faturamento='faturado',fatura_id=? WHERE id=?",[$id,$entry['id']]);
            if ($client['permite_reembolso_despesas']) foreach ($expenses as $expense) query('UPDATE despesas_adicionais SET fatura_id=? WHERE id=?',[$id,$expense['id']]);
            return ['id'=>$id]+$total;
        });
    }
    public static function decimal(int $cents): string { return intdiv($cents,100).'.'.str_pad((string)($cents%100),2,'0',STR_PAD_LEFT); }
}
