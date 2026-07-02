"use client";

import { useEffect, useState } from "react";
import {
  parseThemeMode,
  resolveEffectiveThemeMode,
  themeModeStorageKey,
  type EffectiveThemeMode,
  type ThemeMode,
} from "@/features/theme/theme-mode";

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return parseThemeMode(window.localStorage.getItem(themeModeStorageKey));
  });
  const [prefersDark, setPrefersDark] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const effectiveMode: EffectiveThemeMode = resolveEffectiveThemeMode(mode, prefersDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setPrefersDark(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveMode;
    document.documentElement.style.colorScheme = effectiveMode;
    window.localStorage.setItem(themeModeStorageKey, mode);
  }, [effectiveMode, mode]);

  return {
    effectiveMode,
    mode,
    setMode,
  };
}
