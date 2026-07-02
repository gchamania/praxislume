"use client";

import Link from "next/link";
import { CheckCircle2, Download, Layers3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";

export default function CampaignReadyPage() {
  const { state } = usePraxis();
  const itemCount = state.items.length;
  const carouselCount = Math.min(5, itemCount || 5);
  const captionCount = state.items.filter((item) => item.caption).length;

  return (
    <AppShell title="Campaign Ready" subtitle="Review the generated campaign package before manual export.">
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
          <div className="p-8">
            <Badge tone="emerald">{state.campaign?.durationDays ?? 30}-day package ready</Badge>
            <h2 className="mt-5 font-display text-4xl font-extrabold">{state.clinic?.name ?? "Dhwani ENT Clinics"} campaign is ready for review</h2>
            <p className="mt-4 max-w-2xl text-slate-500">
              This package includes patient-education ideas, captions, reel scripts, and manual export CTAs without publishing integrations.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[`${itemCount || 30} ideas`, `${carouselCount} carousel slides`, `${captionCount || 12} ready captions`].map((metric) => (
                <div key={metric} className="rounded-2xl bg-slate-50 p-5 font-display text-xl font-extrabold">{metric}</div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/calendar"><Button>Review Calendar</Button></Link>
              <Button variant="secondary"><Download className="h-5 w-5" />Manual Export</Button>
            </div>
          </div>
          <div className="bg-teal-950 p-8 text-white">
            <Layers3 className="mb-6 h-12 w-12 text-teal-200" />
            <h3 className="font-display text-2xl font-extrabold">{state.clinic?.name ?? "Dhwani ENT Clinics"}</h3>
            <p className="mt-2 text-teal-100">{state.clinic?.city ?? "Pune"} · {state.doctor?.specialty ?? "ENT"} patient education</p>
            <div className="mt-8 space-y-3">
              {state.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="text-sm font-semibold">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
