import { getGitHubApp } from "@/lib/github/app";
import { logger } from "@/lib/logger";
import { webhookRepository } from "@/lib/repositories";
import { registerWebhookHandlers } from "@/lib/webhooks/register";

export type WebhookHeaders = {
  deliveryId: string;
  eventName: string;
  signature: string;
};

export function parseWebhookHeaders(
  headers: Headers,
): WebhookHeaders | null {
  const deliveryId = headers.get("x-github-delivery");
  const eventName = headers.get("x-github-event");
  const signature = headers.get("x-hub-signature-256");

  if (!deliveryId || !eventName || !signature) {
    return null;
  }

  return { deliveryId, eventName, signature };
}

export async function receiveWebhook(
  payload: string,
  headers: WebhookHeaders,
): Promise<void> {
  if (await webhookRepository.exists(headers.deliveryId)) {
    logger.info("Duplicate webhook delivery skipped", {
      deliveryId: headers.deliveryId,
      event: headers.eventName,
    });
    return;
  }

  await webhookRepository.upsert({
    id: headers.deliveryId,
    event: headers.eventName,
    processed: false,
    receivedAt: new Date(),
  });

  registerWebhookHandlers();
  const webhooks = getGitHubApp().webhooks;

  await webhooks.verifyAndReceive({
    id: headers.deliveryId,
    name: headers.eventName,
    signature: headers.signature,
    payload,
  });
}
