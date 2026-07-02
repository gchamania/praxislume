"use client";

import { useMemo, useState } from "react";
import { Clipboard, Hash, ImageIcon, Save } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  createContentPackageStorageKey,
  serializeContentPackageDraft,
  type ContentPackageItem,
  type ContentPackagePlatform,
} from "./content-package";

const platformTabs: Array<{ id: ContentPackagePlatform; label: string }> = [
  { id: "instagram_post", label: "Instagram" },
  { id: "reel_caption", label: "Reel" },
  { id: "whatsapp_share", label: "WhatsApp" },
  { id: "clinic_handout", label: "Handout" },
];

export function ContentPackagePanel({
  campaignId,
  packages,
}: {
  campaignId: string;
  packages: ContentPackageItem[];
}) {
  const [selectedItemId, setSelectedItemId] = useState(packages[0]?.itemId ?? "");
  const selected = packages.find((contentPackage) => contentPackage.itemId === selectedItemId) ?? packages[0];
  const [drafts, setDrafts] = useState<Record<string, ContentPackageItem>>(() =>
    Object.fromEntries(packages.map((contentPackage) => [contentPackage.itemId, contentPackage])),
  );
  const [platform, setPlatform] = useState<ContentPackagePlatform>("instagram_post");
  const [message, setMessage] = useState<string>();
  const draft = selected ? drafts[selected.itemId] ?? selected : undefined;
  const thumbnailChoices = useMemo(
    () => packages.map((contentPackage) => ({
      itemId: contentPackage.itemId,
      label: contentPackage.dayLabel,
      url: contentPackage.thumbnailUrl,
    })),
    [packages],
  );

  if (!draft) return null;

  function updateDraft(patch: Partial<ContentPackageItem>) {
    if (!draft) return;
    setDrafts((current) => ({
      ...current,
      [draft.itemId]: {
        ...draft,
        ...patch,
      },
    }));
    setMessage(undefined);
  }

  function updateHashtagText(value: string) {
    updateDraft({
      hashtags: value
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#/, "").replace(/[^a-z0-9]/gi, ""))
        .filter(Boolean)
        .slice(0, 14),
    });
  }

  function saveDraft() {
    if (!draft) return;
    window.localStorage.setItem(createContentPackageStorageKey(campaignId, draft.itemId), serializeContentPackageDraft(draft));
    setMessage("Content package saved locally for this staging pass.");
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied.`);
  }

  const platformCopy = buildPlatformCopy(draft, platform);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Badge tone="indigo">Content package</Badge>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">Thumbnail, caption, hashtags, CTA</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Structured posting assets stay separate from final layout moves. Any medical copy changes can be routed back to review before live release.
          </p>
        </div>
        <Button onClick={saveDraft}>
          <Save className="h-4 w-4" /> Save Package
        </Button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Week item</p>
          <div className="grid gap-2">
            {packages.map((contentPackage) => (
              <button
                key={contentPackage.itemId}
                className={`rounded-xl border p-3 text-left ${draft.itemId === contentPackage.itemId ? "border-indigo-300 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                onClick={() => setSelectedItemId(contentPackage.itemId)}
              >
                <span className="text-xs font-extrabold text-indigo-600">{contentPackage.dayLabel}</span>
                <span className="mt-1 block text-sm font-bold leading-snug text-slate-900">{contentPackage.caption.slice(0, 72)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {draft.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.thumbnailUrl} alt="" className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-sm font-bold text-slate-400">
                  <ImageIcon className="mr-2 h-4 w-4" /> No thumbnail
                </div>
              )}
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">{draft.thumbnailLabel}</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {thumbnailChoices.map((choice) => (
                <button
                  key={choice.itemId}
                  className={`overflow-hidden rounded-lg border ${draft.thumbnailUrl === choice.url ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-100"}`}
                  onClick={() => updateDraft({ thumbnailUrl: choice.url, thumbnailLabel: `${choice.label} thumbnail` })}
                  aria-label={`Use ${choice.label} thumbnail`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={choice.url} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-slate-700">Caption</span>
              <textarea
                className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={draft.caption}
                onChange={(event) => updateDraft({ caption: event.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700">
                <Hash className="h-4 w-4" /> Hashtags
              </span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={draft.hashtags.map((tag) => `#${tag}`).join(" ")}
                onChange={(event) => updateHashtagText(event.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700">CTA</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={draft.cta}
                  onChange={(event) => updateDraft({ cta: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-slate-700">Disclaimer</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  value={draft.disclaimer}
                  onChange={(event) => updateDraft({ disclaimer: event.target.value })}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                {platformTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`rounded-full px-3 py-2 text-sm font-bold ${platform === tab.id ? "bg-indigo-600 text-white" : "bg-white text-slate-600 shadow-sm"}`}
                    onClick={() => setPlatform(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <pre className="mt-4 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700">{platformCopy}</pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void copyText(draft.caption, "Caption")}>
                  <Clipboard className="h-4 w-4" /> Caption
                </Button>
                <Button variant="secondary" onClick={() => void copyText(draft.hashtags.map((tag) => `#${tag}`).join(" "), "Hashtags")}>
                  <Clipboard className="h-4 w-4" /> Hashtags
                </Button>
                <Button variant="secondary" onClick={() => void copyText(platformCopy, "Platform copy")}>
                  <Clipboard className="h-4 w-4" /> Platform Copy
                </Button>
              </div>
            </div>

            {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function buildPlatformCopy(contentPackage: ContentPackageItem, platform: ContentPackagePlatform) {
  if (platform === "instagram_post") {
    return [contentPackage.caption, contentPackage.hashtags.map((tag) => `#${tag}`).join(" "), contentPackage.cta, contentPackage.disclaimer].join("\n\n");
  }
  if (platform === "reel_caption") {
    return [contentPackage.caption, contentPackage.hashtags.slice(0, 6).map((tag) => `#${tag}`).join(" "), contentPackage.cta].join("\n\n");
  }
  if (platform === "whatsapp_share") {
    return [contentPackage.caption, contentPackage.cta, contentPackage.disclaimer].join("\n\n");
  }
  return [contentPackage.caption, `Action: ${contentPackage.cta}`, contentPackage.disclaimer].join("\n\n");
}
