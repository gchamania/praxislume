"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";

export default function CampaignOverviewPage() {
  const { state } = usePraxis();
  const campaign = state.campaign;
  const flow = buildCampaignFlowModel({
    state,
    activeStage: campaign ? "thirty_day_plan" : "campaign_setup",
  });
  const weekOneHref = flow.weeks[0]?.href ?? "/campaigns/active/weeks/week-1/copy";

  return (
    <AppShell
      title="Your 30-Day Campaign Plan is Ready"
      subtitle="Prepare the clinic campaign one week at a time so review, visuals, and export stay controlled."
      action={
        <Link href={weekOneHref}>
          <Button>
            Review Plan & Unlock Week 1 <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stage 2"
        title={campaign?.title ?? "Clinic growth campaign"}
        description={campaign?.goal ?? "Create a first campaign plan to unlock weekly work."}
        nextAction={
          <Link href={weekOneHref}>
            <Button>
              Review Plan & Unlock Week 1 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
        preview={
          <CampaignPreviewPanel
            activeStage={campaign ? "thirty_day_plan" : "campaign_setup"}
            campaign={campaign}
            clinic={state.clinic}
            doctor={state.doctor}
            brandKit={state.brandKit}
            items={state.items}
          />
        }
      >
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge tone="indigo">{campaign?.durationDays ?? 30}-day plan</Badge>
              <h2 className="mt-3 font-display text-2xl font-extrabold">Plan review gate</h2>
              <p className="mt-2 text-sm text-slate-500">Review the monthly sequence first. Week 1 copy opens only after this plan review step.</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
              {state.items.length || 0} planned content items
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">Monthly sequence</p>
              <h2 className="mt-2 font-display text-xl font-extrabold text-slate-950">Doctor review before weekly production</h2>
            </div>
            <Badge tone="emerald">Week 1 can unlock</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {state.items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="slate">Day {item.dayOffset + 1}</Badge>
                  <span className="text-xs font-bold text-slate-400">{item.category}</span>
                </div>
                <h3 className="mt-3 font-display text-base font-extrabold text-slate-950">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.objective || item.caption}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-4">
          {flow.weeks.map((week) => {
            const locked = week.status === "locked";
            return (
              <Card key={week.id} className={locked ? "p-5 opacity-80" : "p-5 ring-2 ring-indigo-100"}>
                <div className="flex items-center justify-between">
                  <Badge tone={locked ? "slate" : week.status === "needs_review" ? "amber" : "emerald"}>
                    {locked ? "Locked" : week.status === "needs_review" ? "Needs review" : "Available"}
                  </Badge>
                  {locked ? <Lock className="h-4 w-4 text-slate-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold">{week.label}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {locked ? `Unlocks ${3} days before the week starts.` : `${week.items.length || 7} items ready for copy review.`}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  {locked ? "Future placeholder" : "Starts now"}
                </div>
                {!locked ? (
                  <Link href={week.href}>
                    <Button className="mt-5 w-full">Unlock Week 1 Copy</Button>
                  </Link>
                ) : null}
              </Card>
            );
          })}
        </div>
      </CampaignConveyorShell>
    </AppShell>
  );
}
