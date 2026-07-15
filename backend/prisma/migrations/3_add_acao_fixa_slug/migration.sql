-- AlterTable: Ação de sistema (pré-criada e imutável, ex.: integração Kumon).
-- Substitui a migration WIP de campos de integração "aninhado" (descartada).
ALTER TABLE "Acao" ADD COLUMN "fixa" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Acao" ADD COLUMN "slug" TEXT;

-- CreateIndex: slug único (múltiplos NULL são permitidos no Postgres).
CREATE UNIQUE INDEX "Acao_slug_key" ON "Acao"("slug");
