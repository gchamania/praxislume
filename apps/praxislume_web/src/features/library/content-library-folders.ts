import type { LibraryStatusRow } from "@/features/operations/operating-status";

export type LibrarySystemFolderId =
  | "all"
  | "current-week"
  | "needs-review"
  | "visuals-ready"
  | "ready-to-export"
  | "health-days"
  | "archive";

export type LibraryFolderKind = "system" | "custom";

export type LibraryFolder = {
  id: LibrarySystemFolderId | string;
  name: string;
  description: string;
  kind: LibraryFolderKind;
  locked?: boolean;
};

export type LibraryFolderState = {
  customFolders: LibraryFolder[];
  assignments: Record<string, string | undefined>;
};

export type LibraryStatusFilter = "all" | "posted" | "ready_to_export" | "final_adjustment_needed" | "copy_needs_review";

export type LibraryFilterInput = {
  rows: LibraryStatusRow[];
  state: LibraryFolderState;
  selectedFolderId: string;
  statusFilter?: LibraryStatusFilter;
  query?: string;
};

export type FolderOperationResult = {
  state: LibraryFolderState;
  error?: string;
  folderId?: string;
};

export const libraryFolderStorageVersion = 1;

export const systemLibraryFolders: LibraryFolder[] = [
  {
    id: "all",
    name: "All Content",
    description: "Every campaign item in the library.",
    kind: "system",
    locked: true,
  },
  {
    id: "current-week",
    name: "Current Week",
    description: "Items from the active first week.",
    kind: "system",
    locked: true,
  },
  {
    id: "needs-review",
    name: "Needs Review",
    description: "Copy that still needs compliance or approval.",
    kind: "system",
    locked: true,
  },
  {
    id: "visuals-ready",
    name: "Visuals Ready",
    description: "Approved copy ready for visual pack or adjustment.",
    kind: "system",
    locked: true,
  },
  {
    id: "ready-to-export",
    name: "Ready to Export",
    description: "Items that can be manually copied or exported.",
    kind: "system",
    locked: true,
  },
  {
    id: "health-days",
    name: "Health Days",
    description: "Seasonal, festival, and awareness-day content.",
    kind: "system",
    locked: true,
  },
  {
    id: "archive",
    name: "Archive",
    description: "Manually archived content.",
    kind: "system",
    locked: true,
  },
];

export const emptyLibraryFolderState: LibraryFolderState = {
  customFolders: [],
  assignments: {},
};

export function createLibraryFolder(state: LibraryFolderState, rawName: string): FolderOperationResult {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2) {
    return { state, error: "Folder name needs at least 2 characters." };
  }
  const allNames = [...systemLibraryFolders, ...state.customFolders].map((folder) => folder.name.toLowerCase());
  if (allNames.includes(name.toLowerCase())) {
    return { state, error: "A folder with this name already exists." };
  }
  const folderId = uniqueFolderId(name, state.customFolders);
  return {
    state: {
      ...state,
      customFolders: [
        ...state.customFolders,
        {
          id: folderId,
          name,
          description: "Custom clinic collection.",
          kind: "custom",
        },
      ],
    },
    folderId,
  };
}

export function renameLibraryFolder(state: LibraryFolderState, folderId: string, rawName: string): FolderOperationResult {
  const folder = state.customFolders.find((candidate) => candidate.id === folderId);
  if (!folder) return { state, error: "Only custom folders can be renamed." };
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2) return { state, error: "Folder name needs at least 2 characters." };
  const duplicate = [...systemLibraryFolders, ...state.customFolders]
    .filter((candidate) => candidate.id !== folderId)
    .some((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
  if (duplicate) return { state, error: "A folder with this name already exists." };
  return {
    state: {
      ...state,
      customFolders: state.customFolders.map((candidate) => candidate.id === folderId ? { ...candidate, name } : candidate),
    },
    folderId,
  };
}

export function deleteLibraryFolder(state: LibraryFolderState, folderId: string): FolderOperationResult {
  const folder = state.customFolders.find((candidate) => candidate.id === folderId);
  if (!folder) return { state, error: "Only custom folders can be deleted." };
  const containsItems = Object.values(state.assignments).includes(folderId);
  if (containsItems) return { state, error: "Move items out before deleting this folder." };
  return {
    state: {
      ...state,
      customFolders: state.customFolders.filter((candidate) => candidate.id !== folderId),
    },
  };
}

export function moveLibraryItem(state: LibraryFolderState, itemId: string, folderId: string): LibraryFolderState {
  const nextAssignments = { ...state.assignments };
  if (folderId === "all" || folderId === "current-week" || folderId === "needs-review" || folderId === "visuals-ready" || folderId === "ready-to-export" || folderId === "health-days") {
    delete nextAssignments[itemId];
  } else {
    nextAssignments[itemId] = folderId;
  }
  return { ...state, assignments: nextAssignments };
}

export function folderCounts(rows: LibraryStatusRow[], state: LibraryFolderState) {
  const counts: Record<string, number> = {};
  for (const folder of [...systemLibraryFolders, ...state.customFolders]) {
    counts[folder.id] = filterRowsForFolder(rows, state, folder.id).length;
  }
  return counts;
}

export function filterLibraryRows(input: LibraryFilterInput) {
  const statusFilter = input.statusFilter ?? "all";
  const query = input.query?.trim().toLowerCase() ?? "";
  return filterRowsForFolder(input.rows, input.state, input.selectedFolderId)
    .filter((row) => statusFilter === "all" || row.status.id === statusFilter)
    .filter((row) => {
      if (!query) return true;
      return [
        row.item.title,
        row.item.category,
        row.item.shortCta,
        row.item.objective,
        row.templateName,
        row.status.label,
      ].join(" ").toLowerCase().includes(query);
    });
}

export function serializeLibraryFolderState(state: LibraryFolderState) {
  return JSON.stringify({
    version: libraryFolderStorageVersion,
    customFolders: state.customFolders,
    assignments: state.assignments,
  });
}

export function parseLibraryFolderState(serialized: string | null | undefined): LibraryFolderState {
  if (!serialized) return emptyLibraryFolderState;
  try {
    const parsed = JSON.parse(serialized) as Partial<LibraryFolderState> & { version?: number };
    if (parsed.version !== libraryFolderStorageVersion) return emptyLibraryFolderState;
    const customFolders = Array.isArray(parsed.customFolders)
      ? parsed.customFolders.filter(isCustomFolder)
      : [];
    const assignments = parsed.assignments && typeof parsed.assignments === "object"
      ? Object.fromEntries(Object.entries(parsed.assignments).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    return { customFolders, assignments };
  } catch {
    return emptyLibraryFolderState;
  }
}

export function libraryFolderStorageKey(campaignId: string) {
  return `praxislume:library-folders:${campaignId}`;
}

function filterRowsForFolder(rows: LibraryStatusRow[], state: LibraryFolderState, folderId: string) {
  if (folderId === "all") return rows;
  if (folderId === "current-week") return rows.filter((row) => row.item.dayOffset < 7 && state.assignments[row.item.id] !== "archive");
  if (folderId === "needs-review") return rows.filter((row) => row.status.id === "copy_needs_review" && state.assignments[row.item.id] !== "archive");
  if (folderId === "visuals-ready") return rows.filter((row) => (row.status.id === "visuals_ready" || row.status.id === "final_adjustment_needed") && state.assignments[row.item.id] !== "archive");
  if (folderId === "ready-to-export") return rows.filter((row) => row.status.id === "ready_to_export" && state.assignments[row.item.id] !== "archive");
  if (folderId === "health-days") return rows.filter((row) => isHealthDayRow(row) && state.assignments[row.item.id] !== "archive");
  if (folderId === "archive") return rows.filter((row) => state.assignments[row.item.id] === "archive");
  return rows.filter((row) => state.assignments[row.item.id] === folderId);
}

function isHealthDayRow(row: LibraryStatusRow) {
  const searchable = [row.item.title, row.item.category, row.item.objective, ...row.item.keyPoints].join(" ").toLowerCase();
  return ["health day", "seasonal", "festival", "monsoon", "doctor's day", "world hearing day", "world health day"].some((token) => searchable.includes(token));
}

function uniqueFolderId(name: string, existingFolders: LibraryFolder[]) {
  const base = `folder-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "custom"}`;
  const existingIds = new Set(existingFolders.map((folder) => folder.id));
  if (!existingIds.has(base)) return base;
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function isCustomFolder(value: unknown): value is LibraryFolder {
  if (!value || typeof value !== "object") return false;
  const folder = value as Partial<LibraryFolder>;
  return typeof folder.id === "string" && typeof folder.name === "string" && folder.kind === "custom";
}
