export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  const visible = trimmed.slice(0, 4);
  const hiddenLength = Math.min(Math.max(trimmed.length - 4, 8), 24);
  return `${visible}${"*".repeat(hiddenLength)}`;
}
