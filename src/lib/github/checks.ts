/** Prefix for Check Runs created by RepoGuardX (Phase 6). */
export const REPOGUARD_CHECK_NAME = "RepoGuardX / Secret Scan";

export function isRepoGuardCheckRun(name: string): boolean {
  return name === REPOGUARD_CHECK_NAME || name.startsWith("RepoGuardX");
}
