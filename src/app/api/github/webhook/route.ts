import { jsonError, jsonOk } from "@/lib/api";
import { logger } from "@/lib/logger";
import {
  parseWebhookHeaders,
  receiveWebhook,
} from "@/lib/webhooks/receive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    success: true,
    message: "RepoGuardX webhook endpoint active",
  });
}

export async function POST(request: Request) {
  const headers = parseWebhookHeaders(request.headers);
  if (!headers) {
    return jsonError(
      "Missing required GitHub webhook headers (x-github-delivery, x-github-event, x-hub-signature-256)",
      400,
    );
  }

  const payload = await request.text();
  if (!payload) {
    return jsonError("Empty webhook payload", 400);
  }

  try {
    await receiveWebhook(payload, headers);
    return jsonOk({
      received: true,
      deliveryId: headers.deliveryId,
      event: headers.eventName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";

    if (
      message.toLowerCase().includes("signature") ||
      message.toLowerCase().includes("webhook secret")
    ) {
      logger.warn("Webhook signature verification failed", {
        deliveryId: headers.deliveryId,
        event: headers.eventName,
      });
      return jsonError("Invalid webhook signature", 401);
    }

    logger.error("Webhook processing failed", {
      deliveryId: headers.deliveryId,
      event: headers.eventName,
      message,
    });
    return jsonError("Webhook processing failed", 500);
  }
}
