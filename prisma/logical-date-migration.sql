-- Converts DailyLog.logicalDate from TIMESTAMP to canonical YYYY-MM-DD text.
-- Run with: npx prisma db execute --file prisma/logical-date-migration.sql

ALTER TABLE "DailyLog"
ADD COLUMN "logicalDate_tmp" TEXT;

UPDATE "DailyLog"
SET "logicalDate_tmp" = to_char("logicalDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD');

ALTER TABLE "DailyLog" DROP CONSTRAINT IF EXISTS "DailyLog_logicalDate_key";

ALTER TABLE "DailyLog"
DROP COLUMN "logicalDate";

ALTER TABLE "DailyLog"
RENAME COLUMN "logicalDate_tmp" TO "logicalDate";

ALTER TABLE "DailyLog"
ADD CONSTRAINT "DailyLog_logicalDate_key" UNIQUE ("logicalDate");
