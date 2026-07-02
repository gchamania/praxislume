import type { ContentItem } from "../../lib/praxis-models.ts";

export type WeeklyCopyItemState =
  | "missing_copy"
  | "compliance_needed"
  | "ready_to_approve"
  | "approved"
  | "blocked";

export type WeeklyCopyItem = {
  item: ContentItem;
  dayLabel: string;
  state: WeeklyCopyItemState;
  canApprove: boolean;
};

export type WeeklyCopyModel = {
  campaignId: string;
  weekId: string;
  weekNumber: number;
  items: WeeklyCopyItem[];
  total: number;
  approvedCount: number;
  blockedCount: number;
  needsComplianceCount: number;
  canApproveWeek: boolean;
  canOpenVisualPack: boolean;
  visualLockReason: string;
  visualsHref: string;
};

export function getWeekItems(items: ContentItem[], weekId: string): ContentItem[] {
  const weekIndex = weekIndexFromId(weekId);
  return items
    .filter((item) => Math.floor(item.dayOffset / 7) === weekIndex)
    .sort((left, right) => left.dayOffset - right.dayOffset);
}

export function buildWeeklyCopyModel(input: {
  campaignId: string;
  weekId: string;
  items: ContentItem[];
}): WeeklyCopyModel {
  const weekNumber = weekIndexFromId(input.weekId) + 1;
  const items = getWeekItems(input.items, input.weekId).map((item) => {
    const state = itemState(item);
    return {
      item,
      dayLabel: `Day ${item.dayOffset + 1}`,
      state,
      canApprove: state === "ready_to_approve" || state === "approved",
    };
  });
  const approvedCount = items.filter(({ state }) => state === "approved").length;
  const blockedCount = items.filter(({ state }) => state === "blocked").length;
  const needsComplianceCount = items.filter(({ state }) => state === "missing_copy" || state === "compliance_needed").length;
  const allCompliancePassed = items.length > 0 && items.every(({ item }) => item.complianceStatus === "passed");
  const canApproveWeek = allCompliancePassed && blockedCount === 0;
  const canOpenVisualPack = canApproveWeek && items.every(({ item }) => item.status === "designed" || item.status === "posted");

  return {
    campaignId: input.campaignId,
    weekId: input.weekId,
    weekNumber,
    items,
    total: items.length,
    approvedCount,
    blockedCount,
    needsComplianceCount,
    canApproveWeek,
    canOpenVisualPack,
    visualLockReason: visualLockReason({ total: items.length, blockedCount, needsComplianceCount, canApproveWeek }),
    visualsHref: `/campaigns/${input.campaignId}/weeks/${input.weekId}/visuals`,
  };
}

export function hasPatientIdentifiableText(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    /\b(patient|pt|case)\s+[a-z][a-z]+\s+[a-z][a-z]+\b/i,
    /\b\d{10}\b/,
    /\b(mrn|uhid|medical record|aadhaar|aadhar|passport)\b/i,
    /\b(report|scan|lab result|prescription)\s+(of|for)\s+[a-z][a-z]+/i,
  ].some((pattern) => pattern.test(normalized));
}

function itemState(item: ContentItem): WeeklyCopyItemState {
  if (item.complianceStatus === "blocked") {
    return "blocked";
  }
  if (!item.caption.trim()) {
    return "missing_copy";
  }
  if (item.complianceStatus !== "passed") {
    return "compliance_needed";
  }
  if (item.status === "designed" || item.status === "posted") {
    return "approved";
  }
  return "ready_to_approve";
}

function visualLockReason(input: {
  total: number;
  blockedCount: number;
  needsComplianceCount: number;
  canApproveWeek: boolean;
}) {
  if (input.total === 0) {
    return "Generate this week's copy before visual creation.";
  }
  if (input.blockedCount > 0) {
    return "Resolve blocked compliance items before visual creation.";
  }
  if (input.needsComplianceCount > 0) {
    return "Run compliance review before visual creation.";
  }
  if (!input.canApproveWeek) {
    return "Approve the full week before visual creation.";
  }
  return "Visual creation is unlocked for this week.";
}

function weekIndexFromId(weekId: string) {
  const match = /^week-(\d+)$/.exec(weekId);
  const weekNumber = match ? Number(match[1]) : 1;
  return Math.max(0, weekNumber - 1);
}
