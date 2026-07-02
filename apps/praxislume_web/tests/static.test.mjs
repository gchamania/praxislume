import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const expectedRoutes = [
  "signin",
  "signup",
  "onboarding/clinic-details",
  "onboarding/specialty-selection",
  "dashboard",
  "generate",
  "campaign-ready",
  "calendar",
  "library",
  "content/[itemId]",
  "brand",
  "settings",
  "templates",
  "analytics",
  "media-studio",
  "campaigns/new",
  "campaigns/[campaignId]/overview",
  "campaigns/[campaignId]/weeks/[weekId]/copy",
  "campaigns/[campaignId]/weeks/[weekId]/visuals",
  "campaigns/[campaignId]/weeks/[weekId]/adjust",
  "campaigns/[campaignId]/weeks/[weekId]/export",
];

function source(path) {
  return readFileSync(join(root, path), "utf8");
}

test("exposes the planned evaluation route surface", () => {
  for (const route of expectedRoutes) {
    assert.equal(
      existsSync(join(root, "src", "app", route, "page.tsx")),
      true,
      `missing route: /${route}`,
    );
  }
});

test("renders prototype-faithful PraxisLume and Dhwani dummy content", () => {
  const haystack = [
    source("src/app/page.tsx"),
    source("src/app/dashboard/page.tsx"),
    source("src/app/library/page.tsx"),
    source("src/app/content/[itemId]/page.tsx"),
    source("src/app/campaigns/[campaignId]/weeks/[weekId]/adjust/page.tsx"),
    source("src/features/generation/conveyor-flow.ts"),
    source("src/lib/dummy-data.ts"),
    source("src/components/app-shell.tsx"),
  ].join("\n");

  for (const expected of [
    "PraxisLume",
    "Grow Your Practice",
    "Doctor Growth OS",
    "Dhwani ENT Clinics",
    "What are ear grommets?",
    "Book an ENT consultation",
    "30 days of branded medical content in 30 minutes",
    "Create 30-Day Plan",
    "Campaigns",
    "Final Adjust",
    "Content Library",
    "Media Studio",
    "Analytics",
  ]) {
    assert.match(haystack, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("campaign conveyor uses shared prototype-guided shell components", () => {
  for (const component of [
    "src/features/campaigns/campaign-conveyor-shell.tsx",
    "src/features/campaigns/campaign-preview-panel.tsx",
  ]) {
    assert.equal(existsSync(join(root, component)), true, `missing campaign component: ${component}`);
  }

  const haystack = [
    source("src/features/campaigns/campaign-conveyor-shell.tsx"),
    source("src/features/campaigns/campaign-preview-panel.tsx"),
    source("src/app/campaigns/new/page.tsx"),
    source("src/app/campaigns/[campaignId]/overview/page.tsx"),
    source("src/app/campaigns/[campaignId]/weeks/[weekId]/copy/page.tsx"),
    source("src/app/campaigns/[campaignId]/weeks/[weekId]/visuals/page.tsx"),
    source("src/app/campaigns/[campaignId]/weeks/[weekId]/adjust/page.tsx"),
    source("src/app/campaigns/[campaignId]/weeks/[weekId]/export/page.tsx"),
  ].join("\n");

  for (const expected of [
    "CampaignConveyorShell",
    "CampaignPreviewPanel",
    "Saved Inputs",
    "Package Preview",
    "CONTENT PACKAGE",
    "sticky next action",
  ]) {
    assert.match(haystack, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("content conveyor uses a readable command strip instead of truncated stage tiles", () => {
  const sourceText = source("src/features/generation/conveyor-belt.tsx");

  for (const expected of [
    "CurrentStageHero",
    "ProgressRail",
    "StageDetails",
    "Previous",
    "Current",
    "Next",
    "grid-cols-2 sm:grid-cols-4 xl:grid-cols-8",
  ]) {
    assert.match(sourceText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.equal(sourceText.includes("truncate"), false, "stage labels must not be truncated");
  assert.equal(sourceText.includes("line-clamp"), false, "stage descriptions must not be clamped inside tiny tiles");
  assert.equal(sourceText.includes("overflow-x-auto"), false, "desktop conveyor should wrap instead of forcing horizontal clipping");
});

test("keeps provider calls and secrets out of the web app", () => {
  const files = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/lib/dummy-data.ts",
    "src/lib/config.ts",
    "src/lib/praxis-api-client.ts",
    "src/lib/supabase-client.ts",
    "src/components/app-shell.tsx",
    "src/components/ui.tsx",
  ];
  const forbidden = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "service_role",
    "sb_secret_",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "FAL_KEY",
    "fal.run",
    "api.openai.com",
    "fal.ai",
    "anthropic.com",
  ];

  const haystack = files.map((file) => source(file)).join("\n");
  for (const pattern of forbidden) {
    assert.equal(haystack.includes(pattern), false, `forbidden token found: ${pattern}`);
  }
});

test("bugfix pass exposes auth, onboarding, dashboard, analytics, and campaign recovery UX", () => {
  const authHaystack = [
    source("src/app/signin/page.tsx"),
    source("src/app/signup/page.tsx"),
  ].join("\n");
  for (const expected of [
    "Show password",
    "Hide password",
    "Email or phone",
    "Phone login uses Supabase phone auth",
  ]) {
    assert.match(authHaystack, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const onboardingHaystack = [
    source("src/app/onboarding/clinic-details/page.tsx"),
    source("src/app/onboarding/specialty-selection/page.tsx"),
  ].join("\n");
  for (const expected of [
    "State",
    "City",
    "Search specialty packs",
    "Gynecology / IVF",
    "Physiotherapy",
    "Neurology",
    "Orthopedics",
  ]) {
    assert.match(onboardingHaystack, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const dashboard = source("src/app/dashboard/page.tsx");
  for (const expected of [
    "Clinic Conveyor",
    "adaptive operating cards",
    "min-w-0",
    "line-clamp",
  ]) {
    assert.match(dashboard, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const analytics = source("src/app/analytics/page.tsx");
  for (const expected of [
    "Enquiry sources",
    "Topic ROI",
    "Reception notes",
    "Manual tracking only",
  ]) {
    assert.match(analytics, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const templates = [
    source("src/app/templates/page.tsx"),
    source("src/features/templates/template-catalog.ts"),
  ].join("\n");
  for (const expected of [
    "Curated healthcare templates",
    "Fixed zones",
    "Use in campaign",
    "Jewellery reaction explainer",
    "Gynecology / IVF",
    "Physiotherapy",
    "filterTemplateCatalog",
  ]) {
    assert.match(templates, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const library = [
    source("src/app/library/page.tsx"),
    source("src/features/library/content-library-folders.ts"),
  ].join("\n");
  for (const expected of [
    "Clinic collections",
    "New Folder",
    "Move to",
    "content_folders",
    "content_folder_items",
    "createLibraryFolder",
    "deleteLibraryFolder",
  ]) {
    assert.match(library, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const theme = [
    source("src/components/app-shell.tsx"),
    source("src/app/settings/page.tsx"),
    source("src/app/globals.css"),
    source("src/features/theme/theme-mode.ts"),
    source("src/features/theme/use-theme-mode.ts"),
  ].join("\n");
  for (const expected of [
    "Theme mode",
    "Appearance",
    "Exported clinic assets keep brand kit colors",
    "praxislume:theme-mode",
    "data-theme",
    "colorScheme",
  ]) {
    assert.match(theme, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const campaignSetup = source("src/app/campaigns/new/page.tsx");
  for (const expected of [
    "Plan request is taking longer than expected",
    "setGenerationError",
    "const ok = await generateCampaign(setup);",
  ]) {
    assert.match(campaignSetup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
