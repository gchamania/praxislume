import type { ClinicProfile, ContentItem } from "@/lib/praxis-models";

export type CalendarEventKind = "campaign" | "health_day" | "festival" | "public_holiday" | "state_day" | "clinic_event";

export type ClinicCalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: CalendarEventKind;
  region: "global" | "india" | "maharashtra" | "pune" | "clinic";
  specialty?: string;
  description: string;
};

export type ClinicCalendarDay = {
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: ClinicCalendarEvent[];
  contentItems: ContentItem[];
};

export type ClinicCalendarMonth = {
  year: number;
  monthIndex: number;
  label: string;
  previous: { year: number; monthIndex: number };
  next: { year: number; monthIndex: number };
  days: ClinicCalendarDay[];
};

export const eventKindLabels: Record<CalendarEventKind, string> = {
  campaign: "Campaign",
  health_day: "Health day",
  festival: "Festival",
  public_holiday: "Public holiday",
  state_day: "State day",
  clinic_event: "Clinic event",
};

export const calendarSeedEvents: ClinicCalendarEvent[] = [
  {
    id: "india-doctors-day-2026",
    date: "2026-07-01",
    title: "National Doctor's Day",
    kind: "health_day",
    region: "india",
    description: "Useful for doctor trust, team story, preventive care, and clinic credibility posts.",
  },
  {
    id: "global-population-day-2026",
    date: "2026-07-11",
    title: "World Population Day",
    kind: "health_day",
    region: "global",
    description: "Good fit for gynecology, pediatrics, family health, and preventive screening education.",
  },
  {
    id: "india-kargil-vijay-diwas-2026",
    date: "2026-07-26",
    title: "Kargil Vijay Diwas",
    kind: "state_day",
    region: "india",
    description: "Respectful local-awareness slot; avoid mixing medical claims with patriotic messaging.",
  },
  {
    id: "global-hepatitis-day-2026",
    date: "2026-07-28",
    title: "World Hepatitis Day",
    kind: "health_day",
    region: "global",
    description: "Works for general medicine, gastroenterology, pediatrics, and preventive health campaigns.",
  },
  {
    id: "maharashtra-monsoon-skin-week-2026",
    date: "2026-07-16",
    title: "Monsoon skin and allergy week",
    kind: "clinic_event",
    region: "maharashtra",
    specialty: "Dermatology",
    description: "Local seasonal prompt for skin rashes, fungal infections, jewellery reactions, and allergy care.",
  },
  {
    id: "india-independence-day-2026",
    date: "2026-08-15",
    title: "Independence Day",
    kind: "public_holiday",
    region: "india",
    description: "Public holiday slot; suitable for clinic timing notices or community health messages.",
  },
  {
    id: "maharashtra-ganeshotsav-prep-2026",
    date: "2026-08-18",
    title: "Ganeshotsav health prep",
    kind: "festival",
    region: "maharashtra",
    description: "Festival preparation prompt for noise safety, food hygiene, skin care, and clinic hours.",
  },
  {
    id: "global-heart-day-2026",
    date: "2026-09-29",
    title: "World Heart Day",
    kind: "health_day",
    region: "global",
    description: "Preventive health slot for cardiology, diabetology, family medicine, and wellness campaigns.",
  },
  {
    id: "maharashtra-day-2027",
    date: "2027-05-01",
    title: "Maharashtra Day",
    kind: "state_day",
    region: "maharashtra",
    description: "State observance; useful for local clinic greeting and timing notices.",
  },
];

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

export function buildClinicCalendarMonth(input: {
  year: number;
  monthIndex: number;
  items: ContentItem[];
  clinic?: Pick<ClinicProfile, "city" | "locality">;
  specialty?: string;
  today?: string;
  seedEvents?: ClinicCalendarEvent[];
}): ClinicCalendarMonth {
  const normalizedMonth = normalizeMonth(input.year, input.monthIndex);
  const monthStart = new Date(Date.UTC(normalizedMonth.year, normalizedMonth.monthIndex, 1));
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - monthStart.getUTCDay());
  const eventsByDate = groupEvents(filterEventsForClinic(input.seedEvents ?? calendarSeedEvents, input.clinic, input.specialty));
  const itemsByDate = groupItems(input.items);
  const today = input.today ?? isoDate(new Date());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    const dateKey = isoDate(date);
    return {
      date: dateKey,
      dayOfMonth: date.getUTCDate(),
      inCurrentMonth: date.getUTCMonth() === normalizedMonth.monthIndex,
      isToday: dateKey === today,
      events: eventsByDate[dateKey] ?? [],
      contentItems: itemsByDate[dateKey] ?? [],
    };
  });

  return {
    ...normalizedMonth,
    label: monthFormatter.format(monthStart),
    previous: normalizeMonth(normalizedMonth.year, normalizedMonth.monthIndex - 1),
    next: normalizeMonth(normalizedMonth.year, normalizedMonth.monthIndex + 1),
    days,
  };
}

export function initialCalendarMonth(date = new Date()) {
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function eventKindTone(kind: CalendarEventKind): "indigo" | "emerald" | "orange" | "blue" | "slate" | "amber" {
  if (kind === "campaign") return "indigo";
  if (kind === "health_day") return "emerald";
  if (kind === "festival") return "amber";
  if (kind === "public_holiday") return "blue";
  if (kind === "state_day") return "orange";
  return "slate";
}

function filterEventsForClinic(events: ClinicCalendarEvent[], clinic?: Pick<ClinicProfile, "city" | "locality">, specialty?: string) {
  const city = `${clinic?.city ?? ""} ${clinic?.locality ?? ""}`.toLowerCase();
  const isMaharashtraDemo = city.includes("pune") || city.includes("maharashtra") || !city.trim();
  const normalizedSpecialty = specialty?.toLowerCase() ?? "";

  return events.filter((event) => {
    if (event.region === "pune" && !city.includes("pune")) return false;
    if (event.region === "maharashtra" && !isMaharashtraDemo) return false;
    if (event.specialty && normalizedSpecialty && !normalizedSpecialty.includes(event.specialty.toLowerCase())) return false;
    return true;
  });
}

function groupEvents(events: ClinicCalendarEvent[]) {
  return events.reduce<Record<string, ClinicCalendarEvent[]>>((accumulator, event) => {
    accumulator[event.date] = [...(accumulator[event.date] ?? []), event];
    return accumulator;
  }, {});
}

function groupItems(items: ContentItem[]) {
  return items.reduce<Record<string, ContentItem[]>>((accumulator, item) => {
    accumulator[item.scheduledDate] = [...(accumulator[item.scheduledDate] ?? []), item];
    return accumulator;
  }, {});
}

function normalizeMonth(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return { year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
