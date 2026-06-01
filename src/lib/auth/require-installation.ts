import { redirect } from "next/navigation";
import { getInstallation } from "@/lib/github/installation";
import { getSession, type RepoGuardSession } from "@/lib/session";

export type InstallationContext = {
  session: RepoGuardSession & { installationId: number };
  installationId: number;
  accountLogin: string;
};

export async function requireInstallation(
  returnTo?: string,
): Promise<InstallationContext> {
  const session = await getSession();
  if (!session.installationId) {
    const path = returnTo ?? "/dashboard";
    redirect(`/api/github/install?return_to=${encodeURIComponent(path)}`);
  }

  const installation = await getInstallation(session.installationId);

  return {
    session: session as RepoGuardSession & { installationId: number },
    installationId: session.installationId,
    accountLogin: installation.account.login,
  };
}
