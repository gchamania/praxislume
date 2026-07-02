"use client";

import { Bell, CreditCard, LockKeyhole, Moon, Palette, Sun, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card, Field } from "@/components/ui";
import { themeModeDescription, themeModeLabel, themeModes, type ThemeMode } from "@/features/theme/theme-mode";
import { useThemeMode } from "@/features/theme/use-theme-mode";

export default function SettingsPage() {
  const { mode, state, user, refresh, status } = usePraxis();
  const { effectiveMode, mode: themeMode, setMode: setThemeMode } = useThemeMode();

  return (
    <AppShell title="Account Settings" subtitle="Account and session controls for the web workspace.">
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="p-4">
          {[
            ["Profile", UserRound],
            ["Appearance", Palette],
            ["Security", LockKeyhole],
            ["Notifications", Bell],
            ["Billing", CreditCard],
          ].map(([label, Icon], index) => (
            <button key={String(label)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${index === 0 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Icon className="h-5 w-5" />
              {String(label)}
            </button>
          ))}
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Profile information</h2>
              <Badge tone={mode === "live" ? "emerald" : "slate"}>{mode === "live" ? "Supabase session" : "Demo profile"}</Badge>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" value={state.doctor?.name ?? "Dr. Rohan Verma"} />
              <Field label="Email" value={user?.email ?? "doctor@dhwanient.test"} />
              <Field label="Role" value="Clinic owner" />
              <Field label="Timezone" value="Asia/Kolkata" />
            </div>
            <Button className="mt-8" onClick={() => void refresh()} disabled={status === "loading"}>Refresh Session Data</Button>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold">Appearance</h2>
                <p className="mt-1 text-sm text-slate-500">Theme changes apply to the app workspace only. Exported clinic assets keep brand kit colors.</p>
              </div>
              <Badge tone={effectiveMode === "dark" ? "indigo" : "amber"}>{effectiveMode === "dark" ? "Dark active" : "Light active"}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {themeModes.map((modeOption) => (
                <ThemeModeButton
                  key={modeOption}
                  active={themeMode === modeOption}
                  mode={modeOption}
                  onClick={() => setThemeMode(modeOption)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ThemeModeButton({ active, mode, onClick }: { active: boolean; mode: ThemeMode; onClick(): void }) {
  const Icon = mode === "dark" ? Moon : Sun;
  return (
    <button
      className={`rounded-2xl border p-4 text-left ${active ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-white text-slate-700 hover:bg-slate-50"}`}
      onClick={onClick}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-base font-extrabold">{themeModeLabel(mode)}</p>
      <p className="mt-1 text-sm text-slate-500">{themeModeDescription(mode)}</p>
    </button>
  );
}
