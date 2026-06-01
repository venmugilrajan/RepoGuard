import { enqueueScan } from "@/lib/services/scan-queue";

export async function handlePushEvent(params: {
  installationId: number;
  repositoryId: number;
  repositoryFullName: string;
  ref: string;
  after: string;
  deliveryId: string;
}): Promise<void> {
  if (params.ref.endsWith("/deleted")) {
    return;
  }

  await enqueueScan({
    githubInstallationId: params.installationId,
    githubRepoId: params.repositoryId,
    repositoryFullName: params.repositoryFullName,
    trigger: "push",
    ref: params.ref,
    commitSha: params.after,
    deliveryId: params.deliveryId,
  });
}
