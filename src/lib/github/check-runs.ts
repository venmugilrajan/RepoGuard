import type { Octokit } from "@octokit/rest";
import { REPOGUARD_CHECK_NAME } from "@/lib/github/checks";
import { logger } from "@/lib/logger";
import type { Severity } from "@/lib/store/types";

export type CheckRunConclusion = "success" | "failure";

export type CheckRunPresentation = {
  conclusion: CheckRunConclusion;
  title: string;
  summary: string;
  text: string;
};

function parseOwnerRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner, repo };
}

export async function resolveHeadSha(
  octokit: Octokit,
  fullName: string,
  options: { commitSha?: string | null; ref: string },
): Promise<string> {
  if (options.commitSha) {
    return options.commitSha;
  }

  const { owner, repo } = parseOwnerRepo(fullName);
  const { data: branch } = await octokit.request(
    "GET /repos/{owner}/{repo}/branches/{branch}",
    {
      owner,
      repo,
      branch: options.ref,
    },
  );

  return branch.commit.sha;
}

export type CheckRunFinding = {
  secretType: string;
  severity: Severity;
  filePath: string;
  line: number;
  maskedValue: string;
};

export function buildCheckRunPresentation(
  findings: CheckRunFinding[],
): CheckRunPresentation {
  if (findings.length === 0) {
    return {
      conclusion: "success",
      title: "No secrets detected",
      summary: "RepoGuardX did not detect exposed secrets in this changeset.",
      text: "Scan completed successfully with no findings.",
    };
  }

  const critical = findings.filter((f) => f.severity === "Critical");
  const high = findings.filter((f) => f.severity === "High");
  const lead = critical[0] ?? high[0] ?? findings[0];

  const title =
    critical.length > 0
      ? `Critical secret found: ${lead.secretType}`
      : `Secret found: ${lead.secretType}`;

  const lines = findings.slice(0, 15).map(
    (finding) =>
      `- **${finding.severity}** · ${finding.secretType} · \`${finding.filePath}:${finding.line}\` · \`${finding.maskedValue}\``,
  );

  if (findings.length > 15) {
    lines.push(`- …and ${findings.length - 15} more`);
  }

  return {
    conclusion: "failure",
    title,
    summary: `RepoGuardX detected ${findings.length} potential secret(s) in this scan.`,
    text: lines.join("\n"),
  };
}

export async function createCheckRun(params: {
  octokit: Octokit;
  fullName: string;
  headSha: string;
  scanId: string;
  detailsUrl?: string;
}): Promise<number | null> {
  const { owner, repo } = parseOwnerRepo(params.fullName);

  try {
    const { data } = await params.octokit.request(
      "POST /repos/{owner}/{repo}/check-runs",
      {
        owner,
        repo,
        name: REPOGUARD_CHECK_NAME,
        head_sha: params.headSha,
        status: "in_progress",
        started_at: new Date().toISOString(),
        external_id: params.scanId,
        details_url: params.detailsUrl,
      },
    );

    return data.id;
  } catch (error) {
    logger.warn("Failed to create GitHub check run", {
      repository: params.fullName,
      scanId: params.scanId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function completeCheckRun(params: {
  octokit: Octokit;
  fullName: string;
  checkRunId: number;
  presentation: CheckRunPresentation;
}): Promise<void> {
  const { owner, repo } = parseOwnerRepo(params.fullName);

  try {
    await params.octokit.request(
      "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
      {
        owner,
        repo,
        check_run_id: params.checkRunId,
        status: "completed",
        conclusion: params.presentation.conclusion,
        completed_at: new Date().toISOString(),
        output: {
          title: params.presentation.title,
          summary: params.presentation.summary,
          text: params.presentation.text,
        },
      },
    );
  } catch (error) {
    logger.warn("Failed to complete GitHub check run", {
      repository: params.fullName,
      checkRunId: params.checkRunId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function failCheckRun(params: {
  octokit: Octokit;
  fullName: string;
  checkRunId: number;
  message: string;
}): Promise<void> {
  await completeCheckRun({
    octokit: params.octokit,
    fullName: params.fullName,
    checkRunId: params.checkRunId,
    presentation: {
      conclusion: "failure",
      title: "RepoGuardX scan failed",
      summary: "The secret scan could not be completed.",
      text: params.message,
    },
  });
}
