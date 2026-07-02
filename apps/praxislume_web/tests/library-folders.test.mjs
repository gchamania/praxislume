import assert from "node:assert/strict";
import test from "node:test";

import {
  createLibraryFolder,
  deleteLibraryFolder,
  emptyLibraryFolderState,
  filterLibraryRows,
  folderCounts,
  moveLibraryItem,
  parseLibraryFolderState,
  renameLibraryFolder,
  serializeLibraryFolderState,
  systemLibraryFolders,
} from "../src/features/library/content-library-folders.ts";

function item(input = {}) {
  return {
    id: input.id ?? "item-1",
    clinicId: "clinic-1",
    campaignId: "campaign-1",
    scheduledDate: input.scheduledDate ?? "2026-07-01",
    dayOffset: input.dayOffset ?? 0,
    title: input.title ?? "World Health Day awareness",
    category: input.category ?? "Awareness",
    status: input.itemStatus ?? "drafted",
    objective: input.objective ?? "General patient education",
    keyPoints: input.keyPoints ?? ["General education"],
    caption: "Patient education caption.",
    reelHook: "",
    reelScript: "",
    shortCta: input.shortCta ?? "Book a consultation",
    disclaimer: "General education only.",
    complianceStatus: "passed",
    contentVersionHash: "hash",
  };
}

function row(input = {}) {
  return {
    item: item(input),
    status: {
      id: input.status ?? "copy_needs_review",
      label: input.label ?? "Copy needs review",
      description: "Review copy.",
      tone: "amber",
    },
    templateName: "Clinic education card",
    aspectRatio: "1:1",
    visualStatus: "template background",
    layoutStatus: "default layout",
    href: `/content/${input.id ?? "item-1"}`,
  };
}

test("library folders expose expected system collections", () => {
  assert.deepEqual(
    systemLibraryFolders.map((folder) => folder.id),
    ["all", "current-week", "needs-review", "visuals-ready", "ready-to-export", "health-days", "archive"],
  );
  assert.equal(systemLibraryFolders.every((folder) => folder.locked), true);
});

test("custom folder create, rename, move, and delete-empty behavior is guarded", () => {
  const created = createLibraryFolder(emptyLibraryFolderState, "Reception Review");
  assert.equal(created.error, undefined);
  assert.equal(created.folderId, "folder-reception-review");
  assert.equal(created.state.customFolders[0].name, "Reception Review");

  const moved = moveLibraryItem(created.state, "item-1", created.folderId);
  const blockedDelete = deleteLibraryFolder(moved, created.folderId);
  assert.equal(blockedDelete.error, "Move items out before deleting this folder.");

  const unfiled = moveLibraryItem(moved, "item-1", "all");
  const renamed = renameLibraryFolder(unfiled, created.folderId, "Doctor Approval");
  assert.equal(renamed.state.customFolders[0].name, "Doctor Approval");

  const deleted = deleteLibraryFolder(renamed.state, created.folderId);
  assert.equal(deleted.error, undefined);
  assert.equal(deleted.state.customFolders.length, 0);
});

test("library rows filter by system folder, custom folder, status, and search", () => {
  const rows = [
    row({ id: "review", title: "Jewellery allergy caption", status: "copy_needs_review", dayOffset: 0 }),
    row({ id: "visual", title: "Ear grommet carousel", status: "visuals_ready", dayOffset: 1 }),
    row({ id: "export", title: "Clinic poster", status: "ready_to_export", dayOffset: 8 }),
    row({ id: "health", title: "World Hearing Day", status: "ready_to_export", dayOffset: 2, category: "Health day" }),
  ];
  const created = createLibraryFolder(emptyLibraryFolderState, "Dermatology");
  const folderId = created.folderId;
  assert.ok(folderId);
  const state = moveLibraryItem(created.state, "review", folderId);

  assert.equal(filterLibraryRows({ rows, state, selectedFolderId: "needs-review" }).length, 1);
  assert.equal(filterLibraryRows({ rows, state, selectedFolderId: "health-days" }).length, 1);
  assert.equal(filterLibraryRows({ rows, state, selectedFolderId: folderId }).map((candidate) => candidate.item.id)[0], "review");
  assert.equal(filterLibraryRows({ rows, state, selectedFolderId: "all", statusFilter: "ready_to_export" }).length, 2);
  assert.equal(filterLibraryRows({ rows, state, selectedFolderId: "all", query: "grommet" }).map((candidate) => candidate.item.id)[0], "visual");
});

test("folder counts and serialization round trip local staging state", () => {
  const rows = [
    row({ id: "review", status: "copy_needs_review", dayOffset: 0 }),
    row({ id: "export", status: "ready_to_export", dayOffset: 8 }),
  ];
  const created = createLibraryFolder(emptyLibraryFolderState, "Weekly Export");
  const folderId = created.folderId;
  assert.ok(folderId);
  const state = moveLibraryItem(created.state, "export", folderId);
  const counts = folderCounts(rows, state);
  assert.equal(counts.all, 2);
  assert.equal(counts["needs-review"], 1);
  assert.equal(counts[folderId], 1);

  const serialized = serializeLibraryFolderState(state);
  const parsed = parseLibraryFolderState(serialized);
  assert.equal(parsed.customFolders[0].name, "Weekly Export");
  assert.equal(parsed.assignments.export, folderId);
  assert.deepEqual(parseLibraryFolderState("{bad json"), emptyLibraryFolderState);
});
