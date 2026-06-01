import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/api";
import { scheduleScan } from "@/lib/services/scan-runner";
import { getStore } from "@/lib/store";
import { requireInstallationSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requeueScan(id: string, installationId: number) {
  const scan = await getStore().getScan(id);

  if (!scan || scan.githubInstallationId !== installationId) {
    return null;
  }

  if (scan.status === "running") {
    return {
      kind: "error" as const,
      message: "Scan is already running",
      status: 409 as const,
    };
  }

  await getStore().updateScan(id, {
    status: "queued",
    updatedAt: new Date().toISOString(),
    errorMessage: null,
  });

  scheduleScan(id);
  return { kind: "ok" as const, scanId: id, status: "queued" as const };
}

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
    const result = await requeueScan(id, session.installationId);

    if (!result) {
      return jsonError("Scan not found", 404);
    }
    if (result.kind === "error") {
      return jsonError(result.message, result.status);
    }

    if (isHtmlFormPost(request)) {
      const env = getEnv();
      const scan = await getStore().getScan(id);
      const redirectPath = scan?.repositoryId
        ? `/repositories/${scan.repositoryId}?scan=queued`
        : "/dashboard?scan=queued";
      return NextResponse.redirect(new URL(redirectPath, env.NEXT_PUBLIC_APP_URL), 303);
    }

    return jsonOk({ scanId: result.scanId, status: result.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Install the GitHub App to continue", 401);
    }
    return jsonError("Failed to start scan", 500);
  }
}

export async function GET(request: Request, context: RouteContext) {
  const env = getEnv();
  const { id } = await context.params;

  try {
    const session = await requireInstallationSession();
    const result = await requeueScan(id, session.installationId);

    if (!result) {
      return NextResponse.redirect(
        new URL("/dashboard?error=scan_not_found", env.NEXT_PUBLIC_APP_URL),
      );
    }
    if (result.kind === "error") {
      return NextResponse.redirect(
        new URL("/dashboard?error=scan_busy", env.NEXT_PUBLIC_APP_URL),
      );
    }

    const repo = await getStore().getScan(id);
    const redirectPath = repo?.repositoryId
      ? `/repositories/${repo.repositoryId}`
      : "/dashboard";

    return NextResponse.redirect(new URL(redirectPath, env.NEXT_PUBLIC_APP_URL));
  } catch {
    return NextResponse.redirect(
      new URL("/api/github/install", env.NEXT_PUBLIC_APP_URL),
    );
  }
}
