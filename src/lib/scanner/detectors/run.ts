import { looksLikeHighEntropyToken } from "@/lib/scanner/entropy";
import { isLikelyPlaceholder } from "@/lib/scanner/filters";
import { SORTED_DETECTOR_CATALOG } from "@/lib/scanner/detectors/catalog";
import { scoreConfidence } from "@/lib/scanner/detectors/confidence";
import { isLikelyFalsePositive } from "@/lib/scanner/detectors/false-positives";
import type { DetectorDefinition } from "@/lib/scanner/detectors/types";
import type { RawSecretMatch } from "@/lib/scanner/types";

const ASSIGNMENT_PATTERN =
  /(?:^|[\s{[,])([A-Za-z0-9_.-]*(?:key|secret|token|password|passwd|credential)[A-Za-z0-9_.-]*)\s*[:=]\s*["']?([^\s"'`,;]+)["']?/gi;

export type RunDetectorOptions = {
  filePath?: string;
};

function lineColumn(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function lineAt(content: string, lineNumber: number): string {
  return content.split("\n")[lineNumber - 1] ?? "";
}

function nearbyLines(content: string, lineNumber: number): string[] {
  const lines = content.split("\n");
  const index = lineNumber - 1;
  return [lines[index - 2] ?? "", lines[index - 1] ?? "", lines[index + 1] ?? ""];
}

function contentHasRequiredContext(
  definition: DetectorDefinition,
  content: string,
): boolean {
  if (!definition.contextRequired) {
    return true;
  }
  const keywords = definition.contextKeywords ?? [];
  if (keywords.length === 0) {
    return true;
  }
  const haystack = content.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function extractMatchValue(result: RegExpExecArray): string {
  const full = result[0];
  if (result.length > 1 && result[1] && typeof result[1] === "string") {
    const captured = result[1];
    // Use full match when the capture is only a prefix (e.g. AKIA from AKIA…).
    if (captured.length < full.length && full.startsWith(captured)) {
      return full;
    }
    return captured;
  }
  return full;
}

function addMatch(
  matches: RawSecretMatch[],
  seen: Set<string>,
  match: RawSecretMatch,
): void {
  const key = `${match.line}:${match.column}:${match.detectorId}:${match.value.slice(0, 12)}`;
  if (seen.has(key) || match.confidence <= 0) {
    return;
  }
  seen.add(key);
  matches.push(match);
}

function runDefinition(
  content: string,
  definition: DetectorDefinition,
  options: RunDetectorOptions,
  matches: RawSecretMatch[],
  seen: Set<string>,
): void {
  if (!contentHasRequiredContext(definition, content)) {
    return;
  }

  const pattern = new RegExp(definition.pattern.source, definition.pattern.flags);
  let result: RegExpExecArray | null;

  while ((result = pattern.exec(content)) !== null) {
    const value = extractMatchValue(result).trim();
    if (!value || isLikelyPlaceholder(value)) {
      continue;
    }

    const validated = definition.validate ? definition.validate(value) : true;
    if (definition.validate && !validated) {
      continue;
    }

    const { line, column } = lineColumn(content, result.index);
    const lineText = lineAt(content, line);
    const nearby = nearbyLines(content, line);

    if (
      isLikelyFalsePositive({
        value,
        definition,
        filePath: options.filePath,
        lineText,
        nearbyLines: nearby,
      })
    ) {
      continue;
    }

    const confidence = scoreConfidence(definition, value, {
      filePath: options.filePath,
      lineText,
      nearbyLines: nearby,
    }, validated);

    if (confidence <= 0) {
      continue;
    }

    addMatch(matches, seen, {
      detectorId: definition.id,
      category: definition.category,
      secretType: definition.secretType,
      severity: definition.severity,
      confidence,
      value,
      line,
      column,
      detector: definition.method,
    });
  }
}

export function runRegexDetectors(
  content: string,
  options: RunDetectorOptions = {},
): RawSecretMatch[] {
  const matches: RawSecretMatch[] = [];
  const seen = new Set<string>();

  for (const definition of SORTED_DETECTOR_CATALOG) {
    runDefinition(content, definition, options, matches, seen);
  }

  let assignMatch: RegExpExecArray | null;
  ASSIGNMENT_PATTERN.lastIndex = 0;
  while ((assignMatch = ASSIGNMENT_PATTERN.exec(content)) !== null) {
    const value = assignMatch[2];
    if (!value || isLikelyPlaceholder(value)) {
      continue;
    }
    if (!looksLikeHighEntropyToken(value)) {
      continue;
    }

    const { line, column } = lineColumn(content, assignMatch.index);
    const lineText = lineAt(content, line);
    const nearby = nearbyLines(content, line);

    const genericDef: DetectorDefinition = {
      id: "generic_assignment",
      secretType: "Generic Secret",
      category: "generic",
      severity: "Medium",
      baseConfidence: 0.72,
      pattern: ASSIGNMENT_PATTERN,
      method: "context",
      description: "High-entropy value assigned to a secret-like variable name",
    };

    if (
      isLikelyFalsePositive({
        value,
        definition: genericDef,
        filePath: options.filePath,
        lineText,
        nearbyLines: nearby,
      })
    ) {
      continue;
    }

    const confidence = scoreConfidence(genericDef, value, {
      filePath: options.filePath,
      lineText,
      nearbyLines: nearby,
    }, true);

    addMatch(matches, seen, {
      detectorId: genericDef.id,
      category: genericDef.category,
      secretType: genericDef.secretType,
      severity: genericDef.severity,
      confidence,
      value,
      line,
      column,
      detector: "context",
    });
  }

  return matches;
}

export function runEntropyDetectors(
  content: string,
  options: RunDetectorOptions = {},
): RawSecretMatch[] {
  const matches: RawSecretMatch[] = [];
  const seen = new Set<string>();
  const tokenPattern = /["']([A-Za-z0-9+/=_-]{20,})["']/g;

  let result: RegExpExecArray | null;
  while ((result = tokenPattern.exec(content)) !== null) {
    const value = result[1];
    if (!looksLikeHighEntropyToken(value) || isLikelyPlaceholder(value)) {
      continue;
    }

    const { line, column } = lineColumn(content, result.index + 1);
    const lineText = lineAt(content, line);
    const nearby = nearbyLines(content, line);

    const entropyDef: DetectorDefinition = {
      id: "high_entropy_string",
      secretType: "High Entropy Secret",
      category: "generic",
      severity: "Medium",
      baseConfidence: 0.68,
      pattern: tokenPattern,
      method: "entropy",
      description: "Quoted high-entropy string",
    };

    if (
      isLikelyFalsePositive({
        value,
        definition: entropyDef,
        filePath: options.filePath,
        lineText,
        nearbyLines: nearby,
      })
    ) {
      continue;
    }

    const confidence = scoreConfidence(entropyDef, value, {
      filePath: options.filePath,
      lineText,
      nearbyLines: nearby,
    }, true);

    addMatch(matches, seen, {
      detectorId: entropyDef.id,
      category: entropyDef.category,
      secretType: entropyDef.secretType,
      severity: entropyDef.severity,
      confidence,
      value,
      line,
      column,
      detector: "entropy",
    });
  }

  return matches;
}
