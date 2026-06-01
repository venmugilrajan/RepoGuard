import { hasSecretContext } from "@/lib/scanner/context";
import type { DetectorDefinition } from "@/lib/scanner/detectors/types";
import type { ScoredMatchContext } from "@/lib/scanner/detectors/types";

const CATEGORY_BOOST: Partial<Record<DetectorDefinition["category"], number>> = {
  ai_ml: 0.03,
  cloud_provider: 0.03,
  payment: 0.04,
  identity: 0.02,
};

const HIGH_SPECIFICITY_PREFIXES = [
  "sk-ant-",
  "sk_live_",
  "github_pat_",
  "ghp_",
  "glpat-",
  "hf_",
  "SG.",
  "shpat_",
  "sb_secret_",
  "dop_v1_",
  "doo_v1_",
  "re_",
];

export function hasDefinitionContext(
  definition: DetectorDefinition,
  lineText: string,
  nearbyLines: string[],
): boolean {
  const keywords = [
  ...(definition.contextKeywords ?? []),
  ];
  if (keywords.length === 0) {
    return hasSecretContext(lineText, nearbyLines);
  }
  const haystack = [lineText, ...nearbyLines].join("\n").toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

export function scoreConfidence(
  definition: DetectorDefinition,
  value: string,
  context: ScoredMatchContext,
  validated: boolean,
): number {
  let score = definition.baseConfidence;

  const inContext = hasDefinitionContext(
    definition,
    context.lineText,
    context.nearbyLines,
  );

  if (definition.contextRequired && !inContext) {
    return 0;
  }

  if (inContext) {
    score += 0.12;
  }

  if (validated && definition.validate) {
    score += 0.08;
  }

  const categoryBoost = CATEGORY_BOOST[definition.category];
  if (categoryBoost) {
    score += categoryBoost;
  }

  if (HIGH_SPECIFICITY_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    score += 0.05;
  }

  if (definition.severity === "Critical") {
    score += 0.02;
  }

  if (context.filePath && /\.env(\.|$|\/)/i.test(context.filePath)) {
    score += 0.06;
  }

  if (isCommentOnlyLine(context.lineText) && definition.method !== "context") {
    score -= 0.08;
  }

  return Math.min(0.99, Math.max(0, Number(score.toFixed(3))));
}

function isCommentOnlyLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--")
  );
}
