import type {
  BrandKit,
  ClinicProfile,
  ContentItem,
  DoctorProfile,
} from "../../lib/praxis-models.ts";

export type ContentPackagePlatform = "instagram_post" | "reel_caption" | "whatsapp_share" | "clinic_handout";

export type ContentPackageItem = {
  itemId: string;
  dayLabel: string;
  thumbnailUrl: string;
  thumbnailLabel: string;
  caption: string;
  hashtags: string[];
  cta: string;
  disclaimer: string;
  platformCopy: Record<ContentPackagePlatform, string>;
};

export function createContentPackageStorageKey(campaignId: string, itemId: string) {
  return `praxislume-content-package-${campaignId}-${itemId}`;
}

export function buildContentPackageItem(input: {
  item: ContentItem;
  dayLabel: string;
  clinic: ClinicProfile;
  doctor: DoctorProfile;
  brandKit: BrandKit;
  thumbnailUrl?: string;
  thumbnailLabel?: string;
  serializedDraft?: string | null;
}): ContentPackageItem {
  const draft = parseContentPackageDraft(input.serializedDraft);
  const caption = draft?.caption ?? input.item.caption;
  const hashtags = draft?.hashtags ?? defaultHashtags(input.item, input.clinic, input.doctor);
  const cta = draft?.cta ?? (input.item.shortCta || input.brandKit.defaultCta);
  const disclaimer = draft?.disclaimer ?? (input.item.disclaimer || input.brandKit.disclaimer);
  const base: ContentPackageItem = {
    itemId: input.item.id,
    dayLabel: input.dayLabel,
    thumbnailUrl: draft?.thumbnailUrl ?? input.thumbnailUrl ?? "",
    thumbnailLabel: draft?.thumbnailLabel ?? input.thumbnailLabel ?? "Template preview",
    caption,
    hashtags,
    cta,
    disclaimer,
    platformCopy: {
      instagram_post: "",
      reel_caption: "",
      whatsapp_share: "",
      clinic_handout: "",
    },
  };

  return {
    ...base,
    platformCopy: {
      instagram_post: [caption, "", hashtags.map((tag) => `#${tag}`).join(" "), "", cta, disclaimer].filter(Boolean).join("\n"),
      reel_caption: [input.item.reelHook || input.item.title, caption, hashtags.slice(0, 6).map((tag) => `#${tag}`).join(" "), cta].filter(Boolean).join("\n"),
      whatsapp_share: [`${input.clinic.name}: ${input.item.title}`, caption, cta, disclaimer].filter(Boolean).join("\n\n"),
      clinic_handout: [`${input.item.title}`, `By ${input.doctor.name}, ${input.clinic.name}`, caption, `Action: ${cta}`, disclaimer].filter(Boolean).join("\n\n"),
    },
  };
}

export function serializeContentPackageDraft(item: Pick<ContentPackageItem, "thumbnailUrl" | "thumbnailLabel" | "caption" | "hashtags" | "cta" | "disclaimer">) {
  return JSON.stringify({
    thumbnailUrl: item.thumbnailUrl,
    thumbnailLabel: item.thumbnailLabel,
    caption: item.caption,
    hashtags: item.hashtags,
    cta: item.cta,
    disclaimer: item.disclaimer,
  });
}

export function parseContentPackageDraft(serialized: string | null | undefined): Pick<ContentPackageItem, "thumbnailUrl" | "thumbnailLabel" | "caption" | "hashtags" | "cta" | "disclaimer"> | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as Partial<ContentPackageItem>;
    if (!parsed.caption || !Array.isArray(parsed.hashtags)) return undefined;
    return {
      thumbnailUrl: typeof parsed.thumbnailUrl === "string" ? parsed.thumbnailUrl : "",
      thumbnailLabel: typeof parsed.thumbnailLabel === "string" ? parsed.thumbnailLabel : "Template preview",
      caption: parsed.caption,
      hashtags: parsed.hashtags.filter((tag): tag is string => typeof tag === "string").slice(0, 14),
      cta: typeof parsed.cta === "string" ? parsed.cta : "",
      disclaimer: typeof parsed.disclaimer === "string" ? parsed.disclaimer : "",
    };
  } catch {
    return undefined;
  }
}

function defaultHashtags(item: ContentItem, clinic: ClinicProfile, doctor: DoctorProfile) {
  const seed = [
    doctor.specialty,
    clinic.city,
    clinic.locality,
    ...clinic.services.slice(0, 3),
    ...item.title.split(/\s+/).slice(0, 4),
    "PatientEducation",
    "ClinicCare",
  ];
  const seen = new Set<string>();
  return seed
    .map((value) => value.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean)
    .map((value) => value.slice(0, 24))
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}
