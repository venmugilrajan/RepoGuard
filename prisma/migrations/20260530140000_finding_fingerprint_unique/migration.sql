-- CreateIndex
CREATE UNIQUE INDEX "Finding_repositoryId_fingerprint_key" ON "Finding"("repositoryId", "fingerprint");
