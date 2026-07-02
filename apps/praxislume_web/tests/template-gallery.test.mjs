import assert from "node:assert/strict";
import test from "node:test";

import {
  filterTemplateCatalog,
  healthcareTemplates,
  templateCatalogSummary,
  templateSpecialties,
} from "../src/features/templates/template-catalog.ts";

test("template catalog covers the core healthcare specialty packs with enough choice", () => {
  assert.ok(healthcareTemplates.length >= 24);
  for (const specialty of [
    "ENT",
    "Dermatology",
    "Dental",
    "Pediatrics",
    "Gynecology / IVF",
    "Orthopedics",
    "Neurology",
    "Physiotherapy",
  ]) {
    assert.equal(templateSpecialties.includes(specialty), true, `missing specialty filter: ${specialty}`);
    assert.equal(
      healthcareTemplates.some((template) => template.specialties.includes(specialty)),
      true,
      `missing templates for ${specialty}`,
    );
  }
});

test("template catalog exposes deterministic zones instead of arbitrary design layers", () => {
  for (const template of healthcareTemplates) {
    assert.ok(template.zones.includes("headline"), `${template.id} needs a headline zone`);
    assert.ok(template.zones.includes("cta"), `${template.id} needs a CTA zone`);
    assert.ok(template.zones.includes("logo"), `${template.id} needs a logo zone`);
    assert.ok(template.zones.includes("disclaimer"), `${template.id} needs a disclaimer zone`);
    assert.equal(template.zones.includes("background") || template.format === "WhatsApp", true, `${template.id} needs a controlled background decision`);
  }
});

test("template filters support specialty, format, category, goal, and search", () => {
  const jewellery = filterTemplateCatalog({ specialty: "Dermatology", query: "jewellery" });
  assert.equal(jewellery.length, 1);
  assert.equal(jewellery[0].id, "derma-jewellery-reaction-carousel");

  const entCarousels = filterTemplateCatalog({ specialty: "ENT", format: "Carousel" });
  assert.equal(entCarousels.some((template) => template.id === "ent-grommet-carousel"), true);
  assert.equal(entCarousels.every((template) => template.format === "Carousel"), true);

  const appointmentPosters = filterTemplateCatalog({ category: "Symptom checklist", goal: "Appointments" });
  assert.equal(appointmentPosters.length >= 3, true);
  assert.equal(appointmentPosters.every((template) => template.category === "Symptom checklist"), true);
});

test("template catalog summary supports dashboard-like gallery stats", () => {
  const summary = templateCatalogSummary();
  assert.equal(summary.total, healthcareTemplates.length);
  assert.equal(summary.specialties >= 8, true);
  assert.equal(summary.carousel >= 6, true);
  assert.equal(summary.appointmentFocused >= 7, true);
});
