-- AlterTable: Add gerenciar_kanban permission to Cargo
ALTER TABLE "Cargo" ADD COLUMN "gerenciar_kanban" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: ColunaKanban
CREATE TABLE "ColunaKanban" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "fixa" BOOLEAN NOT NULL DEFAULT false,
    "cor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColunaKanban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColunaKanban_nome_key" ON "ColunaKanban"("nome");
CREATE INDEX "ColunaKanban_ordem_idx" ON "ColunaKanban"("ordem");

-- Seed default columns
INSERT INTO "ColunaKanban" ("id", "nome", "ordem", "fixa", "cor", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'Criada', 0, true, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Em Andamento', 1, false, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Finalizada', 999, true, NULL, NOW(), NOW());

-- Grant gerenciar_kanban to existing admin cargos (those that already have all permissions)
UPDATE "Cargo" SET "gerenciar_kanban" = true
WHERE "acesso_templates" = true
  AND "acesso_acoes" = true
  AND "acesso_usuarios" = true
  AND "deletar_demandas" = true;
