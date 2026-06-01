import { jsonError, jsonOk } from "@/lib/api";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireInstallationSession();
    const { id } = await context.params;
    const finding = await getStore().getFinding(id);

    if (!finding) {
      return jsonError("Finding not found", 404);
    }

    const repositories = await getStore().listRepositories(
      session.installationId,
    );
    const allowed = repositories.some(
      (repo) => repo.id === finding.repositoryId,
    );
    if (!allowed) {
      return jsonError("Finding not found", 404);
    }

    return jsonOk({ finding });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to load finding", 500);
  }
}
