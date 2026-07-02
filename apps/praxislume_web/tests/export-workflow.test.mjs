import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeeklyExportPackage,
  createExportStorageKey,
  downloadFilename,
} from "../src/features/export/export-workflow.ts";
import {
  applyElementOverride,
  createDefaultTemplateLayout,
  serializeTemplateLayout,
} from "../src/features/templates/template-layout.ts";
import {
  buildContentPackageItem,
  parseContentPackageDraft,
  serializeContentPackageDraft,
} from "../src/features/export/content-package.ts";

const clinic = {
  id: "clinic-1",
  name: "Dhwani ENT Clinic",
  locality: "Pune",
  city: "Pune",
  services: ["ENT consultation"],
  phone: "+91 98765 43210",
};

const doctor = {
  id: "doctor-1",
  name: "Dr. Meera Shah",
  qualifications: "MS ENT",
  specialty: "ENT",
};

const brandKit = {
  primaryColor: "#0D4D57",
  secondaryColor: "#D7F8F6",
  accentColor: "#C8C43D",
  tone: "warm",
  defaultCta: "Book an ENT consultation",
  disclaimer: "Educational content only.",
};

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
    caption: input.caption ?? "A safe patient education caption.",
    reelHook: "Parents ask this often",
    reelScript: "Open with the concern, explain generally, close with an ENT review CTA.",
    shortCta: input.shortCta ?? "Book an ENT consultation",
    disclaimer: input.disclaimer ?? "General education only.",
    complianceStatus: input.complianceStatus ?? "passed",
    contentVersionHash: "hash",
  };
}

test("weekly export package stays locked until approved copy is ready", () => {
  const model = buildWeeklyExportPackage({
    campaignId: "campaign-1",
    weekId: "week-1",
    clinic,
    doctor,
    brandKit,
    items: [item({ status: "drafted", complianceStatus: "needs_review" })],
  });

  assert.equal(model.status, "copy_required");
  assert.equal(model.canExport, false);
  assert.equal(model.assets.length, 1);
  assert.match(model.notice, /Approve the full week/);
});

test("weekly export package hydrates saved layout overrides into deterministic SVG output", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "4:5",
  });
  const adjusted = applyElementOverride(layout, "headline", { x: 220, y: 420, width: 680 });
  const serialized = serializeTemplateLayout(adjusted);

  const model = buildWeeklyExportPackage({
    campaignId: "campaign-1",
    weekId: "week-1",
    clinic,
    doctor,
    brandKit,
    items: [item({ id: "day-1" })],
    layoutOverridesByItemId: {
      "day-1": serialized,
    },
  });

  assert.equal(model.status, "ready");
  assert.equal(model.canExport, true);
  assert.equal(model.assets[0].layoutAdjusted, true);
  assert.equal(model.assets[0].aspectRatio, "4:5");
  assert.match(model.assets[0].svg, /<svg/);
  assert.match(model.assets[0].svg, /Dhwani ENT Clinic/);
  assert.match(model.assets[0].svg, /x="220"/);
  assert.match(model.assets[0].svg, /y="420"/);
  assert.match(model.copyText, /Pre auricular sinus awareness/);
  assert.match(model.manifestJson, /"layoutAdjusted": true/);
  assert.equal(model.contentPackages[0].cta, "Book an ENT consultation");
  assert.equal(model.contentPackages[0].thumbnailLabel, "Pre-AI deterministic thumbnail");
});

test("weekly export package keeps signed visual readback separate from provider URLs", () => {
  const model = buildWeeklyExportPackage({
    campaignId: "campaign-1",
    weekId: "week-1",
    clinic,
    doctor,
    brandKit,
    items: [item({ id: "day-1" })],
    signedVisualsByItemId: {
      "day-1": "https://supabase.example.test/storage/v1/object/sign/generated/day-1.svg",
    },
  });

  assert.equal(model.status, "layout_required");
  assert.equal(model.assets[0].backgroundState, "signed_readback");
  assert.equal(model.assets[0].signedReadbackUrl, "https://supabase.example.test/storage/v1/object/sign/generated/day-1.svg");
  assert.match(model.assets[0].svg, /<image/);
  assert.doesNotMatch(model.assets[0].svg, /fal\.run|api\.openai\.com|FAL_KEY|OPENAI_API_KEY/);
});

test("export storage keys and filenames are deterministic and filesystem safe", () => {
  assert.equal(createExportStorageKey("campaign-1", "item-1"), "praxislume-layout-campaign-1-item-1");
  assert.equal(downloadFilename("Dhwani ENT Clinic", "Pre auricular sinus: symptoms?", "svg"), "dhwani-ent-clinic-pre-auricular-sinus-symptoms.svg");
});

test("content package drafts preserve thumbnail, caption, hashtags, CTA, and disclaimer separately from layout", () => {
  const contentPackage = buildContentPackageItem({
    item: item({ id: "day-1" }),
    dayLabel: "Day 1",
    clinic,
    doctor,
    brandKit,
    thumbnailUrl: "data:image/svg+xml,preview",
    thumbnailLabel: "Pre-AI thumbnail",
  });
  const serialized = serializeContentPackageDraft({
    ...contentPackage,
    caption: "Edited caption for approval.",
    hashtags: ["ENT", "Pune", "PatientEducation"],
    cta: "Call the clinic",
    disclaimer: "General education only.",
  });
  const parsed = parseContentPackageDraft(serialized);

  assert.equal(parsed?.thumbnailUrl, "data:image/svg+xml,preview");
  assert.equal(parsed?.caption, "Edited caption for approval.");
  assert.deepEqual(parsed?.hashtags, ["ENT", "Pune", "PatientEducation"]);
  assert.equal(parsed?.cta, "Call the clinic");
});
