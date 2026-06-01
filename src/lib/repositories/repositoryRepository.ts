import { getDb, toBigInt } from "@/lib/repositories/db";

export type RepositoryWriteInput = {
  githubRepoId: number;
  githubInstallationId: number;
  installationId: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch?: string | null;
  securityScore?: number;
  lastScannedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RepositoryMetricsPatch = {
  securityScore: number;
  lastScannedAt: Date;
};

export const repositoryRepository = {
  async create(input: RepositoryWriteInput) {
    return getDb().repository.create({
      data: {
        githubRepoId: toBigInt(input.githubRepoId),
        githubInstallationId: toBigInt(input.githubInstallationId),
        installationId: input.installationId,
        name: input.name,
        fullName: input.fullName,
        private: input.private,
        defaultBranch: input.defaultBranch ?? null,
        securityScore: input.securityScore ?? 100,
        lastScannedAt: input.lastScannedAt ?? null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    });
  },

  async upsert(input: RepositoryWriteInput) {
    return getDb().repository.upsert({
      where: {
        githubInstallationId_githubRepoId: {
          githubInstallationId: toBigInt(input.githubInstallationId),
          githubRepoId: toBigInt(input.githubRepoId),
        },
      },
      create: {
        githubRepoId: toBigInt(input.githubRepoId),
        githubInstallationId: toBigInt(input.githubInstallationId),
        installationId: input.installationId,
        name: input.name,
        fullName: input.fullName,
        private: input.private,
        defaultBranch: input.defaultBranch ?? null,
        securityScore: input.securityScore ?? 100,
        lastScannedAt: input.lastScannedAt ?? null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date(),
      },
      update: {
        name: input.name,
        fullName: input.fullName,
        private: input.private,
        defaultBranch: input.defaultBranch ?? null,
        securityScore: input.securityScore,
        lastScannedAt: input.lastScannedAt,
        updatedAt: input.updatedAt ?? new Date(),
      },
    });
  },

  async deleteByGithubIds(
    githubInstallationId: number,
    githubRepoId: number,
  ) {
    return getDb().repository.deleteMany({
      where: {
        githubInstallationId: toBigInt(githubInstallationId),
        githubRepoId: toBigInt(githubRepoId),
      },
    });
  },

  async findById(id: string) {
    return getDb().repository.findUnique({ where: { id } });
  },

  async findByGithubIds(
    githubInstallationId: number,
    githubRepoId: number,
  ) {
    return getDb().repository.findUnique({
      where: {
        githubInstallationId_githubRepoId: {
          githubInstallationId: toBigInt(githubInstallationId),
          githubRepoId: toBigInt(githubRepoId),
        },
      },
    });
  },

  async findManyByInstallation(githubInstallationId: number) {
    return getDb().repository.findMany({
      where: { githubInstallationId: toBigInt(githubInstallationId) },
      orderBy: { fullName: "asc" },
    });
  },

  async updateMetrics(
    githubInstallationId: number,
    githubRepoId: number,
    patch: RepositoryMetricsPatch,
  ) {
    return getDb().repository.update({
      where: {
        githubInstallationId_githubRepoId: {
          githubInstallationId: toBigInt(githubInstallationId),
          githubRepoId: toBigInt(githubRepoId),
        },
      },
      data: {
        securityScore: patch.securityScore,
        lastScannedAt: patch.lastScannedAt,
        updatedAt: new Date(),
      },
    });
  },
};
