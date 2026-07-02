import type {
  ContentCampaign,
  ContentItem,
} from "../../lib/praxis-models.ts";
import type { TemplateAspectRatio } from "../templates/template-layout.ts";

export type OperatingStatusId =
  | "plan_ready"
  | "copy_needs_review"
  | "visuals_ready"
  | "final_adjustment_needed"
  | "ready_to_export"
  | "posted";

export type OperatingStatus = {
  id: OperatingStatusId;
  label: string;
  description: string;
  tone: "indigo" | "emerald" | "orange" | "blue" | "slate" | "amber";
};

export type DashboardStatusCard = OperatingStatus & {
  count: number;
  href: string;
};

export type LibraryStatusRow = {
  item: ContentItem;
  status: OperatingStatus;
  templateName: string;
  aspectRatio: TemplateAspectRatio;
  visualStatus: "template background" | "signed visual";
  layoutStatus: "default layout" | "layout adjusted";
  href: string;
};

export type CalendarOperatingDay = {
  itemId: string;
  dayOffset: number;
  title: string;
  scheduledDate: string;
  status: OperatingStatus;
  cardMode: "full" | "placeholder";
  locked: boolean;
  href: string;
};

export type OperatingNextAction = {
  label: string;
  href: string;
  status: OperatingStatus;
};

export type OperatingStatusModel = {
  campaign?: ContentCampaign;
  dashboardCards: DashboardStatusCard[];
  libraryRows: LibraryStatusRow[];
  calendarDays: CalendarOperatingDay[];
  nextAction: OperatingNextAction;
};

const statuses: Record<OperatingStatusId, OperatingStatus> = {
  plan_ready: {
    id: "plan_ready",
    label: "Plan ready",
    description: "Review the generated campaign plan and unlock Week 1.",
    tone: "indigo",
  },
  copy_needs_review: {
    id: "copy_needs_review",
    label: "Copy needs review",
    description: "Run compliance review and approve patient-facing copy.",
    tone: "amber",
  },
  visuals_ready: {
    id: "visuals_ready",
    label: "Visuals ready",
    description: "Approved copy can move into deterministic visual assembly.",
    tone: "blue",
  },
  final_adjustment_needed: {
    id: "final_adjustment_needed",
    label: "Final adjustment needed",
    description: "A visual exists; save template-safe final positioning.",
    tone: "orange",
  },
  ready_to_export: {
    id: "ready_to_export",
    label: "Ready to export",
    description: "Copy, layout, and visual package are ready for manual export.",
    tone: "emerald",
  },
  posted: {
    id: "posted",
    label: "Posted",
    description: "Content has been marked as posted.",
    tone: "slate",
  },
};

export function itemOperatingStatus(
  item: ContentItem,
  input: {
    hasVisual?: boolean;
    layoutAdjusted?: boolean;
  } = {},
): OperatingStatus {
  if (item.status === "posted") {
    return statuses.posted;
  }
  if (item.complianceStatus !== "passed" || (item.status !== "designed" && item.status !== "posted")) {
    return statuses.copy_needs_review;
  }
  if (input.layoutAdjusted) {
    return statuses.ready_to_export;
  }
  if (input.hasVisual) {
    return statuses.final_adjustment_needed;
  }
  return statuses.visuals_ready;
}

export function buildOperatingStatusModel(input: {
  campaign?: ContentCampaign;
  items: ContentItem[];
  visualItemIds?: Set<string>;
  layoutAdjustedItemIds?: Set<string>;
  aspectRatioByItemId?: Record<string, TemplateAspectRatio | undefined>;
}): OperatingStatusModel {
  const visualItemIds = input.visualItemIds ?? new Set<string>();
  const layoutAdjustedItemIds = input.layoutAdjustedItemIds ?? new Set<string>();
  const aspectRatioByItemId = input.aspectRatioByItemId ?? {};
  const libraryRows = input.items
    .slice()
    .sort((left, right) => left.dayOffset - right.dayOffset)
    .map((item) => {
      const hasVisual = visualItemIds.has(item.id);
      const layoutAdjusted = layoutAdjustedItemIds.has(item.id);
      return {
        item,
        status: itemOperatingStatus(item, { hasVisual, layoutAdjusted }),
        templateName: "Clinic education card",
        aspectRatio: aspectRatioByItemId[item.id] ?? "1:1",
        visualStatus: hasVisual ? "signed visual" : "template background",
        layoutStatus: layoutAdjusted ? "layout adjusted" : "default layout",
        href: `/content/${item.id}`,
      } satisfies LibraryStatusRow;
    });
  const counts = new Map<OperatingStatusId, number>();
  for (const row of libraryRows) {
    counts.set(row.status.id, (counts.get(row.status.id) ?? 0) + 1);
  }
  if (input.campaign && input.items.length > 0) {
    counts.set("plan_ready", Math.max(0, 1 - (counts.get("plan_ready") ?? 0)));
  }

  const dashboardCards = operatingStatusOrder.map((id) => ({
    ...statuses[id],
    count: counts.get(id) ?? 0,
    href: hrefForStatus(id, input.campaign?.id ?? "active"),
  }));
  const calendarDays: CalendarOperatingDay[] = libraryRows.map((row) => ({
    itemId: row.item.id,
    dayOffset: row.item.dayOffset,
    title: row.item.title,
    scheduledDate: row.item.scheduledDate,
    status: row.status,
    cardMode: row.status.id === "copy_needs_review" ? "placeholder" : "full",
    locked: row.item.dayOffset >= 7 && row.status.id !== "posted",
    href: row.href,
  }));

  return {
    campaign: input.campaign,
    dashboardCards,
    libraryRows,
    calendarDays,
    nextAction: nextActionForRows(input.campaign, libraryRows),
  };
}

export function statusTone(statusId: OperatingStatusId) {
  return statuses[statusId].tone;
}

export function operatingStatusById(statusId: OperatingStatusId) {
  return statuses[statusId];
}

const operatingStatusOrder: OperatingStatusId[] = [
  "plan_ready",
  "copy_needs_review",
  "visuals_ready",
  "final_adjustment_needed",
  "ready_to_export",
  "posted",
];

function nextActionForRows(
  campaign: ContentCampaign | undefined,
  rows: LibraryStatusRow[],
): OperatingNextAction {
  const campaignId = campaign?.id ?? "active";
  if (!campaign) {
    return {
      label: "Create 30-Day Plan",
      href: "/campaigns/new",
      status: statuses.plan_ready,
    };
  }
  const firstActionable = rows.find((row) => row.status.id !== "posted");
  if (!firstActionable) {
    return {
      label: "Review Calendar",
      href: "/calendar",
      status: statuses.posted,
    };
  }
  const weekId = `week-${Math.floor(firstActionable.item.dayOffset / 7) + 1}`;
  if (firstActionable.status.id === "copy_needs_review") {
    return {
      label: `Review Week ${weekId.replace("week-", "")} Copy`,
      href: `/campaigns/${campaignId}/weeks/${weekId}/copy`,
      status: firstActionable.status,
    };
  }
  if (firstActionable.status.id === "visuals_ready") {
    return {
      label: `Open Week ${weekId.replace("week-", "")} Visual Pack`,
      href: `/campaigns/${campaignId}/weeks/${weekId}/visuals`,
      status: firstActionable.status,
    };
  }
  if (firstActionable.status.id === "final_adjustment_needed") {
    return {
      label: `Open Week ${weekId.replace("week-", "")} Final Adjuster`,
      href: `/campaigns/${campaignId}/weeks/${weekId}/adjust`,
      status: firstActionable.status,
    };
  }
  return {
    label: `Export Week ${weekId.replace("week-", "")}`,
    href: `/campaigns/${campaignId}/weeks/${weekId}/export`,
    status: firstActionable.status,
  };
}

function hrefForStatus(statusId: OperatingStatusId, campaignId: string) {
  if (statusId === "plan_ready") {
    return `/campaigns/${campaignId}/overview`;
  }
  if (statusId === "copy_needs_review") {
    return `/campaigns/${campaignId}/weeks/week-1/copy`;
  }
  if (statusId === "visuals_ready") {
    return `/campaigns/${campaignId}/weeks/week-1/visuals`;
  }
  if (statusId === "final_adjustment_needed") {
    return `/campaigns/${campaignId}/weeks/week-1/adjust`;
  }
  if (statusId === "ready_to_export") {
    return `/campaigns/${campaignId}/weeks/week-1/export`;
  }
  return "/calendar";
}
