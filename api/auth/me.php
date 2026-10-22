<?php
require_once dirname(__DIR__).'/bootstrap.php';
method(['GET']); $user=authenticate(); unset($user['sessao_id']); respond($user);
