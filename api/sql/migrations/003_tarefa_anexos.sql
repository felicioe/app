-- Thera Workspace: histórico de anexos por tarefa (Advisory).
-- Executar no banco da aplicação. É idempotente e não remove dados.
CREATE TABLE IF NOT EXISTS tarefa_anexos (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  tarefa_id INT(11) NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  tamanho INT(11) NOT NULL,
  criado_por_usuario_id INT(11) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tarefa_anexos_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefas_kanban(id),
  CONSTRAINT fk_tarefa_anexos_usuario FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios(id),
  INDEX idx_tarefa_anexos_tarefa (tarefa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
