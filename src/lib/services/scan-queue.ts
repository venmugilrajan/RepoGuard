import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";
import { scheduleScan } from "@/lib/services/scan-runner";
import { getStore } from "@/lib/store";
import type { ScanRecord, ScanTrigger } from "@/lib/store/types";

type EnqueueScanInput = {
  githubInstallationId: number;
  githubRepoId: number;
  repositoryFullName: string;
  trigger: ScanTrigger;
  ref?: string | null;
  commitSha?: string | null;
  pullRequestNumber?: number | null;
  deliveryId?: string | null;
};

export async function enqueueScan(
  input: EnqueueScanInput,
): Promise<ScanRecord> {
  const now = new Date().toISOString();
  const scan: ScanRecord = {
    id: randomUUID(),
    githubInstallationId: input.githubInstallationId,
    githubRepoId: input.githubRepoId,
    repositoryId: null,
    repositoryFullName: input.repositoryFullName,
    trigger: input.trigger,
    status: "queued",
    ref: input.ref ?? null,
    commitSha: input.commitSha ?? null,
    pullRequestNumber: input.pullRequestNumber ?? null,
    deliveryId: input.deliveryId ?? null,
    createdAt: now,
    updatedAt: now,
    errorMessage: null,
  };

  await getStore().createScan(scan);

  logger.info("Scan queued", {
    scanId: scan.id,
    trigger: scan.trigger,
    repository: scan.repositoryFullName,
    ref: scan.ref,
    commitSha: scan.commitSha,
    pullRequestNumber: scan.pullRequestNumber,
  });

  scheduleScan(scan.id);

  return scan;
}
