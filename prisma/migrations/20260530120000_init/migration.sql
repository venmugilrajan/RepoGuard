-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('User', 'Organization');

-- CreateEnum
CREATE TYPE "RepositorySelection" AS ENUM ('all', 'selected');

-- CreateEnum
CREATE TYPE "ScanTrigger" AS ENUM ('installation', 'push', 'pull_request', 'repository_added', 'manual');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubUserId" BIGINT NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "githubInstallationId" BIGINT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "repositorySelection" "RepositorySelection" NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "githubInstallationId" BIGINT NOT NULL,
    "installationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT,
    "securityScore" INTEGER NOT NULL DEFAULT 100,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "githubInstallationId" BIGINT NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "repositoryId" TEXT,
    "repositoryFullName" TEXT NOT NULL,
    "trigger" "ScanTrigger" NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'queued',
    "ref" TEXT,
    "commitSha" TEXT,
    "pullRequestNumber" INTEGER,
    "deliveryId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "scanId" TEXT,
    "filePath" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "secretType" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "maskedValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT,
    "githubInstallationId" BIGINT,
    "repositoryFullName" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubUserId_key" ON "User"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_githubInstallationId_key" ON "Installation"("githubInstallationId");

-- CreateIndex
CREATE INDEX "Repository_installationId_idx" ON "Repository"("installationId");

-- CreateIndex
CREATE INDEX "Repository_fullName_idx" ON "Repository"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubInstallationId_githubRepoId_key" ON "Repository"("githubInstallationId", "githubRepoId");

-- CreateIndex
CREATE INDEX "Scan_githubInstallationId_createdAt_idx" ON "Scan"("githubInstallationId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_repositoryId_idx" ON "Scan"("repositoryId");

-- CreateIndex
CREATE INDEX "Finding_repositoryId_idx" ON "Finding"("repositoryId");

-- CreateIndex
CREATE INDEX "Finding_scanId_idx" ON "Finding"("scanId");

-- CreateIndex
CREATE INDEX "Finding_severity_idx" ON "Finding"("severity");

-- CreateIndex
CREATE INDEX "Finding_fingerprint_idx" ON "Finding"("fingerprint");

-- CreateIndex
CREATE INDEX "WebhookDelivery_receivedAt_idx" ON "WebhookDelivery"("receivedAt");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
