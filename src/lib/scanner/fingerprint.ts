import { createHash } from "crypto";

export function fingerprintSecret(secretType: string, value: string): string {
  return createHash("sha256")
    .update(`${secretType}:${value.trim()}`)
    .digest("hex");
}
