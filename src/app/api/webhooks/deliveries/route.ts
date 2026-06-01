import { jsonError, jsonOk } from "@/lib/api";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireInstallationSession();
    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? "30"),
      100,
    );

    const deliveries = await getStore().listWebhookDeliveries(
      Number.isFinite(limit) ? limit : 30,
    );

    return jsonOk({ deliveries, count: deliveries.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to list webhook deliveries", 500);
  }
}
