import { isRepoGuardCheckRun } from "@/lib/github/checks";
import { logger } from "@/lib/logger";

export async function handleCheckRunEvent(params: {
  action: string;
  name: string;
  status: string;
  conclusion: string | null;
  repositoryFullName: string;
  headSha: string;
  installationId: number | null;
}): Promise<void> {
  if (!isRepoGuardCheckRun(params.name)) {
    return;
  }

  logger.info("RepoGuardX check run event", {
    action: params.action,
    status: params.status,
    conclusion: params.conclusion,
    repository: params.repositoryFullName,
    headSha: params.headSha,
    installationId: params.installationId,
  });
}
