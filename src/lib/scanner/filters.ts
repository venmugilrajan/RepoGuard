export { isLikelyPlaceholder } from "@/lib/scanner/detectors/false-positives";

const SKIP_PATH_SEGMENTS = [
  "node_modules/",
  "vendor/",
  "dist/",
  "build/",
  ".git/",
  ".next/",
  "coverage/",
  "__pycache__/",
  ".venv/",
  "target/",
  "bin/",
  "obj/",
];

const SCANNABLE_EXTENSIONS = new Set([
  ".env",
  ".json",
  ".yaml",
  ".yml",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".go",
  ".java",
  ".rb",
  ".php",
  ".sh",
  ".bash",
  ".zsh",
  ".tf",
  ".properties",
  ".xml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".md",
  ".txt",
  ".sql",
  ".gradle",
  ".kt",
  ".swift",
  ".cs",
  ".cpp",
  ".c",
  ".h",
  ".rs",
]);

export function shouldScanPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  if (SKIP_PATH_SEGMENTS.some((segment) => normalized.includes(segment))) {
    return false;
  }
  if (
    normalized.endsWith(".lock") ||
    normalized.endsWith(".min.js") ||
    normalized.endsWith(".map") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".svg") ||
    normalized.endsWith(".woff") ||
    normalized.endsWith(".woff2")
  ) {
    return false;
  }
  const dot = normalized.lastIndexOf(".");
  if (dot === -1) {
    return normalized.endsWith(".env") || normalized.includes("dockerfile");
  }
  const ext = normalized.slice(dot);
  return SCANNABLE_EXTENSIONS.has(ext);
}
