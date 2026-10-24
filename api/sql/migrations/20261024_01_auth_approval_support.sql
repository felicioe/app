-- Thera Workspace: estruturas auxiliares de autenticação e aprovação
-- Baseado no DDL exportado do banco u630316951_app em 2026-10-24.
-- IDs INT(11) assinados para compatibilidade com as PKs existentes.
-- Este arquivo é aditivo: não apaga tabelas, colunas ou registros.
-- Faça backup e teste em cópia antes de executar. Execute uma única vez.
--
-- ATENÇÃO: esta migração cobre as tabelas auxiliares ausentes e a estrutura de
-- alçadas/aprovações. Ela NÃO resolve os nomes de colunas divergentes nas
-- tabelas de clientes, apontamentos, documentos, faturas, despesas e Kanban.
-- O backend ainda precisa ser compatibilizado com essas tabelas antes do uso.

CREATE TABLE IF NOT EXISTS sessoes_api (
  id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sessoes_api_token_hash (token_hash),
  KEY idx_sessoes_api_usuario (usuario_id),
  KEY idx_sessoes_api_expira (expira_em),
  CONSTRAINT fk_sessoes_api_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_tentativas (
  chave CHAR(64) NOT NULL,
  tentativas INT(10) UNSIGNED NOT NULL DEFAULT 0,
  inicio DATETIME NOT NULL,
  PRIMARY KEY (chave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE regras_alcada
  ADD COLUMN etapa INT(10) UNSIGNED NOT NULL DEFAULT 1 AFTER cliente_id;

CREATE TABLE IF NOT EXISTS regra_aprovadores (
  regra_id INT(11) NOT NULL,
  usuario_id INT(11) NOT NULL,
  PRIMARY KEY (regra_id, usuario_id),
  KEY idx_regra_aprovadores_usuario (usuario_id),
  CONSTRAINT fk_regra_aprovadores_regra
    FOREIGN KEY (regra_id) REFERENCES regras_alcada (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_regra_aprovadores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documento_alcadas (
  id INT(11) NOT NULL AUTO_INCREMENT,
  documento_id INT(11) NOT NULL,
  regra_id INT(11) NOT NULL,
  etapa INT(10) UNSIGNED NOT NULL,
  tipo_aprovacao ENUM('simples','conjunta') NOT NULL,
  aprovadores_necessarios INT(10) UNSIGNED NOT NULL,
  status ENUM('pendente','aprovada') NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (id),
  UNIQUE KEY uk_documento_alcadas_regra (documento_id, regra_id),
  KEY idx_documento_alcadas_regra (regra_id),
  KEY idx_documento_alcadas_etapa (documento_id, etapa, status),
  CONSTRAINT fk_documento_alcadas_documento
    FOREIGN KEY (documento_id) REFERENCES documentos_pagar (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_documento_alcadas_regra
    FOREIGN KEY (regra_id) REFERENCES regras_alcada (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documento_aprovadores (
  alcada_id INT(11) NOT NULL,
  usuario_id INT(11) NOT NULL,
  PRIMARY KEY (alcada_id, usuario_id),
  KEY idx_documento_aprovadores_usuario (usuario_id),
  CONSTRAINT fk_documento_aprovadores_alcada
    FOREIGN KEY (alcada_id) REFERENCES documento_alcadas (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_documento_aprovadores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE aprovacoes_documento
  ADD COLUMN alcada_id INT(11) NULL AFTER documento_id,
  ADD COLUMN evidencia TEXT NULL AFTER status,
  ADD COLUMN assinatura_hash CHAR(64) NULL AFTER evidencia,
  ADD COLUMN criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER assinatura_hash,
  MODIFY COLUMN status ENUM('aprovado','rejeitado') NOT NULL DEFAULT 'aprovado',
  ADD KEY idx_aprovacoes_alcada (alcada_id),
  ADD UNIQUE KEY uk_aprovacoes_alcada_usuario (alcada_id, usuario_id),
  ADD CONSTRAINT fk_aprovacoes_alcada
    FOREIGN KEY (alcada_id) REFERENCES documento_alcadas (id)
    ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  documento_id INT(11) NOT NULL,
  mensagem VARCHAR(255) NOT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificacoes_usuario_lida (usuario_id, lida),
  KEY idx_notificacoes_documento (documento_id),
  CONSTRAINT fk_notificacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notificacoes_documento
    FOREIGN KEY (documento_id) REFERENCES documentos_pagar (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
