import type { Severity } from "@/generated/prisma/client";
import { getDb, toBigInt } from "@/lib/repositories/db";

export type FindingCreateInput = {
  repositoryId: string;
  scanId?: string | null;
  filePath: string;
  line: number;
  secretType: string;
  severity: Severity;
  confidence: number;
  fingerprint: string;
  maskedValue: string;
};

export const findingRepository = {
  async create(input: FindingCreateInput) {
    return getDb().finding.create({
      data: input,
      include: { repository: { select: { fullName: true } } },
    });
  },

  async upsertByFingerprint(input: FindingCreateInput) {
    return getDb().finding.upsert({
      where: {
        repositoryId_fingerprint: {
          repositoryId: input.repositoryId,
          fingerprint: input.fingerprint,
        },
      },
      create: input,
      update: {
        scanId: input.scanId,
        filePath: input.filePath,
        line: input.line,
        secretType: input.secretType,
        severity: input.severity,
        confidence: input.confidence,
        maskedValue: input.maskedValue,
      },
      include: { repository: { select: { fullName: true } } },
    });
  },

  async delete(id: string) {
    return getDb().finding.delete({ where: { id } });
  },

  async findById(id: string) {
    return getDb().finding.findUnique({
      where: { id },
      include: { repository: { select: { fullName: true } } },
    });
  },

  async existsByFingerprint(repositoryId: string, fingerprint: string) {
    const row = await getDb().finding.findFirst({
      where: { repositoryId, fingerprint },
      select: { id: true },
    });
    return Boolean(row);
  },

  async findMany(options?: {
    repositoryId?: string;
    githubInstallationId?: number;
    severity?: Severity;
    limit?: number;
  }) {
    return getDb().finding.findMany({
      where: {
        ...(options?.repositoryId
          ? { repositoryId: options.repositoryId }
          : {}),
        ...(options?.severity ? { severity: options.severity } : {}),
        ...(options?.githubInstallationId !== undefined
          ? {
              repository: {
                githubInstallationId: toBigInt(options.githubInstallationId),
              },
            }
          : {}),
      },
      include: { repository: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
    });
  },

  async count(options?: {
    repositoryId?: string;
    githubInstallationId?: number;
    severity?: Severity;
  }) {
    return getDb().finding.count({
      where: {
        ...(options?.repositoryId
          ? { repositoryId: options.repositoryId }
          : {}),
        ...(options?.severity ? { severity: options.severity } : {}),
        ...(options?.githubInstallationId !== undefined
          ? {
              repository: {
                githubInstallationId: toBigInt(options.githubInstallationId),
              },
            }
          : {}),
      },
    });
  },
};
