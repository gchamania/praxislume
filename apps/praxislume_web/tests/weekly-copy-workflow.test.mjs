import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeeklyCopyModel,
  getWeekItems,
  hasPatientIdentifiableText,
} from "../src/features/campaigns/weekly-copy-workflow.ts";

function item(input = {}) {
  return {
    id: input.id ?? `item-${input.dayOffset ?? 0}`,
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: "2026-06-30",
    dayOffset: input.dayOffset ?? 0,
    title: input.title ?? "Ear health awareness",
    category: "awareness",
    status: input.status ?? "drafted",
    objective: "Patient education",
    keyPoints: ["General symptom awareness"],
    caption: input.caption ?? "A general education caption.",
    reelHook: input.reelHook ?? "",
    reelScript: input.reelScript ?? "",
    shortCta: "Book a consultation",
    disclaimer: "General education only.",
    complianceStatus: input.complianceStatus,
    contentVersionHash: input.contentVersionHash,
  };
}

test("getWeekItems selects the requested campaign week in day order", () => {
  const items = [
    item({ id: "day-9", dayOffset: 8 }),
    item({ id: "day-2", dayOffset: 1 }),
    item({ id: "day-7", dayOffset: 6 }),
    item({ id: "day-8", dayOffset: 7 }),
  ];

  assert.deepEqual(getWeekItems(items, "week-1").map((candidate) => candidate.id), ["day-2", "day-7"]);
  assert.deepEqual(getWeekItems(items, "week-2").map((candidate) => candidate.id), ["day-8", "day-9"]);
});

test("weekly copy model requires passed compliance before week approval and visual unlock", () => {
  const model = buildWeeklyCopyModel({
    campaignId: "campaign-1",
    weekId: "week-1",
    items: [
      item({ id: "approved", status: "designed", complianceStatus: "passed" }),
      item({ id: "needs-review", status: "drafted", complianceStatus: "needsDoctorReview" }),
      item({ id: "missing-caption", status: "drafted", caption: "", complianceStatus: undefined }),
      item({ id: "blocked", status: "drafted", complianceStatus: "blocked" }),
    ],
  });

  assert.equal(model.weekNumber, 1);
  assert.equal(model.items.length, 4);
  assert.equal(model.approvedCount, 1);
  assert.equal(model.blockedCount, 1);
  assert.equal(model.needsComplianceCount, 2);
  assert.equal(model.canApproveWeek, false);
  assert.equal(model.canOpenVisualPack, false);
  assert.equal(model.visualLockReason, "Resolve blocked compliance items before visual creation.");
  assert.equal(model.items[0].state, "approved");
  assert.equal(model.items[1].state, "compliance_needed");
  assert.equal(model.items[2].state, "missing_copy");
  assert.equal(model.items[3].state, "blocked");
});

test("weekly copy model opens visual pack only after every item is approved", () => {
  const model = buildWeeklyCopyModel({
    campaignId: "campaign-1",
    weekId: "week-1",
    items: [
      item({ id: "day-1", status: "designed", complianceStatus: "passed" }),
      item({ id: "day-2", status: "posted", complianceStatus: "passed" }),
    ],
  });

  assert.equal(model.canApproveWeek, true);
  assert.equal(model.canOpenVisualPack, true);
  assert.equal(model.visualsHref, "/campaigns/campaign-1/weeks/week-1/visuals");
});

test("patient-identifiable freeform text is rejected before generation helpers use it", () => {
  assert.equal(hasPatientIdentifiableText("Please write about patient Rohan Sharma, phone 9876543210."), true);
  assert.equal(hasPatientIdentifiableText("Explain why children may need an ENT visit for repeated ear infections."), false);
});
