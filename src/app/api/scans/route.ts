import { jsonError, jsonOk } from "@/lib/api";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireInstallationSession();
    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? "50"),
      100,
    );

    const scans = await getStore().listScans({
      githubInstallationId: session.installationId,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return jsonOk({ scans, count: scans.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to list scans", 500);
  }
}
