import { jsonError, jsonOk } from "@/lib/api";
import { listInstallationRepositories } from "@/lib/github/installation";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireInstallationSession();
    const stored = await getStore().listRepositories(session.installationId);

    if (stored.length > 0) {
      return jsonOk({
        source: "database",
        repositories: stored.map((repo) => ({
          id: repo.githubRepoId,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          securityScore: repo.securityScore ?? 100,
          lastScannedAt: repo.lastScannedAt ?? null,
        })),
        count: stored.length,
      });
    }

    const repositories = await listInstallationRepositories(
      session.installationId,
    );
    return jsonOk({
      source: "github",
      repositories,
      count: repositories.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    console.error("Failed to list installation repositories", error);
    return jsonError("Failed to list repositories", 500);
  }
}
