<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['POST']); $data = input();
$email = strtolower(required($data,'email'));
if (!isset($data['senha']) || !is_string($data['senha']) || $data['senha'] === '') throw new HttpError(422,'Senha obrigatória.');
$password = $data['senha'];
if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($password)>1024) throw new HttpError(422,'Credenciais inválidas.');
$key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '').'|'.$email);
$result = transaction(function() use ($key,$email,$password) {
    query('INSERT IGNORE INTO login_tentativas (chave,tentativas,inicio) VALUES (?,0,UTC_TIMESTAMP())',[$key]);
    $attempt = query('SELECT *, inicio < UTC_TIMESTAMP() - INTERVAL 15 MINUTE AS expirou FROM login_tentativas WHERE chave=? FOR UPDATE',[$key])->fetch();
    if ($attempt['expirou']) query('UPDATE login_tentativas SET tentativas=0,inicio=UTC_TIMESTAMP() WHERE chave=?',[$key]);
    elseif ($attempt['tentativas'] >= 10) return ['code'=>429];
    $user = query('SELECT * FROM usuarios WHERE email=? AND ativo=1',[$email])->fetch();
    $valid = password_verify($password, $user['senha_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
    if (!$user || !$valid) { query('UPDATE login_tentativas SET tentativas=tentativas+1 WHERE chave=?',[$key]); return ['code'=>401]; }
    query('DELETE FROM login_tentativas WHERE chave=?',[$key]);
    $token = bin2hex(random_bytes(32));
    query('INSERT INTO sessoes_api (usuario_id,token_hash,expira_em) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))',[$user['id'],hash('sha256',$token)]);
    return ['token'=>$token,'usuario'=>array_intersect_key($user,array_flip(['id','nome','email','perfil','cliente_id']))];
});
if (isset($result['code'])) throw new HttpError($result['code'], $result['code']===429 ? 'Muitas tentativas. Aguarde 15 minutos.' : 'E-mail ou senha inválidos.');
respond($result);
