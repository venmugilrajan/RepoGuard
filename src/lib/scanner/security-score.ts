import type { Severity } from "@/lib/store/types";

type ScoreInput = {
  counts: Record<Severity, number>;
  isPrivate: boolean;
  totalHistoricalFindings: number;
};

export function calculateSecurityScore(input: ScoreInput): number {
  let score = 100;
  score -= input.counts.Critical * 25;
  score -= input.counts.High * 15;
  score -= input.counts.Medium * 8;
  score -= input.counts.Low * 3;

  if (!input.isPrivate) {
    score -= 5;
  }

  score -= Math.min(input.totalHistoricalFindings * 2, 15);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function emptySeverityCounts(): Record<Severity, number> {
  return { Critical: 0, High: 0, Medium: 0, Low: 0 };
}
