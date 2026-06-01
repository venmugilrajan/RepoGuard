import { jsonError, jsonOk } from "@/lib/api";
import { getSession } from "@/lib/session";
import { getInstallation } from "@/lib/github/installation";

export async function GET() {
  const session = await getSession();
  if (!session.installationId) {
    return jsonError("Not authenticated", 401);
  }

  try {
    const installation = await getInstallation(session.installationId);
    return jsonOk({
      installationId: installation.id,
      account: installation.account,
      repositorySelection: installation.repositorySelection,
      installedAt: session.installedAt ?? null,
    });
  } catch (error) {
    console.error("Failed to refresh installation session", error);
    return jsonError("Installation is no longer valid", 401);
  }
}

export async function DELETE() {
  const session = await getSession();
  await session.destroy();
  return jsonOk({ signedOut: true });
}
