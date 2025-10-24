-- CreateEnum
CREATE TYPE "PrimaryActivity" AS ENUM ('WORK', 'STUDY', 'FITNESS', 'REST', 'SOCIAL', 'CREATIVE');

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "logicalDate" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "sleepQuality" INTEGER NOT NULL,
    "energyLevel" INTEGER NOT NULL DEFAULT 3,
    "primaryActivities" "PrimaryActivity"[] DEFAULT ARRAY[]::"PrimaryActivity"[],
    "mentalWorldActivities" JSONB NOT NULL DEFAULT '[]',
    "dailyLifeActivities" JSONB NOT NULL DEFAULT '[]',
    "newsEntries" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsCache" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsSnapshot" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyLog_userId_idx" ON "DailyLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_userId_logicalDate_key" ON "DailyLog"("userId", "logicalDate");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCache_language_key" ON "NewsCache"("language");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSnapshot_articleId_url_key" ON "NewsSnapshot"("articleId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

