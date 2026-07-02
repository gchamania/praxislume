"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone, Stethoscope } from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { usePraxis } from "@/components/praxis-provider";
import { Button, Card, LogoMark } from "@/components/ui";

const cityOptionsByState: Record<string, string[]> = {
  Maharashtra: ["Pune", "Mumbai", "Nagpur", "Nashik"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Telangana: ["Hyderabad", "Secunderabad"],
};

export default function ClinicDetailsPage() {
  const { state, saveOnboarding, status, message } = usePraxis();
  const [clinicName, setClinicName] = useState(state.clinic?.name ?? "Dhwani ENT Clinics");
  const [doctorName, setDoctorName] = useState(state.doctor?.name ?? "Dr. Rohan Verma");
  const [qualifications, setQualifications] = useState(state.doctor?.qualifications ?? "MS ENT, Fellowship Otology");
  const [locality, setLocality] = useState(state.clinic?.locality ?? "Aundh");
  const [region, setRegion] = useState("Maharashtra");
  const [city, setCity] = useState(state.clinic?.city ?? "Pune");
  const [phone, setPhone] = useState(state.clinic?.phone ?? "+91 98765 43210");
  const fields = useMemo<Array<{ label: string; value: string; setter: Dispatch<SetStateAction<string>> }>>(
    () => [
      { label: "Clinic name", value: clinicName, setter: setClinicName },
      { label: "Doctor display name", value: doctorName, setter: setDoctorName },
      { label: "Qualifications", value: qualifications, setter: setQualifications },
      { label: "Locality", value: locality, setter: setLocality },
      { label: "Phone / WhatsApp", value: phone, setter: setPhone },
    ],
    [clinicName, doctorName, locality, phone, qualifications],
  );
  const cityOptions = cityOptionsByState[region] ?? cityOptionsByState.Maharashtra;

  const submit = async () => {
    await saveOnboarding({
      clinicName,
      doctorName,
      qualifications,
      locality,
      city,
      phone,
      specialty: state.doctor?.specialty ?? "ENT",
      services: state.clinic?.services?.length ? state.clinic.services : ["Grommet consultation", "Hearing tests", "Pediatric ENT"],
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <LogoMark />
          <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">Step 1 of 2</span>
        </header>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="overflow-hidden">
            <div className="bg-teal-950 p-10 text-white">
              <Stethoscope className="mb-8 h-12 w-12 text-teal-200" />
              <h1 className="font-display text-4xl font-extrabold">Set up your clinic profile</h1>
              <p className="mt-4 text-teal-100">PraxisLume uses this clinic context to render branded campaign screens.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-8 text-sm">
              <div className="rounded-2xl bg-indigo-50 p-4 font-bold text-indigo-700">ENT specialty pack</div>
              <div className="rounded-2xl bg-teal-50 p-4 font-bold text-teal-700">{city} local context</div>
            </div>
          </Card>
          <Card className="p-8">
            <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
              {fields.map(({ label, setter, value }) => (
                <label key={label} className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                  />
                </label>
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">State</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={region}
                    onChange={(event) => {
                      const nextState = event.target.value;
                      setRegion(nextState);
                      setCity(cityOptionsByState[nextState]?.[0] ?? city);
                    }}
                  >
                    {Object.keys(cityOptionsByState).map((stateName) => (
                      <option key={stateName} value={stateName}>{stateName}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">City</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  >
                    {cityOptions.map((cityName) => (
                      <option key={cityName} value={cityName}>{cityName}</option>
                    ))}
                  </select>
                </label>
              </div>
            </form>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600"><MapPin className="h-4 w-4" /> {city}, {region}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600"><Phone className="h-4 w-4" /> Manual CTA only</span>
            </div>
            {message ? <p className="mt-5 text-sm font-semibold text-indigo-600">{message}</p> : null}
            <Link href="/onboarding/specialty-selection" className="mt-8 block" onClick={() => void submit()}>
              <Button className="w-full py-4" disabled={status === "saving"}>Continue to specialty <ArrowRight className="h-5 w-5" /></Button>
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
