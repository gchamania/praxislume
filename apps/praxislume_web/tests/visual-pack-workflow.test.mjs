import assert from "node:assert/strict";
import test from "node:test";

import { buildWeeklyCopyModel } from "../src/features/campaigns/weekly-copy-workflow.ts";
import { buildVisualPackModel } from "../src/features/campaigns/visual-pack-workflow.ts";

function item(input = {}) {
  return {
    id: input.id ?? `item-${input.dayOffset ?? 0}`,
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: "2026-06-30",
    dayOffset: input.dayOffset ?? 0,
    title: input.title ?? "Pre auricular sinus awareness",
    category: "procedure_explainer",
    status: input.status ?? "designed",
    objective: "General patient education",
    keyPoints: ["Know the symptoms", "Avoid squeezing", "Visit an ENT"],
    caption: "General patient education caption.",
    reelHook: "",
    reelScript: "",
    shortCta: input.shortCta ?? "Book an ENT consultation",
    disclaimer: input.disclaimer ?? "General education only.",
    complianceStatus: input.complianceStatus ?? "passed",
    contentVersionHash: "hash",
  };
}

function approvedWeek(items = [item({ id: "day-1" }), item({ id: "day-2", dayOffset: 1 })]) {
  return buildWeeklyCopyModel({ campaignId: "campaign-1", weekId: "week-1", items });
}

test("visual pack model keeps visuals locked until the full week copy is approved", () => {
  const week = buildWeeklyCopyModel({
    campaignId: "campaign-1",
    weekId: "week-1",
    items: [item({ id: "draft", status: "drafted", complianceStatus: "needsDoctorReview" })],
  });

  const model = buildVisualPackModel({ week, enableVisualPilot: true });

  assert.equal(model.status, "copy_required");
  assert.equal(model.canGenerate, false);
  assert.equal(model.canOpenAdjuster, false);
  assert.equal(model.notice, "Approve the full week before visual creation.");
});

test("visual pack model exposes deterministic fallback slots when pilot is disabled", () => {
  const model = buildVisualPackModel({ week: approvedWeek(), enableVisualPilot: false });

  assert.equal(model.status, "provider_disabled");
  assert.equal(model.canGenerate, false);
  assert.equal(model.canUseFallback, true);
  assert.equal(model.canOpenAdjuster, true);
  assert.equal(model.slots.length, 2);
  assert.equal(model.slots[0].backgroundState, "fallback");
  assert.equal(model.slots[0].headline, "Pre auricular sinus awareness");
  assert.equal(model.slots[0].cta, "Book an ENT consultation");
});

test("visual pack model can run the pre-AI conveyor with deterministic thumbnails only", () => {
  const model = buildVisualPackModel({
    week: approvedWeek(),
    enableVisualPilot: true,
    preAiPreview: true,
    clinicName: "Dhwani ENT Clinic",
    primaryColor: "#0D4D57",
    accentColor: "#12AFC0",
  });

  assert.equal(model.status, "pre_ai_preview");
  assert.equal(model.canGenerate, false);
  assert.equal(model.canOpenAdjuster, true);
  assert.equal(model.slots[0].backgroundState, "deterministic_preview");
  assert.match(model.slots[0].thumbnailUrl, /^data:image\/svg\+xml/);
  assert.match(model.notice, /without provider calls/);
});

test("visual pack model surfaces weekly quota exhaustion without blocking fallback adjustment", () => {
  const model = buildVisualPackModel({
    week: approvedWeek(),
    enableVisualPilot: true,
    generatedVisualCount: 4,
    maxWeeklyVisualSets: 4,
  });

  assert.equal(model.status, "quota_exhausted");
  assert.equal(model.canGenerate, false);
  assert.equal(model.canUseFallback, true);
  assert.equal(model.canOpenAdjuster, true);
  assert.equal(model.notice, "Weekly visual allowance is used. Deterministic template previews are still available.");
});

test("visual pack model maps generated assets to week-level visual slots", () => {
  const model = buildVisualPackModel({
    week: approvedWeek(),
    enableVisualPilot: true,
    generatedAssetsByItemId: {
      "day-2": "https://example.test/day-2.svg",
    },
  });

  assert.equal(model.status, "ready");
  assert.equal(model.canGenerate, true);
  assert.equal(model.slots[0].backgroundState, "fallback");
  assert.equal(model.slots[1].backgroundState, "generated");
  assert.equal(model.slots[1].signedUrl, "https://example.test/day-2.svg");
});

test("visual pack model treats provider errors as non-blocking fallback states", () => {
  const model = buildVisualPackModel({
    week: approvedWeek(),
    enableVisualPilot: true,
    providerMessage: "Provider quota error from backend",
  });

  assert.equal(model.status, "provider_error");
  assert.equal(model.canGenerate, false);
  assert.equal(model.canUseFallback, true);
  assert.equal(model.canOpenAdjuster, true);
});
