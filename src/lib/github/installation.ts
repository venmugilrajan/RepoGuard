import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { getEnv, normalizePrivateKey } from "@/lib/env";

export type InstallationAccount = {
  login: string;
  type: "User" | "Organization";
  avatarUrl: string | null;
};

export type InstallationSummary = {
  id: number;
  account: InstallationAccount;
  repositorySelection: "all" | "selected";
  suspendedAt: string | null;
};

export async function getInstallation(
  installationId: number,
): Promise<InstallationSummary> {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.request("GET /app/installations/{installation_id}", {
    installation_id: installationId,
  });

  const account = data.account;
  if (!account || !("login" in account)) {
    throw new Error("Installation account is missing or unsupported");
  }

  return {
    id: data.id,
    account: {
      login: account.login,
      type: account.type as "User" | "Organization",
      avatarUrl: "avatar_url" in account ? (account.avatar_url ?? null) : null,
    },
    repositorySelection: data.repository_selection,
    suspendedAt: data.suspended_at,
  };
}

/**
 * Installation-scoped Octokit from @octokit/rest (includes paginate).
 * Do not use App#getInstallationOctokit — that client lacks paginate REST.
 */
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const env = getEnv();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey: normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
      installationId,
    },
  });
}

export async function listInstallationRepositories(
  installationId: number,
): Promise<
  Array<{
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    defaultBranch: string | null;
  }>
> {
  const octokit = await getInstallationOctokit(installationId);
  const repos = await octokit.paginate("GET /installation/repositories", {
    per_page: 100,
  });

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
  }));
}
