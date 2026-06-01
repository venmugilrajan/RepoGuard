import { enqueueScan } from "@/lib/services/scan-queue";

const SCANNABLE_ACTIONS = new Set([
  "opened",
  "synchronize",
  "reopened",
  "ready_for_review",
]);

export async function handlePullRequestEvent(params: {
  installationId: number;
  repositoryId: number;
  repositoryFullName: string;
  action: string;
  pullRequestNumber: number;
  headRef: string;
  headSha: string;
  deliveryId: string;
}): Promise<void> {
  if (!SCANNABLE_ACTIONS.has(params.action)) {
    return;
  }

  await enqueueScan({
    githubInstallationId: params.installationId,
    githubRepoId: params.repositoryId,
    repositoryFullName: params.repositoryFullName,
    trigger: "pull_request",
    ref: params.headRef,
    commitSha: params.headSha,
    pullRequestNumber: params.pullRequestNumber,
    deliveryId: params.deliveryId,
  });
}
