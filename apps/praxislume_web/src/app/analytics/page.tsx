import { ClipboardList, MessageCircle, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, StatCard } from "@/components/ui";
import { chartBars, stats } from "@/lib/dummy-data";

const enquirySources = [
  { label: "WhatsApp CTA", value: 42, tone: "bg-emerald-500" },
  { label: "Phone calls", value: 28, tone: "bg-indigo-500" },
  { label: "Google Business", value: 18, tone: "bg-sky-500" },
  { label: "Reception walk-ins", value: 12, tone: "bg-amber-500" },
];

const topicRoi = [
  { topic: "Ear grommets explained", enquiries: 18, exports: 5, confidence: "High" },
  { topic: "Monsoon ear care", enquiries: 14, exports: 4, confidence: "Medium" },
  { topic: "Child hearing tests", enquiries: 11, exports: 3, confidence: "Medium" },
  { topic: "Safe ear cleaning", enquiries: 8, exports: 3, confidence: "Learning" },
];

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Manual clinic growth tracking for the current demo campaign.">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold">Campaign performance</h2>
              <p className="mt-1 text-sm text-slate-500">Views and enquiries over 12 sample weeks.</p>
            </div>
            <Badge tone="indigo">Last 90 days</Badge>
          </div>
          <div className="flex h-80 items-end gap-3 rounded-2xl bg-slate-50 p-5">
            {chartBars.map((bar, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-xl bg-indigo-500" style={{ height: `${bar}%` }} />
                <span className="text-[10px] font-bold text-slate-400">{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-6">
          <Card className="p-6">
            <TrendingUp className="mb-5 h-10 w-10 text-emerald-600" />
            <h2 className="font-display text-xl font-extrabold">Best-performing topics</h2>
            <div className="mt-6 space-y-4">
              {["Ear grommets explained", "Monsoon ear care", "Child hearing tests", "Safe ear cleaning"].map((topic, index) => (
                <div key={topic} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <span className="min-w-0 truncate text-sm font-bold">{topic}</span>
                  <Badge tone={index === 0 ? "emerald" : "slate"}>{92 - index * 8}%</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <MessageCircle className="mb-5 h-10 w-10 text-indigo-600" />
            <h2 className="font-display text-xl font-extrabold">Enquiry sources</h2>
            <p className="mt-2 text-sm text-slate-500">Manual tracking only until integrations are approved.</p>
            <div className="mt-5 space-y-3">
              {enquirySources.map((source) => (
                <div key={source.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-extrabold text-slate-500">
                    <span className="truncate">{source.label}</span>
                    <span>{source.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${source.tone}`} style={{ width: `${source.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold">Topic ROI</h2>
              <p className="mt-1 text-sm text-slate-500">Simple enquiry lift per exported education topic.</p>
            </div>
            <Badge tone="amber">Reception validated</Badge>
          </div>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-100">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[1fr_90px_90px_100px] bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                <span>Topic</span>
                <span>Enquiries</span>
                <span>Exports</span>
                <span>Signal</span>
              </div>
              {topicRoi.map((row) => (
                <div key={row.topic} className="grid grid-cols-[1fr_90px_90px_100px] items-center border-t border-slate-100 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate font-bold text-slate-900">{row.topic}</span>
                  <span className="font-extrabold text-slate-700">{row.enquiries}</span>
                  <span className="font-extrabold text-slate-700">{row.exports}</span>
                  <Badge tone={row.confidence === "High" ? "emerald" : "slate"}>{row.confidence}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <ClipboardList className="mb-5 h-10 w-10 text-amber-600" />
          <h2 className="font-display text-xl font-extrabold">Reception notes</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p className="rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900">Parents asked if grommets affect swimming after seeing the carousel.</p>
            <p className="rounded-2xl bg-slate-50 p-4 font-semibold">Two calls mentioned “ear fluid” directly from the Week 1 copy.</p>
            <p className="rounded-2xl bg-slate-50 p-4 font-semibold">Next campaign should include hearing-test FAQs for school-age children.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
