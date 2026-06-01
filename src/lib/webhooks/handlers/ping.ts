import { logger } from "@/lib/logger";

export async function handlePing(zen: string): Promise<void> {
  logger.info("Webhook ping received", { zen });
}
