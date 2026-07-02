"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Plus, UserCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";
import { createExportStorageKey } from "@/features/export/export-workflow";
import { ConveyorBelt } from "@/features/generation/conveyor-belt";
import { stageForCampaignState } from "@/features/generation/conveyor-flow";
import { buildOperatingStatusModel } from "@/features/operations/operating-status";
import { staffDefaultAction } from "@/features/staff/mobile-staff-ux";

export default function DashboardPage() {
  const { activeVisualAsset, activeVisualItemId, mode, state, status } = usePraxis();
  const displayName = state.doctor?.name.split(" ")[1] ?? "Doctor";
  const contentItems = state.items;
  const visualItemIds = new Set(activeVisualItemId && activeVisualAsset?.signedUrl ? [activeVisualItemId] : []);
  const layoutAdjustedItemIds = readLayoutAdjustedItemIds(state.campaign?.id ?? "demo", contentItems);
  const operating = buildOperatingStatusModel({
    campaign: state.campaign,
    items: contentItems,
    visualItemIds,
    layoutAdjustedItemIds,
  });
  const hasVisualReady = operating.dashboardCards.some((card) => (card.id === "final_adjustment_needed" || card.id === "ready_to_export" || card.id === "posted") && card.count > 0);
  const hasLayoutAdjusted = operating.dashboardCards.some((card) => (card.id === "ready_to_export" || card.id === "posted") && card.count > 0);
  const dashboardStage = stageForCampaignState({
    hasCampaign: Boolean(state.campaign),
    weekCopyReady: state.items.length > 0,
    copyApproved: operating.dashboardCards.some((card) => card.id !== "plan_ready" && card.id !== "copy_needs_review" && card.count > 0),
    visualsReady: hasVisualReady,
    layoutAdjusted: hasLayoutAdjusted,
  }).id;
  const flow = buildCampaignFlowModel({
    state,
    activeStage: dashboardStage,
    visualReady: hasVisualReady,
    layoutAdjusted: hasLayoutAdjusted,
  });
  const staffAction = staffDefaultAction(operating.nextAction.status.id, state.campaign?.id ?? "active", "week-1");

  return (
    <AppShell
      title={`Good morning, ${displayName}!`}
      subtitle={`Here's your content & growth overview${mode === "demo" ? " (demo mode)" : ""}`}
      action={
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-5 w-5" />
            Create 30-Day Plan
          </Button>
        </Link>
      }
    >
      <div data-layout="adaptive operating cards" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-500">Clinic Conveyor</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Today&apos;s content operating line</h2>
          </div>
          <Badge tone={operating.nextAction.status.tone}>{operating.nextAction.status.label}</Badge>
        </div>
        <ConveyorBelt activeStage={flow.activeStage} stages={flow.stages} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {operating.dashboardCards.slice(0, 4).map((card) => (
          <Link key={card.id} href={card.href}>
            <Card className="flex h-full min-w-0 items-center gap-4 p-5 hover:border-indigo-200 hover:bg-indigo-50/30">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-2xl font-extrabold text-slate-950">{card.count}</span>
                  <Badge tone={card.tone}>{card.label}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{card.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="p-6 xl:col-span-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Conveyor Focus</h2>
            <Badge tone={operating.nextAction.status.tone}>{operating.nextAction.status.label}</Badge>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-extrabold text-indigo-950">{operating.nextAction.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-indigo-700">{operating.nextAction.status.description}</p>
            <Link href={operating.nextAction.href}>
              <Button className="mt-4 w-full">Continue Conveyor</Button>
            </Link>
          </div>
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
              <UserCheck className="h-4 w-4" /> Staff default
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              Reception view favors review, copy, and export before design adjustment.
            </p>
            <Link href={staffAction.href}>
              <Button variant="teal" className="mt-4 w-full">{staffAction.label}</Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Top Content</h2>
            <Link href="/content" className="text-xs font-bold text-indigo-600">View All</Link>
          </div>
          <div className="space-y-3">
            {contentItems.map((item) => {
              const row = operating.libraryRows.find((candidate) => candidate.item.id === item.id);
              return (
                <Link key={item.id} href={`/content/${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.category} - {item.shortCta}</p>
                  </div>
                  <Badge tone={row?.status.tone ?? "slate"}>{row?.status.label ?? item.status}</Badge>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden xl:col-span-3">
          <div className="bg-teal-900 p-6 text-white">
            <CalendarDays className="mb-5 h-9 w-9 text-teal-200" />
            <h2 className="font-display text-xl font-extrabold">30 days of branded medical content in 30 minutes</h2>
            <p className="mt-3 text-sm leading-relaxed text-teal-100">
              {status === "loading"
                ? "Loading clinic workspace..."
                : `Workspace for ${state.clinic?.name ?? "your clinic"}, ${state.clinic?.city ?? "Pune"}.`}
            </p>
          </div>
          <div className="p-6">
            <Link href={operating.nextAction.href}>
              <Button variant="teal" className="w-full">{operating.nextAction.label}</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function readLayoutAdjustedItemIds(campaignId: string, items: { id: string }[]) {
  if (typeof window === "undefined") return new Set<string>();
  return new Set(
    items
      .filter((item) => Boolean(window.localStorage.getItem(createExportStorageKey(campaignId, item.id))))
      .map((item) => item.id),
  );
}
