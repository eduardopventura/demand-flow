-- Initial migration: Create all base tables
-- This migration creates all tables including Cargo and Usuario with cargo_id

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Cargo table first (needed for Usuario FK)
CREATE TABLE IF NOT EXISTS "Cargo" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "acesso_templates" BOOLEAN NOT NULL DEFAULT false,
  "acesso_acoes" BOOLEAN NOT NULL DEFAULT false,
  "acesso_usuarios" BOOLEAN NOT NULL DEFAULT false,
  "deletar_demandas" BOOLEAN NOT NULL DEFAULT false,
  "cargo_disponivel_como_responsavel" BOOLEAN NOT NULL DEFAULT false,
  "usuarios_disponiveis_como_responsaveis" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Cargo_nome_key" ON "Cargo"("nome");

-- Create Template table
CREATE TABLE IF NOT EXISTS "Template" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "tempo_medio" INTEGER NOT NULL,
  "abas" JSONB NOT NULL,
  "campos_preenchimento" JSONB NOT NULL,
  "tarefas" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Template_nome_idx" ON "Template"("nome");

-- Create Usuario table (with cargo_id FK)
CREATE TABLE IF NOT EXISTS "Usuario" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "notificar_email" BOOLEAN NOT NULL DEFAULT true,
  "notificar_telefone" BOOLEAN NOT NULL DEFAULT false,
  "cargo_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Usuario_login_key" ON "Usuario"("login");
CREATE INDEX IF NOT EXISTS "Usuario_login_idx" ON "Usuario"("login");
CREATE INDEX IF NOT EXISTS "Usuario_email_idx" ON "Usuario"("email");
CREATE INDEX IF NOT EXISTS "Usuario_cargo_id_idx" ON "Usuario"("cargo_id");

-- Create Demanda table
CREATE TABLE IF NOT EXISTS "Demanda" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "nome_demanda" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "responsavel_id" TEXT NOT NULL,
  "tempo_esperado" INTEGER NOT NULL,
  "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data_previsao" TIMESTAMP(3) NOT NULL,
  "data_finalizacao" TIMESTAMP(3),
  "prazo" BOOLEAN NOT NULL DEFAULT true,
  "observacoes" TEXT,
  "notificacao_prazo_enviada" BOOLEAN NOT NULL DEFAULT false,
  "modificado_por_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Demanda_status_idx" ON "Demanda"("status");
CREATE INDEX IF NOT EXISTS "Demanda_responsavel_id_idx" ON "Demanda"("responsavel_id");
CREATE INDEX IF NOT EXISTS "Demanda_template_id_idx" ON "Demanda"("template_id");
CREATE INDEX IF NOT EXISTS "Demanda_data_previsao_idx" ON "Demanda"("data_previsao");
CREATE INDEX IF NOT EXISTS "Demanda_data_criacao_idx" ON "Demanda"("data_criacao");
CREATE INDEX IF NOT EXISTS "Demanda_modificado_por_id_idx" ON "Demanda"("modificado_por_id");

-- Create TarefaStatus table (with cargo_responsavel_id)
CREATE TABLE IF NOT EXISTS "TarefaStatus" (
  "id" TEXT NOT NULL,
  "demanda_id" TEXT NOT NULL,
  "id_tarefa" TEXT NOT NULL,
  "concluida" BOOLEAN NOT NULL DEFAULT false,
  "responsavel_id" TEXT,
  "cargo_responsavel_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TarefaStatus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TarefaStatus_demanda_id_idx" ON "TarefaStatus"("demanda_id");
CREATE INDEX IF NOT EXISTS "TarefaStatus_id_tarefa_idx" ON "TarefaStatus"("id_tarefa");
CREATE INDEX IF NOT EXISTS "TarefaStatus_concluida_idx" ON "TarefaStatus"("concluida");
CREATE INDEX IF NOT EXISTS "TarefaStatus_cargo_responsavel_id_idx" ON "TarefaStatus"("cargo_responsavel_id");

-- Create Acao table
CREATE TABLE IF NOT EXISTS "Acao" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "campos" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Acao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Acao_nome_idx" ON "Acao"("nome");

-- Create CampoPreenchido table
CREATE TABLE IF NOT EXISTS "CampoPreenchido" (
  "id" TEXT NOT NULL,
  "demanda_id" TEXT NOT NULL,
  "id_campo" TEXT NOT NULL,
  "valor" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampoPreenchido_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CampoPreenchido_demanda_id_idx" ON "CampoPreenchido"("demanda_id");
CREATE INDEX IF NOT EXISTS "CampoPreenchido_id_campo_idx" ON "CampoPreenchido"("id_campo");

-- Add foreign keys
DO $$
BEGIN
  -- Demanda -> Template
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Demanda_template_id_fkey'
  ) THEN
    ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_template_id_fkey" 
      FOREIGN KEY ("template_id") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  -- Demanda -> Usuario (responsavel)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Demanda_responsavel_id_fkey'
  ) THEN
    ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_responsavel_id_fkey" 
      FOREIGN KEY ("responsavel_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  -- Demanda -> Usuario (modificado_por)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Demanda_modificado_por_id_fkey'
  ) THEN
    ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_modificado_por_id_fkey" 
      FOREIGN KEY ("modificado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- TarefaStatus -> Demanda
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TarefaStatus_demanda_id_fkey'
  ) THEN
    ALTER TABLE "TarefaStatus" ADD CONSTRAINT "TarefaStatus_demanda_id_fkey" 
      FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- TarefaStatus -> Usuario (responsavel)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TarefaStatus_responsavel_id_fkey'
  ) THEN
    ALTER TABLE "TarefaStatus" ADD CONSTRAINT "TarefaStatus_responsavel_id_fkey" 
      FOREIGN KEY ("responsavel_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- CampoPreenchido -> Demanda
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CampoPreenchido_demanda_id_fkey'
  ) THEN
    ALTER TABLE "CampoPreenchido" ADD CONSTRAINT "CampoPreenchido_demanda_id_fkey" 
      FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  -- Usuario -> Cargo
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Usuario_cargo_id_fkey'
  ) THEN
    ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_cargo_id_fkey" 
      FOREIGN KEY ("cargo_id") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  -- TarefaStatus -> Cargo (cargo_responsavel)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TarefaStatus_cargo_responsavel_id_fkey'
  ) THEN
    ALTER TABLE "TarefaStatus" ADD CONSTRAINT "TarefaStatus_cargo_responsavel_id_fkey" 
      FOREIGN KEY ("cargo_responsavel_id") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

