-- Adds the newsEntries JSON column for storing news journal items.
-- Run with: npx prisma db execute --schema prisma/schema.prisma --file prisma/news-entries-migration.sql

ALTER TABLE "DailyLog"
ADD COLUMN IF NOT EXISTS "newsEntries" JSONB DEFAULT '[]'::jsonb NOT NULL;
