import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCampaignFlowModel,
  stageStatusesForFlow,
} from "../src/features/campaigns/campaign-flow-state.ts";

const baseState = {
  clinic: {
    id: "clinic-1",
    name: "Dhwani ENT Clinics",
    locality: "Koregaon Park",
    city: "Pune",
    services: ["Pediatric ENT"],
    phone: "+91 98765 43210",
  },
  doctor: {
    id: "doctor-1",
    name: "Dr Rohan Verma",
    qualifications: "MS ENT",
    specialty: "ENT",
  },
  brandKit: {
    primaryColor: "#12AFC0",
    secondaryColor: "#D7F8F6",
    accentColor: "#C8C43D",
    tone: "warm",
    defaultCta: "Book an ENT consultation",
    disclaimer: "Educational content only.",
  },
  campaign: {
    id: "campaign-1",
    clinicId: "clinic-1",
    title: "30-day ENT campaign",
    goal: "Increase appointment enquiries",
    durationDays: 30,
    startDate: "2026-06-29",
    status: "draft",
  },
  generationLogs: [],
};

function item(input) {
  return {
    id: `item-${input.dayOffset}`,
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: "2026-06-29",
    dayOffset: input.dayOffset,
    title: `Topic ${input.dayOffset}`,
    category: "awareness",
    status: input.status ?? "drafted",
    objective: "Patient education",
    keyPoints: ["General education"],
    caption: "Safe caption",
    reelHook: "",
    reelScript: "",
    shortCta: "Book an ENT consultation",
    disclaimer: "Educational only.",
    complianceStatus: input.complianceStatus,
  };
}

test("flow model turns campaign rows into explicit week states", () => {
  const model = buildCampaignFlowModel({
    state: {
      ...baseState,
      items: [
        item({ dayOffset: 0, status: "drafted", complianceStatus: "passed" }),
        item({ dayOffset: 1, status: "drafted" }),
        item({ dayOffset: 8, status: "idea" }),
      ],
    },
    activeStage: "copy_approval",
    activeWeekId: "week-1",
  });

  assert.equal(model.hasCampaign, true);
  assert.equal(model.activeStage, "copy_approval");
  assert.equal(model.weeks.length, 5);
  assert.equal(model.weeks[0].status, "needs_review");
  assert.equal(model.weeks[0].items.length, 2);
  assert.equal(model.weeks[1].status, "locked");
  assert.equal(model.weeks[0].href, "/campaigns/campaign-1/weeks/week-1/copy");
});

test("flow model marks a week complete after copy approval and visual/layout/export states", () => {
  const model = buildCampaignFlowModel({
    state: {
      ...baseState,
      items: [
        item({ dayOffset: 0, status: "designed", complianceStatus: "passed" }),
        item({ dayOffset: 1, status: "posted", complianceStatus: "passed" }),
      ],
    },
    activeStage: "export",
    activeWeekId: "week-1",
    visualReady: true,
    layoutAdjusted: true,
    exported: true,
  });

  assert.equal(model.weeks[0].status, "complete");
  assert.equal(model.stages.find((stage) => stage.id === "visual_pack")?.status, "complete");
  assert.equal(model.stages.find((stage) => stage.id === "calendar")?.status, "ready");
});

test("stage status model includes ready, current, complete, locked, and failed", () => {
  const statuses = stageStatusesForFlow({
    activeStage: "visual_pack",
    failedStage: "final_adjust",
  });

  assert.equal(statuses.find((stage) => stage.id === "copy_approval")?.status, "complete");
  assert.equal(statuses.find((stage) => stage.id === "visual_pack")?.status, "current");
  assert.equal(statuses.find((stage) => stage.id === "final_adjust")?.status, "failed");
  assert.equal(statuses.find((stage) => stage.id === "export")?.status, "locked");
});

test("flow model keeps users at campaign setup when no campaign exists", () => {
  const model = buildCampaignFlowModel({
    state: {
      ...baseState,
      campaign: undefined,
      items: [],
    },
  });

  assert.equal(model.hasCampaign, false);
  assert.equal(model.activeStage, "campaign_setup");
  assert.equal(model.weeks.length, 0);
  assert.equal(model.stages[0].status, "current");
  assert.equal(model.stages[1].status, "locked");
});
