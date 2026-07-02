"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";
import { buildClinicCalendarMonth, eventKindLabels, eventKindTone, initialCalendarMonth } from "@/features/calendar/clinic-calendar";
import { createExportStorageKey } from "@/features/export/export-workflow";
import { buildOperatingStatusModel } from "@/features/operations/operating-status";
import { staffDefaultAction } from "@/features/staff/mobile-staff-ux";

export default function CalendarPage() {
  const { activeVisualAsset, activeVisualItemId, state } = usePraxis();
  const [visibleMonth, setVisibleMonth] = useState(() => initialCalendarMonth());
  const layoutAdjustedItemIds = readLayoutAdjustedItemIds(state.campaign?.id ?? "demo", state.items);
  const operating = buildOperatingStatusModel({
    campaign: state.campaign,
    items: state.items,
    visualItemIds: new Set(activeVisualItemId && activeVisualAsset?.signedUrl ? [activeVisualItemId] : []),
    layoutAdjustedItemIds,
  });
  const campaignId = state.campaign?.id ?? "active";
  const calendarMonth = buildClinicCalendarMonth({
    ...visibleMonth,
    items: state.items,
    clinic: state.clinic,
    specialty: state.doctor?.specialty,
  });

  return (
    <AppShell
      title="Calendar"
      subtitle="Month-by-month clinic calendar with campaign work, health days, local observances, festivals, and public-holiday prompts."
      action={<Link href="/campaigns/new"><Button><Plus className="h-5 w-5" />Create 30-Day Plan</Button></Link>}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="indigo">Month View</Badge>
                <Badge tone="emerald">{state.clinic?.city ?? "Pune"} context</Badge>
                <Badge tone="amber">{state.doctor?.specialty ?? "Specialty"} prompts</Badge>
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">{calendarMonth.label}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setVisibleMonth(calendarMonth.previous)} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => setVisibleMonth(initialCalendarMonth())}>Today</Button>
              <Button variant="secondary" onClick={() => setVisibleMonth(calendarMonth.next)} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-3">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
            {calendarMonth.days.map((day) => {
              const fullItems = day.contentItems.filter((item) => {
                const calendarDay = operating.calendarDays.find((candidate) => candidate.itemId === item.id);
                return calendarDay?.cardMode === "full" && !calendarDay.locked;
              });
              const placeholders = day.contentItems.filter((item) => !fullItems.some((fullItem) => fullItem.id === item.id));
              return (
                <div
                  key={day.date}
                  className={`min-h-40 border-b border-r border-slate-100 p-3 ${day.inCurrentMonth ? "bg-white" : "bg-slate-50/50"} ${day.isToday ? "ring-2 ring-inset ring-indigo-200" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${day.isToday ? "bg-indigo-600 text-white" : day.inCurrentMonth ? "text-slate-900" : "text-slate-300"}`}>
                      {day.dayOfMonth}
                    </span>
                    {day.events.length + day.contentItems.length > 0 ? (
                      <span className="text-[11px] font-bold text-slate-400">{day.events.length + day.contentItems.length}</span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {day.events.slice(0, 2).map((event) => (
                      <div key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <Badge tone={eventKindTone(event.kind)}>{eventKindLabels[event.kind]}</Badge>
                        <p className="mt-1 text-xs font-extrabold leading-snug text-slate-800">{event.title}</p>
                      </div>
                    ))}

                    {fullItems.slice(0, 2).map((item) => {
                      const calendarDay = operating.calendarDays.find((candidate) => candidate.itemId === item.id);
                      return (
                        <Link key={item.id} href={calendarDay?.href ?? `/content/${item.id}`} className="block rounded-lg border border-indigo-100 bg-indigo-50 p-2 hover:bg-indigo-100">
                          <Badge tone="indigo">Campaign</Badge>
                          <p className="mt-1 text-xs font-extrabold leading-snug text-indigo-950">{item.title}</p>
                        </Link>
                      );
                    })}

                    {placeholders.slice(0, 1).map((item) => {
                      const calendarDay = operating.calendarDays.find((candidate) => candidate.itemId === item.id);
                      return (
                        <div key={item.id} className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                            <Lock className="h-3 w-3" />
                            {calendarDay?.locked ? "Future week" : "Needs review"}
                          </div>
                          <p className="mt-1 text-xs font-bold leading-snug text-slate-500">{item.title}</p>
                        </div>
                      );
                    })}

                    {day.events.length + day.contentItems.length > 4 ? (
                      <p className="text-[11px] font-bold text-slate-400">+{day.events.length + day.contentItems.length - 4} more</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-lg font-extrabold text-slate-950">Calendar layers</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(eventKindLabels).map(([kind, label]) => (
                <Badge key={kind} tone={eventKindTone(kind as keyof typeof eventKindLabels)}>{label}</Badge>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Current pilot uses a curated India/Maharashtra seed so clinic campaigns can align with health days, local observances, festivals, and holiday timing.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg font-extrabold text-slate-950">Operating status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="indigo">Calendar View</Badge>
              <Badge tone="emerald">{operating.dashboardCards.find((card) => card.id === "ready_to_export")?.count ?? 0} ready</Badge>
              <Badge tone="amber">{operating.dashboardCards.find((card) => card.id === "copy_needs_review")?.count ?? 0} review</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {operating.calendarDays.slice(0, 4).map((day) => {
                const staffAction = staffDefaultAction(day.status.id, campaignId, "week-1");
                return (
                  <Link key={day.itemId} href={staffAction.href} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 text-sm font-bold leading-snug text-slate-900">{day.title}</p>
                      <Badge tone={day.locked ? "slate" : day.status.tone}>{day.locked ? "locked" : day.status.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{staffAction.label}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function readLayoutAdjustedItemIds(campaignId: string, items: { id: string }[]) {
  if (typeof window === "undefined") return new Set<string>();
  return new Set(
    items
      .filter((item) => Boolean(window.localStorage.getItem(createExportStorageKey(campaignId, item.id))))
      .map((item) => item.id),
  );
}
