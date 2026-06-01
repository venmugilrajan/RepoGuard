import { logger } from "@/lib/logger";
import {
  getInstallation,
  listInstallationRepositories,
} from "@/lib/github/installation";
import { getStore } from "@/lib/store";
import type { InstallationRecord } from "@/lib/store/types";
import { enqueueScan } from "@/lib/services/scan-queue";

function nowIso() {
  return new Date().toISOString();
}

export async function syncInstallationFromGitHub(
  githubInstallationId: number,
): Promise<InstallationRecord> {
  const remote = await getInstallation(githubInstallationId);
  const timestamp = nowIso();
  const existing = await getStore().getInstallation(githubInstallationId);

  const record: InstallationRecord = {
    githubInstallationId,
    accountLogin: remote.account.login,
    accountType: remote.account.type,
    repositorySelection: remote.repositorySelection,
    suspendedAt: remote.suspendedAt,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await getStore().upsertInstallation(record);
  return record;
}

export async function syncInstallationRepositories(
  githubInstallationId: number,
  options?: { queueInitialScans?: boolean; deliveryId?: string },
): Promise<number> {
  const repos = await listInstallationRepositories(githubInstallationId);
  const timestamp = nowIso();

  for (const repo of repos) {
    await getStore().upsertRepository({
      githubRepoId: repo.id,
      githubInstallationId,
      name: repo.name,
      fullName: repo.fullName,
      private: repo.private,
      defaultBranch: repo.defaultBranch,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (options?.queueInitialScans) {
      await enqueueScan({
        githubInstallationId,
        githubRepoId: repo.id,
        repositoryFullName: repo.fullName,
        trigger: "installation",
        ref: repo.defaultBranch,
        deliveryId: options.deliveryId,
      });
    }
  }

  logger.info("Repositories synced", {
    githubInstallationId,
    count: repos.length,
  });

  return repos.length;
}

export async function handleInstallationCreated(
  githubInstallationId: number,
  deliveryId: string,
): Promise<void> {
  await syncInstallationFromGitHub(githubInstallationId);
  await syncInstallationRepositories(githubInstallationId, {
    queueInitialScans: true,
    deliveryId,
  });
}

export async function handleInstallationDeleted(
  githubInstallationId: number,
): Promise<void> {
  await getStore().deleteInstallation(githubInstallationId);
  logger.info("Installation removed", { githubInstallationId });
}

export async function handleRepositoriesAdded(
  githubInstallationId: number,
  repositoryIds: number[],
  deliveryId: string,
): Promise<void> {
  await syncInstallationFromGitHub(githubInstallationId);
  const repos = await listInstallationRepositories(githubInstallationId);
  const added = repos.filter((repo) => repositoryIds.includes(repo.id));
  const timestamp = nowIso();

  for (const repo of added) {
    await getStore().upsertRepository({
      githubRepoId: repo.id,
      githubInstallationId,
      name: repo.name,
      fullName: repo.fullName,
      private: repo.private,
      defaultBranch: repo.defaultBranch,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await enqueueScan({
      githubInstallationId,
      githubRepoId: repo.id,
      repositoryFullName: repo.fullName,
      trigger: "repository_added",
      ref: repo.defaultBranch,
      deliveryId,
    });
  }
}

export async function handleRepositoriesRemoved(
  githubInstallationId: number,
  repositoryIds: number[],
): Promise<void> {
  for (const repoId of repositoryIds) {
    await getStore().removeRepository(githubInstallationId, repoId);
  }
  logger.info("Repositories removed from installation", {
    githubInstallationId,
    count: repositoryIds.length,
  });
}
