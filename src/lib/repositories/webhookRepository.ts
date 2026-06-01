import { getDb, toBigInt } from "@/lib/repositories/db";

const MAX_DELIVERIES = 200;

export type WebhookDeliveryWriteInput = {
  id: string;
  event: string;
  action?: string | null;
  githubInstallationId?: number | null;
  repositoryFullName?: string | null;
  processed?: boolean;
  receivedAt?: Date;
};

export const webhookRepository = {
  async upsert(input: WebhookDeliveryWriteInput) {
    await getDb().webhookDelivery.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        event: input.event,
        action: input.action ?? null,
        githubInstallationId:
          input.githubInstallationId !== undefined &&
          input.githubInstallationId !== null
            ? toBigInt(input.githubInstallationId)
            : null,
        repositoryFullName: input.repositoryFullName ?? null,
        processed: input.processed ?? false,
        receivedAt: input.receivedAt ?? new Date(),
      },
      update: {
        processed: input.processed,
        receivedAt: input.receivedAt,
        action: input.action ?? undefined,
      },
    });

    await trimOverflow();
  },

  async findById(id: string) {
    return getDb().webhookDelivery.findUnique({ where: { id } });
  },

  async exists(id: string) {
    const row = await getDb().webhookDelivery.findUnique({
      where: { id },
      select: { id: true },
    });
    return Boolean(row);
  },

  async findMany(limit = 50) {
    return getDb().webhookDelivery.findMany({
      orderBy: { receivedAt: "desc" },
      take: limit,
    });
  },

  async markProcessed(id: string) {
    return getDb().webhookDelivery.update({
      where: { id },
      data: { processed: true },
    });
  },
};

async function trimOverflow(): Promise<void> {
  const total = await getDb().webhookDelivery.count();
  if (total <= MAX_DELIVERIES) {
    return;
  }

  const overflow = await getDb().webhookDelivery.findMany({
    orderBy: { receivedAt: "desc" },
    skip: MAX_DELIVERIES,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await getDb().webhookDelivery.deleteMany({
      where: { id: { in: overflow.map((row) => row.id) } },
    });
  }
}
