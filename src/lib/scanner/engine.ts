import { applyContextBoost, hasSecretContext } from "@/lib/scanner/context";
import { runEntropyDetectors, runRegexDetectors } from "@/lib/scanner/detectors/run";
import { fingerprintSecret } from "@/lib/scanner/fingerprint";
import { maskSecret } from "@/lib/scanner/mask";
import type {
  RawSecretMatch,
  ScanFileInput,
  ScanFileResult,
  ScannedSecret,
} from "@/lib/scanner/types";
import type { Severity } from "@/lib/store/types";

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const MIN_CONFIDENCE_THRESHOLD = 0.55;

function finalizeMatch(match: RawSecretMatch, content: string): ScannedSecret | null {
  if (match.confidence < MIN_CONFIDENCE_THRESHOLD) {
    return null;
  }

  const lines = content.split("\n");
  const lineIndex = match.line - 1;
  const nearby = [
    lines[lineIndex - 2] ?? "",
    lines[lineIndex - 1] ?? "",
    lines[lineIndex + 1] ?? "",
  ];
  const inContext = hasSecretContext(lines[lineIndex] ?? "", nearby);
  const confidence = applyContextBoost(match.confidence, inContext);

  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    return null;
  }

  return {
    detectorId: match.detectorId,
    category: match.category,
    secretType: match.secretType,
    severity: match.severity,
    confidence: Math.min(0.99, confidence),
    line: match.line,
    column: match.column,
    detector:
      inContext && match.detector === "entropy" ? "context" : match.detector,
    fingerprint: fingerprintSecret(match.secretType, match.value),
    maskedValue: maskSecret(match.value),
  };
}

function dedupeMatches(matches: RawSecretMatch[]): RawSecretMatch[] {
  const best = new Map<string, RawSecretMatch>();

  for (const match of matches) {
    const key = `${match.line}:${match.column}:${fingerprintSecret(match.secretType, match.value)}`;
    const existing = best.get(key);
    if (
      !existing ||
      match.confidence > existing.confidence ||
      (match.confidence === existing.confidence &&
        SEVERITY_RANK[match.severity] > SEVERITY_RANK[existing.severity])
    ) {
      best.set(key, match);
    }
  }

  return [...best.values()];
}

export function scanFileContent(input: ScanFileInput): ScanFileResult {
  const regexMatches = runRegexDetectors(input.content, {
    filePath: input.path,
  });
  const entropyMatches = runEntropyDetectors(input.content, {
    filePath: input.path,
  });
  const combined = dedupeMatches([...regexMatches, ...entropyMatches]);

  const findings = combined
    .map((match) => finalizeMatch(match, input.content))
    .filter((finding): finding is ScannedSecret => finding !== null);

  return {
    path: input.path,
    findings,
  };
}

export function scanFiles(files: ScanFileInput[]): ScanFileResult[] {
  return files.map(scanFileContent);
}
