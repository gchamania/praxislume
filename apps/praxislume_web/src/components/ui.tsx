import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import clsx from "clsx";
import type { LucideProps } from "lucide-react";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xl font-extrabold text-white shadow-lg shadow-indigo-200">
        P
      </div>
      {!compact ? (
        <div>
          <div className="font-display text-xl font-extrabold leading-none text-slate-950">
            PraxisLume
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Grow Your Practice
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "teal";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...props}
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold",
        props.disabled && "cursor-not-allowed opacity-60",
        variant === "primary" &&
          "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-indigo-600 hover:bg-indigo-50",
        variant === "teal" && "bg-teal-700 text-white shadow-lg shadow-teal-100 hover:bg-teal-800",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx("medical-glow rounded-2xl border border-slate-100 bg-white", className)}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "indigo" | "emerald" | "orange" | "blue" | "slate" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  change,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  tone: "indigo" | "emerald" | "orange" | "blue";
  icon: ComponentType<LucideProps>;
}) {
  const iconTones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-500",
    blue: "bg-blue-50 text-blue-500",
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={clsx("flex h-14 w-14 items-center justify-center rounded-2xl", iconTones[tone])}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-950">{value}</span>
          <span className="text-xs font-extrabold text-emerald-500">+{change}</span>
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="text-[10px] text-slate-300">vs last month</p>
      </div>
    </Card>
  );
}

export function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        defaultValue={value}
        placeholder={placeholder}
      />
    </label>
  );
}
