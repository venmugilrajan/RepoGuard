import { jsonError, jsonOk } from "@/lib/api";
import { getStore } from "@/lib/store";
import type { Severity } from "@/lib/store/types";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

export async function GET(request: Request) {
  try {
    const session = await requireInstallationSession();
    const url = new URL(request.url);
    const severityParam = url.searchParams.get("severity");
    const severity =
      severityParam && SEVERITIES.includes(severityParam as Severity)
        ? (severityParam as Severity)
        : undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

    const findings = await getStore().listFindings({
      githubInstallationId: session.installationId,
      severity,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    const criticalCount = await getStore().countFindings({
      githubInstallationId: session.installationId,
      severity: "Critical",
    });

    return jsonOk({
      findings,
      count: findings.length,
      criticalCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to list findings", 500);
  }
}
