import { performance } from "node:perf_hooks";
import { getEnv } from "@/lib/env";
import {
  buildCheckRunPresentation,
  completeCheckRun,
  createCheckRun,
  failCheckRun,
  resolveHeadSha,
} from "@/lib/github/check-runs";
import { getInstallationOctokit } from "@/lib/github/installation";
import { loadFileContents, resolveScanFiles } from "@/lib/github/content";
import { logger } from "@/lib/logger";
import { scanFiles } from "@/lib/scanner/engine";
import {
  calculateSecurityScore,
  emptySeverityCounts,
} from "@/lib/scanner/security-score";
import { getStore } from "@/lib/store";
import type { CheckRunFinding } from "@/lib/github/check-runs";
import type { Severity } from "@/lib/store/types";

function normalizeRef(ref: string | null, defaultBranch: string | null): string {
  if (!ref) {
    return defaultBranch ?? "main";
  }
  if (ref.startsWith("refs/heads/")) {
    return ref.replace("refs/heads/", "");
  }
  if (ref.startsWith("refs/tags/")) {
    return ref.replace("refs/tags/", "");
  }
  return ref;
}

function isFullTreeScan(trigger: string): boolean {
  return trigger === "installation" || trigger === "repository_added";
}

export async function runScan(scanId: string): Promise<void> {
  const store = getStore();
  const scan = await store.getScan(scanId);

  if (!scan) {
    logger.warn("Scan not found", { scanId });
    return;
  }

  if (scan.status !== "queued") {
    return;
  }

  const startedAt = new Date().toISOString();
  const scanStartedMs = performance.now();
  await store.updateScan(scanId, {
    status: "running",
    updatedAt: startedAt,
    startedAt,
    errorMessage: null,
  });

  let checkRunId: number | null = null;
  let octokit: Awaited<ReturnType<typeof getInstallationOctokit>> | null = null;
  let headSha: string | null = null;
  const detectedFindings: CheckRunFinding[] = [];

  try {
    const repository = await store.getRepository(
      scan.githubInstallationId,
      scan.githubRepoId,
    );

    if (!repository?.id) {
      throw new Error("Repository record not found for scan");
    }

    octokit = await getInstallationOctokit(scan.githubInstallationId);
    const ref = normalizeRef(scan.ref, repository.defaultBranch);
    const fullTree = isFullTreeScan(scan.trigger);

    headSha = await resolveHeadSha(octokit, scan.repositoryFullName, {
      commitSha: scan.commitSha,
      ref,
    });

    const env = getEnv();
    const detailsUrl = repository.id
      ? `${env.NEXT_PUBLIC_APP_URL}/repositories/${repository.id}`
      : env.NEXT_PUBLIC_APP_URL;

    checkRunId = await createCheckRun({
      octokit,
      fullName: scan.repositoryFullName,
      headSha,
      scanId: scan.id,
      detailsUrl,
    });

    const fileRefs = await resolveScanFiles(
      octokit,
      scan.repositoryFullName,
      {
        ref,
        commitSha: scan.commitSha,
        pullRequestNumber: scan.pullRequestNumber,
        fullTree,
      },
    );

    const files = await loadFileContents(
      octokit,
      scan.repositoryFullName,
      fileRefs,
      scan.commitSha ?? ref,
    );

    const results = scanFiles(
      files.map((file) => ({ path: file.path, content: file.content })),
    );

    const severityCounts = emptySeverityCounts();
    let newFindings = 0;

    for (const result of results) {
      for (const finding of result.findings) {
        severityCounts[finding.severity] += 1;
        detectedFindings.push({
          secretType: finding.secretType,
          severity: finding.severity,
          filePath: result.path,
          line: finding.line,
          maskedValue: finding.maskedValue,
        });

        const exists = await store.hasFindingFingerprint(
          repository.id,
          finding.fingerprint,
        );
        if (exists) {
          continue;
        }

        await store.createFinding({
          repositoryId: repository.id,
          repositoryFullName: scan.repositoryFullName,
          scanId: scan.id,
          filePath: result.path,
          line: finding.line,
          secretType: finding.secretType,
          severity: finding.severity,
          confidence: finding.confidence,
          fingerprint: finding.fingerprint,
          maskedValue: finding.maskedValue,
        });
        newFindings += 1;
      }
    }

    const allSeverities: Severity[] = ["Critical", "High", "Medium", "Low"];
    const counts = { ...emptySeverityCounts() };
    for (const severity of allSeverities) {
      counts[severity] = await store.countFindings({
        repositoryId: repository.id,
        severity,
      });
    }

    const totalFindings = await store.countFindings({
      repositoryId: repository.id,
    });

    const securityScore = calculateSecurityScore({
      counts,
      isPrivate: repository.private,
      totalHistoricalFindings: totalFindings,
    });

    await store.updateRepositoryMetrics(
      scan.githubInstallationId,
      scan.githubRepoId,
      {
        securityScore,
        lastScannedAt: new Date().toISOString(),
      },
    );

    const completedAt = new Date().toISOString();
    await store.updateScan(scanId, {
      status: "completed",
      updatedAt: completedAt,
      completedAt,
      filesScanned: files.length,
      secretsFound: newFindings,
      durationMs: Math.round(performance.now() - scanStartedMs),
      errorMessage: null,
    });

    if (checkRunId && octokit) {
      await completeCheckRun({
        octokit,
        fullName: scan.repositoryFullName,
        checkRunId,
        presentation: buildCheckRunPresentation(detectedFindings),
      });
    }

    logger.info("Scan completed", {
      scanId,
      repository: scan.repositoryFullName,
      filesScanned: files.length,
      newFindings,
      detectedFindings: detectedFindings.length,
      severityCounts,
      securityScore,
      checkRunId,
      checkConclusion: detectedFindings.length === 0 ? "success" : "failure",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scan failure";
    const failedAt = new Date().toISOString();
    await store.updateScan(scanId, {
      status: "failed",
      updatedAt: failedAt,
      completedAt: failedAt,
      durationMs: Math.round(performance.now() - scanStartedMs),
      errorMessage: message,
    });

    if (checkRunId && octokit) {
      await failCheckRun({
        octokit,
        fullName: scan.repositoryFullName,
        checkRunId,
        message,
      });
    }

    logger.error("Scan failed", { scanId, message });
    throw error;
  }
}

export function scheduleScan(scanId: string): void {
  void runScan(scanId).catch((error) => {
    const message = error instanceof Error ? error.message : "Scan error";
    logger.error("Unhandled scan failure", { scanId, message });
  });
}

export async function processQueuedScans(limit = 5): Promise<number> {
  const store = getStore();
  const queued = await store.listScans({ status: "queued", limit });
  for (const scan of queued) {
    scheduleScan(scan.id);
  }
  return queued.length;
}
