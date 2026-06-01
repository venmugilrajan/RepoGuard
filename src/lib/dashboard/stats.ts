import { getStore } from "@/lib/store";
import type { RepositoryRecord, Severity } from "@/lib/store/types";

export type DashboardStats = {
  repositories: number;
  activeInstallations: number;
  totalScans: number;
  totalFindings: number;
  criticalFindings: number;
  averageSecurityScore: number;
  severityBreakdown: Record<Severity, number>;
};

export async function getDashboardStats(
  installationId: number,
): Promise<DashboardStats> {
  const store = getStore();
  const severities: Severity[] = ["Critical", "High", "Medium", "Low"];

  const [repositories, totalScans, totalFindings, criticalFindings] =
    await Promise.all([
      store.listRepositories(installationId),
      store.countScans({ githubInstallationId: installationId }),
      store.countFindings({ githubInstallationId: installationId }),
      store.countFindings({
        githubInstallationId: installationId,
        severity: "Critical",
      }),
    ]);

  const severityBreakdown = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  } satisfies Record<Severity, number>;

  await Promise.all(
    severities.map(async (severity) => {
      severityBreakdown[severity] = await store.countFindings({
        githubInstallationId: installationId,
        severity,
      });
    }),
  );

  const activeInstallations = await store.countInstallations();
  const averageSecurityScore =
    repositories.length === 0
      ? 100
      : Math.round(
          repositories.reduce((sum, repo) => sum + (repo.securityScore ?? 100), 0) /
            repositories.length,
        );

  return {
    repositories: repositories.length,
    activeInstallations,
    totalScans,
    totalFindings,
    criticalFindings,
    averageSecurityScore,
    severityBreakdown,
  };
}

export type RepositoryWithStats = RepositoryRecord & {
  id: string;
  findingsCount: number;
  criticalCount: number;
  lastScanAt: string | null;
  lastScanStatus: string | null;
};

export async function getRepositoriesWithStats(
  installationId: number,
): Promise<RepositoryWithStats[]> {
  const store = getStore();
  const repositories = await store.listRepositories(installationId);
  const scans = await store.listScans({
    githubInstallationId: installationId,
    limit: 500,
  });

  const enriched: RepositoryWithStats[] = [];

  for (const repo of repositories) {
    if (!repo.id) {
      continue;
    }
    const repoScans = scans.filter(
      (scan) =>
        scan.repositoryId === repo.id ||
        scan.githubRepoId === repo.githubRepoId,
    );
    const lastScan = repoScans[0] ?? null;

    const [findingsCount, criticalCount] = await Promise.all([
      store.countFindings({ repositoryId: repo.id }),
      store.countFindings({ repositoryId: repo.id, severity: "Critical" }),
    ]);

    enriched.push({
      ...repo,
      id: repo.id,
      findingsCount,
      criticalCount,
      lastScanAt: repo.lastScannedAt ?? lastScan?.updatedAt ?? null,
      lastScanStatus: lastScan?.status ?? null,
    });
  }

  return enriched.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getRepositoryDetail(
  installationId: number,
  repositoryId: string,
) {
  const store = getStore();
  const repository = await store.getRepositoryById(repositoryId);

  if (!repository?.id || repository.githubInstallationId !== installationId) {
    return null;
  }

  const [findings, scans, findingsCount, criticalCount] = await Promise.all([
    store.listFindings({ repositoryId: repository.id, limit: 50 }),
    store.listScans({ githubInstallationId: installationId, limit: 20 }),
    store.countFindings({ repositoryId: repository.id }),
    store.countFindings({ repositoryId: repository.id, severity: "Critical" }),
  ]);

  const repoScans = scans.filter(
    (scan) =>
      scan.repositoryId === repository.id ||
      scan.githubRepoId === repository.githubRepoId,
  );

  const severityBreakdown: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  for (const severity of Object.keys(severityBreakdown) as Severity[]) {
    severityBreakdown[severity] = await store.countFindings({
      repositoryId: repository.id,
      severity,
    });
  }

  return {
    repository,
    findings,
    scans: repoScans,
    findingsCount,
    criticalCount,
    severityBreakdown,
  };
}
