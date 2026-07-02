"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Globe2, Languages, Sparkles, Stethoscope, Target, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Field } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import {
  defaultCampaignSetup,
  type CampaignPlatform,
} from "@/features/campaigns/campaign-setup";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";

const platformOptions: CampaignPlatform[] = ["Instagram", "Facebook", "WhatsApp", "Clinic poster", "Google Business"];

export default function NewCampaignPage() {
  const router = useRouter();
  const { generateCampaign, message, state, status } = usePraxis();
  const [generationError, setGenerationError] = useState<string>();
  const [slowGeneration, setSlowGeneration] = useState(false);
  const [setup, setSetup] = useState(() =>
    defaultCampaignSetup({
      durationDays: state.campaign?.durationDays === 7 || state.campaign?.durationDays === 15 || state.campaign?.durationDays === 30 ? state.campaign.durationDays : 30,
      growthGoal: state.campaign?.goal || "More appointment enquiries from patient education",
      topicFocus: state.items[0]?.title ?? "Pediatric ENT awareness",
      audience: "Parents and adult patients",
      serviceFocus: state.clinic?.services[0] ?? "Primary clinic services",
      platforms: ["Instagram", "WhatsApp", "Clinic poster"],
    }),
  );
  const isGenerating = status === "generating";
  const flow = buildCampaignFlowModel({ state, activeStage: "campaign_setup" });

  async function createPlan() {
    if (isGenerating) return;
    setGenerationError(undefined);
    setSlowGeneration(false);
    const slowTimer = window.setTimeout(() => {
      setSlowGeneration(true);
      setGenerationError("Plan request is taking longer than expected. Keep this tab open or try again if the backend is waking up.");
    }, 8000);
    try {
      const ok = await generateCampaign(setup);
      if (ok) {
        router.replace("/campaigns/active/overview");
        window.setTimeout(() => {
          if (window.location.pathname === "/campaigns/new") {
            window.location.assign("/campaigns/active/overview");
          }
        }, 500);
        return;
      }
      setGenerationError(message || "Campaign plan could not be created. Check the backend session and try again.");
    } finally {
      window.clearTimeout(slowTimer);
      setSlowGeneration(false);
    }
  }

  function updateSetup(patch: Partial<typeof setup>) {
    setSetup((current) => ({ ...current, ...patch }));
  }

  function togglePlatform(platform: CampaignPlatform) {
    setSetup((current) => {
      const selected = current.platforms.includes(platform);
      const platforms = selected
        ? current.platforms.filter((candidate) => candidate !== platform)
        : [...current.platforms, platform];
      return { ...current, platforms: platforms.length ? platforms : [platform] };
    });
  }

  return (
    <AppShell
      title="Create 30-Day Plan"
      subtitle="Plan the month now. Prepare copy, visuals, final adjustment, and export one week at a time."
      action={
        <Button onClick={() => void createPlan()} disabled={isGenerating}>
          <Sparkles className="h-5 w-5" /> {isGenerating ? "Creating plan..." : "Create 30-Day Plan"}
        </Button>
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stage 1"
        title="Tell us what this clinic campaign should achieve"
        description="Set the clinical focus, audience, tone, platform mix, and duration. PraxisLume then creates the monthly plan shell before weekly copy begins."
        nextAction={
          <Button onClick={() => void createPlan()} disabled={isGenerating}>
            <Sparkles className="h-5 w-5" /> {isGenerating ? "Creating plan..." : "Create 30-Day Plan"}
          </Button>
        }
        preview={
          <CampaignPreviewPanel
            activeStage="campaign_setup"
            campaign={state.campaign}
            clinic={state.clinic}
            doctor={state.doctor}
            brandKit={state.brandKit}
            items={state.items}
          />
        }
      >
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">1</span>
              <h2 className="font-display text-lg font-extrabold text-indigo-950">Campaign inputs</h2>
            </div>
            <div className="space-y-4">
              <InputSummary icon={Stethoscope} label="Specialty" value={state.doctor?.specialty ?? "ENT"} />
              <InputSummary icon={Target} label="Topic focus" value={setup.topicFocus} />
              <InputSummary icon={Users} label="Audience" value={setup.audience} />
              <InputSummary icon={Languages} label="Language" value={setup.languageMode} />
              <InputSummary icon={Globe2} label="Primary location" value={`${state.clinic?.locality ?? "Koregaon Park"}, ${state.clinic?.city ?? "Pune"}`} />
              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Platforms</p>
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map((platform) => (
                    <div
                      key={platform}
                      className={
                        setup.platforms.includes(platform)
                          ? "flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700"
                          : "flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-400"
                      }
                    >
                      {platform}
                      {setup.platforms.includes(platform) ? <Check className="h-3.5 w-3.5" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-500">Plan builder</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">Monthly campaign package</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                  This creates the plan shell. Copy, compliance, visuals, final adjustment, and export stay weekly so doctor review remains manageable.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-slate-50 p-4 text-indigo-600 md:block">
                <CalendarDays className="h-7 w-7" />
              </div>
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Campaign goal</span>
              <textarea
                className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={setup.growthGoal}
                onChange={(event) => updateSetup({ growthGoal: event.target.value })}
              />
            </label>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Topic / condition focus</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={setup.topicFocus}
                  onChange={(event) => updateSetup({ topicFocus: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Audience</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={setup.audience}
                  onChange={(event) => updateSetup({ audience: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Plan duration</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  value={setup.durationDays}
                  onChange={(event) => updateSetup({ durationDays: Number(event.target.value) as 7 | 15 | 30 })}
                >
                  <option value={7}>7 days</option>
                  <option value={15}>15 days</option>
                  <option value={30}>30 days</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Service focus</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  value={setup.serviceFocus}
                  onChange={(event) => updateSetup({ serviceFocus: event.target.value })}
                >
                  {[setup.serviceFocus, ...(state.clinic?.services ?? [])]
                    .filter(Boolean)
                    .filter((service, index, services) => services.indexOf(service) === index)
                    .map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Language mode</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={setup.languageMode}
                  onChange={(event) => updateSetup({ languageMode: event.target.value })}
                />
              </label>
              <Field label="Default CTA from brand kit" value={state.brandKit.defaultCta} />
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-sm font-bold text-slate-700">Platform package</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {platformOptions.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={
                      setup.platforms.includes(platform)
                        ? "rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-left text-xs font-extrabold text-indigo-700"
                        : "rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-extrabold text-slate-500 hover:bg-slate-50"
                    }
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold text-slate-900">Conveyor rule</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                PraxisLume will not generate everything at once. Week 1 unlocks first, then copy approval opens visual creation and final adjustment.
              </p>
            </div>
            {(generationError || slowGeneration || (status === "error" && message)) ? (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-relaxed text-amber-900">
                {generationError || message}
              </div>
            ) : null}
          </Card>
        </div>
      </CampaignConveyorShell>
    </AppShell>
  );
}

function InputSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
        <Icon className="h-4 w-4 text-indigo-500" />
        <span className="min-w-0 truncate">{value}</span>
      </div>
    </div>
  );
}
