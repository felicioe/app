-- REFERÊNCIA PARA BANCO NOVO. Não executar sobre produção sem comparar o DDL real.
CREATE TABLE clientes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL,
 tipo_cobranca ENUM('hora','fechado','misto') NOT NULL DEFAULT 'hora',
 franquia_horas DECIMAL(10,2) NOT NULL DEFAULT 0, valor_hora_padrao DECIMAL(11,2) NOT NULL DEFAULT 0,
 valor_mensalidade_fixa DECIMAL(11,2) NOT NULL DEFAULT 0, permite_reembolso_despesas BOOLEAN NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE usuarios (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NULL, nome VARCHAR(255) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE, senha_hash VARCHAR(255) NOT NULL, ativo BOOLEAN NOT NULL DEFAULT 1,
 perfil ENUM('bpo_adm','bpo_operador','cliente_diretor','cliente_gerente','cliente_coordenador','cliente_usuario') NOT NULL,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE projetos_consultoria (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, nome VARCHAR(255) NOT NULL,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE tarefas_kanban (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, projeto_id BIGINT UNSIGNED NOT NULL,
 titulo VARCHAR(255) NOT NULL, status ENUM('pendente','em_andamento','concluida') NOT NULL DEFAULT 'pendente',
 FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (projeto_id) REFERENCES projetos_consultoria(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE faturas_honorarios (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, periodo_inicio DATE NOT NULL, periodo_fim DATE NOT NULL,
 total_minutos INT UNSIGNED NOT NULL, valor_honorarios DECIMAL(14,2) NOT NULL, valor_despesas DECIMAL(14,2) NOT NULL, valor_total DECIMAL(14,2) NOT NULL,
 criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY periodo (cliente_id,periodo_inicio,periodo_fim), FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE apontamentos_horas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, usuario_id BIGINT UNSIGNED NOT NULL,
 projeto_id BIGINT UNSIGNED NOT NULL, tarefa_id BIGINT UNSIGNED NULL, data DATE NOT NULL, hora_inicio TIME NOT NULL, hora_fim TIME NOT NULL,
 duracao_minutos INT UNSIGNED NOT NULL, faturavel BOOLEAN NOT NULL DEFAULT 1, status_faturamento ENUM('pendente','faturado') NOT NULL DEFAULT 'pendente', fatura_id BIGINT UNSIGNED NULL,
 INDEX ciclo (cliente_id,data,status_faturamento), FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
 FOREIGN KEY (projeto_id) REFERENCES projetos_consultoria(id), FOREIGN KEY (tarefa_id) REFERENCES tarefas_kanban(id), FOREIGN KEY (fatura_id) REFERENCES faturas_honorarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE despesas_adicionais (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, data DATE NOT NULL, descricao VARCHAR(500) NOT NULL,
 valor DECIMAL(11,2) NOT NULL, reembolsavel BOOLEAN NOT NULL DEFAULT 0, fatura_id BIGINT UNSIGNED NULL,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (fatura_id) REFERENCES faturas_honorarios(id), INDEX ciclo (cliente_id,data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE plano_contas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, codigo VARCHAR(64) NOT NULL, descricao VARCHAR(255) NOT NULL,
 tipo ENUM('sintetica','analitica') NOT NULL, conta_pai_id BIGINT UNSIGNED NULL, UNIQUE KEY codigo_cliente (cliente_id,codigo),
 FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (conta_pai_id) REFERENCES plano_contas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE centros_custo (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, codigo VARCHAR(64) NOT NULL, descricao VARCHAR(255) NOT NULL,
 UNIQUE KEY codigo_cliente (cliente_id,codigo), FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE documentos_pagar (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, criado_por BIGINT UNSIGNED NOT NULL,
 descricao VARCHAR(500) NOT NULL, valor DECIMAL(11,2) NOT NULL, vencimento DATE NOT NULL, linha_digitavel VARCHAR(255) NULL, chave_pix VARCHAR(255) NULL,
 status ENUM('pendente_aprovacao','aprovado') NOT NULL DEFAULT 'pendente_aprovacao', anexo_url VARCHAR(255) NOT NULL, anexo_mime VARCHAR(100) NOT NULL,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id), FOREIGN KEY (criado_por) REFERENCES usuarios(id), INDEX fila (cliente_id,status,vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE regras_alcada (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id BIGINT UNSIGNED NOT NULL, etapa INT UNSIGNED NOT NULL,
 valor_minimo DECIMAL(11,2) NOT NULL DEFAULT 0, valor_maximo DECIMAL(11,2) NULL,
 tipo_aprovacao ENUM('simples','conjunta') NOT NULL, aprovadores_necessarios INT UNSIGNED NOT NULL DEFAULT 1,
 FOREIGN KEY (cliente_id) REFERENCES clientes(id), CHECK (aprovadores_necessarios>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- As tabelas auxiliares abaixo também são necessárias; comparar/adaptar para o banco existente.
CREATE TABLE sessoes_api (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expira_em DATETIME NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id), INDEX (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE login_tentativas (chave CHAR(64) PRIMARY KEY, tentativas INT UNSIGNED NOT NULL DEFAULT 0, inicio DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE regra_aprovadores (
 regra_id BIGINT UNSIGNED NOT NULL, usuario_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY (regra_id,usuario_id),
 FOREIGN KEY (regra_id) REFERENCES regras_alcada(id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE documento_alcadas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, documento_id BIGINT UNSIGNED NOT NULL, regra_id BIGINT UNSIGNED NOT NULL,
 etapa INT UNSIGNED NOT NULL, tipo_aprovacao ENUM('simples','conjunta') NOT NULL, aprovadores_necessarios INT UNSIGNED NOT NULL,
 status ENUM('pendente','aprovada') NOT NULL DEFAULT 'pendente', UNIQUE KEY regra_documento (documento_id,regra_id),
 FOREIGN KEY (documento_id) REFERENCES documentos_pagar(id), FOREIGN KEY (regra_id) REFERENCES regras_alcada(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE documento_aprovadores (
 alcada_id BIGINT UNSIGNED NOT NULL, usuario_id BIGINT UNSIGNED NOT NULL, PRIMARY KEY (alcada_id,usuario_id),
 FOREIGN KEY (alcada_id) REFERENCES documento_alcadas(id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE aprovacoes_documento (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, documento_id BIGINT UNSIGNED NOT NULL, alcada_id BIGINT UNSIGNED NOT NULL, usuario_id BIGINT UNSIGNED NOT NULL,
 evidencia TEXT NOT NULL, assinatura_hash CHAR(64) NOT NULL, criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY assinatura_unica (alcada_id,usuario_id), FOREIGN KEY (documento_id) REFERENCES documentos_pagar(id),
 FOREIGN KEY (alcada_id) REFERENCES documento_alcadas(id), FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE notificacoes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED NOT NULL, documento_id BIGINT UNSIGNED NOT NULL,
 mensagem VARCHAR(255) NOT NULL, lida BOOLEAN NOT NULL DEFAULT 0, criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id), FOREIGN KEY (documento_id) REFERENCES documentos_pagar(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
