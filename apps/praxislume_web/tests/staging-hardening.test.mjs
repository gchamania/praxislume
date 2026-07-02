import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const appRoot = process.cwd();
const repoRoot = join(appRoot, "..", "..");

test("web source has no direct provider endpoints or server-only key names", () => {
  const files = sourceFiles(join(appRoot, "src"));
  const forbidden = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "service_role",
    "OPENAI_API_KEY",
    "OPENAI_IMAGE_API_KEY",
    "FAL_KEY",
    "fal.run",
    "api.openai.com",
    "fal.ai",
    "anthropic.com",
  ];

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const token of forbidden) {
      assert.equal(
        text.includes(token),
        false,
        `${relative(appRoot, file)} contains forbidden browser-side token ${token}`,
      );
    }
  }
});

test("staging deployment runbook records smoke, network, and provider-state gates", () => {
  const runbookPath = join(repoRoot, "docs", "STAGING_DEPLOYMENT.md");
  assert.equal(existsSync(runbookPath), true, "missing staging deployment runbook");
  const runbook = readFileSync(runbookPath, "utf8");

  for (const expected of [
    "## Local Next.js Staging Loop",
    "## Remote Staging Deployment Loop",
    "## Browser Smoke Matrix",
    "## Browser Network Denylist",
    "## Provider Disabled and Quota Checks",
    "NEXT_PUBLIC_*",
    "OpenAI",
    "FAL",
    "api.openai.com",
    "fal.run",
  ]) {
    assert.match(runbook, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

function sourceFiles(dir) {
  const entries = readdirSync(dir).map((entry) => join(dir, entry));
  return entries.flatMap((entry) => {
    const stat = statSync(entry);
    if (stat.isDirectory()) return sourceFiles(entry);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry) ? [entry] : [];
  });
}
