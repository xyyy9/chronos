DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;
END
$$;

ALTER TABLE "DailyLog"
  DROP CONSTRAINT IF EXISTS "DailyLog_logicalDate_key";

ALTER TABLE "DailyLog"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'DailyLog_userId_logicalDate_key'
  ) THEN
    ALTER TABLE "DailyLog"
      ADD CONSTRAINT "DailyLog_userId_logicalDate_key"
      UNIQUE ("userId", "logicalDate");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "DailyLog_userId_idx"
  ON "DailyLog" ("userId");

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'DailyLog_userId_fkey'
  ) THEN
    ALTER TABLE "DailyLog"
      ADD CONSTRAINT "DailyLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END
$$;

INSERT INTO "User" ("id", "username", "email", "passwordHash")
VALUES (
  '68692f76-68ff-4869-810f-eab31174b3c4',
  'xycindyz',
  'xycindyz@gmail.com',
  '91a3f041e61c9e178b27875f2f773ecd:ce4947d2ae86fdb7429c2dfe83c765406ccb5086c5257eb10f3a32d407f31ca8eec98f940ecb74dd25784f74c85c7a84789018240dfa4a63005279aeeab9c18c'
)
ON CONFLICT ("email") DO NOTHING;

WITH target AS (
  SELECT "id" FROM "User" WHERE "email" = 'xycindyz@gmail.com'
)
UPDATE "DailyLog"
SET "userId" = (SELECT "id" FROM target)
WHERE "userId" IS NULL;
