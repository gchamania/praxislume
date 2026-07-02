"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { CalendarPlus, CheckCircle2, Clipboard, Download, FileArchive, FileJson, SlidersHorizontal, UserCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { usePraxis } from "@/components/praxis-provider";
import { CampaignConveyorShell } from "@/features/campaigns/campaign-conveyor-shell";
import { CampaignPreviewPanel } from "@/features/campaigns/campaign-preview-panel";
import { buildCampaignFlowModel } from "@/features/campaigns/campaign-flow-state";
import { buildVisualPackModel } from "@/features/campaigns/visual-pack-workflow";
import { buildWeeklyCopyModel } from "@/features/campaigns/weekly-copy-workflow";
import { createContentPackageStorageKey } from "@/features/export/content-package";
import { ContentPackagePanel } from "@/features/export/content-package-panel";
import {
  buildWeeklyExportPackage,
  createExportStorageKey,
  downloadFilename,
  type WeeklyExportStatus,
} from "@/features/export/export-workflow";
import type { OperatingStatusId } from "@/features/operations/operating-status";
import { staffDefaultAction } from "@/features/staff/mobile-staff-ux";
import type { ClinicProfile, DoctorProfile } from "@/lib/praxis-models";

export default function WeeklyExportPage() {
  const params = useParams<{ campaignId?: string; weekId?: string }>();
  const { state, activeVisualAsset, activeVisualItemId, updateContentItem } = usePraxis();
  const campaignId = state.campaign?.id ?? params.campaignId ?? "demo";
  const weekId = params.weekId ?? "week-1";
  const clinic = state.clinic ?? fallbackClinic;
  const doctor = state.doctor ?? fallbackDoctor;
  const layoutOverridesByItemId = readStoredLayoutOverrides(campaignId, state.items);
  const signedVisualsByItemId = activeVisualAsset?.signedUrl && activeVisualItemId
    ? { [activeVisualItemId]: activeVisualAsset.signedUrl }
    : {};
  const weekModel = buildWeeklyCopyModel({ campaignId, weekId, items: state.items });
  const visualPack = buildVisualPackModel({
    week: weekModel,
    enableVisualPilot: false,
    generatedAssetsByItemId: signedVisualsByItemId,
    preAiPreview: true,
    clinicName: clinic.name,
    primaryColor: state.brandKit.primaryColor,
    accentColor: state.brandKit.accentColor,
  });
  const thumbnailUrlsByItemId = Object.fromEntries(visualPack.slots.map((slot) => [slot.itemId, slot.signedUrl ?? slot.thumbnailUrl]));
  const contentPackageDraftsByItemId = readContentPackageDrafts(campaignId, state.items);
  const exportPackage = buildWeeklyExportPackage({
    campaignId,
    weekId,
    clinic,
    doctor,
    brandKit: state.brandKit,
    items: state.items,
    layoutOverridesByItemId,
    signedVisualsByItemId,
    thumbnailUrlsByItemId,
    contentPackageDraftsByItemId,
  });
  const items = exportPackage.assets;
  const flow = buildCampaignFlowModel({
    state,
    activeStage: "export",
    activeWeekId: weekId,
    visualReady: true,
    layoutAdjusted: exportPackage.status === "ready",
    exported: state.items.some((item) => item.status === "designed" || item.status === "posted"),
  });
  const staffAction = staffDefaultAction(statusToOperatingStatus(exportPackage.status), campaignId, weekId);

  async function copyPack() {
    await navigator.clipboard.writeText(exportPackage.copyText);
  }

  async function markExported() {
    if (!exportPackage.canMarkExported) return;
    await Promise.all(exportPackage.assets.map((asset) => updateContentItem(asset.itemId, { status: "designed" })));
  }

  function downloadManifest() {
    downloadTextFile(
      downloadFilename(clinic.name, `${weekId}-export-manifest`, "json"),
      exportPackage.manifestJson,
      "application/json",
    );
  }

  function downloadSvg(assetIndex = 0) {
    const asset = exportPackage.assets[assetIndex];
    if (!asset) return;
    downloadTextFile(asset.filename, asset.svg, "image/svg+xml");
  }

  return (
    <AppShell
      title="Export This Week's Content"
      subtitle="Manual posting is first-class: copy captions, download creatives, and mark the week exported."
      action={
        <Link href="/calendar">
          <Button>
            <CalendarPlus className="h-4 w-4" /> View Calendar
          </Button>
        </Link>
      }
    >
      <CampaignConveyorShell
        activeStage={flow.activeStage}
        stages={flow.stages}
        eyebrow="Stage 7"
        title="Weekly export pack"
        description="Copy captions, download the adjusted creative preview, and mark the week exported. No social publishing integration is connected."
        nextAction={
          <Link href="/calendar">
            <Button>
              <CalendarPlus className="h-4 w-4" /> View Calendar
            </Button>
          </Link>
        }
        preview={
          <CampaignPreviewPanel
            activeStage="export"
            campaign={state.campaign}
            clinic={clinic}
            doctor={doctor}
            brandKit={state.brandKit}
            items={state.items.slice(0, 7)}
            visualReady
            layoutAdjusted={exportPackage.status === "ready"}
          />
        }
      >
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge tone={exportTone(exportPackage.status)}>{exportStatusLabel(exportPackage.status)}</Badge>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">Manual posting package</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {exportPackage.notice} Manual posting remains first-class; no social publishing integration is connected.
              </p>
            </div>
            <FileArchive className="h-10 w-10 text-indigo-500" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Button onClick={() => void copyPack()} variant="secondary">
              <Clipboard className="h-4 w-4" /> Copy weekly pack
            </Button>
            <Button onClick={() => void markExported()} disabled={!exportPackage.canMarkExported}>
              <CheckCircle2 className="h-4 w-4" /> Mark exported
            </Button>
            <Button variant="secondary" onClick={() => downloadSvg()} disabled={exportPackage.assets.length === 0}>
              <Download className="h-4 w-4" /> First SVG
            </Button>
            <Button variant="secondary" onClick={downloadManifest}>
              <FileJson className="h-4 w-4" /> Manifest JSON
            </Button>
            <Link href={`/campaigns/${params.campaignId ?? "active"}/weeks/${weekId}/adjust`}>
              <Button variant="secondary" className="w-full">
                <SlidersHorizontal className="h-4 w-4" /> Final adjust
              </Button>
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
              <UserCheck className="h-4 w-4" /> Staff posting default
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              Reception flow starts with copy, files, and export status. Design adjustment stays a controlled handoff.
            </p>
            <Link href={staffAction.href}>
              <Button variant="teal" className="mt-4 w-full md:w-auto">{staffAction.label}</Button>
            </Link>
          </div>
        </Card>

        <ContentPackagePanel campaignId={campaignId} packages={exportPackage.contentPackages} />

        <div className="grid gap-4 md:grid-cols-2">
          {items.slice(0, 4).map((asset, index) => (
            <Card key={asset.itemId} className="overflow-hidden p-0">
              <div className="aspect-square bg-slate-100">
                <Image
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`}
                  alt={`${asset.dayLabel} export preview`}
                  width={1080}
                  height={1080}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="slate">{asset.dayLabel}</Badge>
                  <Badge tone={asset.layoutAdjusted ? "emerald" : "orange"}>{asset.layoutAdjusted ? "layout saved" : "default layout"}</Badge>
                  <Badge tone={asset.backgroundState === "signed_readback" ? "indigo" : "slate"}>{asset.backgroundState === "signed_readback" ? "signed visual" : "template background"}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-extrabold text-slate-950">{asset.headline}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{asset.copyText}</p>
                <Button className="mt-4 w-full" variant="secondary" onClick={() => downloadSvg(index)}>
                  <Download className="h-4 w-4" /> Download SVG
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CampaignConveyorShell>
    </AppShell>
  );
}

function readContentPackageDrafts(campaignId: string, items: { id: string }[]) {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(
    items.map((item) => [item.id, window.localStorage.getItem(createContentPackageStorageKey(campaignId, item.id))]),
  );
}

const fallbackClinic: ClinicProfile = {
  id: "demo-clinic",
  name: "PraxisLume Clinic",
  locality: "Locality",
  city: "City",
  services: [],
  phone: "",
};

const fallbackDoctor: DoctorProfile = {
  id: "demo-doctor",
  name: "Doctor",
  qualifications: "",
  specialty: "General practice",
};

function readStoredLayoutOverrides(campaignId: string, items: { id: string }[]) {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(
    items.map((item) => [item.id, window.localStorage.getItem(createExportStorageKey(campaignId, item.id))]),
  );
}

function downloadTextFile(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportTone(status: WeeklyExportStatus): "emerald" | "orange" | "slate" {
  if (status === "ready") return "emerald";
  if (status === "layout_required") return "orange";
  return "slate";
}

function exportStatusLabel(status: WeeklyExportStatus) {
  return {
    copy_required: "copy approval needed",
    layout_required: "final adjustment needed",
    ready: "ready to export",
  }[status];
}

function statusToOperatingStatus(status: WeeklyExportStatus): OperatingStatusId {
  const statusMap: Record<WeeklyExportStatus, OperatingStatusId> = {
    copy_required: "copy_needs_review",
    layout_required: "final_adjustment_needed",
    ready: "ready_to_export",
  };
  return statusMap[status];
}
