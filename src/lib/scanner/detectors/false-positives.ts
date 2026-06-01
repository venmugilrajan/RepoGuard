import type { DetectorDefinition } from "@/lib/scanner/detectors/types";

const PLACEHOLDER_EXACT =
  /^(changeme|example|placeholder|dummy|test|fake|null|undefined|your[_-]?|xxx+|<[^>]+>|\$\{[^}]+\}|redacted|insert[_-]?here|todo|fixme)$/i;

const EXAMPLE_LINE =
  /\b(example|sample|dummy|fake|placeholder|xxx+|your[_\s-]?key[_\s-]?here|not[_\s-]?a[_\s-]?real)\b/i;

const DOC_PATH =
  /(^|\/)(docs?|documentation|examples?|samples?|fixtures?|testdata|__tests__|\.github\/workflows)(\/|$)/i;

const LOCKFILE_PATH = /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Cargo\.lock)$/i;

const COMMENT_LINE = /^\s*(\/\/|#|\/\*|\*|<!--)/;

const NPM_HASH = /^[a-f0-9]{40,128}$/i;

const NPM_INTEGRITY_BASE64 = /^[A-Za-z0-9+/]{40,128}={0,2}$/;

const ALL_SAME_CHAR = /^(.)\1{12,}$/;

const JWT_EXAMPLE_PAYLOAD =
  /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*/;

export function isLikelyPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 8) {
    return true;
  }
  if (PLACEHOLDER_EXACT.test(trimmed)) {
    return true;
  }
  if (/^(sk|pk)[-_]?(test|live)[-_]?(key)?$/i.test(trimmed)) {
    return true;
  }
  if (ALL_SAME_CHAR.test(trimmed)) {
    return true;
  }
  return false;
}

export function isExampleContext(lineText: string, nearbyLines: string[]): boolean {
  const block = [lineText, ...nearbyLines].join("\n");
  if (/\b(AKIA|ASIA)[0-9A-Z]{16}\b/.test(block)) {
    return false;
  }
  return EXAMPLE_LINE.test(block);
}

export function isCommentLine(lineText: string): boolean {
  return COMMENT_LINE.test(lineText);
}

export function isDocumentationPath(filePath?: string): boolean {
  if (!filePath) {
    return false;
  }
  const normalized = filePath.replace(/\\/g, "/");
  return DOC_PATH.test(normalized) || LOCKFILE_PATH.test(normalized);
}

export function isLikelyNpmIntegrityHash(value: string, lineText: string): boolean {
  const normalized = value.replace(/^sha512-/i, "").replace(/=+$/, "");
  const looksLikeHash =
    NPM_HASH.test(normalized) || NPM_INTEGRITY_BASE64.test(normalized);
  return (
    looksLikeHash &&
    /integrity|sha512|resolved/i.test(lineText)
  );
}

export function isJwtExample(value: string, lineText: string): boolean {
  if (!JWT_EXAMPLE_PAYLOAD.test(value)) {
    return false;
  }
  return /jwt\.io|example\.com|sample|your-256-bit-secret/i.test(lineText);
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export type FalsePositiveInput = {
  value: string;
  definition: DetectorDefinition;
  filePath?: string;
  lineText: string;
  nearbyLines: string[];
};

export function isLikelyFalsePositive(input: FalsePositiveInput): boolean {
  const { value, definition, filePath, lineText, nearbyLines } = input;

  if (isLikelyPlaceholder(value)) {
    return true;
  }

  if (isLikelyNpmIntegrityHash(value, lineText)) {
    return true;
  }

  if (definition.id === "jwt_token" && isJwtExample(value, lineText)) {
    return true;
  }

  if (
    definition.id === "cloudflare_api_token" &&
    isUuidLike(value)
  ) {
    return true;
  }

  if (isDocumentationPath(filePath) && isExampleContext(lineText, nearbyLines)) {
    return true;
  }

  if (isCommentLine(lineText) && isExampleContext(lineText, nearbyLines)) {
    return true;
  }

  if (
    definition.category === "identity" &&
    definition.id === "jwt_token" &&
    value.length < 80 &&
    isExampleContext(lineText, nearbyLines)
  ) {
    return true;
  }

  return false;
}
