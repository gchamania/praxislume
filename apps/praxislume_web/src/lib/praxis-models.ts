export const defaultDisclaimer =
  "This content is for general education only. Please consult a qualified doctor for personal medical advice.";

export type ClinicProfile = {
  id: string;
  name: string;
  locality: string;
  city: string;
  services: string[];
  phone: string;
  whatsapp?: string;
  appointmentUrl?: string;
};

export type DoctorProfile = {
  id: string;
  name: string;
  qualifications: string;
  specialty: string;
};

export type BrandKit = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tone: "warm" | "authoritative" | "simple" | "premium" | "local_language_friendly";
  defaultCta: string;
  disclaimer: string;
  logoPath?: string;
};

export type ContentCampaign = {
  id: string;
  clinicId: string;
  title: string;
  goal: string;
  durationDays: number;
  startDate: string;
  status: "draft" | "active" | "archived";
};

export type ContentItem = {
  id: string;
  clinicId: string;
  campaignId: string;
  scheduledDate: string;
  dayOffset: number;
  title: string;
  category: string;
  status: string;
  objective: string;
  keyPoints: string[];
  caption: string;
  reelHook: string;
  reelScript: string;
  shortCta: string;
  disclaimer: string;
  complianceStatus?: string;
  contentVersionHash?: string;
};

export type AiGenerationLog = {
  id: string;
  generationType: string;
  provider: string;
  model: string;
  status: string;
  createdAt: string;
  latencyMs: number;
};

export type PraxisState = {
  clinic?: ClinicProfile;
  doctor?: DoctorProfile;
  brandKit: BrandKit;
  campaign?: ContentCampaign;
  items: ContentItem[];
  generationLogs: AiGenerationLog[];
};

export const defaultBrandKit: BrandKit = {
  primaryColor: "#0D4D57",
  secondaryColor: "#A7E1D6",
  accentColor: "#F2C15E",
  tone: "warm",
  defaultCta: "Book a consultation",
  disclaimer: defaultDisclaimer,
};
