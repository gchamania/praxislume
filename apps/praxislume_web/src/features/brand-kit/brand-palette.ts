import type { BrandKit } from "@/lib/praxis-models";

export type BrandPalette = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const healthcarePalettes: BrandPalette[] = [
  {
    id: "clinic-teal",
    name: "Clinic Teal",
    primaryColor: "#0D4D57",
    secondaryColor: "#A7E1D6",
    accentColor: "#F2C15E",
  },
  {
    id: "derma-coral",
    name: "Derma Coral",
    primaryColor: "#7C2D5A",
    secondaryColor: "#F7D6DD",
    accentColor: "#10B981",
  },
  {
    id: "ent-blue",
    name: "ENT Blue",
    primaryColor: "#1D4ED8",
    secondaryColor: "#DBEAFE",
    accentColor: "#F97316",
  },
  {
    id: "premium-charcoal",
    name: "Premium Charcoal",
    primaryColor: "#1F2937",
    secondaryColor: "#E5E7EB",
    accentColor: "#14B8A6",
  },
  {
    id: "pediatric-bright",
    name: "Pediatric Bright",
    primaryColor: "#5B21B6",
    secondaryColor: "#EDE9FE",
    accentColor: "#F59E0B",
  },
];

export function applyPalette(brandKit: BrandKit, palette: BrandPalette): BrandKit {
  return {
    ...brandKit,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
  };
}

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  if (isHexColor(trimmed)) return trimmed.toUpperCase();
  return value;
}

export function contrastRatio(foreground: string, background: string) {
  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastLabel(foreground: string, background: string) {
  if (!isHexColor(foreground) || !isHexColor(background)) return "Check color values";
  const ratio = contrastRatio(foreground, background);
  if (ratio >= 4.5) return "Strong contrast";
  if (ratio >= 3) return "Usable for large text";
  return "Low contrast";
}

function relativeLuminance(hex: string) {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}
