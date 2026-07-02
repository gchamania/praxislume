"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Clipboard,
  Download,
  FileText,
  ImageIcon,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";
import { createExportStorageKey } from "@/features/export/export-workflow";
import { itemOperatingStatus } from "@/features/operations/operating-status";
import { doctor } from "@/lib/dummy-data";
import type { ContentItem } from "@/lib/praxis-models";

export default function ContentDetailPage() {
  const params = useParams<{ itemId: string }>();
  const {
    activeCarousel,
    activeVisualAsset,
    config,
    exportVisualAssetPng,
    fetchLatestVisualCarousel,
    fetchLatestVisualAsset,
    generateReelScript,
    generateVisualAsset,
    generateVisualCarousel,
    regenerateCaption,
    reviewCompliance,
    rewriteTone,
    mode,
    session,
    state,
    status,
    activeVisualItemId,
    updateContentItem,
  } = usePraxis();
  const item = useMemo(
    () => state.items.find((candidate) => candidate.id === params.itemId) ?? (mode === "demo" ? state.items[0] : undefined),
    [mode, params.itemId, state.items],
  );
  const [caption, setCaption] = useState(item?.caption ?? "");
  const [statusValue, setStatusValue] = useState(item?.status ?? "drafted");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "exported">("idle");
  const isGenerating = status === "generating" || status === "saving";
  const supportsCuratedCarousel = item ? supportsCarousel(item) : false;
  const copyApprovedForVisuals = Boolean(item && item.complianceStatus === "passed" && (item.status === "designed" || item.status === "posted"));
  const weekId = item ? `week-${Math.floor(item.dayOffset / 7) + 1}` : "week-1";
  const campaignId = state.campaign?.id ?? "active";
  const operatingStatus = item ? itemOperatingStatus(item, {
    hasVisual: activeVisualItemId === item.id && Boolean(activeVisualAsset?.signedUrl),
    layoutAdjusted: hasSavedLayout(campaignId, item.id),
  }) : undefined;
  const fallbackSlides = item
    ? [
        { title: item.title, body: item.objective || item.caption },
        ...item.keyPoints.slice(0, 4).map((point) => ({ title: point, body: item.caption })),
      ].slice(0, 5)
    : [];

  useEffect(() => {
    // This editor mirrors the active content item when the route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaption(item?.caption ?? "");
    setStatusValue(item?.status ?? "drafted");
    setCopyState("idle");
  }, [item?.caption, item?.id, item?.status]);

  useEffect(() => {
    if (item?.id && config.enableVisualPilot && supportsCuratedCarousel && (mode === "demo" || session)) {
      void fetchLatestVisualCarousel(item.id);
    }
    // The provider method identity changes with active carousel state; item id and feature flag are the intended triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enableVisualPilot, item?.id, mode, session, supportsCuratedCarousel]);

  const packageText = item ? buildExportText(item, state.brandKit.disclaimer) : "";

  return (
    <AppShell title={item?.title ?? "Content Detail"} subtitle="Review, edit, and manually export this patient-education content package.">
      <span className="sr-only">{state.clinic?.name ?? "Clinic"} {item?.title ?? "content detail"}</span>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone={item?.complianceStatus === "passed" ? "emerald" : "indigo"}>
                {item?.complianceStatus ?? "Needs review"}
              </Badge>
              <Badge tone="indigo">{state.clinic?.name ?? "Dhwani ENT Clinics"}</Badge>
              <Badge tone="slate">{item?.category ?? "procedure_explainer"}</Badge>
              {operatingStatus ? <Badge tone={operatingStatus.tone}>{operatingStatus.label}</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => item && void regenerateCaption(item.id)} disabled={!item || isGenerating}>
                <RefreshCw className="h-4 w-4" /> Caption
              </Button>
              <Button variant="secondary" onClick={() => item && void generateReelScript(item.id)} disabled={!item || isGenerating}>
                <WandSparkles className="h-4 w-4" /> Reel
              </Button>
              <Button variant="secondary" onClick={() => item && void reviewCompliance(item.id)} disabled={!item || isGenerating}>
                <ShieldCheck className="h-4 w-4" /> Review
              </Button>
              <Button onClick={() => item && void generateVisualCarousel(item.id)} disabled={!item || isGenerating || !config.enableVisualPilot || !supportsCuratedCarousel || !copyApprovedForVisuals}>
                <Download className="h-4 w-4" /> Generate carousel
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {((item && activeCarousel?.slides.length) ? activeCarousel.slides : fallbackSlides).map((slide, index) => (
              <div key={"slideHeadline" in slide ? slide.slideHeadline : slide.title} className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="preview-grid aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 via-white to-indigo-100 p-6">
                  {"signedUrl" in slide ? (
                    <img src={slide.signedUrl} alt={slide.slideHeadline} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <>
                      <div className="mb-8 flex items-center justify-between">
                        <span className="font-display font-extrabold text-teal-900">{state.clinic?.name ?? doctor.clinic}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700">{index + 1}/5</span>
                      </div>
                      <div className="rounded-2xl bg-white/90 p-5 shadow-xl">
                        <h2 className="font-display text-2xl font-extrabold text-slate-950">{slide.title}</h2>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600">{slide.body}</p>
                      </div>
                      <div className="mt-6 rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white">{state.brandKit.defaultCta}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!item ? (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
              Content item is loading or no longer exists in this clinic workspace.
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <ImageIcon className="mb-5 h-10 w-10 text-indigo-600" />
          <h2 className="font-display text-xl font-extrabold">Content package</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Clinic text, CTA, and disclaimer are deterministic UI layers. Background visual generation stays backend-only and feature-gated.
          </p>
          {operatingStatus ? (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge tone={operatingStatus.tone}>{operatingStatus.label}</Badge>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{operatingStatus.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/campaigns/${campaignId}/weeks/${weekId}/adjust`}>
                    <Button variant="secondary"><SlidersHorizontal className="h-4 w-4" /> Final adjust</Button>
                  </Link>
                  <Link href={`/campaigns/${campaignId}/weeks/${weekId}/export`}>
                    <Button variant="secondary"><Download className="h-4 w-4" /> Export pack</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          {activeVisualAsset ? (
            <img src={activeVisualAsset.signedUrl} alt="Generated branded asset" className="mt-5 aspect-square w-full rounded-2xl object-cover" />
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Caption</span>
              <textarea
                className="min-h-36 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Status</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
              >
                {["idea", "drafted", "designed", "posted", "archived"].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Disclaimer</p>
              <p className="mt-2 text-sm text-slate-700">{item?.disclaimer || state.brandKit.disclaimer}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Button onClick={() => item && void updateContentItem(item.id, { caption, status: statusValue })} disabled={!item || isGenerating}>
              <Save className="h-4 w-4" /> Save edits
            </Button>
            <Button variant="secondary" onClick={() => void copyPackage(packageText, setCopyState)} disabled={!item}>
              <Clipboard className="h-4 w-4" /> {copyState === "copied" ? "Copied" : "Copy package"}
            </Button>
            <Button variant="secondary" onClick={() => item && exportPackage(item, packageText, setCopyState)} disabled={!item}>
              <Download className="h-4 w-4" /> {copyState === "exported" ? "Exported" : "Export text"}
            </Button>
            <Button variant="secondary" onClick={() => item && void rewriteTone(item.id)} disabled={!item || isGenerating}>
              <FileText className="h-4 w-4" /> Rewrite tone
            </Button>
            <Button variant="secondary" onClick={() => item && void fetchLatestVisualAsset(item.id)} disabled={!item || isGenerating}>
              <ImageIcon className="h-4 w-4" /> Load latest visual
            </Button>
            <Button className="w-full" onClick={() => item && void generateVisualAsset(item.id)} disabled={!item || isGenerating || !config.enableVisualPilot || !copyApprovedForVisuals}>
              <ImageIcon className="h-4 w-4" /> Generate visual
            </Button>
            <Button variant="teal" className="w-full" onClick={() => void exportVisualAssetPng()} disabled={!activeVisualAsset || isGenerating}>
              <Download className="h-4 w-4" /> Export PNG
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function hasSavedLayout(campaignId: string, itemId: string) {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(createExportStorageKey(campaignId, itemId)));
}

function supportsCarousel(item: ContentItem): boolean {
  const searchable = [item.title, item.caption, item.objective, ...item.keyPoints].join(" ").toLowerCase();
  return [
    "grommet",
    "wisdom",
    "jewellery",
    "jewelry",
    "nickel",
    "preauricular",
    "pre auricular",
  ].some((keyword) => searchable.includes(keyword));
}

function buildExportText(item: ContentItem, fallbackDisclaimer: string): string {
  return [
    item.title,
    "",
    "Caption:",
    item.caption,
    "",
    "CTA:",
    item.shortCta,
    "",
    "Reel hook:",
    item.reelHook || "Not generated yet.",
    "",
    "Reel script:",
    item.reelScript || "Not generated yet.",
    "",
    "Disclaimer:",
    item.disclaimer || fallbackDisclaimer,
  ].join("\n");
}

async function copyPackage(text: string, setCopyState: (state: "idle" | "copied" | "exported") => void) {
  await navigator.clipboard.writeText(text);
  setCopyState("copied");
}

function exportPackage(item: ContentItem, text: string, setCopyState: (state: "idle" | "copied" | "exported") => void) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "praxislume-content"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  setCopyState("exported");
}
