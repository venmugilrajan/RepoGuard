import type { Severity } from "@/lib/store/types";

export type DetectorCategory =
  | "ai_ml"
  | "cloud_provider"
  | "cicd_vcs"
  | "communication"
  | "database"
  | "payment"
  | "commerce"
  | "identity"
  | "generic";

export type DetectorMethod = "regex" | "entropy" | "context";

export type DetectorDefinition = {
  /** Stable identifier for tests, docs, and benchmarks */
  id: string;
  secretType: string;
  category: DetectorCategory;
  severity: Severity;
  /** Baseline confidence before contextual scoring (0–1) */
  baseConfidence: number;
  pattern: RegExp;
  method: DetectorMethod;
  description: string;
  /** Optional documentation link */
  referenceUrl?: string;
  /** Keywords that increase confidence when present on/near the match line */
  contextKeywords?: string[];
  /** Match is reported only when secret context exists nearby */
  contextRequired?: boolean;
  /** Additional validation beyond regex (entropy, structure, etc.) */
  validate?: (value: string) => boolean;
  /** Higher runs first when patterns could overlap */
  priority?: number;
};

export type DetectorCatalogMeta = {
  version: string;
  totalDetectors: number;
  categories: DetectorCategory[];
};

export type ScoredMatchContext = {
  filePath?: string;
  lineText: string;
  nearbyLines: string[];
};
