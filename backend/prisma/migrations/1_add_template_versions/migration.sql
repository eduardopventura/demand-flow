-- Migration: Add TemplateVersion model and template_version_id to Demanda

-- Create TemplateVersion table
CREATE TABLE IF NOT EXISTS "TemplateVersion" (
  "id"          TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "nome"        TEXT NOT NULL,
  "dados"       JSONB NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TemplateVersion_template_id_idx" ON "TemplateVersion"("template_id");
CREATE INDEX IF NOT EXISTS "TemplateVersion_created_at_idx"  ON "TemplateVersion"("created_at");

ALTER TABLE "TemplateVersion"
  ADD CONSTRAINT "TemplateVersion_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add template_version_id to Demanda (nullable for backward compat)
ALTER TABLE "Demanda" ADD COLUMN IF NOT EXISTS "template_version_id" TEXT;

CREATE INDEX IF NOT EXISTS "Demanda_template_version_id_idx" ON "Demanda"("template_version_id");

-- Backfill: create initial version (v1) for every existing template
-- Nome = DDMMyyHHmm from updated_at (fixed 10 chars)
INSERT INTO "TemplateVersion" ("id", "template_id", "nome", "dados", "created_at")
SELECT
  gen_random_uuid()::TEXT,
  t."id",
  TO_CHAR(t."updated_at", 'DDMMYYHH24MI'),
  jsonb_build_object(
    'id',                   t."id",
    'nome',                 t."nome",
    'tempo_medio',          t."tempo_medio",
    'abas',                 t."abas",
    'campos_preenchimento', t."campos_preenchimento",
    'tarefas',              t."tarefas"
  ),
  t."updated_at"
FROM "Template" t
ON CONFLICT DO NOTHING;

-- Backfill: assign each existing Demanda to the first (earliest) version of its template
UPDATE "Demanda" d
SET "template_version_id" = (
  SELECT tv."id"
  FROM "TemplateVersion" tv
  WHERE tv."template_id" = d."template_id"
  ORDER BY tv."created_at" ASC
  LIMIT 1
)
WHERE d."template_version_id" IS NULL;

-- Add FK constraint after backfill
ALTER TABLE "Demanda"
  ADD CONSTRAINT "Demanda_template_version_id_fkey"
  FOREIGN KEY ("template_version_id") REFERENCES "TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
