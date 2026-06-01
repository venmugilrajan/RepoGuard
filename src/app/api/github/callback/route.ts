import { NextResponse } from "next/server";
import { getInstallation } from "@/lib/github/installation";
import { getEnv } from "@/lib/env";
import {
  syncInstallationFromGitHub,
  syncInstallationRepositories,
} from "@/lib/services/installation-service";
import { getSession } from "@/lib/session";

type InstallState = {
  returnTo: string;
  issuedAt: number;
};

const STATE_MAX_AGE_MS = 15 * 60 * 1000;

function parseState(state: string | null): InstallState | null {
  if (!state) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as InstallState;
    if (!decoded.returnTo || typeof decoded.issuedAt !== "number") {
      return null;
    }
    if (Date.now() - decoded.issuedAt > STATE_MAX_AGE_MS) {
      return null;
    }
    if (!decoded.returnTo.startsWith("/")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const env = getEnv();
  const url = new URL(request.url);
  const installationIdParam = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  const state = parseState(url.searchParams.get("state"));

  if (!installationIdParam) {
    return NextResponse.redirect(
      new URL("/?error=missing_installation", env.NEXT_PUBLIC_APP_URL),
    );
  }

  const installationId = Number(installationIdParam);
  if (!Number.isInteger(installationId) || installationId <= 0) {
    return NextResponse.redirect(
      new URL("/?error=invalid_installation", env.NEXT_PUBLIC_APP_URL),
    );
  }

  if (setupAction === "request") {
    return NextResponse.redirect(
      new URL("/?notice=install_requested", env.NEXT_PUBLIC_APP_URL),
    );
  }

  try {
    const installation = await getInstallation(installationId);
    if (installation.suspendedAt) {
      return NextResponse.redirect(
        new URL("/?error=installation_suspended", env.NEXT_PUBLIC_APP_URL),
      );
    }

    const session = await getSession();
    session.installationId = installation.id;
    session.accountLogin = installation.account.login;
    session.accountType = installation.account.type;
    session.avatarUrl = installation.account.avatarUrl;
    session.installedAt = new Date().toISOString();
    await session.save();

    await syncInstallationFromGitHub(installationId);
    await syncInstallationRepositories(installationId);

    const returnTo = state?.returnTo ?? "/dashboard";
    return NextResponse.redirect(new URL(returnTo, env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error("GitHub installation callback failed", error);
    return NextResponse.redirect(
      new URL("/?error=installation_verify_failed", env.NEXT_PUBLIC_APP_URL),
    );
  }
}
