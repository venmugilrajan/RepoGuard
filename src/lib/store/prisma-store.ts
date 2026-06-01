import {
  findingRepository,
  installationRepository,
  repositoryRepository,
  scanRepository,
  webhookRepository,
} from "@/lib/repositories";
import {
  toFindingRecordWithRepo,
  toInstallationRecord,
  toPrismaAccountType,
  toPrismaRepositorySelection,
  toPrismaScanStatus,
  toPrismaScanTrigger,
  toPrismaSeverity,
  toRepositoryRecord,
  toScanRecord,
  toWebhookDeliveryRecord,
} from "@/lib/store/mappers";
import type {
  FindingRecord,
  InstallationRecord,
  RepoGuardStore,
  RepositoryRecord,
  ScanRecord,
  Severity,
  WebhookDeliveryRecord,
} from "@/lib/store/types";

export class PrismaRepoGuardStore implements RepoGuardStore {
  private async ensureInstallationId(
    githubInstallationId: number,
  ): Promise<string> {
    const row = await installationRepository.findByGithubId(
      githubInstallationId,
    );
    if (!row) {
      throw new Error(
        `Installation ${githubInstallationId} must be created before repositories`,
      );
    }
    return row.id;
  }

  async upsertInstallation(record: InstallationRecord): Promise<void> {
    await installationRepository.upsert({
      githubInstallationId: record.githubInstallationId,
      accountLogin: record.accountLogin,
      accountType: toPrismaAccountType(record.accountType),
      repositorySelection: toPrismaRepositorySelection(
        record.repositorySelection,
      ),
      suspendedAt: record.suspendedAt ? new Date(record.suspendedAt) : null,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }

  async deleteInstallation(githubInstallationId: number): Promise<void> {
    await installationRepository.deleteByGithubId(githubInstallationId);
  }

  async getInstallation(
    githubInstallationId: number,
  ): Promise<InstallationRecord | null> {
    const row = await installationRepository.findByGithubId(
      githubInstallationId,
    );
    return row ? toInstallationRecord(row) : null;
  }

  async upsertRepository(record: RepositoryRecord): Promise<void> {
    const installationId = await this.ensureInstallationId(
      record.githubInstallationId,
    );
    await repositoryRepository.upsert({
      githubRepoId: record.githubRepoId,
      githubInstallationId: record.githubInstallationId,
      installationId,
      name: record.name,
      fullName: record.fullName,
      private: record.private,
      defaultBranch: record.defaultBranch,
      securityScore: record.securityScore ?? 100,
      lastScannedAt: record.lastScannedAt
        ? new Date(record.lastScannedAt)
        : null,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }

  async removeRepository(
    githubInstallationId: number,
    githubRepoId: number,
  ): Promise<void> {
    await repositoryRepository.deleteByGithubIds(
      githubInstallationId,
      githubRepoId,
    );
  }

  async getRepositoryById(id: string): Promise<RepositoryRecord | null> {
    const row = await repositoryRepository.findById(id);
    return row ? toRepositoryRecord(row) : null;
  }

  async countInstallations(): Promise<number> {
    return installationRepository.count();
  }

  async countScans(options?: {
    githubInstallationId?: number;
  }): Promise<number> {
    return scanRepository.count(options);
  }

  async getRepository(
    githubInstallationId: number,
    githubRepoId: number,
  ): Promise<RepositoryRecord | null> {
    const row = await repositoryRepository.findByGithubIds(
      githubInstallationId,
      githubRepoId,
    );
    return row ? toRepositoryRecord(row) : null;
  }

  async updateRepositoryMetrics(
    githubInstallationId: number,
    githubRepoId: number,
    patch: { securityScore: number; lastScannedAt: string },
  ): Promise<void> {
    await repositoryRepository.updateMetrics(
      githubInstallationId,
      githubRepoId,
      {
        securityScore: patch.securityScore,
        lastScannedAt: new Date(patch.lastScannedAt),
      },
    );
  }

  async getScan(id: string): Promise<ScanRecord | null> {
    const row = await scanRepository.findById(id);
    return row ? toScanRecord(row) : null;
  }

  async hasFindingFingerprint(
    repositoryId: string,
    fingerprint: string,
  ): Promise<boolean> {
    return findingRepository.existsByFingerprint(repositoryId, fingerprint);
  }

  async listRepositories(
    githubInstallationId: number,
  ): Promise<RepositoryRecord[]> {
    const rows =
      await repositoryRepository.findManyByInstallation(githubInstallationId);
    return rows.map(toRepositoryRecord);
  }

  async createScan(record: ScanRecord): Promise<void> {
    let repositoryId = record.repositoryId;
    if (!repositoryId) {
      const repo = await repositoryRepository.findByGithubIds(
        record.githubInstallationId,
        record.githubRepoId,
      );
      repositoryId = repo?.id ?? null;
    }

    await scanRepository.create({
      id: record.id,
      githubInstallationId: record.githubInstallationId,
      githubRepoId: record.githubRepoId,
      repositoryId,
      repositoryFullName: record.repositoryFullName,
      trigger: toPrismaScanTrigger(record.trigger),
      status: toPrismaScanStatus(record.status),
      ref: record.ref,
      commitSha: record.commitSha,
      pullRequestNumber: record.pullRequestNumber,
      deliveryId: record.deliveryId,
      errorMessage: record.errorMessage,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }

  async updateScan(
    id: string,
    patch: Partial<
      Pick<ScanRecord, "status" | "updatedAt" | "errorMessage"> & {
        filesScanned?: number;
        secretsFound?: number;
        durationMs?: number;
        startedAt?: string;
        completedAt?: string;
      }
    >,
  ): Promise<void> {
    await scanRepository.update(id, {
      ...(patch.status
        ? { status: toPrismaScanStatus(patch.status) }
        : {}),
      ...(patch.updatedAt ? { updatedAt: new Date(patch.updatedAt) } : {}),
      ...(patch.errorMessage !== undefined
        ? { errorMessage: patch.errorMessage }
        : {}),
      ...(patch.filesScanned !== undefined
        ? { filesScanned: patch.filesScanned }
        : {}),
      ...(patch.secretsFound !== undefined
        ? { secretsFound: patch.secretsFound }
        : {}),
      ...(patch.durationMs !== undefined ? { durationMs: patch.durationMs } : {}),
      ...(patch.startedAt !== undefined
        ? { startedAt: patch.startedAt ? new Date(patch.startedAt) : null }
        : {}),
      ...(patch.completedAt !== undefined
        ? {
            completedAt: patch.completedAt
              ? new Date(patch.completedAt)
              : null,
          }
        : {}),
    });
  }

  async listScans(options?: {
    githubInstallationId?: number;
    status?: ScanRecord["status"];
    limit?: number;
  }): Promise<ScanRecord[]> {
    const rows = await scanRepository.findMany({
      githubInstallationId: options?.githubInstallationId,
      status: options?.status
        ? toPrismaScanStatus(options.status)
        : undefined,
      limit: options?.limit,
    });
    return rows.map(toScanRecord);
  }

  async recordWebhookDelivery(record: WebhookDeliveryRecord): Promise<void> {
    await webhookRepository.upsert({
      id: record.id,
      event: record.event,
      action: record.action,
      githubInstallationId: record.installationId,
      repositoryFullName: record.repositoryFullName,
      processed: record.processed,
      receivedAt: new Date(record.receivedAt),
    });
  }

  async listWebhookDeliveries(limit = 50): Promise<WebhookDeliveryRecord[]> {
    const rows = await webhookRepository.findMany(limit);
    return rows.map(toWebhookDeliveryRecord);
  }

  async createFinding(
    record: Omit<FindingRecord, "id" | "createdAt">,
  ): Promise<FindingRecord> {
    const row = await findingRepository.upsertByFingerprint({
      repositoryId: record.repositoryId,
      scanId: record.scanId,
      filePath: record.filePath,
      line: record.line,
      secretType: record.secretType,
      severity: toPrismaSeverity(record.severity),
      confidence: record.confidence,
      fingerprint: record.fingerprint,
      maskedValue: record.maskedValue,
    });
    return toFindingRecordWithRepo(row);
  }

  async getFinding(id: string): Promise<FindingRecord | null> {
    const row = await findingRepository.findById(id);
    return row ? toFindingRecordWithRepo(row) : null;
  }

  async listFindings(options?: {
    githubInstallationId?: number;
    repositoryId?: string;
    severity?: Severity;
    limit?: number;
  }): Promise<FindingRecord[]> {
    const rows = await findingRepository.findMany({
      repositoryId: options?.repositoryId,
      severity: options?.severity
        ? toPrismaSeverity(options.severity)
        : undefined,
      githubInstallationId: options?.githubInstallationId,
      limit: options?.limit,
    });
    return rows.map(toFindingRecordWithRepo);
  }

  async countFindings(options?: {
    githubInstallationId?: number;
    repositoryId?: string;
    severity?: Severity;
  }): Promise<number> {
    return findingRepository.count({
      repositoryId: options?.repositoryId,
      severity: options?.severity
        ? toPrismaSeverity(options.severity)
        : undefined,
      githubInstallationId: options?.githubInstallationId,
    });
  }
}
