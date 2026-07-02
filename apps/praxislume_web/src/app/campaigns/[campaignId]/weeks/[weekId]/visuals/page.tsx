"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ImageIcon, Layers3, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";
import { buildWeeklyCopyModel } from "@/features/campaigns/weekly-copy-workflow";
import { buildVisualPackModel, selectedVisualStorageKey, type VisualPackStatus } from "@/features/campaigns/visual-pack-workflow";

export default function WeeklyVisualsPage() {
  const params = useParams<{ campaignId?: string; weekId?: string }>();
  const { activeVisualAsset, activeVisualItemId, config, generateVisualAsset, message, state, status } = usePraxis();
  const activeWeekId = params.weekId ?? "week-1";
  const campaignId = params.campaignId ?? state.campaign?.id ?? "active";
  const selectionStorageKey = selectedVisualStorageKey(campaignId, activeWeekId);
  const [selectedVisualItemId, setSelectedVisualItemId] = useState<string>();
  const weekModel = buildWeeklyCopyModel({ campaignId, weekId: activeWeekId, items: state.items });
  const isGenerating = status === "generating";
  const generatedAssetsByItemId =
    activeVisualAsset?.signedUrl && activeVisualItemId ? { [activeVisualItemId]: activeVisualAsset.signedUrl } : {};
  const visualPack = buildVisualPackModel({
    week: weekModel,
    enableVisualPilot: config.enableVisualPilot,
    generatedAssetsByItemId,
    providerMessage: message,
    isGenerating,
    preAiPreview: true,
    clinicName: state.clinic?.name,
    primaryColor: state.brandKit.primaryColor,
    accentColor: state.brandKit.accentColor,
  });
  const flow = buildCampaignFlowModel({
    state,
    activeStage: "visual_pack",
    activeWeekId,
    visualReady: visualPack.canOpenAdjuster,
  });
  const currentSelectedVisualItemId = selectedVisualItemId ?? readSelectedVisual(selectionStorageKey) ?? visualPack.slots[0]?.itemId;

  function selectVisual(itemId: string) {
    window.localStorage.setItem(selectionStorageKey, itemId);
    setSelectedVisualItemId(itemId);
  }

  return (
    <AppShell
      title="Weekly Visual Pack"
      subtitle="Create restricted visuals only after copy approval. Template text stays deterministic."
      action={
        <Button onClick={() => void generateWeekVisuals()} disabled={!visualPack.canGenerate}>
          <ImageIcon className="h-4 w-4" /> {visualPack.canGenerate ? "Create Visual Pack" : visualPackActionLabel(visualPack.status)}
        </Button>
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stage 5"
        title="Visual pack for approved copy"
        description="Create restricted branded backgrounds and deterministic overlays. If the visual pilot is off, the template preview still moves forward."
        nextAction={
          visualPack.canOpenAdjuster ? (
            <Link href={`/campaigns/${campaignId}/weeks/${activeWeekId}/adjust`}>
              <Button variant="teal">
                <SlidersHorizontal className="h-4 w-4" /> Open Final Adjuster
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled>
              <SlidersHorizontal className="h-4 w-4" /> Final Adjust Locked
            </Button>
          )
        }
        preview={
          <CampaignPreviewPanel
            activeStage="visual_pack"
            campaign={state.campaign}
            clinic={state.clinic}
            doctor={state.doctor}
            brandKit={state.brandKit}
            items={weekModel.items.map(({ item }) => item)}
            visualReady={visualPack.canOpenAdjuster}
          />
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge tone={visualPackTone(visualPack.status)}>{visualPackStatusLabel(visualPack.status)}</Badge>
                  <h2 className="mt-3 font-display text-xl font-extrabold text-slate-950">Week {weekModel.weekNumber} visual outputs</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{visualPack.notice}</p>
                </div>
                <Button onClick={() => void generateWeekVisuals()} disabled={!visualPack.canGenerate}>
                  <ImageIcon className="h-4 w-4" /> Create Visual Pack
                </Button>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visualPack.slots.map((slot) => (
                <Card key={slot.itemId} className="overflow-hidden">
                  <div className="preview-grid relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-indigo-100 p-4">
                    {slot.signedUrl || slot.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={slot.signedUrl ?? slot.thumbnailUrl} className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-teal-900">{state.clinic?.name ?? "PraxisLume Clinic"}</span>
                        <Badge tone={slot.backgroundState === "generated" ? "emerald" : "slate"}>
                          {slot.backgroundState === "generated" ? "background ready" : slot.backgroundState === "deterministic_preview" ? "pre-AI thumbnail" : "template fallback"}
                        </Badge>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-4 shadow-xl">
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">{slot.dayLabel}</p>
                        <h3 className="mt-2 font-display text-xl font-extrabold leading-tight text-slate-950">{slot.headline}</h3>
                        <div className="mt-4 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-extrabold text-white">{slot.cta || state.brandKit.defaultCta}</div>
                        <p className="mt-3 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-500">
                          {slot.disclaimer || state.brandKit.disclaimer}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="text-xs font-bold text-slate-500">
                      {slot.backgroundState === "generated" ? "AI background + deterministic overlay" : "Deterministic pre-AI preview"}
                    </div>
                    <Button variant={currentSelectedVisualItemId === slot.itemId ? "teal" : "secondary"} onClick={() => selectVisual(slot.itemId)}>
                      <ImageIcon className="h-4 w-4" /> {currentSelectedVisualItemId === slot.itemId ? "Selected" : "Use Thumbnail"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <Layers3 className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-3 font-display text-lg font-extrabold">Visual limits</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>{visualPack.generatedVisualCount}/{visualPack.maxWeeklyVisualSets} original visual sets used this week.</p>
                <p>Max 1 carousel per week, 3-5 slides.</p>
                <p>Only successful jobs consume allowance.</p>
              </div>
            </Card>
            <Card className="p-5">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h2 className="mt-3 font-display text-lg font-extrabold">Visual state</h2>
              <p className="mt-2 text-sm text-slate-500">{visualPack.notice}</p>
              <Button
                className="mt-5 w-full"
                onClick={() => void generateWeekVisuals()}
                disabled={!visualPack.canGenerate}
              >
                <ImageIcon className="h-4 w-4" /> {visualPack.canGenerate ? "Create Visual Pack" : visualPackActionLabel(visualPack.status)}
              </Button>
              {visualPack.canUseFallback ? (
                <Link href={`/campaigns/${campaignId}/weeks/${activeWeekId}/adjust`}>
                  <Button className="mt-3 w-full" variant="teal">
                    <SlidersHorizontal className="h-4 w-4" /> Open Final Adjuster
                  </Button>
                </Link>
              ) : null}
            </Card>
            <Card className="p-5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <h2 className="mt-3 font-display text-lg font-extrabold">Safety boundary</h2>
              <p className="mt-2 text-sm text-slate-500">No readable provider text, patient faces, before/after claims, or provider URLs are exposed in the browser. PraxisLume renders clinic text, CTA, and disclaimer deterministically.</p>
            </Card>
          </div>
        </div>
      </CampaignConveyorShell>
    </AppShell>
  );

  async function generateWeekVisuals() {
    if (!visualPack.canGenerate) return;
    const remaining = Math.max(0, visualPack.maxWeeklyVisualSets - visualPack.generatedVisualCount);
    const slots = visualPack.slots.filter((slot) => slot.backgroundState === "fallback").slice(0, remaining);
    for (const slot of slots) {
      await generateVisualAsset(slot.itemId);
    }
  }
}

function readSelectedVisual(storageKey: string) {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(storageKey) ?? undefined;
}

function visualPackTone(status: VisualPackStatus): "indigo" | "emerald" | "orange" | "slate" | "amber" {
  if (status === "ready") return "indigo";
  if (status === "pre_ai_preview") return "emerald";
  if (status === "generating") return "indigo";
  if (status === "provider_disabled") return "slate";
  if (status === "quota_exhausted" || status === "provider_error") return "orange";
  return "amber";
}

function visualPackStatusLabel(status: VisualPackStatus) {
  const labels: Record<VisualPackStatus, string> = {
    copy_required: "copy approval required",
    pre_ai_preview: "pre-AI preview ready",
    provider_disabled: "visual pilot disabled",
    quota_exhausted: "weekly quota used",
    provider_error: "provider fallback",
    generating: "generating",
    ready: "ready for visuals",
  };
  return labels[status];
}

function visualPackActionLabel(status: VisualPackStatus) {
  if (status === "copy_required") return "Approve Copy First";
  if (status === "pre_ai_preview") return "Pre-AI Preview";
  if (status === "provider_disabled") return "Pilot Disabled";
  if (status === "quota_exhausted") return "Quota Used";
  if (status === "provider_error") return "Use Fallback Preview";
  if (status === "generating") return "Creating...";
  return "Create Visual Pack";
}
