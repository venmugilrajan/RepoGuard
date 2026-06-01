import {
  handleRepositoriesAdded,
  handleRepositoriesRemoved,
} from "@/lib/services/installation-service";

export async function handleInstallationRepositoriesAdded(
  installationId: number,
  repositoryIds: number[],
  deliveryId: string,
): Promise<void> {
  await handleRepositoriesAdded(installationId, repositoryIds, deliveryId);
}

export async function handleInstallationRepositoriesRemoved(
  installationId: number,
  repositoryIds: number[],
): Promise<void> {
  await handleRepositoriesRemoved(installationId, repositoryIds);
}
