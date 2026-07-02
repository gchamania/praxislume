import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClinicCalendarMonth,
  eventKindLabels,
} from "../src/features/calendar/clinic-calendar.ts";
import {
  applyPalette,
  contrastLabel,
  healthcarePalettes,
  isHexColor,
  normalizeHexColor,
} from "../src/features/brand-kit/brand-palette.ts";

function item(input = {}) {
  return {
    id: input.id ?? "item-1",
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: input.scheduledDate ?? "2026-07-01",
    dayOffset: input.dayOffset ?? 0,
    title: input.title ?? "Why jewellery can trigger skin reactions",
    category: input.category ?? "awareness",
    status: input.status ?? "drafted",
    objective: "General patient education",
    keyPoints: ["Nickel allergy", "Sweat and friction", "See a dermatologist"],
    caption: "Patient education caption.",
    reelHook: "",
    reelScript: "",
    shortCta: "Book a skin consultation",
    disclaimer: "General education only.",
    complianceStatus: input.complianceStatus,
    contentVersionHash: "hash",
  };
}

test("clinic calendar builds a real navigable current-month grid", () => {
  const month = buildClinicCalendarMonth({
    year: 2026,
    monthIndex: 6,
    items: [item({ scheduledDate: "2026-07-01" })],
    clinic: { city: "Pune", locality: "Aundh" },
    specialty: "Dermatology",
    today: "2026-07-02",
  });

  assert.equal(month.label, "July 2026");
  assert.equal(month.previous.monthIndex, 5);
  assert.equal(month.next.monthIndex, 7);
  assert.equal(month.days.length, 42);
  assert.equal(month.days.some((day) => day.date === "2026-07-02" && day.isToday), true);
  assert.equal(month.days.find((day) => day.date === "2026-07-01")?.contentItems.length, 1);
});

test("clinic calendar layers health days, state/local days, festivals, and campaign items", () => {
  const month = buildClinicCalendarMonth({
    year: 2026,
    monthIndex: 6,
    items: [item({ scheduledDate: "2026-07-16" })],
    clinic: { city: "Pune", locality: "Baner" },
    specialty: "Dermatology",
    today: "2026-07-02",
  });

  const julyFirst = month.days.find((day) => day.date === "2026-07-01");
  const localPrompt = month.days.find((day) => day.date === "2026-07-16");
  assert.equal(julyFirst?.events.some((event) => event.title === "National Doctor's Day"), true);
  assert.equal(localPrompt?.events.some((event) => event.title === "Monsoon skin and allergy week"), true);
  assert.equal(localPrompt?.contentItems[0].title, "Why jewellery can trigger skin reactions");
  assert.equal(eventKindLabels.public_holiday, "Public holiday");
});

test("brand palette helpers apply safe healthcare palettes and contrast labels", () => {
  const base = {
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#CCCCCC",
    tone: "warm",
    defaultCta: "Book a consultation",
    disclaimer: "General education only.",
  };

  const palette = healthcarePalettes.find((candidate) => candidate.id === "derma-coral");
  assert.ok(palette);
  const branded = applyPalette(base, palette);
  assert.equal(branded.primaryColor, "#7C2D5A");
  assert.equal(isHexColor(branded.accentColor), true);
  assert.equal(normalizeHexColor("ffffff"), "#FFFFFF");
  assert.equal(contrastLabel("#000000", "#FFFFFF"), "Strong contrast");
  assert.equal(contrastLabel("#AAAAAA", "#FFFFFF"), "Low contrast");
});
