const CONTEXT_KEYWORDS = [
  "api_key",
  "apikey",
  "api-key",
  "secret",
  "password",
  "passwd",
  "token",
  "credential",
  "private_key",
  "access_key",
  "auth",
  "bearer",
  "client_secret",
  "service_role",
  "anthropic",
  "openai",
  "gemini",
  "firebase",
  "supabase",
  "stripe",
  "sendgrid",
  "twilio",
  "shopify",
  "cloudflare",
  "digitalocean",
  "gitlab",
  "huggingface",
  "resend",
];

export function hasSecretContext(line: string, nearbyLines: string[]): boolean {
  const haystack = [line, ...nearbyLines].join("\n").toLowerCase();
  return CONTEXT_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function applyContextBoost(
  confidence: number,
  inContext: boolean,
): number {
  if (!inContext) {
    return confidence;
  }
  return Math.min(0.99, confidence + 0.08);
}
