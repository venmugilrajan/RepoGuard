import {
  handleInstallationCreated,
  handleInstallationDeleted,
} from "@/lib/services/installation-service";

export async function handleInstallationCreatedEvent(
  installationId: number,
  deliveryId: string,
): Promise<void> {
  await handleInstallationCreated(installationId, deliveryId);
}

export async function handleInstallationDeletedEvent(
  installationId: number,
): Promise<void> {
  await handleInstallationDeleted(installationId);
}
