export type ConveyorStageId =
  | "campaign_setup"
  | "thirty_day_plan"
  | "week_copy"
  | "copy_approval"
  | "visual_pack"
  | "final_adjust"
  | "export"
  | "calendar";

export type ConveyorStage = {
  id: ConveyorStageId;
  label: string;
  description: string;
};

export type ConveyorStageStatus = "complete" | "current" | "ready" | "needs_review" | "locked" | "failed";

export type ConveyorStageWithStatus = ConveyorStage & {
  status: ConveyorStageStatus;
};

export type CampaignFlowState = {
  hasCampaign: boolean;
  weekCopyReady?: boolean;
  copyApproved?: boolean;
  visualsReady?: boolean;
  layoutAdjusted?: boolean;
  exported?: boolean;
  scheduled?: boolean;
};

export const conveyorStages: ConveyorStage[] = [
  {
    id: "campaign_setup",
    label: "Campaign Setup",
    description: "Choose the clinic goal, topic focus, tone, platforms, and posting frequency.",
  },
  {
    id: "thirty_day_plan",
    label: "30-Day Plan",
    description: "Review the monthly plan shell and unlock Week 1.",
  },
  {
    id: "week_copy",
    label: "Week Copy",
    description: "Generate and review this week of patient-education copy.",
  },
  {
    id: "copy_approval",
    label: "Copy Approval",
    description: "Approve medical wording before visual generation.",
  },
  {
    id: "visual_pack",
    label: "Visual Pack",
    description: "Create restricted branded visuals for approved copy.",
  },
  {
    id: "final_adjust",
    label: "Final Adjust",
    description: "Move template-safe CTA, headline, logo, and image crop zones.",
  },
  {
    id: "export",
    label: "Export",
    description: "Copy captions and download ready-to-post assets.",
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Place approved content into the manual posting calendar.",
  },
];

export function stageForCampaignState(state: CampaignFlowState): ConveyorStage {
  if (!state.hasCampaign) return byId("campaign_setup");
  const weekCopyReady = state.weekCopyReady || state.copyApproved || state.visualsReady || state.layoutAdjusted || state.exported;
  const copyApproved = state.copyApproved || state.visualsReady || state.layoutAdjusted || state.exported;
  const visualsReady = state.visualsReady || state.layoutAdjusted || state.exported;
  if (!weekCopyReady) return byId("thirty_day_plan");
  if (!copyApproved) return byId("copy_approval");
  if (!visualsReady) return byId("visual_pack");
  if (!state.layoutAdjusted) return byId("final_adjust");
  if (!state.exported) return byId("export");
  return byId(state.scheduled ? "calendar" : "export");
}

export function stageIndex(stageId: ConveyorStageId) {
  return conveyorStages.findIndex((stage) => stage.id === stageId);
}

export function stageStatuses(activeStage: ConveyorStageId): ConveyorStageWithStatus[] {
  const activeIndex = Math.max(0, stageIndex(activeStage));
  return conveyorStages.map((stage, index) => ({
    ...stage,
    status: index < activeIndex ? "complete" : index === activeIndex ? "current" : "locked",
  }));
}

function byId(id: ConveyorStageId) {
  return conveyorStages.find((stage) => stage.id === id) ?? conveyorStages[0];
}
