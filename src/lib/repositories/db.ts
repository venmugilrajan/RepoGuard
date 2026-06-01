import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export function getDb() {
  return getPrisma();
}

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return getDb().$transaction(fn);
}

export function toBigInt(value: number): bigint {
  return BigInt(value);
}

export function toNumber(value: bigint): number {
  return Number(value);
}
