import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
  var __pgPool: Pool | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Prisma");
  }

  const pool =
    globalThis.__pgPool ?? new Pool({ connectionString, max: 10 });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

let connectionVerified = false;

async function ensureConnectedOnce(): Promise<void> {
  if (connectionVerified) {
    return;
  }
  const client = getPrisma();
  await client.$queryRaw`SELECT 1`;
  connectionVerified = true;
}

let connectPromise: Promise<void> | null = null;

/** Verifies Supabase connectivity on first use (app warm-up). */
export function warmUpDatabaseConnection(): Promise<void> {
  if (!connectPromise) {
    connectPromise = ensureConnectedOnce().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }
  return connectPromise;
}

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();
  }
  return globalThis.__prisma;
}
