import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { enqueueScan } from "@/lib/services/scan-queue";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isHtmlFormPost(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireInstallationSession();
    const { id } = await context.params;
    const repository = await getStore().getRepositoryById(id);

    if (
      !repository?.id ||
      repository.githubInstallationId !== session.installationId
    ) {
      return jsonError("Repository not found", 404);
    }

    const scan = await enqueueScan({
      githubInstallationId: session.installationId,
      githubRepoId: repository.githubRepoId,
      repositoryFullName: repository.fullName,
      trigger: "manual",
      ref: repository.defaultBranch,
    });

    if (isHtmlFormPost(request)) {
      const env = getEnv();
      return NextResponse.redirect(
        new URL(
          `/repositories/${id}?scan=queued&scanId=${scan.id}`,
          env.NEXT_PUBLIC_APP_URL,
        ),
        303,
      );
    }

    return jsonOk({ scan });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to start scan", 500);
  }
}
