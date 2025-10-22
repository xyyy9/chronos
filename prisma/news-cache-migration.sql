-- Adds NewsCache and NewsSnapshot tables for cached articles and html snapshots.
-- Run with: npx prisma db execute --schema prisma/schema.prisma --file prisma/news-cache-migration.sql

CREATE TABLE IF NOT EXISTS "NewsCache" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "language" TEXT NOT NULL UNIQUE,
  "payload" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "fetchedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "NewsSnapshot" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "articleId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "savedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "NewsSnapshot_articleId_url_key" UNIQUE ("articleId", "url")
);

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "NewsCache_updatedAt"
BEFORE UPDATE ON "NewsCache"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER "NewsSnapshot_updatedAt"
BEFORE UPDATE ON "NewsSnapshot"
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
