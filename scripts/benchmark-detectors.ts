/**
 * Detector benchmark — run: npm run benchmark:detectors
 */
import { performance } from "node:perf_hooks";
import { DETECTOR_CATALOG } from "../src/lib/scanner/detectors/catalog";
import { runRegexDetectors, runEntropyDetectors } from "../src/lib/scanner/detectors/run";
import { scanFileContent } from "../src/lib/scanner/engine";
import { POSITIVE_SAMPLES } from "../src/lib/scanner/detectors/__tests__/fixtures";

const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 100);

function buildSyntheticFile(lines: number): string {
  const samples = Object.values(POSITIVE_SAMPLES);
  const rows: string[] = [];
  for (let i = 0; i < lines; i++) {
    const sample = samples[i % samples.length];
    rows.push(`const config_${i} = "${sample}";`);
  }
  return rows.join("\n");
}

function bench(name: string, fn: () => void): { name: string; msPerOp: number } {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const elapsed = performance.now() - start;
  return { name, msPerOp: Number((elapsed / ITERATIONS).toFixed(3)) };
}

const small = buildSyntheticFile(50);
const medium = buildSyntheticFile(500);
const large = buildSyntheticFile(
  Number(process.env.BENCH_LARGE_LINES ?? 1000),
);

console.log("RepoGuardX detector benchmark\n");
console.log(`Catalog size: ${DETECTOR_CATALOG.length} detectors`);
console.log(`Iterations per scenario: ${ITERATIONS}\n`);

const results = [
  bench("regex (50 lines)", () => runRegexDetectors(small)),
  bench("regex (500 lines)", () => runRegexDetectors(medium)),
  bench("regex (2000 lines)", () => runRegexDetectors(large)),
  bench("entropy (500 lines)", () => runEntropyDetectors(medium)),
  bench("full scan (500 lines)", () =>
    scanFileContent({ path: "src/app.ts", content: medium }),
  ),
];

console.table(results);

const full = scanFileContent({ path: "src/app.ts", content: medium });
console.log(`\nFindings in 500-line synthetic file: ${full.findings.length}`);
