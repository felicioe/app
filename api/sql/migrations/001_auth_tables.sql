-- Thera Workspace: tabelas mínimas para login/sessão.
-- Executar no banco da aplicação. É idempotente e não remove dados.
CREATE TABLE IF NOT EXISTS sessoes_api (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expira_em DATETIME NOT NULL,
  CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_sessoes_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_tentativas (
  chave CHAR(64) PRIMARY KEY,
  tentativas INT UNSIGNED NOT NULL DEFAULT 0,
  inicio DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
