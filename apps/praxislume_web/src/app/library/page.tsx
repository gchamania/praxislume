"use client";

import Link from "next/link";
import { ArrowRight, Filter, Folder, FolderOpen, FolderPlus, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";
import { createExportStorageKey } from "@/features/export/export-workflow";
import {
  createLibraryFolder,
  deleteLibraryFolder,
  emptyLibraryFolderState,
  filterLibraryRows,
  folderCounts,
  libraryFolderStorageKey,
  moveLibraryItem,
  parseLibraryFolderState,
  renameLibraryFolder,
  serializeLibraryFolderState,
  systemLibraryFolders,
  type LibraryFolderState,
  type LibraryStatusFilter,
} from "@/features/library/content-library-folders";
import { buildOperatingStatusModel, type OperatingStatusModel } from "@/features/operations/operating-status";
import { staffDefaultAction } from "@/features/staff/mobile-staff-ux";
import type { TemplateAspectRatio } from "@/features/templates/template-layout";

const statusTabs: Array<{ id: LibraryStatusFilter; label: string }> = [
  { id: "all", label: "All Content" },
  { id: "posted", label: "Posted" },
  { id: "ready_to_export", label: "Ready to Export" },
  { id: "final_adjustment_needed", label: "Needs Adjust" },
  { id: "copy_needs_review", label: "Copy Review" },
];

export default function LibraryPage() {
  const { activeVisualAsset, activeVisualItemId, state } = usePraxis();
  const campaignId = state.campaign?.id ?? "demo";
  const contentItems = state.items;
  const layoutMetadata = readLayoutMetadata(campaignId, contentItems);
  const operating = buildOperatingStatusModel({
    campaign: state.campaign,
    items: contentItems,
    visualItemIds: new Set(activeVisualItemId && activeVisualAsset?.signedUrl ? [activeVisualItemId] : []),
    layoutAdjustedItemIds: layoutMetadata.layoutAdjustedItemIds,
    aspectRatioByItemId: layoutMetadata.aspectRatioByItemId,
  });

  return <LibraryWorkspace key={campaignId} campaignId={campaignId} operating={operating} state={state} />;
}

function LibraryWorkspace({
  campaignId,
  operating,
  state,
}: {
  campaignId: string;
  operating: OperatingStatusModel;
  state: ReturnType<typeof usePraxis>["state"];
}) {
  const storageKey = libraryFolderStorageKey(campaignId);
  const [folderState, setFolderState] = useState<LibraryFolderState>(() =>
    typeof window === "undefined" ? emptyLibraryFolderState : parseLibraryFolderState(window.localStorage.getItem(storageKey)),
  );
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderMessage, setFolderMessage] = useState<string>();
  const [renamingFolderId, setRenamingFolderId] = useState<string>();
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, serializeLibraryFolderState(folderState));
    }
  }, [folderState, storageKey]);

  const allFolders = useMemo(() => [...systemLibraryFolders, ...folderState.customFolders], [folderState.customFolders]);
  const counts = useMemo(() => folderCounts(operating.libraryRows, folderState), [folderState, operating.libraryRows]);
  const filteredRows = useMemo(
    () => filterLibraryRows({ rows: operating.libraryRows, state: folderState, selectedFolderId, statusFilter, query }),
    [folderState, operating.libraryRows, query, selectedFolderId, statusFilter],
  );
  const selectedFolder = allFolders.find((folder) => folder.id === selectedFolderId) ?? allFolders[0];

  const createFolder = () => {
    const result = createLibraryFolder(folderState, newFolderName);
    setFolderState(result.state);
    setFolderMessage(result.error ?? `Created ${newFolderName.trim()}`);
    if (!result.error && result.folderId) {
      setSelectedFolderId(result.folderId);
      setNewFolderName("");
      setCreatingFolder(false);
    }
  };

  const startRename = (folderId: string, name: string) => {
    setRenamingFolderId(folderId);
    setRenameValue(name);
    setFolderMessage(undefined);
  };

  const commitRename = () => {
    if (!renamingFolderId) return;
    const result = renameLibraryFolder(folderState, renamingFolderId, renameValue);
    setFolderState(result.state);
    setFolderMessage(result.error ?? "Folder renamed");
    if (!result.error) {
      setRenamingFolderId(undefined);
      setRenameValue("");
    }
  };

  const removeSelectedFolder = () => {
    const result = deleteLibraryFolder(folderState, selectedFolderId);
    setFolderState(result.state);
    setFolderMessage(result.error ?? "Folder deleted");
    if (!result.error) {
      setSelectedFolderId("all");
    }
  };

  return (
    <AppShell
      title="Content Library"
      subtitle="All campaign assets, folders, conveyor states, and export metadata in one place."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setCreatingFolder(true)}><FolderPlus className="h-4 w-4" />New Folder</Button>
          <Link href="/campaigns/new"><Button><Plus className="h-4 w-4" />Create 30-Day Plan</Button></Link>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-500">Folders</p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Clinic collections</h2>
            </div>
            <Badge tone="indigo">{allFolders.length}</Badge>
          </div>

          {creatingFolder ? (
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Folder name</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. Dermatology launch"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") createFolder();
                    if (event.key === "Escape") setCreatingFolder(false);
                  }}
                />
              </label>
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" onClick={createFolder}>Create</Button>
                <Button variant="ghost" onClick={() => setCreatingFolder(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : null}

          {folderMessage ? <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">{folderMessage}</p> : null}

          <div className="mt-5 space-y-2">
            {allFolders.map((folder) => {
              const selected = selectedFolderId === folder.id;
              const Icon = selected ? FolderOpen : Folder;
              return (
                <button
                  key={folder.id}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${selected ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <Icon className={`mt-0.5 h-5 w-5 ${selected ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-slate-900">{folder.name}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">{folder.description}</span>
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-extrabold text-slate-500 shadow-sm">{counts[folder.id] ?? 0}</span>
                </button>
              );
            })}
          </div>

          {selectedFolder?.kind === "custom" ? (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              {renamingFolderId === selectedFolder.id ? (
                <div>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename();
                      if (event.key === "Escape") setRenamingFolderId(undefined);
                    }}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" onClick={commitRename}>Save</Button>
                    <Button variant="ghost" onClick={() => setRenamingFolderId(undefined)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => startRename(selectedFolder.id, selectedFolder.name)}><PenLine className="h-4 w-4" />Rename</Button>
                  <Button variant="ghost" className="flex-1" onClick={removeSelectedFolder}><Trash2 className="h-4 w-4" />Delete</Button>
                </div>
              )}
            </div>
          ) : null}

          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            Folder organization is local staging state for now. Backend persistence can move this into `content_folders` and `content_folder_items` after the UX stabilizes.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="indigo">{selectedFolder?.name ?? "All Content"}</Badge>
                  <Badge tone="emerald">{filteredRows.length} items</Badge>
                </div>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">{selectedFolder?.name ?? "Content"} Library</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedFolder?.description}</p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Search content, topic, type..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-full px-3 py-2 text-sm font-bold ${statusFilter === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              <button
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  setStatusFilter("all");
                  setQuery("");
                }}
              >
                <Filter className="h-4 w-4" />
                Reset filters
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const staffAction = staffDefaultAction(row.status.id, state.campaign?.id ?? "active", "week-1");
              const assignment = folderState.assignments[row.item.id] ?? "all";
              return (
                <div key={row.item.id} className="grid gap-4 p-5 hover:bg-indigo-50/30 2xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(180px,220px)_auto] 2xl:items-center">
                  <div className="min-w-0">
                    <Link href={row.href} className="font-bold text-slate-950 hover:text-indigo-600">{row.item.title}</Link>
                    <p className="mt-1 text-sm text-slate-500">{row.item.category} - {row.item.shortCta}</p>
                  </div>
                  <Badge tone="indigo">{row.templateName}</Badge>
                  <Badge tone={row.aspectRatio === "1:1" ? "slate" : "blue"}>{row.aspectRatio}</Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.visualStatus === "signed visual" ? "emerald" : "slate"}>{row.visualStatus}</Badge>
                    <Badge tone={row.layoutStatus === "layout adjusted" ? "emerald" : "orange"}>{row.layoutStatus}</Badge>
                    <Badge tone={row.status.tone}>{row.status.label}</Badge>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Move to</span>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      value={assignment}
                      onChange={(event) => setFolderState((current) => moveLibraryItem(current, row.item.id, event.target.value))}
                    >
                      <option value="all">Unfiled</option>
                      <option value="archive">Archive</option>
                      {folderState.customFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </label>
                  <Link href={staffAction.href}>
                    <Button variant={staffAction.intent === "export" ? "teal" : "secondary"} className="w-full 2xl:w-auto">
                      {staffAction.label} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="font-display text-xl font-extrabold text-slate-950">No content in this view</h2>
              <p className="mt-2 text-sm text-slate-500">Try another folder, clear the search query, or reset the status filter.</p>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

function readLayoutMetadata(campaignId: string, items: { id: string }[]) {
  const layoutAdjustedItemIds = new Set<string>();
  const aspectRatioByItemId: Record<string, TemplateAspectRatio> = {};
  if (typeof window === "undefined") {
    return { layoutAdjustedItemIds, aspectRatioByItemId };
  }
  for (const item of items) {
    const serialized = window.localStorage.getItem(createExportStorageKey(campaignId, item.id));
    if (!serialized) continue;
    layoutAdjustedItemIds.add(item.id);
    const aspectRatio = aspectRatioFromSerialized(serialized);
    if (aspectRatio) {
      aspectRatioByItemId[item.id] = aspectRatio;
    }
  }
  return { layoutAdjustedItemIds, aspectRatioByItemId };
}

function aspectRatioFromSerialized(serialized: string): TemplateAspectRatio | undefined {
  try {
    const parsed = JSON.parse(serialized) as { aspectRatio?: string };
    return parsed.aspectRatio === "1:1" || parsed.aspectRatio === "4:5" || parsed.aspectRatio === "9:16" || parsed.aspectRatio === "16:9"
      ? parsed.aspectRatio
      : undefined;
  } catch {
    return undefined;
  }
}
