<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['POST']); $user=authenticate(); query('DELETE FROM sessoes_api WHERE id=?',[$user['sessao_id']]); respond(['encerrada'=>true]);
