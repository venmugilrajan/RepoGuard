import type {
  AccountType as PrismaAccountType,
  RepositorySelection as PrismaRepositorySelection,
  ScanStatus as PrismaScanStatus,
  ScanTrigger as PrismaScanTrigger,
  Severity as PrismaSeverity,
} from "@/generated/prisma/client";
import type {
  FindingRecord,
  InstallationRecord,
  RepositoryRecord,
  ScanRecord,
  ScanStatus,
  ScanTrigger,
  Severity,
  WebhookDeliveryRecord,
} from "@/lib/store/types";
import type {
  Finding,
  Installation,
  Repository,
  Scan,
  WebhookDelivery,
} from "@/generated/prisma/client";

export function toNumber(value: bigint): number {
  return Number(value);
}

export function toBigInt(value: number): bigint {
  return BigInt(value);
}

export function toInstallationRecord(
  row: Installation,
): InstallationRecord {
  return {
    githubInstallationId: toNumber(row.githubInstallationId),
    accountLogin: row.accountLogin,
    accountType: row.accountType as InstallationRecord["accountType"],
    repositorySelection:
      row.repositorySelection as InstallationRecord["repositorySelection"],
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRepositoryRecord(row: Repository): RepositoryRecord {
  return {
    id: row.id,
    githubRepoId: toNumber(row.githubRepoId),
    githubInstallationId: toNumber(row.githubInstallationId),
    name: row.name,
    fullName: row.fullName,
    private: row.private,
    defaultBranch: row.defaultBranch,
    securityScore: row.securityScore,
    lastScannedAt: row.lastScannedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toScanRecord(row: Scan): ScanRecord {
  return {
    id: row.id,
    githubInstallationId: toNumber(row.githubInstallationId),
    githubRepoId: toNumber(row.githubRepoId),
    repositoryId: row.repositoryId,
    repositoryFullName: row.repositoryFullName,
    trigger: row.trigger as ScanTrigger,
    status: row.status as ScanStatus,
    ref: row.ref,
    commitSha: row.commitSha,
    pullRequestNumber: row.pullRequestNumber,
    deliveryId: row.deliveryId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    errorMessage: row.errorMessage,
  };
}

export function toFindingRecord(row: Finding): FindingRecord {
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    repositoryFullName: "",
    scanId: row.scanId,
    filePath: row.filePath,
    line: row.line,
    secretType: row.secretType,
    severity: row.severity as Severity,
    confidence: row.confidence,
    fingerprint: row.fingerprint,
    maskedValue: row.maskedValue,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFindingRecordWithRepo(
  row: Finding & { repository: Pick<Repository, "fullName"> },
): FindingRecord {
  return {
    ...toFindingRecord(row),
    repositoryFullName: row.repository.fullName,
  };
}

export function toWebhookDeliveryRecord(
  row: WebhookDelivery,
): WebhookDeliveryRecord {
  return {
    id: row.id,
    event: row.event,
    action: row.action,
    installationId: row.githubInstallationId
      ? toNumber(row.githubInstallationId)
      : null,
    repositoryFullName: row.repositoryFullName,
    receivedAt: row.receivedAt.toISOString(),
    processed: row.processed,
  };
}

export function toPrismaAccountType(
  value: InstallationRecord["accountType"],
): PrismaAccountType {
  return value;
}

export function toPrismaRepositorySelection(
  value: InstallationRecord["repositorySelection"],
): PrismaRepositorySelection {
  return value;
}

export function toPrismaScanTrigger(value: ScanTrigger): PrismaScanTrigger {
  return value;
}

export function toPrismaScanStatus(value: ScanStatus): PrismaScanStatus {
  return value;
}

export function toPrismaSeverity(value: Severity): PrismaSeverity {
  return value;
}
