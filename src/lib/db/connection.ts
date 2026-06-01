import { logger } from "@/lib/logger";

let lastVerifiedAt: number | null = null;
let lastVerificationError: string | null = null;

export async function verifyDatabaseConnection(): Promise<void> {
  const { getPrisma } = await import("@/lib/db/prisma");
  const prisma = getPrisma();
  await prisma.$queryRaw`SELECT 1`;
  lastVerifiedAt = Date.now();
  lastVerificationError = null;
}

export function getDatabaseConnectionStatus(): {
  verified: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
} {
  return {
    verified: lastVerifiedAt !== null && lastVerificationError === null,
    lastVerifiedAt: lastVerifiedAt
      ? new Date(lastVerifiedAt).toISOString()
      : null,
    lastError: lastVerificationError,
  };
}

export async function verifyDatabaseConnectionOnStartup(): Promise<void> {
  const { warmUpDatabaseConnection } = await import("@/lib/db/prisma");
  try {
    await warmUpDatabaseConnection();
    lastVerifiedAt = Date.now();
    lastVerificationError = null;
    logger.info("Database connection verified at startup");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";
    lastVerificationError = message;
    logger.error("Database connection failed at startup", { message });
    throw error;
  }
}
