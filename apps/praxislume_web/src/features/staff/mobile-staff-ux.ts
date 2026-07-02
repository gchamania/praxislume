import type { ConveyorStage, ConveyorStageId } from "@/features/generation/conveyor-flow";
import type { OperatingStatusId } from "@/features/operations/operating-status";

export type MobileConveyorStage = ConveyorStage & {
  position: "previous" | "current" | "next";
};

export type FinalAdjustSurface = "mobile" | "desktop";

export type FinalAdjustCapabilities = {
  surface: FinalAdjustSurface;
  previewFirst: boolean;
  primaryControls: Array<"move" | "reset" | "aspect_ratio" | "save" | "resize" | "export_preview">;
  canResize: boolean;
  canCrop: boolean;
  canExportPreview: boolean;
};

export type StaffActionIntent = "review" | "export" | "handoff_to_editor" | "plan" | "wait";

export type StaffDefaultAction = {
  label: string;
  href: string;
  intent: StaffActionIntent;
};

export function mobileConveyorWindow(stages: ConveyorStage[], activeStage: ConveyorStageId): MobileConveyorStage[] {
  const activeIndex = Math.max(0, stages.findIndex((stage) => stage.id === activeStage));
  return stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ index }) => index >= activeIndex - 1 && index <= activeIndex + 1)
    .map(({ stage, index }) => ({
      ...stage,
      position: index < activeIndex ? "previous" : index === activeIndex ? "current" : "next",
    }));
}

export function finalAdjustCapabilities(surface: FinalAdjustSurface): FinalAdjustCapabilities {
  if (surface === "mobile") {
    return {
      surface,
      previewFirst: true,
      primaryControls: ["move", "reset", "aspect_ratio", "save"],
      canResize: false,
      canCrop: false,
      canExportPreview: false,
    };
  }

  return {
    surface,
    previewFirst: false,
    primaryControls: ["move", "reset", "aspect_ratio", "resize", "save", "export_preview"],
    canResize: true,
    canCrop: true,
    canExportPreview: true,
  };
}

export function staffDefaultAction(
  statusId: OperatingStatusId,
  campaignId = "active",
  weekId = "week-1",
): StaffDefaultAction {
  if (statusId === "copy_needs_review") {
    return {
      label: "Review copy",
      href: `/campaigns/${campaignId}/weeks/${weekId}/copy`,
      intent: "review",
    };
  }

  if (statusId === "ready_to_export" || statusId === "posted") {
    return {
      label: "Export weekly pack",
      href: `/campaigns/${campaignId}/weeks/${weekId}/export`,
      intent: "export",
    };
  }

  if (statusId === "final_adjustment_needed") {
    return {
      label: "Ask editor to adjust",
      href: `/campaigns/${campaignId}/weeks/${weekId}/adjust`,
      intent: "handoff_to_editor",
    };
  }

  if (statusId === "visuals_ready") {
    return {
      label: "Prepare export",
      href: `/campaigns/${campaignId}/weeks/${weekId}/export`,
      intent: "export",
    };
  }

  if (statusId === "plan_ready") {
    return {
      label: "Open campaign plan",
      href: `/campaigns/${campaignId}/overview`,
      intent: "plan",
    };
  }

  return {
    label: "Wait for doctor approval",
    href: "/dashboard",
    intent: "wait",
  };
}
