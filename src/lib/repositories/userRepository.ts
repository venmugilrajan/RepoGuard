import { getDb, toBigInt } from "@/lib/repositories/db";

export type CreateUserInput = {
  githubUserId: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export type UpdateUserInput = Partial<
  Pick<CreateUserInput, "login" | "name" | "email" | "avatarUrl">
>;

export const userRepository = {
  async create(input: CreateUserInput) {
    return getDb().user.create({
      data: {
        githubUserId: toBigInt(input.githubUserId),
        login: input.login,
        name: input.name ?? null,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    });
  },

  async update(id: string, input: UpdateUserInput) {
    return getDb().user.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string) {
    return getDb().user.delete({ where: { id } });
  },

  async findById(id: string) {
    return getDb().user.findUnique({ where: { id } });
  },

  async findByGithubUserId(githubUserId: number) {
    return getDb().user.findUnique({
      where: { githubUserId: toBigInt(githubUserId) },
    });
  },

  async findMany(options?: { take?: number; skip?: number }) {
    return getDb().user.findMany({
      orderBy: { createdAt: "desc" },
      take: options?.take,
      skip: options?.skip,
    });
  },

  async upsertByGithubUserId(input: CreateUserInput) {
    return getDb().user.upsert({
      where: { githubUserId: toBigInt(input.githubUserId) },
      create: {
        githubUserId: toBigInt(input.githubUserId),
        login: input.login,
        name: input.name ?? null,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
      update: {
        login: input.login,
        name: input.name ?? null,
        email: input.email ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
    });
  },
};
