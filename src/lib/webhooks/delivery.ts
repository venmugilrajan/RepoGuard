import { getStore } from "@/lib/store";
import type { WebhookDeliveryRecord } from "@/lib/store/types";

export async function recordDelivery(params: {
  id: string;
  event: string;
  action: string | null;
  installationId: number | null;
  repositoryFullName: string | null;
  processed: boolean;
}): Promise<void> {
  const record: WebhookDeliveryRecord = {
    id: params.id,
    event: params.event,
    action: params.action,
    installationId: params.installationId,
    repositoryFullName: params.repositoryFullName,
    receivedAt: new Date().toISOString(),
    processed: params.processed,
  };
  await getStore().recordWebhookDelivery(record);
}
