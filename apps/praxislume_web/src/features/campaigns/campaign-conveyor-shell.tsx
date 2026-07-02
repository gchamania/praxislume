import type { ReactNode } from "react";
import { Bookmark, Sparkles } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { ConveyorBelt } from "@/features/generation/conveyor-belt";
import { conveyorStages, type ConveyorStageId, type ConveyorStageWithStatus } from "@/features/generation/conveyor-flow";
import { mobileConveyorWindow } from "@/features/staff/mobile-staff-ux";

type CampaignConveyorShellProps = {
  activeStage: ConveyorStageId;
  stages?: ConveyorStageWithStatus[];
  eyebrow: string;
  title: string;
  description: string;
  nextAction: ReactNode;
  children: ReactNode;
  preview: ReactNode;
  utilityAction?: ReactNode;
};

export function CampaignConveyorShell({
  activeStage,
  stages,
  eyebrow,
  title,
  description,
  nextAction,
  children,
  preview,
  utilityAction,
}: CampaignConveyorShellProps) {
  const mobileStages = mobileConveyorWindow(stages ?? conveyorStages, activeStage);

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Compact conveyor</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {mobileStages.map((stage) => (
              <div
                key={stage.id}
                className={`min-h-20 rounded-xl border p-3 ${
                  stage.position === "current"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-950"
                    : "border-slate-100 bg-slate-50 text-slate-500"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em]">{stage.position}</p>
                <p className="mt-2 text-xs font-extrabold leading-tight">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <ConveyorBelt activeStage={activeStage} stages={stages} compact />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <Badge tone="indigo">{eyebrow}</Badge>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto">
            {utilityAction ?? (
              <Button variant="secondary">
                <Bookmark className="h-4 w-4" /> Saved Inputs
              </Button>
            )}
            {nextAction}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-5">{children}</div>
        {preview}
      </div>

      <section data-purpose="sticky next action" className="sticky bottom-4 z-10 rounded-2xl border border-indigo-100 bg-indigo-50/95 p-4 shadow-lg shadow-indigo-100/60 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between [&_a]:w-full [&_button]:w-full md:[&_a]:w-auto md:[&_button]:w-auto">
          <div>
            <p className="text-sm font-extrabold text-indigo-950">Ready for the next conveyor step?</p>
            <p className="mt-1 text-xs text-indigo-700">Move forward only when this stage is reviewed enough for a clinic demo.</p>
          </div>
          {nextAction}
        </div>
      </section>
    </div>
  );
}
