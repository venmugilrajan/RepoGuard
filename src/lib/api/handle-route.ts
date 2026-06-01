import { jsonError } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function handleApiRoute<T>(
  handler: () => Promise<T>,
  options?: { errorMessage?: string },
): Promise<Response> {
  try {
    const data = await handler();
    return Response.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (options?.errorMessage ?? "Internal server error");

    logger.error("API route failed", { message });

    if (message.includes("Invalid environment")) {
      return jsonError("Server configuration error", 500);
    }

    return jsonError(message, 500);
  }
}
