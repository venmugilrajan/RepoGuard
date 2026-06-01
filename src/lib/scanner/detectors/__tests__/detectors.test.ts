import { describe, expect, it } from "vitest";
import { DETECTOR_CATALOG, getDetectorById } from "@/lib/scanner/detectors/catalog";
import { runRegexDetectors } from "@/lib/scanner/detectors/run";
import { scanFileContent } from "@/lib/scanner/engine";
import {
  NEGATIVE_SAMPLES,
  POSITIVE_SAMPLES,
} from "@/lib/scanner/detectors/__tests__/fixtures";
import {
  isLikelyFalsePositive,
  isLikelyPlaceholder,
} from "@/lib/scanner/detectors/false-positives";

describe("detector catalog", () => {
  it("includes all requested provider families", () => {
    const ids = new Set(DETECTOR_CATALOG.map((d) => d.id));
    const required = [
      "anthropic_api_key",
      "google_gemini_api_key",
      "gcp_service_account",
      "azure_storage_account_key",
      "azure_client_secret",
      "jwt_token",
      "sendgrid_api_key",
      "twilio_api_key",
      "shopify_token",
      "supabase_service_role_key",
      "firebase_web_api_key",
      "cloudflare_api_token",
      "digitalocean_token",
      "gitlab_token",
      "huggingface_token",
      "resend_api_key",
    ];
    for (const id of required) {
      expect(ids.has(id), `missing detector: ${id}`).toBe(true);
    }
  });

  it("assigns metadata to every detector", () => {
    for (const detector of DETECTOR_CATALOG) {
      expect(detector.id).toBeTruthy();
      expect(detector.secretType).toBeTruthy();
      expect(detector.category).toBeTruthy();
      expect(detector.baseConfidence).toBeGreaterThan(0);
      expect(detector.description).toBeTruthy();
    }
  });
});

describe("positive detection", () => {
  for (const [detectorId, content] of Object.entries(POSITIVE_SAMPLES)) {
    it(`detects ${detectorId}`, () => {
      const matches = runRegexDetectors(content, { filePath: "src/config.ts" });
      const definition = getDetectorById(detectorId);
      expect(definition).toBeDefined();

      const hit = matches.find(
        (m) =>
          m.detectorId === detectorId ||
          (definition && m.secretType === definition.secretType),
      );
      expect(hit, `expected match for ${detectorId} in: ${content}`).toBeDefined();
      expect(hit!.confidence).toBeGreaterThanOrEqual(0.55);
    });
  }
});

describe("false positive reduction", () => {
  it("rejects placeholders", () => {
    expect(isLikelyPlaceholder("changeme")).toBe(true);
    expect(isLikelyPlaceholder("sk-test-key")).toBe(true);
  });

  it("skips npm integrity hashes", () => {
    const def = {
      id: "high_entropy_string",
      secretType: "High Entropy Secret",
      category: "generic" as const,
      severity: "Medium" as const,
      baseConfidence: 0.68,
      pattern: /x/g,
      method: "entropy" as const,
      description: "test",
    };
    expect(
      isLikelyFalsePositive({
        value:
          "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab",
        definition: def,
        lineText: NEGATIVE_SAMPLES.npm_integrity,
        nearbyLines: [],
      }),
    ).toBe(true);
  });

  for (const [name, content] of Object.entries(NEGATIVE_SAMPLES)) {
    it(`does not flag benign sample: ${name}`, () => {
      const result = scanFileContent({ path: "src/app.ts", content });
      const critical = result.findings.filter((f) => f.severity === "Critical");
      expect(critical.length, content).toBe(0);
    });
  }
});

describe("confidence scoring", () => {
  it("scores high-specificity tokens above threshold", () => {
    const content = POSITIVE_SAMPLES.sendgrid_api_key;
    const matches = runRegexDetectors(content);
    const hit = matches.find((m) => m.detectorId === "sendgrid_api_key");
    expect(hit?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("requires firebase context for firebase web api key", () => {
    const bare = POSITIVE_SAMPLES.google_gemini_api_key;
    const withFirebase = POSITIVE_SAMPLES.firebase_web_api_key;
    const bareHits = runRegexDetectors(bare).filter(
      (m) => m.detectorId === "firebase_web_api_key",
    );
    const firebaseHits = runRegexDetectors(withFirebase).filter(
      (m) => m.detectorId === "firebase_web_api_key",
    );
    expect(bareHits.length).toBe(0);
    expect(firebaseHits.length).toBeGreaterThan(0);
  });
});
