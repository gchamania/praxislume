"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, HelpCircle, LogOut, Menu, Moon, Sparkles, Sun } from "lucide-react";
import { doctor, navItems } from "@/lib/dummy-data";
import { usePraxis } from "@/components/praxis-provider";
import { Button, LogoMark } from "@/components/ui";
import { nextThemeMode, themeModeLabel } from "@/features/theme/theme-mode";
import { useThemeMode } from "@/features/theme/use-theme-mode";

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, session, signOut, state, status, message } = usePraxis();
  const { effectiveMode, mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const displayDoctor = state.doctor?.name || doctor.name;
  const displaySpecialty = state.doctor?.specialty || doctor.specialty;
  const initials = displayDoctor
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (mode === "live" && status === "ready" && !session && !pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
      router.replace("/signin");
    }
  }, [mode, pathname, router, session, status]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <span className="sr-only">PraxisLume Grow Your Practice Doctor Growth OS</span>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="p-6">
          <LogoMark />
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
          >
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </Link>
        </nav>
        <div className="m-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <h4 className="font-display text-lg font-extrabold">Go Pro</h4>
          <p className="mt-2 text-xs leading-relaxed text-indigo-100">
            Unlock advanced templates and growth analytics for your clinic.
          </p>
          <Button variant="secondary" className="mt-4 w-full border-white/20 text-indigo-600">
            Upgrade Now
          </Button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500">
              <Menu className="h-5 w-5" />
            </button>
            <LogoMark compact />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-5">
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              aria-label={`Theme mode: ${themeModeLabel(themeMode)}`}
              title={`Theme mode: ${themeModeLabel(themeMode)}`}
              onClick={() => setThemeMode(nextThemeMode(themeMode))}
            >
              {effectiveMode === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button className="relative text-slate-400 hover:text-slate-600">
              <Bell className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-100 pl-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-indigo-100 to-teal-100 text-xs font-extrabold text-indigo-700">
                {initials || doctor.avatarInitials}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-none text-slate-900">{displayDoctor}</p>
                <p className="mt-1 text-xs text-slate-500">{displaySpecialty}</p>
              </div>
              <Button
                variant="ghost"
                className="min-h-9 px-2 text-slate-400 hover:text-indigo-600"
                aria-label="Sign out"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">
                {title}
              </h1>
              {subtitle ? <p className="mt-2 text-slate-500">{subtitle}</p> : null}
            </div>
            {action}
          </div>
          {message ? (
            <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              {message}
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
