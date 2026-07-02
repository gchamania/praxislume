import type {
  BrandKit,
  ClinicProfile,
  ContentItem,
  DoctorProfile,
} from "../../lib/praxis-models.ts";
import {
  buildWeeklyCopyModel,
} from "../campaigns/weekly-copy-workflow.ts";
import {
  buildContentPackageItem,
  type ContentPackageItem,
} from "./content-package.ts";
import {
  createDefaultTemplateLayout,
  hydrateTemplateLayout,
  type TemplateAspectRatio,
  type TemplateLayout,
} from "../templates/template-layout.ts";

export type WeeklyExportStatus = "copy_required" | "layout_required" | "ready";

export type WeeklyExportAsset = {
  itemId: string;
  dayLabel: string;
  headline: string;
  aspectRatio: TemplateAspectRatio;
  filename: string;
  copyText: string;
  svg: string;
  layoutAdjusted: boolean;
  backgroundState: "fallback" | "signed_readback";
  signedReadbackUrl?: string;
};

export type WeeklyExportPackage = {
  status: WeeklyExportStatus;
  notice: string;
  canExport: boolean;
  canMarkExported: boolean;
  copyText: string;
  manifestJson: string;
  contentPackages: ContentPackageItem[];
  assets: WeeklyExportAsset[];
};

export function buildWeeklyExportPackage(input: {
  campaignId: string;
  weekId: string;
  clinic: ClinicProfile;
  doctor: DoctorProfile;
  brandKit: BrandKit;
  items: ContentItem[];
  layoutOverridesByItemId?: Record<string, string | null | undefined>;
  signedVisualsByItemId?: Record<string, string | undefined>;
  thumbnailUrlsByItemId?: Record<string, string | undefined>;
  contentPackageDraftsByItemId?: Record<string, string | null | undefined>;
}): WeeklyExportPackage {
  const week = buildWeeklyCopyModel({
    campaignId: input.campaignId,
    weekId: input.weekId,
    items: input.items,
  });
  const layoutOverridesByItemId = input.layoutOverridesByItemId ?? {};
  const signedVisualsByItemId = input.signedVisualsByItemId ?? {};
  const thumbnailUrlsByItemId = input.thumbnailUrlsByItemId ?? {};
  const contentPackageDraftsByItemId = input.contentPackageDraftsByItemId ?? {};
  const assets = week.items.map(({ item, dayLabel }) => {
    const serializedLayout = layoutOverridesByItemId[item.id];
    const aspectRatio = aspectRatioFromSerialized(serializedLayout) ?? "1:1";
    const baseLayout = createDefaultTemplateLayout({
      templateId: "clinic-education-card",
      aspectRatio,
    });
    const layout = hydrateTemplateLayout(baseLayout, serializedLayout);
    const signedReadbackUrl = signedVisualsByItemId[item.id];
    const copyText = copyTextForItem({
      item,
      dayLabel,
      clinic: input.clinic,
      brandKit: input.brandKit,
    });

    return {
      itemId: item.id,
      dayLabel,
      headline: item.title,
      aspectRatio: layout.aspectRatio,
      filename: downloadFilename(input.clinic.name, `${dayLabel}-${item.title}`, "svg"),
      copyText,
      svg: renderDeterministicExportSvg({
        layout,
        clinic: input.clinic,
        doctor: input.doctor,
        brandKit: input.brandKit,
        item,
        signedReadbackUrl,
      }),
      layoutAdjusted: Boolean(serializedLayout),
      backgroundState: signedReadbackUrl ? "signed_readback" : "fallback",
      ...(signedReadbackUrl ? { signedReadbackUrl } : {}),
    } satisfies WeeklyExportAsset;
  });
  const contentPackages = week.items.map(({ item, dayLabel }) =>
    buildContentPackageItem({
      item,
      dayLabel,
      clinic: input.clinic,
      doctor: input.doctor,
      brandKit: input.brandKit,
      thumbnailUrl: signedVisualsByItemId[item.id] ?? thumbnailUrlsByItemId[item.id],
      thumbnailLabel: signedVisualsByItemId[item.id] ? "Signed visual readback" : "Pre-AI deterministic thumbnail",
      serializedDraft: contentPackageDraftsByItemId[item.id],
    }),
  );
  const layoutAdjustedCount = assets.filter((asset) => asset.layoutAdjusted).length;
  const status: WeeklyExportStatus = !week.canOpenVisualPack
    ? "copy_required"
    : layoutAdjustedCount === 0
      ? "layout_required"
      : "ready";
  const manifest = {
    campaignId: input.campaignId,
    weekId: input.weekId,
    clinicId: input.clinic.id,
    clinicName: input.clinic.name,
    status,
    generatedAt: "manual-export-preview",
    assets: assets.map((asset) => ({
      itemId: asset.itemId,
      dayLabel: asset.dayLabel,
      headline: asset.headline,
      filename: asset.filename,
      aspectRatio: asset.aspectRatio,
      layoutAdjusted: asset.layoutAdjusted,
      backgroundState: asset.backgroundState,
      signedReadbackUrl: asset.signedReadbackUrl,
    })),
    contentPackages: contentPackages.map((contentPackage) => ({
      itemId: contentPackage.itemId,
      dayLabel: contentPackage.dayLabel,
      thumbnailLabel: contentPackage.thumbnailLabel,
      hashtags: contentPackage.hashtags,
      cta: contentPackage.cta,
    })),
  };

  return {
    status,
    notice: noticeForStatus(status),
    canExport: status === "ready",
    canMarkExported: status === "ready",
    copyText: assets.map((asset) => asset.copyText).join("\n\n---\n\n"),
    manifestJson: JSON.stringify(manifest, null, 2),
    contentPackages,
    assets,
  };
}

export function createExportStorageKey(campaignId: string, itemId: string) {
  return `praxislume-layout-${campaignId}-${itemId}`;
}

export function downloadFilename(clinicName: string, title: string, extension: "json" | "svg" | "txt") {
  const slug = `${clinicName}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92);
  return `${slug || "praxislume-export"}.${extension}`;
}

function renderDeterministicExportSvg(input: {
  layout: TemplateLayout;
  clinic: ClinicProfile;
  doctor: DoctorProfile;
  brandKit: BrandKit;
  item: ContentItem;
  signedReadbackUrl?: string;
}) {
  const { layout, clinic, doctor, brandKit, item, signedReadbackUrl } = input;
  const background = layout.elements.background;
  const logo = layout.elements.logo;
  const headline = layout.elements.headline;
  const cta = layout.elements.cta;
  const disclaimer = layout.elements.disclaimer;
  const headlineText = escapeXml(item.title);
  const ctaText = escapeXml(item.shortCta || brandKit.defaultCta);
  const disclaimerText = escapeXml(item.disclaimer || brandKit.disclaimer);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvas.width}" height="${layout.canvas.height}" viewBox="0 0 ${layout.canvas.width} ${layout.canvas.height}" role="img" aria-label="${headlineText}">`,
    "<defs>",
    `<linearGradient id="plBackground" x1="0" y1="0" x2="${layout.canvas.width}" y2="${layout.canvas.height}">`,
    `<stop offset="0%" stop-color="${escapeXml(brandKit.secondaryColor)}"/>`,
    '<stop offset="54%" stop-color="#ffffff"/>',
    `<stop offset="100%" stop-color="${escapeXml(brandKit.accentColor)}" stop-opacity="0.38"/>`,
    "</linearGradient>",
    "</defs>",
    `<rect width="${layout.canvas.width}" height="${layout.canvas.height}" fill="#f8f9ff"/>`,
    background.visible === false
      ? ""
      : signedReadbackUrl
      ? `<image href="${escapeXml(signedReadbackUrl)}" x="${background.x}" y="${background.y}" width="${background.width}" height="${background.height}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${background.x}" y="${background.y}" width="${background.width}" height="${background.height}" fill="url(#plBackground)"/>`,
    logo.visible === false ? "" : `<rect x="${logo.x}" y="${logo.y}" width="${logo.width}" height="${logo.height}" rx="28" fill="${escapeXml(brandKit.primaryColor)}"/>`,
    logo.visible === false ? "" : `<text x="${logo.x + logo.width / 2}" y="${logo.y + logo.height / 2 + 24}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">${escapeXml(clinic.name.slice(0, 1))}</text>`,
    logo.visible === false ? "" : `<text x="${logo.x + logo.width + 28}" y="${logo.y + 48}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="${escapeXml(brandKit.primaryColor)}">${escapeXml(clinic.name)}</text>`,
    logo.visible === false ? "" : `<text x="${logo.x + logo.width + 28}" y="${logo.y + 88}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#64748b">${escapeXml(clinic.city)} - ${escapeXml(doctor.name)}</text>`,
    headline.visible === false ? "" : foreignText({
      x: headline.x,
      y: headline.y,
      width: headline.width,
      height: headline.height,
      color: "#121c2a",
      fontFamily: headline.fontFamily,
      fontSize: headline.fontSize ?? 76,
      fontWeight: headline.fontWeight ?? 800,
      lineHeight: headline.lineHeight ?? 1.05,
      text: item.title,
      align: headline.align,
    }),
    cta.visible === false ? "" : `<rect x="${cta.x}" y="${cta.y}" width="${cta.width}" height="${cta.height}" rx="32" fill="#5017e9"/>`,
    cta.visible === false ? "" : foreignText({
      x: cta.x,
      y: cta.y,
      width: cta.width,
      height: cta.height,
      color: "#ffffff",
      fontFamily: cta.fontFamily,
      fontSize: cta.fontSize ?? 36,
      fontWeight: cta.fontWeight ?? 800,
      lineHeight: cta.lineHeight ?? 1.1,
      text: ctaText,
      align: cta.align ?? "center",
    }),
    disclaimer.visible === false ? "" : foreignText({
      x: disclaimer.x,
      y: disclaimer.y,
      width: disclaimer.width,
      height: disclaimer.height,
      color: "#475569",
      fontFamily: disclaimer.fontFamily,
      fontSize: disclaimer.fontSize ?? 24,
      fontWeight: disclaimer.fontWeight ?? 500,
      lineHeight: disclaimer.lineHeight ?? 1.15,
      text: disclaimerText,
      align: disclaimer.align,
    }),
    `<text x="${layout.safeMargin}" y="${layout.canvas.height - Math.max(18, layout.safeMargin / 2)}" font-family="Inter, Arial, sans-serif" font-size="20" fill="#64748b">${escapeXml(doctor.name)} - ${escapeXml(doctor.qualifications)}</text>`,
    "</svg>",
  ].join("");
}

function foreignText(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fontFamily?: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  text: string;
  align?: "left" | "center" | "right";
}) {
  return [
    `<foreignObject x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:${justifyContent(input.align)};font-family:${escapeXml(input.fontFamily ?? "Inter")},Arial,sans-serif;font-size:${input.fontSize}px;font-weight:${input.fontWeight};line-height:${input.lineHeight};color:${input.color};text-align:${input.align ?? "left"};">`,
    escapeXml(input.text),
    "</div>",
    "</foreignObject>",
  ].join("");
}

function justifyContent(align: "left" | "center" | "right" | undefined) {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

function copyTextForItem(input: {
  item: ContentItem;
  dayLabel: string;
  clinic: ClinicProfile;
  brandKit: BrandKit;
}) {
  const { item, dayLabel, clinic, brandKit } = input;
  return [
    `${dayLabel}: ${item.title}`,
    "",
    item.caption,
    "",
    `CTA: ${item.shortCta || brandKit.defaultCta}`,
    `Clinic: ${clinic.name}, ${clinic.city}`,
    `Disclaimer: ${item.disclaimer || brandKit.disclaimer}`,
    item.reelScript ? `Reel script: ${item.reelScript}` : "",
  ].filter(Boolean).join("\n");
}

function noticeForStatus(status: WeeklyExportStatus) {
  if (status === "copy_required") {
    return "Approve the full week before export.";
  }
  if (status === "layout_required") {
    return "Save a controlled final adjustment before product export. Deterministic preview files can still be inspected.";
  }
  return "Structured copy, deterministic SVG creatives, and signed visual readback references are ready for manual export.";
}

function aspectRatioFromSerialized(serialized: string | null | undefined): TemplateAspectRatio | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as { aspectRatio?: string };
    return parsed.aspectRatio === "1:1" || parsed.aspectRatio === "4:5" || parsed.aspectRatio === "9:16" || parsed.aspectRatio === "16:9"
      ? parsed.aspectRatio
      : undefined;
  } catch {
    return undefined;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
