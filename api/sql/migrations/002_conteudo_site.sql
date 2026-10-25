-- Thera Workspace: conteúdo editável da página institucional (landing page).
-- Executar no banco da aplicação. É idempotente e não remove dados.
CREATE TABLE IF NOT EXISTS conteudo_site (
  chave VARCHAR(80) PRIMARY KEY,
  valor TEXT NOT NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  atualizado_por_usuario_id INT(11) NULL,
  CONSTRAINT fk_conteudo_site_usuario FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO conteudo_site (chave, valor) VALUES
('hero_eyebrow', 'Consultoria e BPO Financeiro'),
('hero_titulo', 'Clareza financeira para decidir com confiança.'),
('hero_subtitulo', 'Consultoria estratégica e operação financeira (BPO) para empresas que querem crescer com controle.'),
('sobre_texto', 'A Thera Financial une consultoria estratégica e operação financeira (BPO) para dar às empresas clareza, controle e previsibilidade sobre seus números, permitindo decisões mais rápidas e seguras.'),
('servicos', '[{"titulo":"Thera Advisory","descricao":"Consultoria estratégica, projetos e apontamento técnico de horas."},{"titulo":"Thera Flow (BPO Financeiro)","descricao":"Documentos a pagar, aprovações e rotinas financeiras operacionais."},{"titulo":"Governança e controles","descricao":"Alçadas de aprovação, auditoria e processos financeiros estruturados."}]'),
('contato_titulo', 'Vamos conversar sobre o seu próximo passo?'),
('contato_email', 'contato@therafinancial.com.br'),
('cta_workspace_label', 'Acessar Workspace BPO'),
('cta_workspace_desc', 'Documentos, pagamentos e aprovações financeiras.'),
('cta_advisory_label', 'Acessar Thera Advisory'),
('cta_advisory_desc', 'Apontamento técnico, projetos e horas por cliente.')
ON DUPLICATE KEY UPDATE chave=chave;
