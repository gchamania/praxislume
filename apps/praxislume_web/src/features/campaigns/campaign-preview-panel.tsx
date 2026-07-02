import clsx from "clsx";
import { CalendarDays, CheckCircle2, FileText, ImageIcon, Megaphone, Palette, Video } from "lucide-react";
import { Badge } from "@/components/ui";
import type { BrandKit, ClinicProfile, ContentCampaign, ContentItem, DoctorProfile } from "@/lib/praxis-models";
import type { ConveyorStageId } from "@/features/generation/conveyor-flow";

type CampaignPreviewPanelProps = {
  activeStage: ConveyorStageId;
  campaign?: ContentCampaign;
  clinic?: ClinicProfile;
  doctor?: DoctorProfile;
  brandKit: BrandKit;
  items: ContentItem[];
  visualReady?: boolean;
  layoutAdjusted?: boolean;
};

const packageModules = [
  { label: "Week Copy", icon: FileText, tone: "text-indigo-600", stage: "copy" },
  { label: "Carousel", icon: ImageIcon, tone: "text-blue-500", stage: "visual" },
  { label: "Reel Script", icon: Video, tone: "text-fuchsia-500", stage: "copy" },
  { label: "CTA Pack", icon: Megaphone, tone: "text-emerald-600", stage: "copy" },
  { label: "Final Layout", icon: Palette, tone: "text-orange-500", stage: "adjust" },
];

export function CampaignPreviewPanel({
  activeStage,
  campaign,
  clinic,
  doctor,
  brandKit,
  items,
  visualReady = false,
  layoutAdjusted = false,
}: CampaignPreviewPanelProps) {
  const firstItem = items[0];
  const approvedCount = items.filter((item) => item.status === "designed" || item.status === "posted").length;
  const duration = campaign?.durationDays ?? 30;
  const clinicName = clinic?.name ?? "PraxisLume Clinic";
  const specialty = doctor?.specialty ?? "Specialty";

  return (
    <aside className="space-y-4 xl:sticky xl:top-28">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-500">Package Preview</p>
          <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">CONTENT PACKAGE</h2>
        </div>
        <div className="p-5">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.35),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.35),transparent_28%)]" />
            <div className="relative">
              <Badge tone="indigo">{specialty}</Badge>
              <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight">
                {firstItem?.title ?? campaign?.title ?? "30-day clinic growth campaign"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {firstItem?.caption || campaign?.goal || "Plan patient-friendly content, approve copy, create visuals, adjust, and export."}
              </p>
              <div className="mt-5 inline-flex rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white">
                {brandKit.defaultCta}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric label="Days" value={String(duration)} />
            <Metric label="Items" value={String(items.length || duration)} />
            <Metric label="Approved" value={String(approvedCount)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-extrabold text-slate-950">Package modules</h2>
          <Badge tone={visualReady ? "emerald" : "slate"}>{visualReady ? "visual ready" : "building"}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {packageModules.map((module) => {
            const Icon = module.icon;
            const ready =
              module.stage === "copy" ? items.length > 0 : module.stage === "visual" ? visualReady : layoutAdjusted;
            return (
              <div
                key={module.label}
                className={clsx(
                  "rounded-2xl border p-3",
                  ready ? "border-indigo-100 bg-indigo-50/70" : "border-slate-100 bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className={clsx("h-5 w-5", module.tone)} />
                  </div>
                  {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                </div>
                <p className="mt-3 text-sm font-extrabold text-slate-900">{module.label}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {ready ? "Ready" : "Locked"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-extrabold text-indigo-950">{clinicName}</p>
            <p className="mt-1 text-xs text-indigo-700">
              Stage: {activeStage.replace(/_/g, " ")}. Manual export remains first-class for MVP.
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-lg font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    </div>
  );
}
