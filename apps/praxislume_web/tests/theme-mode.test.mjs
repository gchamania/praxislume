import assert from "node:assert/strict";
import test from "node:test";

import {
  nextThemeMode,
  parseThemeMode,
  resolveEffectiveThemeMode,
  themeModeDescription,
  themeModeLabel,
  themeModeStorageKey,
} from "../src/features/theme/theme-mode.ts";

test("theme mode parsing defaults unsafe or missing values to system", () => {
  assert.equal(parseThemeMode("light"), "light");
  assert.equal(parseThemeMode("dark"), "dark");
  assert.equal(parseThemeMode("system"), "system");
  assert.equal(parseThemeMode("provider-key"), "system");
  assert.equal(parseThemeMode(undefined), "system");
});

test("system theme resolves from device preference while explicit modes stay stable", () => {
  assert.equal(resolveEffectiveThemeMode("system", true), "dark");
  assert.equal(resolveEffectiveThemeMode("system", false), "light");
  assert.equal(resolveEffectiveThemeMode("light", true), "light");
  assert.equal(resolveEffectiveThemeMode("dark", false), "dark");
});

test("theme mode cycles through system, light, and dark", () => {
  assert.equal(nextThemeMode("system"), "light");
  assert.equal(nextThemeMode("light"), "dark");
  assert.equal(nextThemeMode("dark"), "system");
});

test("theme labels and storage key are explicit app UI concepts", () => {
  assert.equal(themeModeStorageKey, "praxislume:theme-mode");
  assert.equal(themeModeLabel("dark"), "Dark");
  assert.equal(themeModeDescription("system"), "Follow this device");
});
