"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import { KonvaFinalAdjusterLoader } from "@/features/konva-editor/konva-final-adjuster-loader";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";
import { buildVisualPackModel, selectedVisualStorageKey } from "@/features/campaigns/visual-pack-workflow";
import { buildWeeklyCopyModel } from "@/features/campaigns/weekly-copy-workflow";
import { createExportStorageKey } from "@/features/export/export-workflow";

export default function WeeklyAdjustPage() {
  const params = useParams<{ campaignId?: string; weekId?: string }>();
  const { activeVisualAsset, activeVisualItemId, state } = usePraxis();
  const campaignId = params.campaignId ?? state.campaign?.id ?? "active";
  const weekId = params.weekId ?? "week-1";
  const selectionStorageKey = selectedVisualStorageKey(campaignId, weekId);
  const weekModel = buildWeeklyCopyModel({ campaignId, weekId, items: state.items });
  const generatedAssetsByItemId =
    activeVisualAsset?.signedUrl && activeVisualItemId ? { [activeVisualItemId]: activeVisualAsset.signedUrl } : {};
  const visualPack = buildVisualPackModel({
    week: weekModel,
    enableVisualPilot: false,
    generatedAssetsByItemId,
    preAiPreview: true,
    clinicName: state.clinic?.name,
    primaryColor: state.brandKit.primaryColor,
    accentColor: state.brandKit.accentColor,
  });
  const selectedVisualItemId = readSelectedVisual(selectionStorageKey);
  const selectedSlot = visualPack.slots.find((slot) => slot.itemId === selectedVisualItemId) ?? visualPack.slots[0];
  const item = state.items.find((candidate) => candidate.id === selectedSlot?.itemId) ?? state.items[0];
  const flow = buildCampaignFlowModel({
    state,
    activeStage: "final_adjust",
    activeWeekId: weekId,
    visualReady: true,
  });

  return (
    <AppShell
      title="Final Adjust"
      subtitle="Move approved template zones inside safe bounds. This is not a freeform canvas."
      action={
        <Link href={`/campaigns/${campaignId}/weeks/${weekId}/export`}>
          <Button>
            <Download className="h-4 w-4" /> Export This Week&apos;s Content
          </Button>
        </Link>
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stage 6"
        title="Controlled final adjustment"
        description="Move only approved template zones: headline, CTA, logo, disclaimer, and background crop. Medical text remains structured."
        nextAction={
          <Link href={`/campaigns/${campaignId}/weeks/${weekId}/export`}>
            <Button>
              <Download className="h-4 w-4" /> Export This Week&apos;s Content
            </Button>
          </Link>
        }
        preview={
          <CampaignPreviewPanel
            activeStage="final_adjust"
            campaign={state.campaign}
            clinic={state.clinic}
            doctor={state.doctor}
            brandKit={state.brandKit}
            items={state.items.slice(0, 7)}
            visualReady
          />
        }
      >
        <KonvaFinalAdjusterLoader
          storageKey={createExportStorageKey(state.campaign?.id ?? campaignId, item?.id ?? "item")}
          clinicName={state.clinic?.name ?? "PraxisLume Clinic"}
          headline={item?.title ?? "Patient education made simple"}
          cta={item?.shortCta || state.brandKit.defaultCta}
          disclaimer={item?.disclaimer || state.brandKit.disclaimer}
          backgroundUrl={selectedSlot?.signedUrl ?? selectedSlot?.thumbnailUrl}
          visualLabel={selectedSlot?.thumbnailLabel ?? "Pre-AI deterministic thumbnail"}
        />
      </CampaignConveyorShell>
    </AppShell>
  );
}

function readSelectedVisual(storageKey: string) {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(storageKey) ?? undefined;
}
