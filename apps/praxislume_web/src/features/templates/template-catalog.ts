import type { TemplateAspectRatio, TemplateElementId } from "@/features/templates/template-layout";

export type TemplateSpecialty =
  | "All"
  | "ENT"
  | "Dermatology"
  | "Dental"
  | "Pediatrics"
  | "Gynecology / IVF"
  | "Orthopedics"
  | "Neurology"
  | "Physiotherapy";

export type TemplateFormat = "Carousel" | "Poster" | "Story" | "Reel Cover" | "WhatsApp" | "Google Business";

export type TemplateCategory =
  | "Service explainer"
  | "Myth vs fact"
  | "Symptom checklist"
  | "FAQ"
  | "Health day"
  | "Clinic announcement"
  | "Doctor intro"
  | "Post-care"
  | "Seasonal advisory"
  | "Review request";

export type TemplateGoal = "Awareness" | "Appointments" | "Trust" | "Local visibility" | "Retention";

export type HealthcareTemplate = {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  format: TemplateFormat;
  aspectRatios: TemplateAspectRatio[];
  specialties: TemplateSpecialty[];
  goal: TemplateGoal;
  zones: TemplateElementId[];
  tone: "warm" | "authoritative" | "simple" | "premium" | "local";
  tags: string[];
  accent: string;
  background: string;
};

export type TemplateCatalogFilters = {
  specialty?: TemplateSpecialty | "All";
  format?: TemplateFormat | "All";
  category?: TemplateCategory | "All";
  goal?: TemplateGoal | "All";
  query?: string;
};

export const templateSpecialties: Array<TemplateSpecialty | "All"> = [
  "All",
  "ENT",
  "Dermatology",
  "Dental",
  "Pediatrics",
  "Gynecology / IVF",
  "Orthopedics",
  "Neurology",
  "Physiotherapy",
];

export const templateFormats: Array<TemplateFormat | "All"> = [
  "All",
  "Carousel",
  "Poster",
  "Story",
  "Reel Cover",
  "WhatsApp",
  "Google Business",
];

export const templateCategories: Array<TemplateCategory | "All"> = [
  "All",
  "Service explainer",
  "Myth vs fact",
  "Symptom checklist",
  "FAQ",
  "Health day",
  "Clinic announcement",
  "Doctor intro",
  "Post-care",
  "Seasonal advisory",
  "Review request",
];

export const templateGoals: Array<TemplateGoal | "All"> = [
  "All",
  "Awareness",
  "Appointments",
  "Trust",
  "Local visibility",
  "Retention",
];

export const healthcareTemplates: HealthcareTemplate[] = [
  template("ent-grommet-carousel", "Ear grommet explainer", "A five-slide patient education carousel for parents evaluating ear fluid and hearing concerns.", "Service explainer", "Carousel", ["1:1", "4:5"], ["ENT", "Pediatrics"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["grommets", "ear fluid", "child hearing", "procedure"], "#2563EB", "#DBEAFE"),
  template("ent-monsoon-ear-poster", "Monsoon ear infection signs", "A seasonal poster that helps patients identify safe warning signs without fearmongering.", "Seasonal advisory", "Poster", ["1:1", "4:5"], ["ENT"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["monsoon", "ear infection", "pain", "pune"], "#0F766E", "#CCFBF1"),
  template("ent-hearing-test-story", "When to check hearing", "Story format for parents and adults who keep missing mild hearing symptoms.", "Symptom checklist", "Story", ["9:16"], ["ENT", "Pediatrics"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "warm", ["hearing test", "child speech", "elderly hearing"], "#7C3AED", "#EDE9FE"),
  template("ent-doctor-intro", "Meet your ENT specialist", "Trust-building intro card with qualification and service areas.", "Doctor intro", "Google Business", ["16:9", "1:1"], ["ENT"], "Trust", ["background", "headline", "cta", "logo", "disclaimer"], "premium", ["doctor intro", "clinic trust", "qualification"], "#1E40AF", "#E0F2FE"),

  template("derma-jewellery-reaction-carousel", "Jewellery reaction explainer", "Explains nickel allergy, sweat, friction, and when to see a dermatologist.", "FAQ", "Carousel", ["1:1", "4:5"], ["Dermatology"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["jewellery", "skin reaction", "nickel", "rash", "allergy"], "#BE185D", "#FCE7F3"),
  template("derma-acne-myths", "Acne myths vs facts", "A calm myth-buster layout for teenagers and adults seeking safe acne advice.", "Myth vs fact", "Carousel", ["1:1", "4:5"], ["Dermatology"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "warm", ["acne", "myths", "skin care"], "#9333EA", "#F3E8FF"),
  template("derma-fungal-monsoon", "Monsoon fungal rash advisory", "Local seasonal advisory for humid-weather skin problems.", "Seasonal advisory", "Poster", ["1:1", "4:5"], ["Dermatology"], "Local visibility", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["monsoon", "fungal rash", "itching"], "#047857", "#D1FAE5"),
  template("derma-post-procedure-care", "After skin procedure care", "Post-care checklist for peels, minor procedures, or laser aftercare reminders.", "Post-care", "WhatsApp", ["1:1"], ["Dermatology"], "Retention", ["headline", "cta", "logo", "disclaimer"], "simple", ["aftercare", "procedure", "skin clinic"], "#C2410C", "#FFEDD5"),

  template("dental-wisdom-tooth-carousel", "Wisdom tooth removal guide", "Procedure explainer carousel for pain, swelling, and safe dental consultation.", "Service explainer", "Carousel", ["1:1", "4:5"], ["Dental"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["wisdom tooth", "oral surgery", "pain"], "#0891B2", "#CFFAFE"),
  template("dental-child-cavity-check", "Child cavity checklist", "Parent-friendly symptom checklist for early dental visits.", "Symptom checklist", "Poster", ["1:1", "4:5"], ["Dental", "Pediatrics"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "warm", ["child dental", "cavity", "tooth pain"], "#F59E0B", "#FEF3C7"),
  template("dental-cleaning-myths", "Cleaning myths vs facts", "Myth-buster card for scaling, bleeding gums, and preventive dental care.", "Myth vs fact", "Google Business", ["16:9", "1:1"], ["Dental"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["scaling", "cleaning", "gum bleeding"], "#0D9488", "#CCFBF1"),

  template("peds-vaccination-reminder", "Vaccination reminder", "A clinic-safe reminder template for routine immunization education.", "Health day", "WhatsApp", ["1:1", "9:16"], ["Pediatrics"], "Retention", ["headline", "cta", "logo", "disclaimer"], "warm", ["vaccination", "immunization", "child health"], "#4F46E5", "#E0E7FF"),
  template("peds-fever-red-flags", "Child fever red flags", "Conservative checklist that avoids diagnosis while guiding timely consultation.", "Symptom checklist", "Carousel", ["1:1", "4:5"], ["Pediatrics"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["fever", "red flags", "child"], "#DC2626", "#FEE2E2"),
  template("peds-doctor-welcome", "Pediatrician welcome card", "Trust card for new families discovering the clinic locally.", "Doctor intro", "Poster", ["1:1"], ["Pediatrics"], "Trust", ["background", "headline", "cta", "logo", "disclaimer"], "warm", ["doctor intro", "child clinic", "trust"], "#EA580C", "#FFEDD5"),

  template("gyn-pcos-faq", "PCOS FAQ carousel", "Patient-friendly FAQ template with careful claims and consultation CTA.", "FAQ", "Carousel", ["1:1", "4:5"], ["Gynecology / IVF"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["pcos", "periods", "hormones"], "#A21CAF", "#FAE8FF"),
  template("gyn-pregnancy-checklist", "Pregnancy visit checklist", "Warm checklist for first antenatal visit preparation.", "Symptom checklist", "WhatsApp", ["1:1", "9:16"], ["Gynecology / IVF"], "Retention", ["headline", "cta", "logo", "disclaimer"], "warm", ["pregnancy", "antenatal", "checklist"], "#DB2777", "#FCE7F3"),
  template("ivf-trust-explainer", "IVF consultation explainer", "Trust-first service explainer that avoids success guarantees.", "Service explainer", "Poster", ["1:1", "4:5"], ["Gynecology / IVF"], "Trust", ["background", "headline", "cta", "logo", "disclaimer"], "premium", ["ivf", "fertility", "consultation"], "#7E22CE", "#F3E8FF"),

  template("ortho-knee-pain-checklist", "Knee pain checklist", "Decision-support poster for persistent knee pain and mobility concerns.", "Symptom checklist", "Poster", ["1:1", "4:5"], ["Orthopedics", "Physiotherapy"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["knee pain", "joint pain", "mobility"], "#1D4ED8", "#DBEAFE"),
  template("ortho-fracture-myths", "Fracture care myths", "Myth-buster carousel for splints, swelling, and follow-up safety.", "Myth vs fact", "Carousel", ["1:1", "4:5"], ["Orthopedics"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["fracture", "cast", "swelling"], "#475569", "#E2E8F0"),
  template("physio-back-pain-reel", "Back pain reel cover", "Short-video cover and hook structure for safe movement education.", "Service explainer", "Reel Cover", ["9:16"], ["Physiotherapy", "Orthopedics"], "Local visibility", ["background", "headline", "cta", "logo", "disclaimer"], "local", ["back pain", "physio", "exercise"], "#059669", "#D1FAE5"),

  template("neuro-headache-red-flags", "Headache red flags", "Conservative red-flag checklist that directs patients toward qualified evaluation.", "Symptom checklist", "Carousel", ["1:1", "4:5"], ["Neurology"], "Appointments", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["headache", "migraine", "red flags"], "#4338CA", "#E0E7FF"),
  template("neuro-stroke-awareness", "Stroke awareness day", "Health-day post for FAST awareness and emergency care education.", "Health day", "Poster", ["1:1", "4:5"], ["Neurology"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "authoritative", ["stroke", "fast", "health day"], "#B91C1C", "#FEE2E2"),

  template("all-health-day-greeting", "Health day education card", "Reusable all-specialty health-day card with patient education first and soft CTA.", "Health day", "Poster", ["1:1", "4:5", "9:16"], ["All"], "Awareness", ["background", "headline", "cta", "logo", "disclaimer"], "warm", ["health day", "awareness", "education"], "#4F46E5", "#EEF2FF"),
  template("all-clinic-hours-notice", "Clinic timing notice", "Structured clinic announcement for holiday hours, camps, or service availability.", "Clinic announcement", "Google Business", ["16:9", "1:1"], ["All"], "Local visibility", ["background", "headline", "cta", "logo", "disclaimer"], "simple", ["clinic hours", "holiday", "announcement"], "#0F766E", "#CCFBF1"),
  template("all-review-request", "Review request card", "Post-consultation review request that stays polite and non-incentivized.", "Review request", "WhatsApp", ["1:1"], ["All"], "Trust", ["headline", "cta", "logo", "disclaimer"], "warm", ["review", "feedback", "trust"], "#EA580C", "#FFEDD5"),
  template("all-service-menu", "Clinic service menu", "Dense service list card for local discovery and enquiry generation.", "Service explainer", "Poster", ["1:1", "4:5"], ["All"], "Local visibility", ["background", "headline", "cta", "logo", "disclaimer"], "premium", ["services", "local seo", "appointments"], "#111827", "#E5E7EB"),
];

export function filterTemplateCatalog(filters: TemplateCatalogFilters = {}) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return healthcareTemplates.filter((templateCard) => {
    const specialty = filters.specialty && filters.specialty !== "All" ? filters.specialty : undefined;
    const format = filters.format && filters.format !== "All" ? filters.format : undefined;
    const category = filters.category && filters.category !== "All" ? filters.category : undefined;
    const goal = filters.goal && filters.goal !== "All" ? filters.goal : undefined;

    if (specialty && !templateCard.specialties.includes(specialty) && !templateCard.specialties.includes("All")) return false;
    if (format && templateCard.format !== format) return false;
    if (category && templateCard.category !== category) return false;
    if (goal && templateCard.goal !== goal) return false;
    if (!query) return true;
    return templateSearchText(templateCard).includes(query);
  });
}

export function templateCatalogSummary(templates = healthcareTemplates) {
  return {
    total: templates.length,
    specialties: new Set(templates.flatMap((templateCard) => templateCard.specialties.filter((specialty) => specialty !== "All"))).size,
    carousel: templates.filter((templateCard) => templateCard.format === "Carousel").length,
    appointmentFocused: templates.filter((templateCard) => templateCard.goal === "Appointments").length,
  };
}

function template(
  id: string,
  title: string,
  description: string,
  category: TemplateCategory,
  format: TemplateFormat,
  aspectRatios: TemplateAspectRatio[],
  specialties: TemplateSpecialty[],
  goal: TemplateGoal,
  zones: TemplateElementId[],
  tone: HealthcareTemplate["tone"],
  tags: string[],
  accent: string,
  background: string,
): HealthcareTemplate {
  return {
    id,
    title,
    description,
    category,
    format,
    aspectRatios,
    specialties,
    goal,
    zones,
    tone,
    tags,
    accent,
    background,
  };
}

function templateSearchText(templateCard: HealthcareTemplate) {
  return [
    templateCard.title,
    templateCard.description,
    templateCard.category,
    templateCard.format,
    templateCard.goal,
    templateCard.tone,
    ...templateCard.specialties,
    ...templateCard.tags,
  ].join(" ").toLowerCase();
}
