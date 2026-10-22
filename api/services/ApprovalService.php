<?php
declare(strict_types=1);
final class ApprovalService {
    public static function initialize(int $document, int $client, string $amount): void {
        $rules=query('SELECT * FROM regras_alcada WHERE cliente_id=? AND valor_minimo<=? AND (valor_maximo IS NULL OR valor_maximo>=?) ORDER BY etapa,id',[$client,$amount,$amount])->fetchAll();
        if (!$rules) throw new HttpError(422,'Nenhuma regra de alçada cobre este valor.');
        foreach ($rules as $rule) {
            $approvers=query('SELECT u.id FROM regra_aprovadores r JOIN usuarios u ON u.id=r.usuario_id WHERE r.regra_id=? AND u.cliente_id=? AND u.ativo=1 AND u.perfil IN (?,?,?)',[$rule['id'],$client,'cliente_diretor','cliente_gerente','cliente_coordenador'])->fetchAll();
            $needed=max($rule['tipo_aprovacao']==='conjunta'?2:1,(int)$rule['aprovadores_necessarios']);
            if (count($approvers)<$needed) throw new HttpError(422,'Alçada sem aprovadores suficientes.');
            query('INSERT INTO documento_alcadas (documento_id,regra_id,etapa,tipo_aprovacao,aprovadores_necessarios) VALUES (?,?,?,?,?)',[$document,$rule['id'],$rule['etapa'],$rule['tipo_aprovacao'],$needed]);
            $stage=(int)database()->lastInsertId();
            foreach ($approvers as $approver) query('INSERT INTO documento_aprovadores (alcada_id,usuario_id) VALUES (?,?)',[$stage,$approver['id']]);
        }
        self::notifyNext($document);
    }
    private static function notifyNext(int $document): void {
        $stage=query("SELECT MIN(etapa) AS etapa FROM documento_alcadas WHERE documento_id=? AND status='pendente'",[$document])->fetchColumn();
        if ($stage===null) return;
        query("INSERT INTO notificacoes (usuario_id,documento_id,mensagem) SELECT DISTINCT a.usuario_id, d.documento_id, 'Documento aguardando sua aprovação' FROM documento_aprovadores a JOIN documento_alcadas d ON d.id=a.alcada_id WHERE d.documento_id=? AND d.etapa=? AND d.status='pendente'",[$document,$stage]);
    }
    public static function approve(int $document, int $client, array $user): array {
        return transaction(function() use ($document,$client,$user) {
            $doc=query('SELECT * FROM documentos_pagar WHERE id=? AND cliente_id=? FOR UPDATE',[$document,$client])->fetch();
            if (!$doc) throw new HttpError(404,'Documento não encontrado.');
            if ($doc['status']!=='pendente_aprovacao') throw new HttpError(409,'Documento fora da fila de aprovação.');
            $stage=query("SELECT MIN(etapa) FROM documento_alcadas WHERE documento_id=? AND status='pendente'",[$document])->fetchColumn();
            $rules=query("SELECT d.* FROM documento_alcadas d JOIN documento_aprovadores a ON a.alcada_id=d.id WHERE d.documento_id=? AND d.etapa=? AND d.status='pendente' AND a.usuario_id=?",[$document,$stage,$user['id']])->fetchAll();
            if (!$rules) throw new HttpError(403,'Usuário não autorizado na etapa atual.');
            $signed=false;
            foreach ($rules as $rule) {
                if (query('SELECT id FROM aprovacoes_documento WHERE alcada_id=? AND usuario_id=?',[$rule['id'],$user['id']])->fetch()) continue;
                $payload=json_encode(['documento'=>$document,'alcada'=>$rule['id'],'usuario'=>$user['id'],'valor'=>$doc['valor'],'instante'=>gmdate('c'),'nonce'=>bin2hex(random_bytes(16))],JSON_THROW_ON_ERROR);
                $secret=getenv('APP_SIGNING_KEY');
                if (!$secret || strlen($secret)<32) throw new RuntimeException('Configure APP_SIGNING_KEY com pelo menos 32 caracteres.');
                query('INSERT INTO aprovacoes_documento (documento_id,alcada_id,usuario_id,evidencia,assinatura_hash) VALUES (?,?,?,?,?)',[$document,$rule['id'],$user['id'],$payload,hash_hmac('sha256',$payload,$secret)]);
                $signed=true;
                $count=(int)query('SELECT COUNT(*) FROM aprovacoes_documento WHERE alcada_id=?',[$rule['id']])->fetchColumn();
                if ($count>=(int)$rule['aprovadores_necessarios']) query("UPDATE documento_alcadas SET status='aprovada' WHERE id=?",[$rule['id']]);
            }
            if (!$signed) throw new HttpError(409,'Aprovação já registrada.');
            $next=query("SELECT MIN(etapa) FROM documento_alcadas WHERE documento_id=? AND status='pendente'",[$document])->fetchColumn();
            if ($next===null) query("UPDATE documentos_pagar SET status='aprovado' WHERE id=?",[$document]);
            elseif ((int)$next!==(int)$stage) self::notifyNext($document);
            return ['id'=>$document,'status'=>$next===null?'aprovado':'pendente_aprovacao'];
        });
    }
}
