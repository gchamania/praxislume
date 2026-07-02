"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Filter, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import {
  filterTemplateCatalog,
  templateCatalogSummary,
  templateCategories,
  templateFormats,
  templateGoals,
  templateSpecialties,
  type HealthcareTemplate,
  type TemplateCatalogFilters,
} from "@/features/templates/template-catalog";

export default function TemplatesPage() {
  const [filters, setFilters] = useState<TemplateCatalogFilters>({
    specialty: "All",
    format: "All",
    category: "All",
    goal: "All",
    query: "",
  });
  const templates = useMemo(() => filterTemplateCatalog(filters), [filters]);
  const summary = templateCatalogSummary();

  const updateFilter = <TKey extends keyof TemplateCatalogFilters>(key: TKey, value: TemplateCatalogFilters[TKey]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <AppShell
      title="Templates"
      subtitle="Curated healthcare templates with fixed medical-content zones, built for campaign generation and final adjustment."
      action={<Link href="/campaigns/new"><Button><Sparkles className="h-4 w-4" />Use in Campaign</Button></Link>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <TemplateStat label="Curated templates" value={String(summary.total)} />
          <TemplateStat label="Specialty packs" value={`${summary.specialties}+`} />
          <TemplateStat label="Carousel layouts" value={String(summary.carousel)} />
          <TemplateStat label="Appointment focused" value={String(summary.appointmentFocused)} />
        </section>

        <Card className="p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,190px))]">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Search className="h-4 w-4" />Search</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Search topic, condition, format..."
                value={filters.query ?? ""}
                onChange={(event) => updateFilter("query", event.target.value)}
              />
            </label>
            <SelectFilter label="Specialty" value={filters.specialty ?? "All"} options={templateSpecialties} onChange={(value) => updateFilter("specialty", value as TemplateCatalogFilters["specialty"])} />
            <SelectFilter label="Format" value={filters.format ?? "All"} options={templateFormats} onChange={(value) => updateFilter("format", value as TemplateCatalogFilters["format"])} />
            <SelectFilter label="Category" value={filters.category ?? "All"} options={templateCategories} onChange={(value) => updateFilter("category", value as TemplateCatalogFilters["category"])} />
            <SelectFilter label="Goal" value={filters.goal ?? "All"} options={templateGoals} onChange={(value) => updateFilter("goal", value as TemplateCatalogFilters["goal"])} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="indigo">{templates.length} matching</Badge>
              <Badge tone="emerald">Fixed zones</Badge>
              <Badge tone="amber">Doctor approval ready</Badge>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
              onClick={() => setFilters({ specialty: "All", format: "All", category: "All", goal: "All", query: "" })}
            >
              <Filter className="h-4 w-4" />
              Reset filters
            </button>
          </div>
        </Card>

        <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </section>

        {templates.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="font-display text-xl font-extrabold text-slate-950">No matching templates</h2>
            <p className="mt-2 text-sm text-slate-500">Broaden the specialty, format, category, or search query.</p>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function TemplateStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </Card>
  );
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange(value: string): void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TemplateCard({ template }: { template: HealthcareTemplate }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50 xl:grid-cols-[210px_minmax(0,1fr)]">
      <TemplatePreview template={template} />
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Badge tone="indigo">{template.format}</Badge>
          <Badge tone="slate">{template.category}</Badge>
          <Badge tone="emerald">{template.goal}</Badge>
        </div>
        <h2 className="mt-3 font-display text-lg font-extrabold leading-tight text-slate-950">{template.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{template.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {template.specialties.map((specialty) => (
            <span key={specialty} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">{specialty}</span>
          ))}
          {template.aspectRatios.map((ratio) => (
            <span key={ratio} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">{ratio}</span>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Fixed zones
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {template.zones.map(zoneLabel).join(", ")}. Medical text, CTA, logo, and disclaimer remain deterministic.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/campaigns/new">
            <Button variant="secondary">Use in campaign <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Button variant="ghost"><CheckCircle2 className="h-4 w-4" />Preview structure</Button>
        </div>
      </div>
    </article>
  );
}

function TemplatePreview({ template }: { template: HealthcareTemplate }) {
  const isTall = template.aspectRatios.includes("9:16") && !template.aspectRatios.includes("1:1");
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-100 p-4 ${isTall ? "min-h-80" : "min-h-56"}`}
      style={{ background: `linear-gradient(145deg, ${template.background}, #ffffff 60%, ${template.accent}22)` }}
    >
      <div className="absolute right-3 top-3 h-9 w-9 rounded-xl bg-white shadow-sm" />
      <div className="mt-10 rounded-2xl bg-white/90 p-4 shadow-sm">
        <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: template.accent }} />
        <div className="space-y-2">
          <div className="h-4 w-11/12 rounded-full bg-slate-900" />
          <div className="h-4 w-2/3 rounded-full bg-slate-700" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-200" />
          <div className="h-2 w-5/6 rounded-full bg-slate-200" />
          <div className="h-2 w-2/3 rounded-full bg-slate-200" />
        </div>
        <div className="mt-5 h-9 w-32 rounded-xl" style={{ backgroundColor: template.accent }} />
      </div>
      <div className="absolute bottom-3 left-4 right-4 h-2 rounded-full bg-white/70" />
    </div>
  );
}

function zoneLabel(zone: HealthcareTemplate["zones"][number]) {
  if (zone === "cta") return "CTA";
  return zone.slice(0, 1).toUpperCase() + zone.slice(1);
}
