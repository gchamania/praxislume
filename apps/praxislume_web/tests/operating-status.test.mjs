import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOperatingStatusModel,
  itemOperatingStatus,
} from "../src/features/operations/operating-status.ts";

function item(input = {}) {
  return {
    id: input.id ?? `item-${input.dayOffset ?? 0}`,
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: input.scheduledDate ?? "2026-06-30",
    dayOffset: input.dayOffset ?? 0,
    title: input.title ?? "Pre auricular sinus awareness",
    category: input.category ?? "procedure_explainer",
    status: input.status ?? "drafted",
    objective: "General patient education",
    keyPoints: ["Know the symptoms", "Avoid squeezing", "Visit an ENT"],
    caption: input.caption ?? "General patient education caption.",
    reelHook: "",
    reelScript: "",
    shortCta: input.shortCta ?? "Book an ENT consultation",
    disclaimer: input.disclaimer ?? "General education only.",
    complianceStatus: input.complianceStatus,
    contentVersionHash: "hash",
  };
}

test("item operating status follows the conveyor after copy approval", () => {
  assert.equal(itemOperatingStatus(item({ status: "drafted", complianceStatus: "needs_review" })).id, "copy_needs_review");
  assert.equal(itemOperatingStatus(item({ status: "designed", complianceStatus: "passed" })).id, "visuals_ready");
  assert.equal(
    itemOperatingStatus(item({ status: "designed", complianceStatus: "passed" }), { hasVisual: true }).id,
    "final_adjustment_needed",
  );
  assert.equal(
    itemOperatingStatus(item({ status: "designed", complianceStatus: "passed" }), { hasVisual: true, layoutAdjusted: true }).id,
    "ready_to_export",
  );
  assert.equal(itemOperatingStatus(item({ status: "posted", complianceStatus: "passed" })).id, "posted");
});

test("operating status model summarizes dashboard cards and next action", () => {
  const model = buildOperatingStatusModel({
    campaign: {
      id: "campaign-1",
      clinicId: "clinic-1",
      title: "30-day ENT campaign",
      goal: "appointments",
      durationDays: 30,
      startDate: "2026-06-30",
      status: "draft",
    },
    items: [
      item({ id: "copy", status: "drafted", complianceStatus: "needs_review" }),
      item({ id: "visual", dayOffset: 1, status: "designed", complianceStatus: "passed" }),
      item({ id: "adjust", dayOffset: 2, status: "designed", complianceStatus: "passed" }),
      item({ id: "export", dayOffset: 3, status: "designed", complianceStatus: "passed" }),
      item({ id: "posted", dayOffset: 4, status: "posted", complianceStatus: "passed" }),
    ],
    visualItemIds: new Set(["adjust", "export"]),
    layoutAdjustedItemIds: new Set(["export"]),
  });

  assert.equal(model.dashboardCards.find((card) => card.id === "copy_needs_review")?.count, 1);
  assert.equal(model.dashboardCards.find((card) => card.id === "visuals_ready")?.count, 1);
  assert.equal(model.dashboardCards.find((card) => card.id === "final_adjustment_needed")?.count, 1);
  assert.equal(model.dashboardCards.find((card) => card.id === "ready_to_export")?.count, 1);
  assert.equal(model.dashboardCards.find((card) => card.id === "posted")?.count, 1);
  assert.equal(model.nextAction.href, "/campaigns/campaign-1/weeks/week-1/copy");
  assert.equal(model.nextAction.label, "Review Week 1 Copy");
});

test("library rows expose template, aspect ratio, visual status, and layout state", () => {
  const model = buildOperatingStatusModel({
    items: [item({ id: "export", status: "designed", complianceStatus: "passed" })],
    visualItemIds: new Set(["export"]),
    layoutAdjustedItemIds: new Set(["export"]),
    aspectRatioByItemId: { export: "4:5" },
  });

  assert.equal(model.libraryRows[0].templateName, "Clinic education card");
  assert.equal(model.libraryRows[0].aspectRatio, "4:5");
  assert.equal(model.libraryRows[0].visualStatus, "signed visual");
  assert.equal(model.libraryRows[0].layoutStatus, "layout adjusted");
  assert.equal(model.libraryRows[0].status.id, "ready_to_export");
});

test("calendar shows full cards only for approved or export-ready items and locks future weeks", () => {
  const model = buildOperatingStatusModel({
    items: [
      item({ id: "draft", status: "drafted", complianceStatus: "needs_review" }),
      item({ id: "approved", dayOffset: 1, status: "designed", complianceStatus: "passed" }),
      item({ id: "future", dayOffset: 8, status: "designed", complianceStatus: "passed" }),
    ],
  });

  assert.equal(model.calendarDays.find((day) => day.itemId === "draft")?.cardMode, "placeholder");
  assert.equal(model.calendarDays.find((day) => day.itemId === "approved")?.cardMode, "full");
  assert.equal(model.calendarDays.find((day) => day.itemId === "future")?.locked, true);
});
