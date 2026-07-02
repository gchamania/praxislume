import type { WeeklyCopyModel } from "./weekly-copy-workflow.ts";

export type VisualPackStatus =
  | "copy_required"
  | "pre_ai_preview"
  | "provider_disabled"
  | "quota_exhausted"
  | "provider_error"
  | "generating"
  | "ready";

export type VisualPackSlot = {
  itemId: string;
  dayLabel: string;
  headline: string;
  cta: string;
  disclaimer: string;
  backgroundState: "deterministic_preview" | "fallback" | "generated";
  thumbnailUrl: string;
  thumbnailLabel: string;
  signedUrl?: string;
};

export type VisualPackModel = {
  status: VisualPackStatus;
  notice: string;
  canGenerate: boolean;
  canUseFallback: boolean;
  canOpenAdjuster: boolean;
  generatedVisualCount: number;
  maxWeeklyVisualSets: number;
  slots: VisualPackSlot[];
};

export function buildVisualPackModel(input: {
  week: WeeklyCopyModel;
  enableVisualPilot: boolean;
  generatedAssetsByItemId?: Record<string, string | undefined>;
  generatedVisualCount?: number;
  maxWeeklyVisualSets?: number;
  providerMessage?: string;
  isGenerating?: boolean;
  preAiPreview?: boolean;
  clinicName?: string;
  primaryColor?: string;
  accentColor?: string;
}): VisualPackModel {
  const generatedAssetsByItemId = input.generatedAssetsByItemId ?? {};
  const generatedVisualCount = input.generatedVisualCount ?? Object.values(generatedAssetsByItemId).filter(Boolean).length;
  const maxWeeklyVisualSets = input.maxWeeklyVisualSets ?? 4;
  const slots = input.week.items.map(({ item, dayLabel }, index) => {
    const signedUrl = generatedAssetsByItemId[item.id];
    const thumbnailUrl = deterministicThumbnailUrl({
      index,
      headline: item.title,
      clinicName: input.clinicName ?? "PraxisLume Clinic",
      primaryColor: input.primaryColor ?? "#5017e9",
      accentColor: input.accentColor ?? "#12afc0",
    });
    return {
      itemId: item.id,
      dayLabel,
      headline: item.title,
      cta: item.shortCta,
      disclaimer: item.disclaimer,
      backgroundState: signedUrl ? "generated" : input.preAiPreview ? "deterministic_preview" : "fallback",
      thumbnailUrl,
      thumbnailLabel: signedUrl ? "Signed visual readback" : input.preAiPreview ? "Pre-AI deterministic thumbnail" : "Template fallback thumbnail",
      ...(signedUrl ? { signedUrl } : {}),
    } satisfies VisualPackSlot;
  });
  const status = visualPackStatus({
    copyApproved: input.week.canOpenVisualPack,
    enableVisualPilot: input.enableVisualPilot,
    generatedVisualCount,
    maxWeeklyVisualSets,
    providerMessage: input.providerMessage,
    isGenerating: input.isGenerating,
    preAiPreview: input.preAiPreview,
  });

  return {
    status,
    notice: noticeForStatus(status),
    canGenerate: status === "ready",
    canUseFallback: input.week.canOpenVisualPack,
    canOpenAdjuster: input.week.canOpenVisualPack,
    generatedVisualCount,
    maxWeeklyVisualSets,
    slots,
  };
}

function visualPackStatus(input: {
  copyApproved: boolean;
  enableVisualPilot: boolean;
  generatedVisualCount: number;
  maxWeeklyVisualSets: number;
  providerMessage?: string;
  isGenerating?: boolean;
  preAiPreview?: boolean;
}): VisualPackStatus {
  if (!input.copyApproved) {
    return "copy_required";
  }
  if (input.preAiPreview) {
    return "pre_ai_preview";
  }
  if (input.isGenerating) {
    return "generating";
  }
  if (input.providerMessage && /quota|limit|locked|exhausted/i.test(input.providerMessage)) {
    return "provider_error";
  }
  if (input.generatedVisualCount >= input.maxWeeklyVisualSets) {
    return "quota_exhausted";
  }
  if (!input.enableVisualPilot) {
    return "provider_disabled";
  }
  if (input.providerMessage && /disabled|error|failed|provider/i.test(input.providerMessage)) {
    return "provider_error";
  }
  return "ready";
}

function noticeForStatus(status: VisualPackStatus) {
  if (status === "copy_required") {
    return "Approve the full week before visual creation.";
  }
  if (status === "pre_ai_preview") {
    return "Pre-AI conveyor test mode is active. Deterministic thumbnails are available without provider calls.";
  }
  if (status === "provider_disabled") {
    return "Visual pilot is disabled. Deterministic template previews are still available.";
  }
  if (status === "quota_exhausted") {
    return "Weekly visual allowance is used. Deterministic template previews are still available.";
  }
  if (status === "provider_error") {
    return "Visual provider could not complete this request. Deterministic template previews are still available.";
  }
  if (status === "generating") {
    return "Creating safe background assets through the backend.";
  }
  return "Visual generation is available. All text, CTA, logo, and disclaimer remain deterministic.";
}

export function selectedVisualStorageKey(campaignId: string, weekId: string) {
  return `praxislume-selected-visual-${campaignId}-${weekId}`;
}

function deterministicThumbnailUrl(input: {
  index: number;
  headline: string;
  clinicName: string;
  primaryColor: string;
  accentColor: string;
}) {
  const palettes = [
    ["#f8fafc", "#dff8f3", input.primaryColor],
    ["#fff7ed", "#e0f2fe", input.accentColor],
    ["#f5f3ff", "#ecfeff", input.primaryColor],
    ["#f0fdf4", "#eef2ff", input.accentColor],
  ];
  const palette = palettes[input.index % palettes.length];
  const safeHeadline = escapeSvg(input.headline.slice(0, 70));
  const safeClinicName = escapeSvg(input.clinicName);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">`,
    "<defs>",
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${palette[0]}"/>`,
    `<stop offset="54%" stop-color="${palette[1]}"/>`,
    `<stop offset="100%" stop-color="${palette[2]}" stop-opacity="0.28"/>`,
    "</linearGradient>",
    "</defs>",
    `<rect width="1080" height="1350" fill="url(#bg)"/>`,
    `<circle cx="${220 + input.index * 34}" cy="260" r="150" fill="${palette[2]}" opacity="0.12"/>`,
    `<circle cx="${860 - input.index * 28}" cy="990" r="210" fill="${input.primaryColor}" opacity="0.10"/>`,
    `<rect x="88" y="92" width="904" height="1166" rx="56" fill="#ffffff" opacity="0.68"/>`,
    `<text x="128" y="184" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="800" fill="${input.primaryColor}">${safeClinicName}</text>`,
    `<text x="128" y="700" font-family="Inter,Arial,sans-serif" font-size="64" font-weight="900" fill="#111827">${safeHeadline}</text>`,
    `<rect x="128" y="1084" width="360" height="96" rx="48" fill="${input.primaryColor}"/>`,
    `<text x="308" y="1145" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="800" fill="#ffffff">CTA zone</text>`,
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
