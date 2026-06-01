import { describe, expect, it } from "vitest";
import {
  isDocumentationPath,
  isExampleContext,
  isLikelyPlaceholder,
} from "@/lib/scanner/detectors/false-positives";

describe("false-positives helpers", () => {
  it("detects documentation paths", () => {
    expect(isDocumentationPath("docs/setup.md")).toBe(true);
    expect(isDocumentationPath("src/lib/auth.ts")).toBe(false);
  });

  it("detects example context", () => {
    expect(isExampleContext("// example api key below", [])).toBe(true);
    expect(isExampleContext("const production = true", [])).toBe(false);
  });

  it("flags short placeholders", () => {
    expect(isLikelyPlaceholder("xxx")).toBe(true);
  });
});
