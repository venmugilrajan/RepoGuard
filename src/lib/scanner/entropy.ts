const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export function shannonEntropy(value: string): number {
  if (value.length === 0) {
    return 0;
  }
  const frequencies = new Map<string, number>();
  for (const char of value) {
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

export function looksLikeHighEntropyToken(value: string): boolean {
  if (value.length < 20 || value.length > 256) {
    return false;
  }
  if (!/^[A-Za-z0-9+/=_-]+$/.test(value)) {
    return false;
  }
  const entropy = shannonEntropy(value);
  if (entropy < 4.2) {
    return false;
  }
  const base64Ratio =
    [...value].filter((char) => BASE64_CHARS.includes(char)).length / value.length;
  return base64Ratio > 0.85;
}
