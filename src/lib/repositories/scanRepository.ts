import type { ScanStatus, ScanTrigger } from "@/generated/prisma/client";
import { getDb, toBigInt } from "@/lib/repositories/db";

export type ScanCreateInput = {
  id: string;
  githubInstallationId: number;
  githubRepoId: number;
  repositoryId?: string | null;
  repositoryFullName: string;
  trigger: ScanTrigger;
  status?: ScanStatus;
  ref?: string | null;
  commitSha?: string | null;
  pullRequestNumber?: number | null;
  deliveryId?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ScanUpdateInput = {
  status?: ScanStatus;
  updatedAt?: Date;
  errorMessage?: string | null;
  filesScanned?: number;
  secretsFound?: number;
  durationMs?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  repositoryId?: string | null;
};

export const scanRepository = {
  async create(input: ScanCreateInput) {
    return getDb().scan.create({
      data: {
        id: input.id,
        githubInstallationId: toBigInt(input.githubInstallationId),
        githubRepoId: toBigInt(input.githubRepoId),
        repositoryId: input.repositoryId ?? null,
        repositoryFullName: input.repositoryFullName,
        trigger: input.trigger,
        status: input.status ?? "queued",
        ref: input.ref ?? null,
        commitSha: input.commitSha ?? null,
        pullRequestNumber: input.pullRequestNumber ?? null,
        deliveryId: input.deliveryId ?? null,
        errorMessage: input.errorMessage ?? null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      },
    });
  },

  async update(id: string, input: ScanUpdateInput) {
    return getDb().scan.update({
      where: { id },
      data: {
        ...input,
        updatedAt: input.updatedAt ?? new Date(),
      },
    });
  },

  async delete(id: string) {
    return getDb().scan.delete({ where: { id } });
  },

  async findById(id: string) {
    return getDb().scan.findUnique({ where: { id } });
  },

  async findMany(options?: {
    githubInstallationId?: number;
    status?: ScanStatus;
    repositoryId?: string;
    limit?: number;
  }) {
    return getDb().scan.findMany({
      where: {
        ...(options?.githubInstallationId !== undefined
          ? {
              githubInstallationId: toBigInt(options.githubInstallationId),
            }
          : {}),
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.repositoryId
          ? { repositoryId: options.repositoryId }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
    });
  },

  async count(options?: { githubInstallationId?: number }) {
    return getDb().scan.count({
      where:
        options?.githubInstallationId !== undefined
          ? {
              githubInstallationId: toBigInt(options.githubInstallationId),
            }
          : undefined,
    });
  },
};
