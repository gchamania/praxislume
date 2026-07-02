"use client";

import { CheckCircle2, ImagePlus, Palette, Save, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePraxis } from "@/components/praxis-provider";
import { Badge, Button, Card } from "@/components/ui";
import { applyPalette, contrastLabel, healthcarePalettes, isHexColor, normalizeHexColor } from "@/features/brand-kit/brand-palette";
import type { BrandKit } from "@/lib/praxis-models";

export default function BrandPage() {
  const { saveBrandKit, state, status, uploadLogo } = usePraxis();
  const formKey = [
    state.brandKit.primaryColor,
    state.brandKit.secondaryColor,
    state.brandKit.accentColor,
    state.brandKit.defaultCta,
    state.brandKit.disclaimer,
    state.brandKit.logoPath,
  ].join("|");

  return <BrandForm key={formKey} initialBrandKit={state.brandKit} saveBrandKit={saveBrandKit} state={state} status={status} uploadLogo={uploadLogo} />;
}

function BrandForm({
  initialBrandKit,
  saveBrandKit,
  state,
  status,
  uploadLogo,
}: {
  initialBrandKit: BrandKit;
  saveBrandKit(brandKit: BrandKit): Promise<void>;
  state: ReturnType<typeof usePraxis>["state"];
  status: ReturnType<typeof usePraxis>["status"];
  uploadLogo(file: File): Promise<void>;
}) {
  const [brandKit, setBrandKit] = useState<BrandKit>(initialBrandKit);
  const [logoPreview, setLogoPreview] = useState<string>();
  const [uploadMessage, setUploadMessage] = useState<string>();
  const [paletteMessage, setPaletteMessage] = useState<string>();

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const update = (key: keyof BrandKit, value: string) => {
    setBrandKit((current) => ({ ...current, [key]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    setUploadMessage("Uploading logo...");
    setLogoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    try {
      await uploadLogo(file);
      setUploadMessage("Logo saved to brand kit");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Logo upload failed");
    }
  };

  const handlePaletteSource = async (file: File) => {
    setPaletteMessage("Reading colors...");
    setLogoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    try {
      const palette = await extractPaletteFromImage(file);
      setBrandKit((current) => ({ ...current, ...palette }));
      setPaletteMessage("Palette applied from image");
    } catch (error) {
      setPaletteMessage(error instanceof Error ? error.message : "Could not read image colors");
    }
  };

  return (
    <AppShell title="Brand Settings" subtitle="Control how generated content carries the clinic identity.">
      <div className="space-y-6">
        <BrandPreview brandKit={brandKit} logoPreview={logoPreview} clinicName={state.clinic?.name ?? "Dhwani ENT Clinics"} doctorName={state.doctor?.name ?? "Dr. Rohan Verma"} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-6">
            <div className="mb-6 flex flex-wrap gap-3">
              {["Brand Identity", "Colors", "Voice", "Disclaimer"].map((tab, index) => (
                <Badge key={tab} tone={index === 0 ? "indigo" : "slate"}>{tab}</Badge>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <ReadOnlyField label="Clinic name" value={state.clinic?.name ?? "Dhwani ENT Clinics"} />
              <ReadOnlyField label="Doctor display name" value={state.doctor?.name ?? "Dr. Rohan Verma"} />
              <ReadOnlyField label="Qualifications" value={state.doctor?.qualifications ?? "MS ENT, Fellowship Otology"} />
              <ReadOnlyField label="Appointment URL" value={state.clinic?.appointmentUrl ?? "https://dhwanient.example/book"} />
              <ColorField label="Primary color" value={brandKit.primaryColor} onChange={(value) => update("primaryColor", value)} />
              <ColorField label="Secondary color" value={brandKit.secondaryColor} onChange={(value) => update("secondaryColor", value)} />
              <ColorField label="Accent color" value={brandKit.accentColor} onChange={(value) => update("accentColor", value)} />
              <EditableField label="Default CTA" value={brandKit.defaultCta} onChange={(value) => update("defaultCta", value)} />
              <div className="md:col-span-2">
                <EditableField label="Disclaimer" value={brandKit.disclaimer} onChange={(value) => update("disclaimer", value)} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Contrast check</p>
                  <p className="mt-1 text-xs text-slate-500">{contrastLabel("#FFFFFF", brandKit.primaryColor)} for white text on primary color</p>
                </div>
                <Badge tone={isHexColor(brandKit.primaryColor) && isHexColor(brandKit.accentColor) ? "emerald" : "orange"}>
                  {isHexColor(brandKit.primaryColor) && isHexColor(brandKit.accentColor) ? "Valid colors" : "Check hex"}
                </Badge>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => void saveBrandKit(brandKit)} disabled={status === "saving"}><Save className="h-4 w-4" />Save Brand Kit</Button>
              <FileButton label="Upload Logo" icon="image" onFile={(file) => void handleLogoUpload(file)} />
            </div>
            {uploadMessage ? <p className="mt-3 text-sm font-bold text-slate-500">{uploadMessage}</p> : null}
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-600" />
                <h2 className="font-display text-lg font-extrabold text-slate-950">Palette presets</h2>
              </div>
              <div className="space-y-3">
                {healthcarePalettes.map((palette) => (
                  <button
                    key={palette.id}
                    className="w-full rounded-xl border border-slate-100 bg-white p-3 text-left hover:border-indigo-200 hover:bg-indigo-50/40"
                    onClick={() => setBrandKit((current) => applyPalette(current, palette))}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-extrabold text-slate-900">{palette.name}</span>
                      <span className="flex gap-1">
                        {[palette.primaryColor, palette.secondaryColor, palette.accentColor].map((color) => (
                          <span key={color} className="h-5 w-5 rounded-full border border-white shadow" style={{ backgroundColor: color }} />
                        ))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-teal-700" />
                <h2 className="font-display text-lg font-extrabold text-slate-950">Image palette</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">Use a logo or clinic photo as a palette source. This pilot reads colors in-browser; provider-backed AI review stays backend-only later.</p>
              <FileButton label="Extract Palette" icon="wand" onFile={(file) => void handlePaletteSource(file)} className="mt-4 w-full" />
              {paletteMessage ? <p className="mt-3 text-sm font-bold text-slate-500">{paletteMessage}</p> : null}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function BrandPreview({
  brandKit,
  clinicName,
  doctorName,
  logoPreview,
}: {
  brandKit: BrandKit;
  clinicName: string;
  doctorName: string;
  logoPreview?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${brandKit.secondaryColor}, #ffffff 55%, ${brandKit.accentColor}26)` }}>
          <div className="mb-8 flex items-center gap-3">
            <LogoPreview logoPreview={logoPreview} clinicName={clinicName} primaryColor={brandKit.primaryColor} />
            <div>
              <p className="font-display text-2xl font-extrabold text-slate-950">{clinicName}</p>
              <p className="text-sm font-semibold text-slate-500">{doctorName}</p>
            </div>
          </div>
          <div className="max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <Palette className="mb-5 h-8 w-8" style={{ color: brandKit.primaryColor }} />
            <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-950">What are ear grommets?</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">Tiny tubes placed in the eardrum can help air enter the middle ear and fluid drain.</p>
            <div className="mt-6 rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: brandKit.primaryColor }}>{brandKit.defaultCta}</div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">{brandKit.disclaimer}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-white p-6 lg:border-l lg:border-t-0">
          <Badge tone="indigo">Live sample</Badge>
          <h2 className="mt-4 font-display text-xl font-extrabold text-slate-950">Brand visualization first</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Change colors, CTA, disclaimer, or logo and judge the clinic content before saving settings.</p>
          <div className="mt-6 space-y-3">
            {[brandKit.primaryColor, brandKit.secondaryColor, brandKit.accentColor].map((color) => (
              <div key={color} className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full border border-slate-100 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold text-slate-700">{color}</span>
              </div>
            ))}
          </div>
          {brandKit.logoPath ? (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Logo path saved
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function LogoPreview({ clinicName, logoPreview, primaryColor }: { clinicName: string; logoPreview?: string; primaryColor: string }) {
  if (logoPreview) {
    // Local blob preview only; Next image optimization is not useful for this transient file.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={`${clinicName} logo preview`} className="h-16 w-16 rounded-2xl border border-white bg-white object-contain p-2 shadow" src={logoPreview} />;
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white shadow" style={{ backgroundColor: primaryColor }}>
      {clinicName.slice(0, 1)}
    </div>
  );
}

function FileButton({
  className,
  icon,
  label,
  onFile,
}: {
  className?: string;
  icon: "image" | "wand";
  label: string;
  onFile(file: File): void;
}) {
  const Icon = icon === "image" ? ImagePlus : Wand2;
  return (
    <label className={className}>
      <input
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
      <span className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
        <Icon className="h-4 w-4" />{label}
      </span>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <EditableField label={label} value={value} readOnly onChange={() => undefined} />;
}

function ColorField({ label, onChange, value }: { label: string; onChange(value: string): void; value: string }) {
  const normalized = isHexColor(value) ? normalizeHexColor(value) : value;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="flex gap-2">
        <input
          className="h-12 w-14 rounded-xl border border-slate-200 bg-white p-1"
          type="color"
          value={isHexColor(normalized) ? normalized : "#000000"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          value={value}
          onBlur={() => onChange(normalizeHexColor(value))}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function EditableField({
  label,
  onChange,
  readOnly = false,
  value,
}: {
  label: string;
  onChange(value: string): void;
  readOnly?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

async function extractPaletteFromImage(file: File): Promise<Pick<BrandKit, "primaryColor" | "secondaryColor" | "accentColor">> {
  if (file.type === "image/svg+xml") {
    throw new Error("Use PNG, JPEG, or WebP for palette extraction");
  }
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data;
    const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();
    for (let index = 0; index < data.length; index += 4 * 8) {
      const alpha = data[index + 3];
      if (alpha < 160) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      if (red > 245 && green > 245 && blue > 245) continue;
      const key = `${Math.round(red / 32)}-${Math.round(green / 32)}-${Math.round(blue / 32)}`;
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += red;
      bucket.green += green;
      bucket.blue += blue;
      buckets.set(key, bucket);
    }
    const colors = Array.from(buckets.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 3)
      .map((bucket) => rgbToHex(Math.round(bucket.red / bucket.count), Math.round(bucket.green / bucket.count), Math.round(bucket.blue / bucket.count)));
    if (colors.length === 0) throw new Error("No usable colors found");
    return {
      primaryColor: colors[0],
      secondaryColor: colors[1] ?? "#E6F7F4",
      accentColor: colors[2] ?? colors[0],
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = src;
  });
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
