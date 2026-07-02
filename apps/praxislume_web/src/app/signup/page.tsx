"use client";

import Link from "next/link";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Phone, Stethoscope, type LucideIcon } from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { usePraxis } from "@/components/praxis-provider";
import { Button, LogoMark } from "@/components/ui";

export default function SignUpPage() {
  const { signUp, status, mode, message } = usePraxis();
  const [doctorName, setDoctorName] = useState("Dr. Rohan Verma");
  const [clinicName, setClinicName] = useState("Dhwani ENT Clinics");
  const [email, setEmail] = useState("doctor@dhwanient.test");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [password, setPassword] = useState("evaluation-password");
  const [showPassword, setShowPassword] = useState(false);
  const fields = useMemo<Array<{ label: string; value: string; icon: LucideIcon; setter: Dispatch<SetStateAction<string>>; type?: string }>>(
    () => [
      { label: "Doctor name", value: doctorName, icon: Stethoscope, setter: setDoctorName },
      { label: "Clinic name", value: clinicName, icon: Building2, setter: setClinicName },
      { label: "Email", value: email, icon: Mail, setter: setEmail },
      { label: "Phone", value: phone, icon: Phone, setter: setPhone, type: "tel" },
    ],
    [clinicName, doctorName, email, phone],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-teal-950 p-10 text-white lg:p-16">
          <LogoMark />
          <h1 className="mt-16 font-display text-5xl font-extrabold">Build your clinic content engine.</h1>
          <p className="mt-5 text-lg leading-relaxed text-teal-100">
            {mode === "demo" ? "Create a demo PraxisLume account for the web client." : "Create a Supabase-backed PraxisLume account."}
          </p>
          <div className="mt-12 space-y-5">
            {["Specialty-aware campaigns", "Branded carousels and posts", "Manual export workflow"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="p-8 lg:p-16">
          <h2 className="font-display text-3xl font-extrabold">Create your account</h2>
          <p className="mt-2 text-slate-500">
            {mode === "demo" ? "Demo mode continues without backend credentials." : "Supabase Auth creates the user; onboarding saves clinic data next."}
          </p>
          <form
            className="mt-10 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void signUp(email, password, doctorName);
            }}
          >
            {fields.map(({ icon: Icon, label, setter, type, value }) => (
              <label key={label} className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4"
                    type={type ?? "text"}
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                  />
                </div>
              </label>
            ))}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-24"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <span className="mt-2 block text-xs font-semibold text-slate-500">Phone login uses Supabase phone auth when enabled.</span>
            </label>
            <Button type="submit" className="mt-3 w-full py-4" disabled={status === "saving"}>
              {status === "saving" ? "Creating account..." : "Continue"} <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
          {message ? <p className="mt-4 text-sm font-semibold text-indigo-600">{message}</p> : null}
          <p className="mt-8 text-center text-sm text-slate-600">
            Already registered? <Link href="/signin" className="font-bold text-indigo-600">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
