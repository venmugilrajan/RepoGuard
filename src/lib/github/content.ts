import type { Octokit } from "@octokit/rest";
import { shouldScanPath } from "@/lib/scanner/filters";
import { logger } from "@/lib/logger";

const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES_PER_SCAN = 300;

export type RepoFileRef = {
  path: string;
  sha?: string;
};

export type RepoFileContent = {
  path: string;
  content: string;
};

function parseOwnerRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner, repo };
}

export async function fetchFileContent(
  octokit: Octokit,
  fullName: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const { owner, repo } = parseOwnerRepo(fullName);

  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        ref,
      },
    );

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      return null;
    }
    if (data.size > MAX_FILE_BYTES) {
      return null;
    }
    const encoded = data.content.replace(/\n/g, "");
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

async function listTreePaths(
  octokit: Octokit,
  fullName: string,
  ref: string,
): Promise<RepoFileRef[]> {
  const { owner, repo } = parseOwnerRepo(fullName);

  const { data: branch } = await octokit.request(
    "GET /repos/{owner}/{repo}/branches/{branch}",
    {
      owner,
      repo,
      branch: ref,
    },
  );

  const treeSha = branch.commit.commit.tree.sha;

  const { data: tree } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner,
      repo,
      tree_sha: treeSha,
      recursive: "1",
    },
  );

  if (!("tree" in tree) || !Array.isArray(tree.tree)) {
    return [];
  }

  return tree.tree
    .filter((entry) => entry.type === "blob" && entry.path)
    .map((entry) => ({ path: entry.path as string, sha: entry.sha }))
    .filter((entry) => shouldScanPath(entry.path))
    .slice(0, MAX_FILES_PER_SCAN);
}

export async function getFilesForPush(
  octokit: Octokit,
  fullName: string,
  commitSha: string,
): Promise<RepoFileRef[]> {
  const { owner, repo } = parseOwnerRepo(fullName);

  const { data: commit } = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{commit_sha}",
    {
      owner,
      repo,
      commit_sha: commitSha,
    },
  );

  const paths: string[] = [];
  for (const file of commit.files ?? []) {
    if (file.filename && shouldScanPath(file.filename)) {
      paths.push(file.filename);
    }
  }
  return paths.slice(0, MAX_FILES_PER_SCAN).map((path) => ({ path }));
}

export async function getFilesForPullRequest(
  octokit: Octokit,
  fullName: string,
  pullNumber: number,
): Promise<RepoFileRef[]> {
  const { owner, repo } = parseOwnerRepo(fullName);

  const files = await octokit.paginate(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    },
  );

  const paths: string[] = [];
  for (const file of files) {
    if (file.filename && shouldScanPath(file.filename)) {
      paths.push(file.filename);
    }
  }
  return paths.slice(0, MAX_FILES_PER_SCAN).map((path) => ({ path }));
}

export async function resolveScanFiles(
  octokit: Octokit,
  fullName: string,
  options: {
    ref: string;
    commitSha?: string | null;
    pullRequestNumber?: number | null;
    fullTree?: boolean;
  },
): Promise<RepoFileRef[]> {
  if (options.pullRequestNumber) {
    return getFilesForPullRequest(octokit, fullName, options.pullRequestNumber);
  }
  if (options.commitSha && !options.fullTree) {
    return getFilesForPush(octokit, fullName, options.commitSha);
  }
  return listTreePaths(octokit, fullName, options.ref);
}

export async function loadFileContents(
  octokit: Octokit,
  fullName: string,
  files: RepoFileRef[],
  ref: string,
): Promise<RepoFileContent[]> {
  const loaded: RepoFileContent[] = [];

  for (const file of files) {
    const content = await fetchFileContent(octokit, fullName, file.path, ref);
    if (content === null) {
      continue;
    }
    loaded.push({ path: file.path, content });
  }

  logger.info("Loaded files for scan", {
    repository: fullName,
    requested: files.length,
    loaded: loaded.length,
  });

  return loaded;
}
