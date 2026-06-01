/**
 * Verifies Prisma + Supabase CRUD for all domain models.
 * Run: npm run verify:db
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  findingRepository,
  installationRepository,
  repositoryRepository,
  scanRepository,
  userRepository,
  webhookRepository,
} from "../src/lib/repositories";
import { PrismaRepoGuardStore } from "../src/lib/store/prisma-store";

type CheckResult = { name: string; ok: boolean; detail?: string };

const results: CheckResult[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name} — ${detail}`);
}

async function runCheck(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const suffix = randomUUID().slice(0, 8);
  const githubInstallationId = 9_000_000_000 + Math.floor(Math.random() * 1_000_000);
  const githubRepoId = 8_000_000_000 + Math.floor(Math.random() * 1_000_000);
  const githubUserId = 7_000_000_000 + Math.floor(Math.random() * 1_000_000);

  let userId = "";
  let installationId = "";
  let repositoryId = "";
  let scanId = "";
  let findingId = "";
  let deliveryId = `verify-delivery-${suffix}`;

  console.log("\nRepoGuardX — database verification\n");

  await runCheck("Prisma raw query (SELECT 1)", async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  await runCheck("User — create", async () => {
    const user = await userRepository.create({
      githubUserId,
      login: `verify-user-${suffix}`,
      name: "Verify User",
    });
    userId = user.id;
  });

  await runCheck("User — findById", async () => {
    const user = await userRepository.findById(userId);
    if (!user || user.login !== `verify-user-${suffix}`) {
      throw new Error("User not found after create");
    }
  });

  await runCheck("User — update", async () => {
    await userRepository.update(userId, { name: "Verify User Updated" });
    const user = await userRepository.findById(userId);
    if (user?.name !== "Verify User Updated") {
      throw new Error("User update did not persist");
    }
  });

  await runCheck("User — findByGithubUserId", async () => {
    const user = await userRepository.findByGithubUserId(githubUserId);
    if (!user) {
      throw new Error("findByGithubUserId failed");
    }
  });

  await runCheck("Installation — create/upsert", async () => {
    const row = await installationRepository.upsert({
      githubInstallationId,
      accountLogin: `verify-org-${suffix}`,
      accountType: "Organization",
      repositorySelection: "all",
    });
    installationId = row.id;
  });

  await runCheck("Installation — findByGithubId", async () => {
    const row = await installationRepository.findByGithubId(githubInstallationId);
    if (!row) {
      throw new Error("Installation not found");
    }
  });

  await runCheck("Repository — upsert", async () => {
    const row = await repositoryRepository.upsert({
      githubRepoId,
      githubInstallationId,
      installationId,
      name: `verify-repo-${suffix}`,
      fullName: `verify-org-${suffix}/verify-repo-${suffix}`,
      private: true,
      defaultBranch: "main",
    });
    repositoryId = row.id;
  });

  await runCheck("Repository — findById", async () => {
    const row = await repositoryRepository.findById(repositoryId);
    if (!row) {
      throw new Error("Repository not found");
    }
  });

  scanId = randomUUID();

  await runCheck("Scan — create (queued)", async () => {
    await scanRepository.create({
      id: scanId,
      githubInstallationId,
      githubRepoId,
      repositoryId,
      repositoryFullName: `verify-org-${suffix}/verify-repo-${suffix}`,
      trigger: "manual",
      status: "queued",
    });
  });

  await runCheck("Scan — update (running → completed)", async () => {
    await scanRepository.update(scanId, {
      status: "running",
      startedAt: new Date(),
      filesScanned: 10,
    });
    await scanRepository.update(scanId, {
      status: "completed",
      completedAt: new Date(),
      secretsFound: 1,
      durationMs: 1200,
    });
    const scan = await scanRepository.findById(scanId);
    if (scan?.status !== "completed" || scan.filesScanned !== 10) {
      throw new Error("Scan updates did not persist");
    }
  });

  const fingerprint = `verify-fp-${suffix}`;

  await runCheck("Finding — upsertByFingerprint", async () => {
    const row = await findingRepository.upsertByFingerprint({
      repositoryId,
      scanId,
      filePath: "src/config.ts",
      line: 1,
      secretType: "Generic Secret",
      severity: "High",
      confidence: 0.9,
      fingerprint,
      maskedValue: "sk-****",
    });
    findingId = row.id;
  });

  await runCheck("Finding — existsByFingerprint", async () => {
    const exists = await findingRepository.existsByFingerprint(
      repositoryId,
      fingerprint,
    );
    if (!exists) {
      throw new Error("Fingerprint lookup failed");
    }
  });

  await runCheck("Finding — findById", async () => {
    const row = await findingRepository.findById(findingId);
    if (!row) {
      throw new Error("Finding not found");
    }
  });

  await runCheck("WebhookDelivery — upsert + exists", async () => {
    await webhookRepository.upsert({
      id: deliveryId,
      event: "ping",
      action: null,
      processed: false,
    });
    if (!(await webhookRepository.exists(deliveryId))) {
      throw new Error("Webhook delivery not persisted");
    }
    await webhookRepository.markProcessed(deliveryId);
  });

  await runCheck("RepoGuardStore — listFindings via Prisma store", async () => {
    const store = new PrismaRepoGuardStore();
    const findings = await store.listFindings({ repositoryId, limit: 5 });
    if (!findings.some((f) => f.id === findingId)) {
      throw new Error("Store layer could not list created finding");
    }
  });

  await runCheck("Cleanup — delete test rows", async () => {
    await findingRepository.delete(findingId);
    await scanRepository.delete(scanId);
    await repositoryRepository.deleteByGithubIds(githubInstallationId, githubRepoId);
    await installationRepository.deleteByGithubId(githubInstallationId);
    await userRepository.delete(userId);
    await prisma.webhookDelivery.delete({ where: { id: deliveryId } }).catch(() => {});
  });

  await prisma.$disconnect();
  await pool.end();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
