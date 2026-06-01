import { getEnv } from "@/lib/env";
import { isRepoGuardCheckRun } from "@/lib/github/checks";
import { logger } from "@/lib/logger";

export async function handleCheckSuiteEvent(params: {
  action: string;
  status: string | null;
  conclusion: string | null;
  repositoryFullName: string;
  headSha: string;
  appSlug: string | null;
  checkRuns: Array<{ name: string }>;
  installationId: number | null;
}): Promise<void> {
  const env = getEnv();
  const isOurApp = params.appSlug === env.GITHUB_APP_SLUG;
  const hasOurCheckRun = params.checkRuns.some((run) =>
    isRepoGuardCheckRun(run.name),
  );

  if (!isOurApp && !hasOurCheckRun) {
    return;
  }

  logger.info("RepoGuardX check suite event", {
    action: params.action,
    status: params.status,
    conclusion: params.conclusion,
    repository: params.repositoryFullName,
    headSha: params.headSha,
    installationId: params.installationId,
    appSlug: params.appSlug,
  });
}
