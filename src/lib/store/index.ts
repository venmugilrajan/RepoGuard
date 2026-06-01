import { warmUpDatabaseConnection } from "@/lib/db/prisma";
import { PrismaRepoGuardStore } from "@/lib/store/prisma-store";
import type { RepoGuardStore } from "@/lib/store/types";

let storeInstance: RepoGuardStore | null = null;

/** Application data access — backed by Prisma repositories (Supabase PostgreSQL). */
export function getStore(): RepoGuardStore {
  if (!storeInstance) {
    storeInstance = new PrismaRepoGuardStore();
  }
  return storeInstance;
}

/** Await before serving traffic to confirm database connectivity. */
export async function ensureStoreReady(): Promise<RepoGuardStore> {
  await warmUpDatabaseConnection();
  return getStore();
}
