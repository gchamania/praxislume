import type { CampaignPlanRequest } from "@praxislume/contracts";
import type { BrandKit, ClinicProfile, DoctorProfile } from "@/lib/praxis-models";

export type CampaignPlatform = "Instagram" | "Facebook" | "WhatsApp" | "Clinic poster" | "Google Business";

export type CampaignSetupInput = {
  durationDays: 7 | 15 | 30;
  growthGoal: string;
  topicFocus: string;
  audience: string;
  languageMode: string;
  serviceFocus: string;
  platforms: CampaignPlatform[];
};

export type CampaignSetupSafetyResult =
  | { ok: true }
  | { ok: false; reason: string };

export function buildCampaignPlanRequest(input: {
  clinic: ClinicProfile;
  doctor: DoctorProfile;
  brandKit: BrandKit;
  setup: CampaignSetupInput;
  idempotencyKey: string;
}): CampaignPlanRequest {
  const services = prioritizedServices(input.clinic.services, input.setup.serviceFocus);
  return {
    clinicId: input.clinic.id,
    idempotencyKey: input.idempotencyKey,
    durationDays: input.setup.durationDays,
    specialty: input.doctor.specialty,
    services,
    locality: compactText(`${input.clinic.locality}, ${input.clinic.city}`, 120),
    goal: compactGoal(input.setup),
    tone: input.brandKit.tone,
    ctaPreference: input.brandKit.defaultCta,
    disclaimerPreference: input.brandKit.disclaimer,
  };
}

export function createCampaignTitle(input: {
  durationDays: 7 | 15 | 30;
  specialty: string;
  topicFocus: string;
}): string {
  const topic = compactText(input.topicFocus.trim() || "growth", 54).toLowerCase();
  return `${input.durationDays}-day ${input.specialty} ${topic} campaign`;
}

export function campaignSetupHasPatientData(setup: CampaignSetupInput): CampaignSetupSafetyResult {
  const searchable = [
    setup.growthGoal,
    setup.topicFocus,
    setup.audience,
    setup.languageMode,
    setup.serviceFocus,
    setup.platforms.join(" "),
  ].join(" ").toLowerCase();
  const unsafePatterns = [
    /\bpatient\s+[a-z][a-z]+\b/i,
    /\bmrn\b/i,
    /\bmedical\s+record\b/i,
    /\breport\b/i,
    /\bcase\s+history\b/i,
    /\bphone\s*(number)?\b/i,
    /\b\d{10}\b/,
  ];
  if (unsafePatterns.some((pattern) => pattern.test(searchable))) {
    return {
      ok: false,
      reason: "Campaign setup should use general clinic topics, not patient names, reports, phone numbers, or case histories.",
    };
  }
  return { ok: true };
}

export function defaultCampaignSetup(input: {
  durationDays?: 7 | 15 | 30;
  growthGoal?: string;
  topicFocus?: string;
  audience?: string;
  languageMode?: string;
  serviceFocus?: string;
  platforms?: CampaignPlatform[];
} = {}): CampaignSetupInput {
  return {
    durationDays: input.durationDays ?? 30,
    growthGoal: input.growthGoal ?? "Increase appointment enquiries",
    topicFocus: input.topicFocus ?? "Patient education and clinic service awareness",
    audience: input.audience ?? "Local patients and caregivers",
    languageMode: input.languageMode ?? "English, local-language friendly",
    serviceFocus: input.serviceFocus ?? "Primary clinic services",
    platforms: input.platforms ?? ["Instagram", "WhatsApp", "Clinic poster"],
  };
}

function prioritizedServices(services: string[], serviceFocus: string): string[] {
  const ordered = [serviceFocus, ...services]
    .map((service) => service.trim())
    .filter(Boolean);
  return Array.from(new Set(ordered)).slice(0, 20);
}

function compactGoal(setup: CampaignSetupInput): string {
  return compactText(
    [
      setup.growthGoal,
      `Topic: ${setup.topicFocus}`,
      `Audience: ${setup.audience}`,
      `Platforms: ${setup.platforms.join(", ")}`,
      `Language: ${setup.languageMode}`,
    ].join(" | "),
    240,
  );
}

function compactText(value: string, maxLength: number): string {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) {
    return compacted;
  }
  return `${compacted.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
