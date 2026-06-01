import type {
  AccountType,
  RepositorySelection,
} from "@/generated/prisma/client";
import { getDb, toBigInt } from "@/lib/repositories/db";

export type InstallationWriteInput = {
  githubInstallationId: number;
  accountLogin: string;
  accountType: AccountType;
  repositorySelection: RepositorySelection;
  suspendedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export const installationRepository = {
  async create(input: InstallationWriteInput) {
    return getDb().installation.create({
      data: {
        githubInstallationId: toBigInt(input.githubInstallationId),
        accountLogin: input.accountLogin,
        accountType: input.accountType,
        repositorySelection: input.repositorySelection,
        suspendedAt: input.suspendedAt ?? null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    });
  },

  async upsert(input: InstallationWriteInput) {
    return getDb().installation.upsert({
      where: { githubInstallationId: toBigInt(input.githubInstallationId) },
      create: {
        githubInstallationId: toBigInt(input.githubInstallationId),
        accountLogin: input.accountLogin,
        accountType: input.accountType,
        repositorySelection: input.repositorySelection,
        suspendedAt: input.suspendedAt ?? null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      },
      update: {
        accountLogin: input.accountLogin,
        accountType: input.accountType,
        repositorySelection: input.repositorySelection,
        suspendedAt: input.suspendedAt ?? null,
        updatedAt: input.updatedAt ?? new Date(),
      },
    });
  },

  async deleteByGithubId(githubInstallationId: number) {
    return getDb().installation.deleteMany({
      where: { githubInstallationId: toBigInt(githubInstallationId) },
    });
  },

  async findByGithubId(githubInstallationId: number) {
    return getDb().installation.findUnique({
      where: { githubInstallationId: toBigInt(githubInstallationId) },
    });
  },

  async findById(id: string) {
    return getDb().installation.findUnique({ where: { id } });
  },

  async findMany(options?: { take?: number }) {
    return getDb().installation.findMany({
      orderBy: { createdAt: "desc" },
      take: options?.take,
    });
  },

  async count() {
    return getDb().installation.count();
  },

  async markSuspended(githubInstallationId: number, suspendedAt: Date) {
    return getDb().installation.update({
      where: { githubInstallationId: toBigInt(githubInstallationId) },
      data: { suspendedAt, updatedAt: new Date() },
    });
  },
};
