import type { DetectorCategory } from "@/lib/scanner/detectors/types";
import type { Severity } from "@/lib/store/types";

export type RawSecretMatch = {
  detectorId: string;
  category: DetectorCategory;
  secretType: string;
  severity: Severity;
  confidence: number;
  value: string;
  line: number;
  column: number;
  detector: "regex" | "entropy" | "context";
};

export type ScannedSecret = Omit<RawSecretMatch, "value"> & {
  fingerprint: string;
  maskedValue: string;
};

export type ScanFileInput = {
  path: string;
  content: string;
};

export type ScanFileResult = {
  path: string;
  findings: ScannedSecret[];
};
