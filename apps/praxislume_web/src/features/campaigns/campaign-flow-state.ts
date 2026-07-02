import type { ContentItem, PraxisState } from "../../lib/praxis-models.ts";
import {
  conveyorStages,
  stageStatuses,
  stageIndex,
  type ConveyorStageId,
  type ConveyorStageWithStatus,
  type ConveyorStageStatus,
} from "../generation/conveyor-flow.ts";

export type CampaignWeekStatus = "locked" | "ready" | "current" | "needs_review" | "complete" | "failed";

export type CampaignWeek = {
  id: string;
  index: number;
  label: string;
  href: string;
  status: CampaignWeekStatus;
  items: ContentItem[];
};

export type CampaignFlowModel = {
  hasCampaign: boolean;
  campaignId?: string;
  activeStage: ConveyorStageId;
  stages: ConveyorStageWithStatus[];
  weeks: CampaignWeek[];
};

export function buildCampaignFlowModel(input: {
  state: PraxisState;
  activeStage?: ConveyorStageId;
  activeWeekId?: string;
  visualReady?: boolean;
  layoutAdjusted?: boolean;
  exported?: boolean;
  failedStage?: ConveyorStageId;
}): CampaignFlowModel {
  const campaign = input.state.campaign;
  const activeStage = input.activeStage ?? (campaign ? "thirty_day_plan" : "campaign_setup");
  const activeWeekId = input.activeWeekId ?? "week-1";

  if (!campaign) {
    return {
      hasCampaign: false,
      activeStage: "campaign_setup",
      stages: stageStatuses("campaign_setup"),
      weeks: [],
    };
  }

  const weekCount = Math.max(1, Math.ceil(campaign.durationDays / 7));
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const id = `week-${index + 1}`;
    const items = input.state.items.filter((item) => Math.floor(item.dayOffset / 7) === index);
    const status = weekStatus({
      weekIndex: index,
      items,
      activeWeekId,
      weekId: id,
      exported: input.exported,
    });
    return {
      id,
      index,
      label: `Week ${index + 1}`,
      href: `/campaigns/${campaign.id}/weeks/${id}/copy`,
      status,
      items,
    };
  });

  return {
    hasCampaign: true,
    campaignId: campaign.id,
    activeStage,
    stages: stageStatusesForFlow({
      activeStage,
      visualReady: input.visualReady,
      layoutAdjusted: input.layoutAdjusted,
      exported: input.exported,
      failedStage: input.failedStage,
    }),
    weeks,
  };
}

export function stageStatusesForFlow(input: {
  activeStage: ConveyorStageId;
  visualReady?: boolean;
  layoutAdjusted?: boolean;
  exported?: boolean;
  failedStage?: ConveyorStageId;
}): ConveyorStageWithStatus[] {
  const activeIndex = Math.max(0, stageIndex(input.activeStage));
  const failedIndex = input.failedStage ? stageIndex(input.failedStage) : -1;
  return conveyorStages.map((stage, index) => {
    let status: ConveyorStageStatus;
    if (index < activeIndex) {
      status = "complete";
    } else if (index === activeIndex) {
      status = "current";
    } else if (failedIndex === index) {
      status = "failed";
    } else if (index === activeIndex + 1) {
      status = nextStageStatus(stage.id, input);
    } else {
      status = "locked";
    }
    return { ...stage, status };
  });
}

function nextStageStatus(
  stageId: ConveyorStageId,
  input: {
    visualReady?: boolean;
    layoutAdjusted?: boolean;
    exported?: boolean;
  },
): ConveyorStageStatus {
  if (stageId === "final_adjust" && !input.visualReady) {
    return "locked";
  }
  if (stageId === "export" && !input.layoutAdjusted) {
    return "locked";
  }
  if (stageId === "calendar" && !input.exported) {
    return "locked";
  }
  return "ready";
}

function weekStatus(input: {
  weekIndex: number;
  weekId: string;
  activeWeekId: string;
  items: ContentItem[];
  exported?: boolean;
}): CampaignWeekStatus {
  if (input.weekIndex > 0) {
    return "locked";
  }
  if (input.items.length === 0) {
    return "ready";
  }
  if (input.exported) {
    return "complete";
  }
  if (input.items.some((item) => item.complianceStatus === "blocked")) {
    return "failed";
  }
  if (input.items.every((item) => item.status === "designed" || item.status === "posted")) {
    return "complete";
  }
  if (input.items.some((item) => item.status === "drafted" || item.status === "idea")) {
    return "needs_review";
  }
  return input.weekId === input.activeWeekId ? "current" : "ready";
}
