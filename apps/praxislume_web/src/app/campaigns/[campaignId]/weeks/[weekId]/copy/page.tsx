"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, RefreshCcw, ShieldCheck, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";
import { buildWeeklyCopyModel, type WeeklyCopyItemState } from "@/features/campaigns/weekly-copy-workflow";

export default function WeeklyCopyPage() {
  const params = useParams<{ campaignId?: string; weekId?: string }>();
  const {
    generateReelScript,
    regenerateCaption,
    reviewCompliance,
    rewriteTone,
    state,
    updateContentItem,
    status,
  } = usePraxis();
  const activeWeekId = params.weekId ?? "week-1";
  const campaignId = params.campaignId ?? state.campaign?.id ?? "active";
  const weekModel = buildWeeklyCopyModel({ campaignId, weekId: activeWeekId, items: state.items });
  const items = weekModel.items.map(({ item }) => item);
  const isSaving = status === "saving" || status === "generating";
  const flow = buildCampaignFlowModel({
    state,
    activeStage: "copy_approval",
    activeWeekId,
  });

  async function generateWeekCopy() {
    for (const { item } of weekModel.items) {
      await regenerateCaption(item.id);
    }
  }

  async function runComplianceForWeek() {
    for (const { item, state: copyState } of weekModel.items) {
      if (copyState !== "missing_copy" && copyState !== "approved") {
        await reviewCompliance(item.id);
      }
    }
  }

  async function approveWeekCopy() {
    if (!weekModel.canApproveWeek) return;
    for (const { item } of weekModel.items) {
      await updateContentItem(item.id, { status: "designed", complianceStatus: "passed" });
    }
  }

  return (
    <AppShell
      title={`Week ${weekModel.weekNumber} Copy Approval`}
      subtitle="Generate, review, and approve patient-facing wording before visual generation opens."
      action={
        weekModel.canOpenVisualPack ? (
          <Link href={weekModel.visualsHref}>
            <Button>
              Continue to Visual Pack <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button onClick={() => void approveWeekCopy()} disabled={!weekModel.canApproveWeek || isSaving}>
            <CheckCircle2 className="h-4 w-4" /> Approve Copy to Create Visuals
          </Button>
        )
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stages 3-4"
        title="Week 1 copy package"
        description="Review the generated patient-education copy, open individual items for edits, then approve wording before visuals are created."
        nextAction={
          weekModel.canOpenVisualPack ? (
            <Link href={weekModel.visualsHref}>
              <Button>
                Continue to Visual Pack <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button onClick={() => void approveWeekCopy()} disabled={!weekModel.canApproveWeek || isSaving}>
              <CheckCircle2 className="h-4 w-4" /> Approve Copy to Create Visuals
            </Button>
          )
        }
        preview={
          <CampaignPreviewPanel
            activeStage="copy_approval"
            campaign={state.campaign}
            clinic={state.clinic}
            doctor={state.doctor}
            brandKit={state.brandKit}
            items={items}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <CopyMetric label="Week items" value={weekModel.total} tone="indigo" />
          <CopyMetric label="Approved" value={weekModel.approvedCount} tone="emerald" />
          <CopyMetric label="Needs review" value={weekModel.needsComplianceCount} tone="amber" />
          <CopyMetric label="Blocked" value={weekModel.blockedCount} tone="orange" />
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone={weekModel.canOpenVisualPack ? "emerald" : "amber"}>
                {weekModel.canOpenVisualPack ? "Visuals unlocked" : "Copy gate active"}
              </Badge>
              <h2 className="mt-3 font-display text-xl font-extrabold text-slate-950">Weekly copy production</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{weekModel.visualLockReason}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => void generateWeekCopy()} disabled={weekModel.total === 0 || isSaving}>
                <RefreshCcw className="h-4 w-4" /> Generate This Week&apos;s Content
              </Button>
              <Button variant="secondary" onClick={() => void runComplianceForWeek()} disabled={weekModel.total === 0 || isSaving}>
                <ShieldCheck className="h-4 w-4" /> Run Compliance
              </Button>
              <Button onClick={() => void approveWeekCopy()} disabled={!weekModel.canApproveWeek || isSaving}>
                <CheckCircle2 className="h-4 w-4" /> Approve Week
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {weekModel.items.map(({ item, dayLabel, state: copyState }) => (
              <Card key={item.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={copyStateTone(copyState)}>{copyStateLabel(copyState)}</Badge>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{dayLabel}</span>
                    </div>
                    <h2 className="mt-3 font-display text-xl font-extrabold text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.caption || item.objective}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">{item.category}</span>
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">{item.shortCta || state.brandKit.defaultCta}</span>
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">{item.complianceStatus ?? "not reviewed"}</span>
                    </div>
                  </div>
                  <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-64 md:grid-cols-1">
                    <Button variant="secondary" onClick={() => void regenerateCaption(item.id)} disabled={isSaving}>
                      <RefreshCcw className="h-4 w-4" /> Caption
                    </Button>
                    <Button variant="secondary" onClick={() => void generateReelScript(item.id)} disabled={isSaving}>
                      <WandSparkles className="h-4 w-4" /> Reel
                    </Button>
                    <Button variant="secondary" onClick={() => void rewriteTone(item.id)} disabled={isSaving}>
                      <FileText className="h-4 w-4" /> Tone
                    </Button>
                    <Button variant="secondary" onClick={() => void reviewCompliance(item.id)} disabled={isSaving || copyState === "missing_copy"}>
                      <ShieldCheck className="h-4 w-4" /> Review
                    </Button>
                    <Button onClick={() => void updateContentItem(item.id, { status: "designed", complianceStatus: "passed" })} disabled={isSaving || copyState !== "ready_to_approve"}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Link href={`/content/${item.id}`}>
                      <Button variant="secondary" className="w-full">
                        <FileText className="h-4 w-4" /> Open item
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
            {weekModel.items.length === 0 ? (
              <Card className="p-6 text-sm font-semibold text-slate-500">
                No planned items exist for this week yet. Return to campaign setup or plan review to create the weekly sequence.
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-display text-lg font-extrabold">Weekly allowance</h2>
              <p className="mt-2 text-sm text-slate-500">Up to 7 planned items, one full-week regeneration, and two rewrites per item.</p>
              <Button className="mt-5 w-full" variant="secondary" onClick={() => void generateWeekCopy()} disabled={weekModel.total === 0 || isSaving}>
                <RefreshCcw className="h-4 w-4" /> Regenerate week
              </Button>
            </Card>
            <Card className="p-5">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h2 className="mt-3 font-display text-lg font-extrabold">Approval gate</h2>
              <p className="mt-2 text-sm text-slate-500">{weekModel.visualLockReason}</p>
              <Button className="mt-5 w-full" onClick={() => void approveWeekCopy()} disabled={!weekModel.canApproveWeek || isSaving}>
                <CheckCircle2 className="h-4 w-4" /> Approve Copy
              </Button>
              {weekModel.canOpenVisualPack ? (
                <Link href={weekModel.visualsHref}>
                  <Button className="mt-3 w-full" variant="teal">
                    <ArrowRight className="h-4 w-4" /> Open Visual Pack
                  </Button>
                </Link>
              ) : null}
            </Card>
          </div>
        </div>
      </CampaignConveyorShell>
    </AppShell>
  );
}

function CopyMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "emerald" | "amber" | "orange";
}) {
  return (
    <Card className="p-4">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-3 font-display text-3xl font-extrabold text-slate-950">{value}</p>
    </Card>
  );
}

function copyStateTone(state: WeeklyCopyItemState): "indigo" | "emerald" | "orange" | "slate" | "amber" {
  if (state === "approved") return "emerald";
  if (state === "ready_to_approve") return "indigo";
  if (state === "blocked") return "orange";
  if (state === "missing_copy") return "slate";
  return "amber";
}

function copyStateLabel(state: WeeklyCopyItemState) {
  const labels: Record<WeeklyCopyItemState, string> = {
    approved: "copy approved",
    ready_to_approve: "ready to approve",
    blocked: "blocked",
    missing_copy: "needs copy",
    compliance_needed: "needs review",
  };
  return labels[state];
}
