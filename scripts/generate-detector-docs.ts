/**
 * Regenerates docs/DETECTORS.md from the detector catalog.
 * Run: npm run docs:detectors
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DETECTOR_CATALOG,
  getCatalogMeta,
} from "../src/lib/scanner/detectors/catalog";
import type { DetectorCategory } from "../src/lib/scanner/detectors/types";

const CATEGORY_LABELS: Record<DetectorCategory, string> = {
  ai_ml: "AI / ML",
  cloud_provider: "Cloud providers",
  cicd_vcs: "CI/CD & version control",
  communication: "Communication",
  database: "Databases",
  payment: "Payments",
  commerce: "Commerce",
  identity: "Identity & crypto",
  generic: "Generic",
};

const meta = getCatalogMeta();
const byCategory = new Map<DetectorCategory, typeof DETECTOR_CATALOG>();

for (const detector of DETECTOR_CATALOG) {
  const list = byCategory.get(detector.category) ?? [];
  list.push(detector);
  byCategory.set(detector.category, list);
}

const lines: string[] = [
  "# RepoGuardX Detector Reference",
  "",
  `> Auto-generated from detector catalog v${meta.version} (${meta.totalDetectors} detectors).`,
  `> Regenerate: \`npm run docs:detectors\``,
  "",
  "## Overview",
  "",
  "RepoGuardX uses a layered detection pipeline:",
  "",
  "1. **Regex detectors** — provider-specific patterns with metadata and priority ordering",
  "2. **Entropy detectors** — quoted high-entropy strings",
  "3. **Context assignment** — `secret=`, `api_key=`, and similar variable assignments",
  "4. **Confidence scoring** — base score + context, validation, category, and path boosts",
  "5. **False-positive filters** — placeholders, docs/fixtures, npm integrity hashes, examples",
  "",
  "Findings below **0.55** confidence are dropped. Values are never stored in full — only masked previews and fingerprints.",
  "",
  "## Categories",
  "",
  ...meta.categories.map(
    (c) => `- **${CATEGORY_LABELS[c]}** (\`${c}\`)`,
  ),
  "",
  "## Confidence model",
  "",
  "| Factor | Effect |",
  "| --- | --- |",
  "| `baseConfidence` | Per-detector baseline (0–1) |",
  "| Context keywords | +0.12 when nearby line matches |",
  "| `validate()` passed | +0.08 |",
  "| Category boost | +0.02–0.04 |",
  "| High-specificity prefix | +0.05 |",
  "| Critical severity | +0.02 |",
  "| `.env` file path | +0.06 |",
  "| Comment-only line | −0.08 |",
  "| `contextRequired` | No match without context |",
  "",
  "## Detectors",
  "",
];

for (const category of meta.categories) {
  const detectors = byCategory.get(category) ?? [];
  lines.push(`### ${CATEGORY_LABELS[category]}`, "");
  lines.push(
    "| ID | Secret type | Severity | Base confidence | Context required |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const d of detectors) {
    lines.push(
      `| \`${d.id}\` | ${d.secretType} | ${d.severity} | ${d.baseConfidence} | ${d.contextRequired ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  for (const d of detectors) {
    lines.push(`#### \`${d.id}\``);
    lines.push("");
    lines.push(d.description);
    lines.push("");
    if (d.referenceUrl) {
      lines.push(`Reference: ${d.referenceUrl}`);
      lines.push("");
    }
    if (d.contextKeywords?.length) {
      lines.push(`Context keywords: ${d.contextKeywords.map((k) => `\`${k}\``).join(", ")}`);
      lines.push("");
    }
  }
}

lines.push("## Testing & benchmarks", "", "```bash", "npm run test:detectors", "npm run benchmark:detectors", "```", "");

const outDir = path.join(process.cwd(), "docs");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "DETECTORS.md");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
