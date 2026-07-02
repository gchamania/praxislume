export type ThemeMode = "system" | "light" | "dark";
export type EffectiveThemeMode = "light" | "dark";

export const themeModeStorageKey = "praxislume:theme-mode";
export const themeModes: ThemeMode[] = ["system", "light", "dark"];

export function parseThemeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function resolveEffectiveThemeMode(mode: ThemeMode, prefersDark: boolean): EffectiveThemeMode {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const index = themeModes.indexOf(mode);
  return themeModes[(index + 1) % themeModes.length] ?? "system";
}

export function themeModeLabel(mode: ThemeMode) {
  if (mode === "system") return "System";
  if (mode === "light") return "Light";
  return "Dark";
}

export function themeModeDescription(mode: ThemeMode) {
  if (mode === "system") return "Follow this device";
  if (mode === "light") return "Bright clinic workspace";
  return "Low-glare clinic workspace";
}
