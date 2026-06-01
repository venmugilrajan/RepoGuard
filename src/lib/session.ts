import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

export type RepoGuardSession = {
  installationId?: number;
  accountLogin?: string;
  accountType?: "User" | "Organization";
  avatarUrl?: string | null;
  installedAt?: string;
};

export const SESSION_COOKIE = "repoguard_session";

function getSessionOptions(): SessionOptions {
  const env = getEnv();
  return {
    password: env.SESSION_SECRET,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  return getIronSession<RepoGuardSession>(await cookies(), getSessionOptions());
}

export async function requireInstallationSession(): Promise<
  RepoGuardSession & { installationId: number }
> {
  const session = await getSession();
  if (!session.installationId) {
    throw new Error("UNAUTHORIZED");
  }
  return session as RepoGuardSession & { installationId: number };
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
