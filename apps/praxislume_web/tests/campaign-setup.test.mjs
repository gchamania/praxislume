import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCampaignPlanRequest,
  campaignSetupHasPatientData,
  createCampaignTitle,
} from "../src/features/campaigns/campaign-setup.ts";

const clinic = {
  id: "56c55f12-5ab3-4831-9e4f-44390f06b531",
  name: "Dhwani ENT Clinics",
  locality: "Koregaon Park",
  city: "Pune",
  services: ["Grommet consultation", "Hearing tests", "Pediatric ENT"],
  phone: "+91 98765 43210",
};

const doctor = {
  id: "doctor-1",
  name: "Dr Rohan Verma",
  qualifications: "MS ENT",
  specialty: "ENT",
};

const brandKit = {
  primaryColor: "#12AFC0",
  secondaryColor: "#D7F8F6",
  accentColor: "#C8C43D",
  tone: "warm",
  defaultCta: "Book an ENT consultation",
  disclaimer: "Educational content only.",
};

test("campaign setup maps rich web inputs into the existing backend campaign-plan contract", () => {
  const request = buildCampaignPlanRequest({
    clinic,
    doctor,
    brandKit,
    setup: {
      durationDays: 30,
      growthGoal: "Increase appointment enquiries",
      topicFocus: "Pre auricular sinus awareness",
      audience: "Parents and young adults",
      languageMode: "English + simple Hindi",
      serviceFocus: "Pediatric ENT",
      platforms: ["Instagram", "WhatsApp", "Clinic poster"],
    },
    idempotencyKey: "web-campaign-test",
  });

  assert.equal(request.clinicId, clinic.id);
  assert.equal(request.durationDays, 30);
  assert.equal(request.specialty, "ENT");
  assert.deepEqual(request.services, ["Pediatric ENT", "Grommet consultation", "Hearing tests"]);
  assert.match(request.goal, /Pre auricular sinus awareness/);
  assert.match(request.goal, /Instagram, WhatsApp, Clinic poster/);
  assert.equal(request.goal.length <= 240, true);
  assert.equal(request.tone, "warm");
  assert.equal(request.ctaPreference, "Book an ENT consultation");
});

test("campaign title reflects duration, specialty, and topic focus", () => {
  assert.equal(
    createCampaignTitle({
      durationDays: 15,
      specialty: "Dermatology",
      topicFocus: "jewellery skin reactions",
    }),
    "15-day Dermatology jewellery skin reactions campaign",
  );
});

test("campaign setup rejects patient-identifiable text before generation", () => {
  assert.equal(
    campaignSetupHasPatientData({
      durationDays: 7,
      growthGoal: "Create content from patient Rahul Sharma's report",
      topicFocus: "rash after jewellery",
      audience: "patients",
      languageMode: "English",
      serviceFocus: "Dermatology",
      platforms: ["Instagram"],
    }).ok,
    false,
  );
});
