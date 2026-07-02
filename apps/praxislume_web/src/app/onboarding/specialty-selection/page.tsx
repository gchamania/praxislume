"use client";

import Link from "next/link";
import { Activity, Baby, Bone, Brain, Ear, HeartPulse, Search, Smile, Sparkles, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card, LogoMark } from "@/components/ui";

type SpecialtyPack = {
  name: string;
  description: string;
  icon: LucideIcon;
  services: string[];
};

const specialties: SpecialtyPack[] = [
  { name: "ENT", description: "Ear, nose, throat and hearing campaigns", icon: Ear, services: ["Grommet consultation", "Hearing tests", "Sinus care"] },
  { name: "Dermatology", description: "Skin, hair, allergy and procedure education", icon: Sparkles, services: ["Acne care", "Skin allergy", "Laser consults"] },
  { name: "Dental", description: "Oral hygiene and procedure explainers", icon: Smile, services: ["Dental implants", "Wisdom tooth", "Root canal"] },
  { name: "Pediatrics", description: "Parent-friendly child health content", icon: Baby, services: ["Vaccination", "Fever care", "Growth checks"] },
  { name: "Gynecology / IVF", description: "Women's health and fertility education", icon: HeartPulse, services: ["PCOS care", "Pregnancy care", "IVF counselling"] },
  { name: "Orthopedics", description: "Joint, spine and sports injury campaigns", icon: Bone, services: ["Knee pain", "Fracture care", "Back pain"] },
  { name: "Neurology", description: "Headache, epilepsy and nerve health topics", icon: Brain, services: ["Migraine", "Seizure care", "Stroke awareness"] },
  { name: "Physiotherapy", description: "Rehab, posture and pain recovery education", icon: Activity, services: ["Posture rehab", "Sports rehab", "Back pain"] },
  { name: "Ophthalmology", description: "Eye health, cataract and screening content", icon: Activity, services: ["Cataract consult", "Dry eye", "Eye screening"] },
  { name: "Cardiology", description: "Heart health and preventive care campaigns", icon: HeartPulse, services: ["BP care", "Chest pain awareness", "ECG consults"] },
  { name: "Diabetology", description: "Sugar control and lifestyle education", icon: Activity, services: ["Diabetes follow-up", "Diet education", "Foot care"] },
  { name: "General Practice", description: "Local family-clinic growth campaigns", icon: HeartPulse, services: ["Fever clinic", "Annual checkups", "Preventive care"] },
];

export default function SpecialtySelectionPage() {
  const { state, saveOnboarding, status } = usePraxis();
  const [selectedSpecialty, setSelectedSpecialty] = useState(state.doctor?.specialty ?? "ENT");
  const [query, setQuery] = useState("");
  const clinic = state.clinic;
  const profile = state.doctor;
  const filteredSpecialties = useMemo(
    () =>
      specialties.filter((specialty) =>
        [specialty.name, specialty.description, ...specialty.services]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  const selectedPack = specialties.find((specialty) => specialty.name === selectedSpecialty) ?? specialties[0];

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <LogoMark />
          <Badge tone="indigo">Step 2 of 2</Badge>
        </header>
        <Card className="p-8">
          <h1 className="font-display text-4xl font-extrabold">Choose your specialty</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Specialty packs keep campaigns clinically specific while generation still runs only through the backend.
          </p>
          <label className="mt-6 block max-w-xl">
            <span className="mb-2 block text-sm font-bold text-slate-700">Search specialty packs</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Search ENT, Dermatology, IVF, Physiotherapy..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSpecialties.map(({ name, description, icon: Icon }) => {
              const selected = selectedSpecialty === name;
              return (
              <button key={name} className={`min-w-0 text-left rounded-xl border p-4 transition ${selected ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"}`} onClick={() => setSelectedSpecialty(name)}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Icon className={`h-6 w-6 shrink-0 ${selected ? "text-indigo-700" : "text-slate-400"}`} />
                  {selected ? <Badge tone="indigo">Selected</Badge> : <Badge>Available</Badge>}
                </div>
                <h2 className="truncate font-display text-base font-extrabold text-slate-950">{name}</h2>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{description}</p>
              </button>
            )})}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Selected pack services</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedPack.services.map((service) => <Badge key={service} tone="blue">{service}</Badge>)}
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex"
            onClick={() => {
              if (!clinic || !profile) return;
              void saveOnboarding({
                clinicName: clinic.name,
                doctorName: profile.name,
                qualifications: profile.qualifications,
                locality: clinic.locality,
                city: clinic.city,
                phone: clinic.phone,
                specialty: selectedSpecialty,
                services: selectedPack.services.length ? selectedPack.services : clinic.services,
              });
            }}
          >
            <Button disabled={status === "saving"}>Open PraxisLume workspace</Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
