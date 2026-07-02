import clsx from "clsx";
import { ArrowRight, CheckCircle2, CircleDot, LockKeyhole } from "lucide-react";
import { stageIndex, stageStatuses, type ConveyorStageId, type ConveyorStageWithStatus } from "./conveyor-flow";

export function ConveyorBelt({
  activeStage,
  stages,
  compact = false,
}: {
  activeStage: ConveyorStageId;
  stages?: ConveyorStageWithStatus[];
  compact?: boolean;
}) {
  const displayStages = stages ?? stageStatuses(activeStage);
  const currentIndex = Math.max(0, displayStages.findIndex((stage) => stage.id === activeStage));
  const currentStage = displayStages[currentIndex] ?? displayStages[0];
  const previousStage = currentIndex > 0 ? displayStages[currentIndex - 1] : undefined;
  const nextStage = currentIndex < displayStages.length - 1 ? displayStages[currentIndex + 1] : undefined;

  return (
    <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-teal-50/40 p-4 shadow-sm shadow-indigo-100/50 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-500">Content Conveyor</p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950 sm:text-2xl">Generate, approve, adjust, export</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
          Stage {currentIndex + 1} of {displayStages.length}
        </span>
      </div>

      <CurrentStageHero currentStage={currentStage} currentIndex={currentIndex} />

      {!compact ? <StageDetails previousStage={previousStage} currentStage={currentStage} nextStage={nextStage} /> : null}

      <ProgressRail activeStage={activeStage} stages={displayStages} />
    </section>
  );
}

function CurrentStageHero({
  currentIndex,
  currentStage,
}: {
  currentIndex: number;
  currentStage: ConveyorStageWithStatus;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-extrabold text-white shadow-lg shadow-indigo-100">
        {currentIndex + 1}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">Current stage</p>
        <h3 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{currentStage.label}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{currentStage.description}</p>
      </div>
      <StatusPill stage={currentStage} />
    </div>
  );
}

function StageDetails({
  currentStage,
  nextStage,
  previousStage,
}: {
  currentStage: ConveyorStageWithStatus;
  nextStage?: ConveyorStageWithStatus;
  previousStage?: ConveyorStageWithStatus;
}) {
  const cards = [
    previousStage ? { label: "Previous", stage: previousStage } : undefined,
    { label: "Current", stage: currentStage },
    nextStage ? { label: "Next", stage: nextStage } : undefined,
  ].filter(Boolean) as Array<{ label: "Previous" | "Current" | "Next"; stage: ConveyorStageWithStatus }>;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {cards.map(({ label, stage }) => (
        <div key={`${label}-${stage.id}`} className={clsx("rounded-2xl border p-4", label === "Current" ? "border-indigo-100 bg-indigo-50" : "border-slate-100 bg-white/80")}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <h4 className="mt-1 text-sm font-extrabold text-slate-950">{stage.label}</h4>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{stage.description}</p>
        </div>
      ))}
    </div>
  );
}

function ProgressRail({
  activeStage,
  stages,
}: {
  activeStage: ConveyorStageId;
  stages: ConveyorStageWithStatus[];
}) {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
      {stages.map((stage, index) => {
        const active = stage.id === activeStage;
        return (
          <div
            key={stage.id}
            className={clsx(
              "min-h-24 rounded-2xl border p-3",
              active && "border-indigo-200 bg-indigo-600 text-white shadow-lg shadow-indigo-100",
              !active && stage.status === "complete" && "border-emerald-100 bg-emerald-50 text-emerald-800",
              !active && stage.status === "ready" && "border-indigo-100 bg-white text-indigo-700",
              !active && stage.status === "needs_review" && "border-amber-100 bg-amber-50 text-amber-800",
              !active && stage.status === "failed" && "border-rose-100 bg-rose-50 text-rose-700",
              !active && stage.status === "locked" && "border-slate-100 bg-white text-slate-500",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <StageIcon active={active} index={index} stage={stage} />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-75">{shortStatus(stage.status)}</span>
            </div>
            <p className="text-sm font-extrabold leading-tight">{stage.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function StageIcon({
  active,
  index,
  stage,
}: {
  active: boolean;
  index: number;
  stage: ConveyorStageWithStatus;
}) {
  const className = clsx(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
    active && "bg-white text-indigo-700",
    !active && stage.status === "complete" && "bg-emerald-600 text-white",
    !active && stage.status !== "complete" && "bg-slate-100 text-slate-500",
  );

  if (stage.status === "complete") {
    return <span className={className}><CheckCircle2 className="h-4 w-4" /></span>;
  }
  if (stage.status === "locked") {
    return <span className={className}><LockKeyhole className="h-4 w-4" /></span>;
  }
  if (active) {
    return <span className={className}><CircleDot className="h-4 w-4" /></span>;
  }
  return <span className={className}>{index + 1}</span>;
}

function StatusPill({ stage }: { stage: ConveyorStageWithStatus }) {
  return (
    <span className={clsx("inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold", pillClass(stage.status))}>
      {stage.status === "complete" ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      {longStatus(stage.status)}
    </span>
  );
}

function shortStatus(status: ConveyorStageWithStatus["status"]) {
  switch (status) {
    case "complete":
      return "Done";
    case "current":
      return "Now";
    case "ready":
      return "Ready";
    case "needs_review":
      return "Review";
    case "failed":
      return "Issue";
    case "locked":
      return "Locked";
  }
}

function longStatus(status: ConveyorStageWithStatus["status"]) {
  switch (status) {
    case "complete":
      return "Completed";
    case "current":
      return "In progress";
    case "ready":
      return "Ready";
    case "needs_review":
      return "Needs review";
    case "failed":
      return "Needs attention";
    case "locked":
      return "Locked";
  }
}

function pillClass(status: ConveyorStageWithStatus["status"]) {
  switch (status) {
    case "complete":
      return "bg-emerald-50 text-emerald-700";
    case "current":
      return "bg-indigo-50 text-indigo-700";
    case "ready":
      return "bg-blue-50 text-blue-700";
    case "needs_review":
      return "bg-amber-50 text-amber-700";
    case "failed":
      return "bg-rose-50 text-rose-700";
    case "locked":
      return "bg-slate-100 text-slate-600";
  }
}

export function activeStagePosition(activeStage: ConveyorStageId) {
  return Math.max(0, stageIndex(activeStage));
}
