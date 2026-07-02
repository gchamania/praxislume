import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = join(process.cwd(), "..", "..");
const reportPath = join(repoRoot, "docs", "PILOT_QA_REPORT_PASS_12.md");

test("Pass 12 pilot QA report records the full doctor demo script and results", () => {
  assert.equal(existsSync(reportPath), true, "missing Pass 12 pilot QA report");
  const report = readFileSync(reportPath, "utf8");

  for (const expected of [
    "# PraxisLume Pass 12 Pilot QA Report",
    "## QA Script",
    "## Fake-Provider Variant",
    "## Live-Provider Variant",
    "## Failure-Path Checks",
    "## Browser Evidence",
    "## Pass/Fail Summary",
    "/signin",
    "/onboarding/clinic-details",
    "/brand-kit",
    "/campaigns/new",
    "/campaigns/active/weeks/week-1/copy",
    "/campaigns/active/weeks/week-1/visuals",
    "/campaigns/active/weeks/week-1/adjust",
    "/campaigns/active/weeks/week-1/export",
    "/calendar",
    "patient-data rejection",
    "visual pilot disabled",
    "provider quota",
    "No provider keys in browser",
  ]) {
    assert.match(report, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
