"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { usePraxis } from "@/components/praxis-provider";
import { Button, LogoMark } from "@/components/ui";

export default function SignInPage() {
  const { signIn, status, mode, message } = usePraxis();
  const [identifier, setIdentifier] = useState("doctor@dhwanient.test");
  const [password, setPassword] = useState("evaluation");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="grid min-h-[860px] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex flex-col justify-center p-8 md:p-16">
          <div className="mb-12"><LogoMark /></div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-500">Sign in to continue to your account</p>
          <form
            className="mt-10 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn(identifier, password);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700">Email or phone</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </div>
              <span className="mt-2 block text-xs font-semibold text-gray-500">Phone login uses Supabase phone auth when enabled.</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700">Password</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-24" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
            </label>
            <Button type="submit" className="w-full py-4" disabled={status === "saving"}>
              {status === "saving" ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          {message ? <p className="mt-4 text-sm font-semibold text-indigo-600">{message}</p> : null}
          <div className="mt-10 rounded-2xl bg-teal-50 p-5">
            <div className="flex gap-4">
              <ShieldCheck className="h-7 w-7 text-teal-700" />
              <div>
                <p className="font-bold text-gray-800">Your data is safe with us</p>
                <p className="mt-1 text-sm text-gray-600">
                  {mode === "demo" ? "Demo mode uses local dummy data until public env vars are configured." : "Supabase Auth protects your clinic workspace."}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-gray-600">
            New to PraxisLume? <Link href="/signup" className="font-bold text-indigo-600">Create an account</Link>
          </p>
        </section>
        <section className="hidden flex-col justify-between overflow-hidden bg-teal-950 p-12 text-white md:flex lg:p-20">
          <div>
            <h2 className="font-display text-5xl font-extrabold">Your Doctor Growth OS.</h2>
            <p className="mt-4 text-xl text-teal-100">30 days of branded medical content in <span className="font-bold text-amber-300">30 minutes</span>.</p>
          </div>
          <div className="preview-grid rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold">Dhwani ENT Clinics</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Ready</span>
              </div>
              <div className="h-44 rounded-2xl bg-gradient-to-br from-indigo-100 via-white to-teal-100 p-5">
                <p className="font-display text-2xl font-extrabold">What are ear grommets?</p>
                <p className="mt-3 text-sm text-slate-600">Patient education carousel preview</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
