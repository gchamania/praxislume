import type { CampaignPlanResponse } from "@praxislume/contracts";
import type { ContentItem } from "./praxis-models.ts";

export function contentHash(content: string): string {
  let hash = 0;
  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
  }
  return `web-${hash.toString(16).padStart(8, "0")}`;
}

export function itemsFromCampaignPlan(input: {
  clinicId: string;
  campaignId: string;
  startDate: string;
  disclaimer: string;
  planItems: CampaignPlanResponse["items"];
}): ContentItem[] {
  const start = parseDateOnly(input.startDate);
  return input.planItems.map((item) => {
    const scheduledDate = new Date(start);
    scheduledDate.setUTCDate(start.getUTCDate() + item.dayOffset);

    return {
      id: newId("item"),
      clinicId: input.clinicId,
      campaignId: input.campaignId,
      scheduledDate: scheduledDate.toISOString().slice(0, 10),
      dayOffset: item.dayOffset,
      title: item.title,
      category: item.category,
      status: item.caption ? "drafted" : "idea",
      objective: item.objective,
      keyPoints: item.keyPoints,
      caption: item.caption,
      reelHook: item.reelHook ?? "",
      reelScript: item.reelScript ?? "",
      shortCta: item.shortCta,
      disclaimer: item.disclaimerNeeded ? input.disclaimer : "",
      contentVersionHash: contentHash(item.caption),
    };
  });
}

export function dateOnlyAfter(days: number, base = new Date()): string {
  const date = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

function newId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
